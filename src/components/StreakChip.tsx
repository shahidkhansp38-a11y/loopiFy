import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStreak } from '@/hooks/useStreak';

interface Props {
  onClick?: () => void;
}

export function StreakChip({ onClick }: Props) {
  const { streak } = useStreak();
  const n = streak?.current_streak ?? 0;
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 loopify-card-shadow"
    >
      <Flame className={`w-4 h-4 ${n > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
      <span className="text-sm font-semibold text-foreground">{n}</span>
      <span className="text-xs text-muted-foreground">day{n === 1 ? '' : 's'}</span>
    </motion.button>
  );
}
