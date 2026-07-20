import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStreak } from '@/hooks/useStreak';

interface Props {
  onClick?: () => void;
}

export function StreakChip({ onClick }: Props) {
  const { streak } = useStreak();
  const n = streak?.current_streak ?? 0;
  const active = n > 0;
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
        active
          ? 'grad-sunset text-white border-transparent shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)]'
          : 'bg-card text-foreground border-border/60'
      }`}
    >
      <Flame className={`w-4 h-4 ${active ? 'text-white' : 'text-muted-foreground'}`} />
      <span className="text-sm font-bold">{n}</span>
      <span className={`text-xs ${active ? 'text-white/90' : 'text-muted-foreground'}`}>
        day{n === 1 ? '' : 's'}
      </span>
    </motion.button>
  );
}
