# LoopiFy — App Overview & Feature Plan

LoopiFy is a mobile-first peer learning app for students and teachers. It combines study groups, structured lecture-based learning, flashcards, assignments, an AI tutor, and curated VTU resources — all wrapped in a clean, minimal UI with real-time chat and notifications.

---

## 1. How the App Works (High Level)

1. **Landing / Welcome** — Unauthenticated visitors land on `/welcome`, learn about the app, and sign up or log in.
2. **Auth** — Email/password + Google sign-in. Password reset via email.
3. **Onboarding** — New users pick their role: **Student** or **Teacher**. Role is stored in `app_users.platform_role` and drives what they can do.
4. **Home (`/`)** — Personalized dashboard: streak, daily goal ring, quick actions (Groups, Resources), notifications, search.
5. **Core loops**
   - Students → join groups → consume lectures → practice with flashcards → submit assignments → chat with peers → ask the AI tutor.
   - Teachers → create learning groups → upload lectures → publish assignments/flashcards → grade submissions → manage students & invites.
6. **Realtime layer** — Group chats, Q&A, and notifications update live.
7. **Profile** — Manage account, view streak heatmap, sign out, delete account.

---

## 2. Shared Features (Both Roles)

- **Auth & profile management** — sign up, log in, reset password, edit profile, delete account.
- **Study Groups (`/groups`)** — social/peer groups with group chat and peer Q&A.
- **Global search** — search across groups, lectures, resources, people.
- **Notifications** — real-time bell popover for new messages, join requests, grades, replies.
- **Streaks & daily goal** — daily study-minute goal, streak counter, heatmap of activity in Profile.
- **AI Tutor (`/ai-tutor`)** — chat with an AI tutor (Lovable AI Gateway / Gemini) for explanations, examples, quick help. Conversations are saved.
- **VTU Resources (`/resources`)** — curated VTU B.E. CSE study materials (notes, question papers, syllabus).
- **Flashcards (`/flashcards`)** — personal decks with SM-2 spaced-repetition review sessions.
- **Video Call (`/video-call`)** — join a live study/class video room.
- **Splash screen** on first load per session, framer-motion transitions throughout.

---

## 3. What a **Student** Can Do

### Discover & join
- Browse and join **Study Groups** (`/groups`) — send a join request or use an **invite code**.
- Browse **Learning Groups** (`/learning`) created by teachers and request to join.

### Learn
- Open a learning group (`/learning/:groupId`) and see the **Lectures** tab.
- Watch embedded video lectures; progress (percent + seconds) is auto-saved.
- Mark lectures as **Completed**, which logs study minutes into their streak.
- Use the **Cards** tab to review the group's flashcards (spaced repetition).
- Open **Tasks** tab to view and **submit assignments** posted by the teacher.

### Practice
- Create personal **flashcard decks**, add cards, bulk import, run **Review sessions** using SM-2.
- Track mastery over time via streak + heatmap.

### Collaborate
- Chat in **group chat** and post in **peer Q&A** inside a study group.
- Receive live notifications for replies, new lectures, grades, and join-request outcomes.

### Get help
- Ask the **AI Tutor** questions and revisit past conversations.
- Browse **VTU Resources** for notes and past papers.

### Personal
- Set a **daily study goal**, view **streak heatmap**, edit profile, sign out, delete account.

---

## 4. What a **Teacher** Can Do

Teachers get everything a student can do, **plus** admin controls on learning groups they own.

### Create & manage learning groups
- Create a **Learning Group** and become its **admin** (Crown badge).
- Generate & revoke **invite codes** (Invites tab).
- Review **pending join requests** — approve or reject (Manage tab).
- View & remove enrolled students.

### Publish content
- **Add / delete lectures** (title, description, video URL, duration).
- Manage the group's **flashcard decks & cards** (create, edit, bulk import).
- Create **assignments** with instructions and due dates.

### Assess
- Open the **Grade Submissions** panel to review student submissions and assign grades/feedback.
- Students get a notification when graded.

### Communicate
- Participate in group chat and Q&A as the group's authority.
- Video call room for live sessions.

---

## 5. Feature Map by Route

| Route | Purpose | Student | Teacher |
|---|---|---|---|
| `/welcome` | Landing for unauth users | ✓ | ✓ |
| `/auth`, `/reset-password` | Auth flows | ✓ | ✓ |
| `/onboarding` | Pick role | ✓ | ✓ |
| `/` (Index) | Home dashboard, streak, quick actions | ✓ | ✓ |
| `/groups` | Social study groups + chat + Q&A | join/participate | join/participate |
| `/learning` | Browse/join learning groups | join | create, own |
| `/learning/:groupId` | Lectures, Cards, Tasks, Manage, Invites | consume + submit | full admin |
| `/ai-tutor` | AI chat tutor | ✓ | ✓ |
| `/resources` | VTU study materials | ✓ | ✓ |
| `/flashcards` | Personal decks + SM-2 review | ✓ | ✓ |
| `/video-call` | Live video room | ✓ | ✓ |
| `/profile` | Account, streak heatmap, sign out | ✓ | ✓ |

---

## 6. Technical Notes (for reference)

- **Stack:** React 18 + Vite + TypeScript, Tailwind, shadcn/ui, framer-motion, React Router, TanStack Query.
- **Backend (Lovable Cloud):** Postgres with strict RLS, Auth (email + Google), Realtime for chats/Q&A/notifications, Edge Functions (`ai-tutor`, `delete-account`), Storage.
- **Roles:** stored in `app_users.platform_role` (`student` | `teacher` | `admin`); UI gates admin actions via `isAdmin` from `useLectures`/group membership.
- **Session resilience:** `useAuth` exposes `sessionVersion`; data hooks refetch on token refresh and window focus so expired-JWT states self-heal.
- **AI:** Lovable AI Gateway (Google Gemini) via the `ai-tutor` edge function; no user-managed API key.

---

This document describes the app as it exists today. No code changes are proposed here — it's a reference plan of features and per-role capabilities.
