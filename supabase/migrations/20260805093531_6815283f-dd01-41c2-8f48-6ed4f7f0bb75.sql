DROP POLICY IF EXISTS "Authenticated can subscribe to allowed topics" ON realtime.messages;

CREATE POLICY "Authenticated can subscribe to allowed topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'messages-%' THEN public.is_group_member(auth.uid(), (NULLIF(SUBSTRING(realtime.topic() FROM 10), ''))::uuid)
    WHEN realtime.topic() LIKE 'questions-%' THEN public.is_group_member(auth.uid(), (NULLIF(SUBSTRING(realtime.topic() FROM 11), ''))::uuid)
    WHEN realtime.topic() LIKE 'answers-%' THEN EXISTS (
      SELECT 1 FROM public.group_questions q
      WHERE q.id = (NULLIF(SUBSTRING(realtime.topic() FROM 9), ''))::uuid
        AND public.is_group_member(auth.uid(), q.group_id)
    )
    WHEN realtime.topic() LIKE 'notifications-%' THEN (auth.uid())::text = NULLIF(SUBSTRING(realtime.topic() FROM 15), '')
    WHEN realtime.topic() LIKE 'group-call-%' THEN public.is_group_member(auth.uid(), (NULLIF(SUBSTRING(realtime.topic() FROM 12), ''))::uuid)
    ELSE false
  END
);

CREATE POLICY "Group members can broadcast in group call rooms"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'group-call-%'
  AND public.is_group_member(auth.uid(), (NULLIF(SUBSTRING(realtime.topic() FROM 12), ''))::uuid)
);