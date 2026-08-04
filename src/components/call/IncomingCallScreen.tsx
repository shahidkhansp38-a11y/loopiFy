import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from './CallProvider';

export function IncomingCallScreen() {
  const { incoming, acceptCall, rejectCall } = useCall();
  if (!incoming) return null;

  const initials = incoming.caller.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-between py-16 px-6"
    >
      <div className="flex flex-col items-center gap-4 mt-10">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="w-28 h-28 rounded-full grad-brand flex items-center justify-center text-3xl font-bold text-white"
        >
          {initials || '?'}
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">{incoming.caller.name}</h2>
          <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
            <Video className="w-4 h-4" />
            Incoming video call
          </p>
        </div>
      </div>

      <div className="flex items-center gap-12">
        <button
          onClick={rejectCall}
          aria-label="Decline call"
          className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-lg active:scale-95 transition-transform"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
        <motion.button
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          onClick={acceptCall}
          aria-label="Accept call"
          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg active:scale-95"
        >
          <Phone className="w-7 h-7" />
        </motion.button>
      </div>
    </motion.div>
  );
}
