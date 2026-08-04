import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCall } from './CallProvider';

function useTimer(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATUS_LABEL: Record<string, string> = {
  calling: 'Calling…',
  ringing: 'Ringing…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  rejected: 'Call declined',
  busy: 'User is busy',
  missed: 'No answer',
  ended: 'Call ended',
  failed: 'Call failed',
  'permission-denied': 'Permissions needed',
};

export function ActiveCallScreen() {
  const {
    call,
    status,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    speakerOn,
    startedAt,
    errorMessage,
    endCall,
    toggleMic,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
    retryPermissions,
    dismiss,
  } = useCall();

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const timer = useTimer(startedAt);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    const el = remoteRef.current as (HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!el) return;
    el.muted = false;
    if (typeof el.setSinkId === 'function') {
      el.setSinkId(speakerOn ? 'default' : '').catch(() => undefined);
    }
    el.volume = speakerOn ? 1 : 0.35;
  }, [speakerOn, remoteStream]);

  if (!call) return null;

  const terminal = ['rejected', 'busy', 'missed', 'ended', 'failed', 'permission-denied'].includes(
    status
  );
  const initials = call.peer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#0b0b16] flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Remote video / status */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${
            status === 'connected' || status === 'reconnecting' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {status !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-24 h-24 rounded-full grad-brand flex items-center justify-center text-2xl font-bold text-white">
              {initials || '?'}
            </div>
            <h2 className="text-xl font-semibold text-white">{call.peer.name}</h2>
            <p className="text-white/70 text-sm">{STATUS_LABEL[status] ?? status}</p>

            {errorMessage && (
              <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white/10 p-4 text-left text-sm text-white/80">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {status === 'permission-denied' && (
              <Button onClick={retryPermissions} className="grad-brand text-white border-0 rounded-full mt-2">
                <RotateCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}

            {terminal && status !== 'permission-denied' && (
              <Button
                onClick={dismiss}
                variant="secondary"
                className="rounded-full mt-2"
              >
                Close
              </Button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div>
            <p className="text-white font-semibold">{call.peer.name}</p>
            <p className="text-xs text-white/70 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-400'
                    : status === 'reconnecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-white/50 animate-pulse'
                }`}
              />
              {status === 'connected' ? timer : STATUS_LABEL[status] ?? status}
            </p>
          </div>
        </div>

        {/* Local preview */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-28 h-40 rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-xl">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`}
            />
            {!cameraOn && (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-white/60" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!terminal && (
        <div className="px-5 py-6 bg-black/40 flex items-center justify-center gap-3">
          <button
            onClick={toggleMic}
            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            className={`p-3.5 rounded-full transition-colors ${
              micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-destructive'
            }`}
          >
            {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={toggleCamera}
            aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
            className={`p-3.5 rounded-full transition-colors ${
              cameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-destructive'
            }`}
          >
            {cameraOn ? (
              <VideoIcon className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={switchCamera}
            aria-label="Switch camera"
            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <SwitchCamera className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={toggleSpeaker}
            aria-label={speakerOn ? 'Speaker on' : 'Speaker off'}
            className={`p-3.5 rounded-full transition-colors ${
              speakerOn ? 'bg-white/10 hover:bg-white/20' : 'bg-white/25'
            }`}
          >
            {speakerOn ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <VolumeX className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={endCall}
            aria-label="End call"
            className="p-3.5 rounded-full bg-destructive hover:opacity-90 transition-opacity"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
