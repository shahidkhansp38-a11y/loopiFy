# India-Default Phone Sign-In

## Goal
Remove the E.164 format requirement from the Phone tab. The phone field defaults to India (+91) and the user just types their 10-digit mobile number.

## Changes (all in `src/pages/Auth.tsx`)

1. **Phone input UI**
   - Replace the single free-text input with a fixed `+91` prefix chip inside the input (non-editable, styled as part of the field).
   - The input accepts only digits, max length 10, placeholder like `63623 34546`.
   - Helper text changes from "Include country code (E.164 format)" to "Enter your 10-digit Indian mobile number".

2. **Validation**
   - Replace the E.164 zod regex with an India rule: 10 digits starting with 6–9 (`^[6-9]\d{9}$`), error: "Enter a valid 10-digit Indian mobile number".

3. **Normalization**
   - Before calling `supabase.auth.signInWithOtp` and `verifyOtp`, build the E.164 number internally: `+91` + digits (stripping any leading 0 or existing `91`/`+91` prefix if the user pastes a full number).
   - The "Code sent" toast shows the normalized `+91 XXXXXXXXXX` number.

4. **Everything else unchanged**
   - OTP input, resend cooldown, verify flow, email tab, and Google sign-in stay exactly as they are.

## Verification
- Type a 10-digit number (e.g. 6362334546) → "SEND CODE" succeeds, OTP screen appears.
- Invalid numbers (fewer digits, starting with 0–5) show the inline error without calling the backend.
