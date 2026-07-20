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
  const gid = `ring-grad-${size}`;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="60%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-foreground font-display">
        {Math.round(pct * 100)}%
      </span>
    </motion.button>
  );
}
