import { useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SearchDialog from '@/components/SearchDialog';
import { GLOBAL_SEARCH_EVENT } from '@/hooks/useGlobalSearch';


// Routes where the floating BottomNav is hidden — must match BottomNav.HIDDEN.
export const BOTTOM_NAV_HIDDEN = [
  '/welcome',
  '/auth',
  '/onboarding',
  '/reset-password',
  '/video-call',
  '/.lovable/oauth/consent',
];

/**
 * Global layout wrapper. Automatically reserves space at the bottom of every
 * page so the floating BottomNav never overlaps content. Uses the shared
 * `--bottom-nav-safe` CSS variable (height + iOS/Android safe area inset).
 * Also hosts the app-wide global search dialog (Cmd/Ctrl+K).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const withNav = !BOTTOM_NAV_HIDDEN.some((p) => pathname.startsWith(p));
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setSearchOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener(GLOBAL_SEARCH_EVENT, onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(GLOBAL_SEARCH_EVENT, onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <>
      <div className={withNav ? 'pb-bottom-nav' : undefined}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="will-change-transform"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

