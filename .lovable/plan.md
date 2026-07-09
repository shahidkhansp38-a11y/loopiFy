## Fix: Realtime topic authorization

### 1. Migration — replace `realtime.messages` SELECT policy

Drop the current policy and recreate it so each topic pattern is authorized against the specific resource:

```sql
DROP POLICY "Authenticated can subscribe to allowed topics" ON realtime.messages;

CREATE POLICY "Authenticated can subscribe to allowed topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    -- Group chat: messages-{groupId}
    WHEN realtime.topic() LIKE 'messages-%' THEN
      public.is_group_member(auth.uid(), NULLIF(substring(realtime.topic() from 10), '')::uuid)

    -- Q&A questions list: questions-{groupId}
    WHEN realtime.topic() LIKE 'questions-%' THEN
      public.is_group_member(auth.uid(), NULLIF(substring(realtime.topic() from 11), '')::uuid)

    -- Answers on one question: answers-{questionId} — must be member of that question's group
    WHEN realtime.topic() LIKE 'answers-%' THEN
      EXISTS (
        SELECT 1 FROM public.group_questions q
        WHERE q.id = NULLIF(substring(realtime.topic() from 9), '')::uuid
          AND public.is_group_member(auth.uid(), q.group_id)
      )

    -- Per-user notifications: notifications-{userId}
    WHEN realtime.topic() LIKE 'notifications-%' THEN
      auth.uid()::text = NULLIF(substring(realtime.topic() from 15), '')

    ELSE false
  END
);
```

This removes the two `auth.uid() IS NOT NULL`-only branches (`answers-%`, `notifications-realtime`) and replaces them with per-resource checks. Presence/broadcast events on these channels are gated by the same SELECT policy, so unauthorized users can neither subscribe, receive broadcasts, nor see presence.

### 2. Frontend — use per-user notifications channel

**`src/hooks/useNotifications.tsx`** — change:

```ts
.channel('notifications-realtime')
```

to:

```ts
.channel(`notifications-${user.id}`)
```

No other changes needed. Existing channels are already scoped correctly:
- `messages-${groupId}` (useMessages) — group-member gated ✓
- `questions-${groupId}` (useGroupQuestions) — group-member gated ✓
- `answers-${questionId}` (useGroupQuestions) — now gated by question→group membership ✓

### 3. Verification

- Confirm build passes.
- Mark the `realtime_messages_answers_notifications_topic_leak` finding as fixed via the security tool with an explanation of the new policy.
- Update `@security-memory` to note that all realtime topics must be scoped to a resource id and authorized against membership/ownership; no `TRUE` / role-only branches.

### Files changed
1. New Supabase migration (policy rewrite).
2. `src/hooks/useNotifications.tsx` (channel name).
