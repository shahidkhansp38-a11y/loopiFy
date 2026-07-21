import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

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
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const withNav = !BOTTOM_NAV_HIDDEN.some((p) => pathname.startsWith(p));
  return <div className={withNav ? 'pb-bottom-nav' : undefined}>{children}</div>;
}
