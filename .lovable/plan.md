# LoopiFy Premium Redesign Plan

Redesign the visual layer only. All hooks, routing, Supabase calls, MCP, and business logic stay untouched. Only files touched are CSS tokens, the Home page, existing home components, and a new floating bottom nav mounted app-wide.

## 1. New Design System (`src/index.css` + `tailwind.config.ts`)

Rewrite CSS tokens to the Gen Z palette (kept in HSL for shadcn compatibility):

```
--primary: 239 84% 67%      /* #6366F1 Indigo */
--secondary: 258 90% 66%    /* #8B5CF6 Violet */
--accent: 189 94% 43%       /* #06B6D4 Cyan */
--success: 142 71% 45%      /* #22C55E */
--warning: 38 92% 50%       /* #F59E0B */
--destructive: 0 84% 60%    /* #EF4444 */
--background: 210 40% 98%   /* #F8FAFC */
--card: 0 0% 100%
--foreground: 222 47% 11%   /* #0F172A */
--muted-foreground: 215 16% 47% /* #64748B */
--radius: 1.25rem           /* 20px baseline */
```

Dark theme mirrors above with `--background: 222 47% 6%`, `--card: 222 33% 12%`.

New utilities:
- `.grad-brand` → `linear-gradient(135deg, #6366F1, #8B5CF6)`
- `.grad-accent` → `linear-gradient(135deg, #8B5CF6, #06B6D4)`
- `.glass` → `backdrop-blur(24px) saturate(180%) bg-white/70` (dark: `bg-slate-900/60`) + subtle border
- `.card-premium` → white/dark card, 22px radius, layered shadow `0 8px 32px -12px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.04)`
- `.shadow-float` for the floating nav

Add tailwind keyframes: `float-in` (translateY + opacity), `shimmer`, `pulse-glow` for AI card.

Typography: keep Inter for body; add **Space Grotesk** for display headings (via existing Google Fonts import). Use `font-display` utility class.

## 2. Floating Bottom Navigation (new `src/components/BottomNav.tsx`)

Rendered in `App.tsx` inside routes where `user` context exists — hidden on `/welcome`, `/auth`, `/onboarding`, `/reset-password`, `/.lovable/oauth/consent`, and `/video-call`. Uses `useLocation` for active state, `useNavigate` for taps. Existing routes untouched.

Structure:
```
[fixed bottom-4 inset-x-4] .glass .shadow-float rounded-full h-16
 └ 5 items: Home(/), Study Hub(/groups), Learn(/learning), Loopi AI(/ai-tutor), Profile(/profile)
```

Behavior:
- Inactive → icon only, muted color
- Active → icon + label pill, indigo→violet gradient background, icon scales to 1.15
- Animated pill (`layoutId="nav-pill"` with framer-motion) slides between tabs
- Tap: `scale: 0.92` spring; calls `navigator.vibrate?.(8)` when available (haptic)
- Safe-area padding for iOS notch (`pb-[env(safe-area-inset-bottom)]`)
- Page content gets `pb-28` to clear the nav

## 3. Home Screen Redesign (`src/pages/Index.tsx`)

Preserve all data hooks (`useAuth`, `useAppUser`, `useStudyGroups`, `useNotifications`, `useStreak`). Rebuild layout as premium mobile-first dashboard:

```
Header (glass, sticky)
  · Avatar + "Good morning, {name} 👋" + Teacher chip
  · Search icon + Bell (unread dot)

Hero AI Welcome Card (grad-brand, big radius, glow shadow)
  · "Loopi AI" title, sparkle animated icon
  · Sub: "Your study copilot is ready"
  · CTA button → /ai-tutor
  · Animated shimmer accent

Today's Mission strip
  · GoalRing (existing) + streak flame + minutes/cards mini stats
  · "Adjust goal" chevron → existing GoalSettingsDialog

Continue Learning card row (horizontal scroll)
  · Pulls from myGroups (existing). Each card: cover gradient, group name, subject, progress bar
  · Empty state: "Start your first course" CTA → /learning

Quick Actions grid (2x2 large tiles or 4-col chips)
  · Flashcards, Groups, Resources, Video Call — each with icon in soft-tinted square, label, subtle hover

Upcoming Classes / Recent Activity (side-by-side on md, stacked mobile)
  · Uses notifications feed for Recent Activity
  · Upcoming Classes derives from myGroups next lectures (already available via useLearning if fetched; otherwise empty state card with illustration)

Streak / Daily Progress
  · Mini heatmap teaser (reuse StreakHeatmap component) + "View full stats" → /profile

Empty states across sections use friendly illustrations built from lucide icons in gradient circles + one-line copy + CTA.
```

All sections animate in with staggered `float-in` motion.

## 4. Small Component Polish

- `StreakChip.tsx` — upgrade to gradient border, glow on active streak
- `GoalRing.tsx` — thicker stroke, gradient stroke via `<defs><linearGradient>` (indigo→violet), percentage in display font
- `NotificationPopover` / `SearchDialog` triggers — replace muted round buttons with `card-premium` icon buttons

Existing internal logic of these components stays identical.

## 5. Files Touched

- `src/index.css` — token overhaul, utilities, keyframes
- `tailwind.config.ts` — extend colors (brand, accent), keyframes, boxShadow
- `src/App.tsx` — mount `<BottomNav />` conditionally (no route changes)
- `src/components/BottomNav.tsx` — NEW
- `src/pages/Index.tsx` — full JSX rewrite; hooks unchanged
- `src/components/StreakChip.tsx`, `src/components/GoalRing.tsx` — visual tweaks only

Nothing else changes. Auth, MCP, edge functions, DB, hooks, RLS all untouched.

## Out of Scope (this pass)

Other pages (Groups, Learning, Profile, AITutor, etc.) keep current styling. They will visually benefit from the new tokens automatically, but no structural redesign yet — we can iterate per-page after Home lands.
