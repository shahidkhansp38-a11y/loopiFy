# Home Dashboard Redesign Plan

Scope: **Only `src/pages/Index.tsx`** plus small presentational helpers. No changes to auth, Supabase, routing, or BottomNav. All existing hooks (`useAuth`, `useAppUser`, `useStudyGroups`, `useNotifications`, `useStreak`, `useLearning`, `useAssignments`, `useFlashcards`) remain the data source.

## Section-by-section build

1. **Greeting header** — keep existing sticky glass header (avatar, search, notifications). Below it, add a hero greeting block: time-based "Good morning/afternoon/evening", user's first name in large Space Grotesk display type, rotating motivational subtitle.

2. **Study Streak Card** — replace current "Today's Mission" with a richer streak card:
   - 🔥 Flame + current streak number (from `useStreak`)
   - 7-day dot row showing which days this week were active (derived from `history`)
   - Today's goal completion (minutes + cards) with the existing `GoalRing`
   - Gradient purple/violet background, glass overlay

3. **Continue Learning** — pull last-opened lecture from `useLearning` (fallback: most recent group). Single wide card:
   - Course/group name + lecture title
   - Progress bar (uses `lecture_progress` if available, else group progress heuristic)
   - "Continue" CTA → `/learning/{groupId}`

4. **Quick Actions (2×2 grid)** — AI Tutor, Study Groups, Flashcards, Notes (Notes → `/resources`). Each card: gradient tint, lucide icon in rounded square, label + subtitle, `whileTap` scale + hover lift.

5. **Upcoming Classes** — today's scheduled items. Data source: nearest available signal is `assignments` due today + any lectures added today from `useLearning`. Card list with subject, time, teacher name (group creator), and "Join" button routing to `/video-call?groupId=...` for group sessions or `/learning/{groupId}` for lectures. Empty state: "No classes today — enjoy the break".

6. **Recommended Resources** — horizontal rail of items pulled from lectures/resources of the user's joined groups (via `useStudyGroups` + `useLearning`). Each card: type badge (Note/Quiz/Lecture), title, group name, tap → route to that resource.

7. **Weekly Study Statistics** — 4 stat tiles in a 2×2 grid:
   - Hours studied (sum `minutes_studied` last 7 days ÷ 60)
   - Lectures completed (count from `lecture_progress` where completed, last 7 days)
   - Flashcards reviewed (sum `cards_reviewed` last 7 days)
   - Quizzes completed (fallback: `assignments_submitted` last 7 days until quizzes ship)
   Each tile: gradient bg, big number, label, tiny delta vs previous week.

8. **Achievements** — derived badges from existing data (no schema changes):
   - "7-day streak", "30-day streak" (from `streak.current_streak`)
   - "Century Club" (100 cards reviewed total)
   - "First Submission" (any assignment submitted)
   Horizontal scroll rail of badge chips with gradient icons; locked ones shown dimmed.

## Design system (reusing existing tokens)

- Purple brand identity: existing `grad-brand`, `grad-accent`, `shadow-glow`, `card-premium`, `glass` utility classes.
- Radii 20–24px (existing `rounded-[24px]` / `rounded-3xl`).
- Motion: `framer-motion` staggered fade+rise entrance, `whileTap: 0.97`, `whileHover` lift on cards.
- Respect safe areas via existing `AppLayout` (bottom-nav padding already global).
- All colors via semantic tokens — no hardcoded hex in components.

## Files touched

- `src/pages/Index.tsx` — full rewrite of the JSX (hooks unchanged).
- Optionally add small presentational components under `src/components/home/` (e.g. `WeekDots.tsx`, `StatTile.tsx`, `AchievementChip.tsx`) to keep `Index.tsx` readable. Pure UI, no new hooks.

## Explicitly untouched

- `useAuth`, all Supabase clients, edge functions, RLS.
- `App.tsx` routes, `BottomNav.tsx`, `AppLayout.tsx`.
- Backend tables, migrations, RPCs.

## Notes / assumptions

- "Upcoming Classes" and "Notes" don't have dedicated schemas yet; I'll derive them from existing data (assignments/lectures/resources) so nothing new is required backend-side. If you'd rather add a real `class_sessions` table later, that's a separate task.
