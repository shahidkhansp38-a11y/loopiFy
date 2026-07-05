## Plan: Phone/OTP sign-in + fix sign-out redirect

### 1) Fix Sign Out on Profile
Root cause: `handleSignOut` calls `signOut()` then `navigate('/auth')`, but the `useAuth` `onAuthStateChange` listener fires `SIGNED_OUT` which clears `user`. The `Profile` guard effect (`if (!user) navigate('/auth')`) then runs, but because Supabase sometimes retains a stale refresh token attempt (visible in logs: "Invalid Refresh Token"), the session can transiently repopulate on focus, causing "signs out then auto-signs back in" behavior. Also, `signOut()` is called without `{ scope: 'global' }`, and errors are swallowed silently.

Fixes:
- Change `signOut` in `src/hooks/useAuth.tsx` to explicitly clear local state (`setUser(null)`, `setSession(null)`) and call `supabase.auth.signOut({ scope: 'local' })` with error handling.
- In `Profile.tsx` `handleSignOut`, use `window.location.replace('/auth')` instead of `navigate` — this forces a full reload, guaranteeing all in-memory hooks/subscriptions reset and no stale session survives.
- Guard the focus/visibility refresh handler in `useAuth`: skip auto-refresh when there is no current session (prevents zombie refresh attempts that log the "Refresh Token Not Found" error).

### 2) Add Phone + OTP sign-in to Auth page
Add a third auth method alongside Email and Google on `src/pages/Auth.tsx`:
- New toggle at the top of the login/signup card: "Email" | "Phone".
- Phone mode UI:
  - Step 1: Country code + phone input → "Send code" → calls `supabase.auth.signInWithOtp({ phone })`.
  - Step 2: 6-digit OTP input (using existing `input-otp` component) → "Verify" → calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
  - "Resend code" link with 30s cooldown.
- Validate E.164 format with zod (`^\+[1-9]\d{7,14}$`).
- Show toasts for send/verify success/failure; on success the existing `useAuth` listener redirects via the `user` effect.
- Phone tab shown for both login and signup (Supabase phone OTP auto-creates the user on first verify).
- Forgot-password link hidden in phone mode.

### Files to edit
- `src/hooks/useAuth.tsx` — harden signOut + focus refresh guard.
- `src/pages/Profile.tsx` — hard-redirect after sign out.
- `src/pages/Auth.tsx` — add Email/Phone tabs and OTP flow.

### Not in scope
- No DB migrations. Phone provider is already enabled in backend.
- No changes to Google OAuth flow, MCP, or other pages.
