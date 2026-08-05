import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['stun:global.stun.twilio.com:3478'] },
];

interface Props {
  groupId: string;
  groupName: string;
  onLeave: () => void;
}

interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream | null;
  state: RTCPeerConnectionState;
}

type SignalPayload = {
  from: string;
  to: string;
  kind: 'offer' | 'answer' | 'ice';
  data: unknown;
};

function VideoTile({
  stream,
  name,
  muted,
  mirrored,
  status,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  mirrored?: boolean;
  status?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted/40 aspect-[3/4]">
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-white bg-black/50 px-2 py-0.5 rounded-full truncate">
          {name}
        </span>
        {status && status !== 'connected' && (
          <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

export function GroupCallRoom({ groupId, groupName, onLeave }: Props) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({});
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const localRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingIce = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myName = useRef<string>('You');

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const send = useCallback((payload: SignalPayload) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'signal', payload });
  }, []);

  const closePeer = useCallback((peerId: string) => {
    try {
      pcsRef.current[peerId]?.close();
    } catch {
      /* noop */
    }
    delete pcsRef.current[peerId];
    delete pendingIce.current[peerId];
    setPeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  const ensurePeer = useCallback(
    (peerId: string, peerName: string) => {
      if (pcsRef.current[peerId]) return pcsRef.current[peerId];
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcsRef.current[peerId] = pc;

      localRef.current?.getTracks().forEach((t) => pc.addTrack(t, localRef.current!));

      const inbound = new MediaStream();
      setPeers((prev) => ({
        ...prev,
        [peerId]: { id: peerId, name: peerName, stream: null, state: 'new' },
      }));

      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((t) => {
          if (!inbound.getTracks().some((x) => x.id === t.id)) inbound.addTrack(t);
        });
        const snapshot = new MediaStream(inbound.getTracks());
        setPeers((prev) =>
          prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], stream: snapshot } } : prev
        );
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && user)
          send({ from: user.id, to: peerId, kind: 'ice', data: e.candidate.toJSON() });
      };

      pc.onconnectionstatechange = () => {
        setPeers((prev) =>
          prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], state: pc.connectionState } } : prev
        );
        if (pc.connectionState === 'failed') {
          try {
            pc.restartIce();
          } catch {
            /* noop */
          }
        }
      };

      return pc;
    },
    [send, user]
  );

  const callPeer = useCallback(
    async (peerId: string, peerName: string) => {
      if (!user) return;
      const pc = ensurePeer(peerId, peerName);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      send({ from: user.id, to: peerId, kind: 'offer', data: { type: offer.type, sdp: offer.sdp } });
    },
    [ensurePeer, send, user]
  );

  const handleSignal = useCallback(
    async (msg: SignalPayload, nameOf: (id: string) => string) => {
      if (!user || msg.to !== user.id || msg.from === user.id) return;

      if (msg.kind === 'offer') {
        const pc = ensurePeer(msg.from, nameOf(msg.from));
        await pc.setRemoteDescription(new RTCSessionDescription(msg.data as RTCSessionDescriptionInit));
        for (const c of pendingIce.current[msg.from] || []) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            /* noop */
          }
        }
        pendingIce.current[msg.from] = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({
          from: user.id,
          to: msg.from,
          kind: 'answer',
          data: { type: answer.type, sdp: answer.sdp },
        });
      } else if (msg.kind === 'answer') {
        const pc = pcsRef.current[msg.from];
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(msg.data as RTCSessionDescriptionInit));
        for (const c of pendingIce.current[msg.from] || []) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            /* noop */
          }
        }
        pendingIce.current[msg.from] = [];
      } else if (msg.kind === 'ice') {
        const pc = pcsRef.current[msg.from];
        const candidate = msg.data as RTCIceCandidateInit;
        if (!pc || !pc.remoteDescription) {
          pendingIce.current[msg.from] = [...(pendingIce.current[msg.from] || []), candidate];
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          /* noop */
        }
      }
    },
    [ensurePeer, send, user]
  );

  /* -------------------------------------------------------------- */
  /* join room                                                       */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const names: Record<string, string> = {};
    const nameOf = (id: string) => names[id] || 'Study buddy';

    (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        if (!cancelled)
          setError('Camera and microphone access is required to join the group call.');
        setJoining(false);
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localRef.current = stream;
      setLocalStream(stream);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      myName.current = profile?.full_name || 'You';

      await supabase.realtime.setAuth();

      const channel = supabase.channel(`group-call-${groupId}`, {
        config: { private: true, presence: { key: user.id }, broadcast: { self: false } },
      });
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          void handleSignal(payload as SignalPayload, nameOf);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<{ user_id: string; name: string }>();
          const present = new Set<string>();
          Object.values(state).forEach((entries) => {
            entries.forEach((e) => {
              if (!e.user_id || e.user_id === user.id) return;
              present.add(e.user_id);
              names[e.user_id] = e.name || 'Study buddy';
            });
          });
          // drop peers who left
          Object.keys(pcsRef.current).forEach((id) => {
            if (!present.has(id)) closePeer(id);
          });
          // deterministic initiator: lower uuid dials
          present.forEach((id) => {
            if (!pcsRef.current[id] && user.id < id) void callPeer(id, names[id]);
          });
        })
        .subscribe(async (statusText) => {
          if (statusText === 'SUBSCRIBED') {
            await channel.track({ user_id: user.id, name: myName.current });
            if (!cancelled) setJoining(false);
          } else if (statusText === 'CHANNEL_ERROR') {
            if (!cancelled) setError('Could not join the call room. You may not be a group member.');
            setJoining(false);
          }
        });
    })();

    return () => {
      cancelled = true;
      Object.keys(pcsRef.current).forEach((id) => {
        try {
          pcsRef.current[id].close();
        } catch {
          /* noop */
        }
      });
      pcsRef.current = {};
      pendingIce.current = {};
      if (channelRef.current) {
        void channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      localRef.current?.getTracks().forEach((t) => t.stop());
      localRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user?.id]);

  const toggleMic = () => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCamera = () => {
    const track = localRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  };

  const switchCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next },
        audio: false,
      });
      const newTrack = fresh.getVideoTracks()[0];
      Object.values(pcsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        void sender?.replaceTrack(newTrack);
      });
      const old = localRef.current?.getVideoTracks()[0];
      if (old && localRef.current) {
        localRef.current.removeTrack(old);
        old.stop();
        localRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localRef.current.getTracks()));
      }
      setFacingMode(next);
    } catch {
      toast('Could not switch camera');
    }
  };

  const list = Object.values(peers);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      <div className="px-4 pt-[env(safe-area-inset-top)] pb-3 border-b border-border/50">
        <div className="pt-3 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-foreground truncate">{groupName}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {list.length + 1} in call · {mins}:{secs}
            </p>
          </div>
          {joining && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={onLeave}
              className="px-4 py-2 rounded-xl bg-muted text-sm font-medium text-foreground"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <VideoTile stream={localStream} name={`${myName.current} (you)`} muted mirrored />
            {list.map((p) => (
              <VideoTile key={p.id} stream={p.stream} name={p.name} status={p.state} />
            ))}
            {list.length === 0 && !joining && (
              <div className="aspect-[3/4] rounded-2xl border border-dashed border-border flex items-center justify-center p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Waiting for group members to join…
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${micOn ? 'bg-muted text-foreground' : 'bg-destructive text-destructive-foreground'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCamera}
          aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${cameraOn ? 'bg-muted text-foreground' : 'bg-destructive text-destructive-foreground'}`}
        >
          {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={switchCamera}
          aria-label="Switch camera"
          className="w-12 h-12 rounded-full bg-muted text-foreground flex items-center justify-center"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
        <button
          onClick={onLeave}
          aria-label="Leave call"
          className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}
