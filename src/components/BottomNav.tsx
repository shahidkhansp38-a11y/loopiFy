import { Home, Users, GraduationCap, Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { BOTTOM_NAV_HIDDEN } from './AppLayout';

const TABS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/groups', label: 'Study Hub', icon: Users },
  { path: '/learning', label: 'Learn', icon: GraduationCap },
  { path: '/ai-tutor', label: 'Loopi AI', icon: Bot },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (BOTTOM_NAV_HIDDEN.some((p) => location.pathname.startsWith(p))) return null;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleTap = (path: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as Navigator).vibrate?.(8); } catch {}
    }
    if (!isActive(path)) navigate(path);
  };

  return (
    <nav
      className="fixed z-50 left-1/2 -translate-x-1/2 w-[min(560px,calc(100%-1.5rem))] pointer-events-none"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      aria-label="Primary"
    >
      <div className="glass shadow-float rounded-full px-2 py-2 flex items-center justify-between gap-1 pointer-events-auto border border-white/40">
        {TABS.map((t) => {
          const active = isActive(t.path);
          const Icon = t.icon;
          return (
            <motion.button
              key={t.path}
              onClick={() => handleTap(t.path)}
              whileTap={{ scale: 0.92 }}
              className="relative flex-1 flex items-center justify-center outline-none min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  className="absolute inset-0 rounded-full grad-brand shadow-glow"
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center gap-1.5 h-11 px-3 rounded-full transition-colors ${
                  active ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                <motion.span
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                </motion.span>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                  >
                    {t.label}
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
