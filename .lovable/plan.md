# Plan: Per-group video call button on group cards

## Goal
Restore access to the video call feature by adding a call button on each **member** group card in the Groups list. Tapping it opens the existing `/video-call` page scoped to that group's room, so all members joining from the same group land in the same session.

## Changes

### 1) `src/pages/Groups.tsx`
- On each group card in the list, for groups where `group.is_member === true`, add a small circular icon button using `Video` from `lucide-react`, placed just before the existing "Open" button.
- Click handler: `e.stopPropagation()` then `navigate(\`/video-call?groupId=${group.id}&name=${encodeURIComponent(group.name)}\`)`.
- Non-member cards continue to show Join/Full as today (no call button).
- Tooltip / `aria-label`: "Start video call".

### 2) `src/pages/VideoCall.tsx`
- Read `groupId` and `name` from `useSearchParams()`.
- If `groupId` present:
  - Show the group name in the header instead of the generic "Study Session" (fallback stays "Study Session").
  - Use the `groupId` as the room identifier (stored in local state / passed to the future signalling layer). This defines the "per-group room" contract even though the current UI is still a mocked video grid.
- No change to controls, participants mock, or styling.

## Out of scope
- No real WebRTC / signalling implementation — the page remains the current mock, just group-scoped and reachable from Groups.
- No changes to `GroupChat` header, home screen shortcut, or DB schema.
- No new tables or RLS changes.

## Files touched
- `src/pages/Groups.tsx`
- `src/pages/VideoCall.tsx`
