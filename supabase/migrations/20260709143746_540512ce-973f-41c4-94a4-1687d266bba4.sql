DROP POLICY IF EXISTS "Authenticated can subscribe to allowed topics" ON realtime.messages;

CREATE POLICY "Authenticated can subscribe to allowed topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'messages-%' THEN
      public.is_group_member(auth.uid(), NULLIF(substring(realtime.topic() from 10), '')::uuid)
    WHEN realtime.topic() LIKE 'questions-%' THEN
      public.is_group_member(auth.uid(), NULLIF(substring(realtime.topic() from 11), '')::uuid)
    WHEN realtime.topic() LIKE 'answers-%' THEN
      EXISTS (
        SELECT 1 FROM public.group_questions q
        WHERE q.id = NULLIF(substring(realtime.topic() from 9), '')::uuid
          AND public.is_group_member(auth.uid(), q.group_id)
      )
    WHEN realtime.topic() LIKE 'notifications-%' THEN
      auth.uid()::text = NULLIF(substring(realtime.topic() from 15), '')
    ELSE false
  END
);