import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IncomingCallScreen } from './IncomingCallScreen';
import { ActiveCallScreen } from './ActiveCallScreen';
import { toast } from 'sonner';

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'rejected'
  | 'busy'
  | 'missed'
  | 'failed'
  | 'permission-denied';

export interface CallPeer {
  id: string;
  name: string;
}

interface ActiveCall {
  id: string;
  peer: CallPeer;
  isCaller: boolean;
  groupId: string | null;
}

interface IncomingCall {
  id: string;
  caller: CallPeer;
  groupId: string | null;
}

interface CallContextValue {
  status: CallStatus;
  call: ActiveCall | null;
  incoming: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micOn: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
  facingMode: 'user' | 'environment';
  errorMessage: string | null;
  startedAt: number | null;
  startCall: (peer: CallPeer, groupId?: string | null) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  switchCamera: () => Promise<void>;
  retryPermissions: () => Promise<void>;
  dismiss: () => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['stun:global.stun.twilio.com:3478'] },
];

const RING_TIMEOUT_MS = 45_000;

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [status, setStatus] = useState<CallStatus>('idle');
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callRef = useRef<ActiveCall | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSet = useRef(false);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCaller = useRef<CallPeer | null>(null);
  const pendingGroupId = useRef<string | null>(null);

  callRef.current = call;

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */

  const setDbStatus = useCallback(
    async (callId: string, next: string, extra: Record<string, unknown> = {}) => {
      await supabase.from('calls').update({ status: next, ...extra }).eq('id', callId);
    },
    []
  );

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const teardown = useCallback(
    (nextStatus: CallStatus) => {
      if (ringTimer.current) {
        clearTimeout(ringTimer.current);
        ringTimer.current = null;
      }
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch {
          /* noop */
        }
      });
      try {
        pcRef.current?.close();
      } catch {
        /* noop */
      }
      pcRef.current = null;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      pendingIce.current = [];
      remoteDescSet.current = false;
      stopMedia();
      setStartedAt(null);
      setMicOn(true);
      setCameraOn(true);
      setStatus(nextStatus);
      if (nextStatus === 'idle') setCall(null);
    },
    [stopMedia]
  );

  const dismiss = useCallback(() => {
    setCall(null);
    setErrorMessage(null);
    setStatus('idle');
  }, []);

  const getMedia = useCallback(
    async (mode: 'user' | 'environment' = 'user') => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    },
    []
  );

  const describePermissionError = (err: unknown) => {
    const name = (err as DOMException)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError')
      return 'Camera and microphone access was blocked. Allow permissions in your browser settings, then retry.';
    if (name === 'NotFoundError')
      return 'No camera or microphone was found on this device.';
    if (name === 'NotReadableError')
      return 'Your camera or microphone is already in use by another app.';
    return 'Could not access your camera and microphone. Please check permissions and retry.';
  };

  /* ------------------------------------------------------------------ */
  /* peer connection                                                     */
  /* ------------------------------------------------------------------ */

  const createPeerConnection = useCallback(
    (callId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const inbound = new MediaStream();
      setRemoteStream(inbound);

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((t) => {
          if (!inbound.getTracks().some((x) => x.id === t.id)) inbound.addTrack(t);
        });
        setRemoteStream(new MediaStream(inbound.getTracks()));
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate || !user) return;
        void supabase.from('call_signals').insert({
          call_id: callId,
          sender_id: user.id,
          kind: 'ice',
          payload: event.candidate.toJSON() as never,
        });
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === 'connected') {
          setStatus('connected');
          setStartedAt((prev) => prev ?? Date.now());
          if (ringTimer.current) {
            clearTimeout(ringTimer.current);
            ringTimer.current = null;
          }
          if (callRef.current) void setDbStatus(callRef.current.id, 'connected');
        } else if (s === 'disconnected') {
          setStatus('reconnecting');
        } else if (s === 'failed') {
          setStatus('failed');
          setErrorMessage('The connection failed. Your network may be blocking peer-to-peer traffic.');
          if (callRef.current)
            void setDbStatus(callRef.current.id, 'failed', {
              ended_at: new Date().toISOString(),
              end_reason: 'ice-failure',
            });
          teardown('failed');
        }
      };

      return pc;
    },
    [setDbStatus, teardown, user]
  );

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of pendingIce.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* ignore malformed candidates */
      }
    }
    pendingIce.current = [];
  }, []);

  const handleSignal = useCallback(
    async (signal: { kind: string; payload: unknown; sender_id: string }) => {
      if (!user || signal.sender_id === user.id) return;
      const pc = pcRef.current;
      if (!pc) return;

      if (signal.kind === 'answer') {
        await pc.setRemoteDescription(
          new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit)
        );
        remoteDescSet.current = true;
        await flushIce();
      } else if (signal.kind === 'ice') {
        const candidate = signal.payload as RTCIceCandidateInit;
        if (!remoteDescSet.current) pendingIce.current.push(candidate);
        else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            /* ignore */
          }
        }
      }
    },
    [flushIce, user]
  );

  /* ------------------------------------------------------------------ */
  /* per-call realtime channel (signals + status)                        */
  /* ------------------------------------------------------------------ */

  const subscribeToCall = useCallback(
    (callId: string, isCaller: boolean) => {
      const channel = supabase
        .channel(`call-${callId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${callId}` },
          (payload) => {
            void handleSignal(payload.new as never);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
          (payload) => {
            const next = (payload.new as { status: string }).status;
            if (next === 'rejected') {
              toast('Call declined');
              teardown('rejected');
            } else if (next === 'busy') {
              toast('User is on another call');
              teardown('busy');
            } else if (next === 'missed') {
              teardown('missed');
            } else if (next === 'ended') {
              teardown('ended');
            } else if (next === 'accepted' && isCaller) {
              setStatus('connecting');
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [handleSignal, teardown]
  );

  /* ------------------------------------------------------------------ */
  /* outgoing call                                                       */
  /* ------------------------------------------------------------------ */

  const startCall = useCallback(
    async (peer: CallPeer, groupId: string | null = null) => {
      if (!user) return;
      if (callRef.current || status !== 'idle') {
        toast('You are already in a call');
        return;
      }

      setErrorMessage(null);
      setStatus('calling');

      let stream: MediaStream;
      try {
        stream = await getMedia(facingMode);
      } catch (err) {
        pendingCaller.current = peer;
        pendingGroupId.current = groupId;
        setErrorMessage(describePermissionError(err));
        setStatus('permission-denied');
        setCall({ id: 'pending', peer, isCaller: true, groupId });
        return;
      }

      const { data, error } = await supabase
        .from('calls')
        .insert({ caller_id: user.id, callee_id: peer.id, group_id: groupId, status: 'ringing' })
        .select()
        .single();

      if (error || !data) {
        stopMedia();
        setErrorMessage('Could not start the call. Please try again.');
        setStatus('failed');
        return;
      }

      const active: ActiveCall = { id: data.id, peer, isCaller: true, groupId };
      setCall(active);
      callRef.current = active;
      setStatus('ringing');

      subscribeToCall(data.id, true);

      const pc = createPeerConnection(data.id, stream);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await supabase.from('call_signals').insert({
        call_id: data.id,
        sender_id: user.id,
        kind: 'offer',
        payload: { type: offer.type, sdp: offer.sdp } as never,
      });

      ringTimer.current = setTimeout(() => {
        void setDbStatus(data.id, 'missed', {
          ended_at: new Date().toISOString(),
          end_reason: 'no-answer',
        });
        teardown('missed');
      }, RING_TIMEOUT_MS);
    },
    [createPeerConnection, facingMode, getMedia, setDbStatus, status, stopMedia, subscribeToCall, teardown, user]
  );

  const retryPermissions = useCallback(async () => {
    const peer = pendingCaller.current;
    const groupId = pendingGroupId.current;
    setCall(null);
    setStatus('idle');
    setErrorMessage(null);
    if (peer) {
      pendingCaller.current = null;
      await startCall(peer, groupId);
    }
  }, [startCall]);

  /* ------------------------------------------------------------------ */
  /* incoming call                                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls', filter: `callee_id=eq.${user.id}` },
        async (payload) => {
          const row = payload.new as {
            id: string;
            caller_id: string;
            group_id: string | null;
            status: string;
          };
          if (row.status !== 'ringing') return;

          // Already busy on another call → auto-reject as busy.
          if (callRef.current || incoming) {
            await supabase
              .from('calls')
              .update({ status: 'busy', ended_at: new Date().toISOString(), end_reason: 'busy' })
              .eq('id', row.id);
            return;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', row.caller_id)
            .maybeSingle();

          setIncoming({
            id: row.id,
            caller: { id: row.caller_id, name: profile?.full_name || 'Someone' },
            groupId: row.group_id,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `callee_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          setIncoming((prev) =>
            prev && prev.id === row.id && ['missed', 'ended', 'failed'].includes(row.status)
              ? null
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const acceptCall = useCallback(async () => {
    if (!incoming || !user) return;
    const pending = incoming;
    setIncoming(null);
    setErrorMessage(null);
    setStatus('connecting');

    let stream: MediaStream;
    try {
      stream = await getMedia(facingMode);
    } catch (err) {
      setErrorMessage(describePermissionError(err));
      setStatus('permission-denied');
      await supabase
        .from('calls')
        .update({ status: 'rejected', ended_at: new Date().toISOString(), end_reason: 'no-media' })
        .eq('id', pending.id);
      return;
    }

    const active: ActiveCall = {
      id: pending.id,
      peer: pending.caller,
      isCaller: false,
      groupId: pending.groupId,
    };
    setCall(active);
    callRef.current = active;

    subscribeToCall(pending.id, false);
    const pc = createPeerConnection(pending.id, stream);

    await supabase
      .from('calls')
      .update({ status: 'accepted', answered_at: new Date().toISOString() })
      .eq('id', pending.id);

    // Pull the offer (and any ICE that arrived before we subscribed).
    const { data: signals } = await supabase
      .from('call_signals')
      .select('*')
      .eq('call_id', pending.id)
      .order('created_at', { ascending: true });

    const offer = signals?.find((s) => s.kind === 'offer');
    if (!offer) {
      setErrorMessage('The call could not be established.');
      teardown('failed');
      return;
    }

    await pc.setRemoteDescription(
      new RTCSessionDescription(offer.payload as unknown as RTCSessionDescriptionInit)
    );
    remoteDescSet.current = true;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await supabase.from('call_signals').insert({
      call_id: pending.id,
      sender_id: user.id,
      kind: 'answer',
      payload: { type: answer.type, sdp: answer.sdp } as never,
    });

    for (const s of signals || []) {
      if (s.kind === 'ice' && s.sender_id !== user.id) {
        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(s.payload as unknown as RTCIceCandidateInit)
          );
        } catch {
          /* ignore */
        }
      }
    }
  }, [createPeerConnection, facingMode, getMedia, incoming, subscribeToCall, teardown, user]);

  const rejectCall = useCallback(async () => {
    if (!incoming) return;
    const id = incoming.id;
    setIncoming(null);
    await supabase
      .from('calls')
      .update({ status: 'rejected', ended_at: new Date().toISOString(), end_reason: 'declined' })
      .eq('id', id);
  }, [incoming]);

  const endCall = useCallback(async () => {
    const active = callRef.current;
    teardown('ended');
    if (active && active.id !== 'pending') {
      await setDbStatus(active.id, 'ended', {
        ended_at: new Date().toISOString(),
        end_reason: 'hangup',
      });
    }
  }, [setDbStatus, teardown]);

  /* ------------------------------------------------------------------ */
  /* media controls                                                      */
  /* ------------------------------------------------------------------ */

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }, []);

  const toggleSpeaker = useCallback(() => setSpeakerOn((v) => !v), []);

  const switchCamera = useCallback(async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newTrack);

      const old = localStreamRef.current?.getVideoTracks()[0];
      if (old && localStreamRef.current) {
        localStreamRef.current.removeTrack(old);
        old.stop();
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setFacingMode(next);
    } catch {
      toast('Could not switch camera on this device');
    }
  }, [facingMode]);

  /* cleanup on unmount / sign-out */
  useEffect(() => {
    return () => {
      teardown('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: CallContextValue = {
    status,
    call,
    incoming,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    speakerOn,
    facingMode,
    errorMessage,
    startedAt,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
    retryPermissions,
    dismiss,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {incoming && <IncomingCallScreen />}
      {call && <ActiveCallScreen />}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
}
