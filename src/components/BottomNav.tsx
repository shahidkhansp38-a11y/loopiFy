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

const SPRING = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.7 };

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (BOTTOM_NAV_HIDDEN.some((p) => location.pathname.startsWith(p))) return null;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const activeIndex = TABS.findIndex((t) => isActive(t.path));

  const handleTap = (path: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as Navigator).vibrate?.(8); } catch {}
    }
    if (!isActive(path)) navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <div className="relative w-full max-w-3xl mx-auto px-1">
        {/* Single persistent sliding indicator */}
        {activeIndex >= 0 && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 h-16 z-0"
            style={{ width: `${100 / TABS.length}%` }}
            initial={false}
            animate={{ x: `${activeIndex * 100}%` }}
            transition={SPRING}
          >
            <span className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-9 rounded-full grad-brand" />
          </motion.div>
        )}

        <ul className="relative z-10 flex items-stretch w-full">
          {TABS.map((t) => {
            const active = isActive(t.path);
            const Icon = t.icon;
            return (
              <li key={t.path} className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleTap(t.path)}
                  className="relative w-full h-16 flex flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={t.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <motion.span
                    className="relative flex items-center justify-center will-change-transform"
                    initial={false}
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={SPRING}
                  >
                    <motion.span
                      aria-hidden
                      className="absolute inset-[-8px] rounded-full bg-primary/15 blur-[6px]"
                      initial={false}
                      animate={{ opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    />
                    <Icon
                      className={`relative w-5 h-5 transition-colors duration-200 ${
                        active ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      strokeWidth={active ? 2.4 : 2}
                    />
                  </motion.span>
                  <motion.span
                    className={`text-[11px] font-medium leading-none truncate max-w-full transition-colors duration-200 ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    initial={false}
                    animate={{ y: active ? -2 : 0, opacity: active ? 1 : 0.85 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {t.label}
                  </motion.span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
