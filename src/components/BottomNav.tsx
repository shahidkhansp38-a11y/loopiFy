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
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around w-full max-w-3xl mx-auto px-1">
        {TABS.map((t) => {
          const active = isActive(t.path);
          const Icon = t.icon;
          return (
            <li key={t.path} className="flex-1">
              <motion.button
                type="button"
                onClick={() => handleTap(t.path)}
                whileTap={{ scale: 0.94 }}
                className="relative w-full h-16 flex flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={t.label}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    className="absolute top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full grad-brand"
                  />
                )}

                <Icon
                  className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t.label}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
