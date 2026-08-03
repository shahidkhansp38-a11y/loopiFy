import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tint: string;
  delay?: number;
}

export function StatTile({ icon: Icon, value, label, tint, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="card-premium p-4 relative overflow-hidden"
    >
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-40 ${tint}`} />
      <div className={`w-9 h-9 rounded-xl ${tint} flex items-center justify-center mb-2.5`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <p className="text-2xl font-bold font-display text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
    </motion.div>
  );
}
