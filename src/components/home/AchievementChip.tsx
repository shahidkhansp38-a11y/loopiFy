import { motion } from 'framer-motion';
import { LucideIcon, Lock } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  caption: string;
  unlocked: boolean;
  grad: string;
}

export function AchievementChip({ icon: Icon, title, caption, unlocked, grad }: Props) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={`snap-start shrink-0 w-[150px] card-premium p-3.5 text-left ${
        unlocked ? '' : 'opacity-55'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5 ${
          unlocked ? grad : 'bg-muted'
        }`}
      >
        {unlocked ? (
          <Icon className="w-5 h-5 text-white" />
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{caption}</p>
    </motion.div>
  );
}
