
# Flashcards + Study Streaks

Two features, built in order. Both reuse the existing learning-group model, RLS helpers, and notification system. Nothing in the Groups feature changes.

## Why these two for LoopiFy

- **Flashcards** turn lectures and assignments into long-term recall — the missing piece between "watched a video" and "passed the exam."
- **Streaks & Goals** give students a reason to open the app *daily*, which is the #1 retention lever in edtech. Every existing feature (lectures, tasks, flashcards) feeds into the daily goal.

---

## Feature 1 — Flashcards with Spaced Repetition

### User experience

- A new **Flashcards** tab inside each Learning Group, plus a top-level **/flashcards** page for personal decks.
- **Teachers/admins**: create decks tied to a group (optionally linked to a specific lecture), add cards (front/back, optional image, optional hint).
- **Students**: create personal decks, or study any deck shared in their groups.
- **Review mode**: full-screen card. Tap to flip. After flipping, rate recall with four buttons — **Again / Hard / Good / Easy**. The SM-2 algorithm reschedules the card.
- **Today view** shows "X cards due" per deck. Empty state when caught up.
- Optional: import cards in bulk via pasted CSV/TSV.

### Why SM-2

SuperMemo-2 is the proven, lightweight algorithm Anki is built on. Each card stores `ease_factor`, `interval_days`, `repetitions`, and `due_at`. Rating updates those four fields. No ML, no server cron — scheduling happens client-side on review and gets persisted.

### Data model

- `flashcard_decks` — id, owner_id, group_id (nullable for personal decks), lecture_id (nullable), title, description, is_shared.
- `flashcards` — id, deck_id, front, back, hint, image_url.
- `flashcard_reviews` — id, user_id, card_id, ease_factor, interval_days, repetitions, due_at, last_reviewed_at. Composite unique on (user_id, card_id) so each user has their own schedule for a shared card.

### Access rules (plain English)

- Anyone in a group can view decks shared to that group; only the deck owner or a group admin can edit/delete it.
- Personal decks are visible only to their owner.
- Each user's review schedule is private to them.

### UI surface

- `Flashcards` tab inside `LearningGroup` (next to Lectures / Tasks / Manage / Invites).
- New page `/flashcards` (personal + due-today across all groups).
- Components: `DeckList`, `DeckCard`, `AddDeckDialog`, `AddCardDialog`, `ReviewSession` (the full-screen flip-and-rate UI), `BulkImportDialog`.

---

## Feature 2 — Study Streaks & Daily Goals

### User experience

- Home screen gets a **Streak chip** (🔥 N-day streak) and a **Daily Goal ring** (e.g. 0/20 minutes today).
- Profile page shows a 12-week heatmap calendar of activity.
- Settings: user picks their daily goal (minutes studied, cards reviewed, or both).
- When the goal hits 100% for the day, a celebratory toast fires and the streak ticks up at midnight (user's local timezone).
- Missing a day resets the streak — but a one-time **"Streak freeze"** is granted every 7 completed days (so one bad day doesn't kill momentum).

### What counts toward the goal

- Minutes of lecture video watched (already tracked in `lecture_progress`).
- Number of flashcards reviewed today.
- Assignment submitted today (counts as a flat bonus, e.g. 10 min equivalent).

### Data model

- `user_streaks` — user_id (PK), current_streak, longest_streak, last_active_date, freezes_available.
- `daily_activity` — user_id, activity_date, minutes_studied, cards_reviewed, assignments_submitted. Unique on (user_id, activity_date). One row per day per user — cheap to query for the heatmap.
- `user_goals` — user_id (PK), daily_minutes_goal, daily_cards_goal.

### Access rules

- A user can only read/write their own streak, activity, and goals rows.

### UI surface

- `StreakChip` and `GoalRing` components on the home page header.
- `StreakHeatmap` on the Profile page.
- `GoalSettingsDialog` triggered from the chip.
- Hook `useStreak()` that lectures, flashcard review, and assignment submission all call into to log activity.

---

## Build order

1. **Migration A** — flashcards tables, RLS, helper functions, GRANTs, notification trigger for "new deck shared."
2. **Frontend** — `useFlashcards` hook, deck/card CRUD UI, SM-2 review session, Flashcards tab in LearningGroup, `/flashcards` route, Index quick action.
3. **Migration B** — streaks/activity/goals tables, RLS, GRANTs, helper function `log_daily_activity(minutes, cards, submitted)`.
4. **Frontend** — `useStreak` hook, StreakChip + GoalRing on home, heatmap on Profile, goal settings dialog. Wire `useStreak.log(...)` into lecture progress, flashcard review, and assignment submission.

## Technical notes (skip if non-technical)

- SM-2 lives in `src/lib/sm2.ts` — pure function, easily unit-testable.
- Streak rollover is computed on read in the user's timezone (no cron needed): when the user opens the app, `useStreak` compares `last_active_date` to today and updates accordingly.
- Reuse `is_group_admin` / `is_learning_member` helpers — no new RLS primitives needed.
- All new tables follow the existing GRANT-then-RLS pattern; no anon access anywhere.

## Out of scope (for now)

- Card images uploaded to storage (use URLs initially; storage bucket later if asked).
- Public/marketplace decks across groups.
- Leaderboards.
