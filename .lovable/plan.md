## Problem

All Supabase requests are returning `401 PGRST303 "JWT expired"` — including Groups, notifications, streaks, app_users, etc. This isn't a Groups-specific bug; the whole app's session token has expired and the client isn't recovering. The "Failed to load study groups" toast is just the most visible symptom.

Root cause: the access token in memory has expired and `autoRefreshToken` didn't fire in time (typical when the tab was backgrounded, the device slept, or the user came back after a long idle). Requests fire with the stale token before a refresh happens, and our hooks don't retry after a refresh.

## Fix Plan

1. **Harden the Supabase client** (`src/integrations/supabase/client.ts`)
   - Keep `persistSession` + `autoRefreshToken`, and explicitly call `supabase.auth.startAutoRefresh()` on load so refresh keeps running even if the tab was idle.

2. **Recover on `TOKEN_REFRESHED` / `SIGNED_IN`** (`src/hooks/useAuth.tsx`)
   - On those auth events, expose a `sessionVersion` counter through the AuthContext so data hooks can re-run their fetches with the fresh token.

3. **Re-fetch on focus + on session change** in the affected hooks
   - `useStudyGroups`, `useAppUser`, `useNotifications`, `useStreak` (and any other top-level dashboard hooks) refetch when `sessionVersion` bumps and when the window regains focus, so a stale-token failure self-heals as soon as the refresh completes.

4. **Graceful handling in `useStudyGroups`**
   - If the first fetch returns a JWT/permission error, call `supabase.auth.refreshSession()` once and retry before surfacing the toast. This prevents the false "Failed to load study groups" message right after waking the app.

5. **Verify**
   - Reload the preview, confirm Groups loads.
   - Simulate an expired session (manually clear the access token in DevTools) and confirm the app refreshes and recovers without the red toast.

No database, RLS, or grants changes — those are already correct (the same user can hit the same tables once the token is fresh). This is purely a client-side session-refresh resilience fix.