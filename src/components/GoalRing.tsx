import { motion } from 'framer-motion';
import { useStreak } from '@/hooks/useStreak';

interface Props {
  onClick?: () => void;
  size?: number;
}

export function GoalRing({ onClick, size = 56 }: Props) {
  const { today, goal } = useStreak();
  const minutes = today?.minutes_studied ?? 0;
  const cards = today?.cards_reviewed ?? 0;
  const pctMin = Math.min(1, minutes / Math.max(1, goal.daily_minutes_goal));
  const pctCard = Math.min(1, cards / Math.max(1, goal.daily_cards_goal));
  const pct = Math.max(pctMin, pctCard);
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-foreground">{Math.round(pct * 100)}%</span>
    </motion.button>
  );
}
