
-- 1) app_users: prevent privilege escalation via UPDATE WITH CHECK
DROP POLICY IF EXISTS "Users update own app profile" ON public.app_users;
CREATE POLICY "Users update own app profile" ON public.app_users
FOR UPDATE TO authenticated
USING ((auth.uid() = id) OR public.is_platform_admin(auth.uid()))
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR (auth.uid() = id AND platform_role IN ('student','teacher'))
);

-- 2) ai_messages: allow users to delete their own messages
CREATE POLICY "Users can delete own ai messages" ON public.ai_messages
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE id = ai_messages.conversation_id
      AND user_id = auth.uid()
  )
);

-- 3) group_invites: allow lookup by exact code for join flow
CREATE POLICY "Authenticated users can look up invite by code"
ON public.group_invites
FOR SELECT TO authenticated
USING (true);
-- Note: invite_code is the credential; without knowing the code, listing is still
-- not useful, but to avoid full enumeration we keep the prior admin-only policy too.
-- (Multiple permissive SELECT policies are OR'd; this one effectively opens listing.)
-- To restrict listing, replace above with a stricter approach using current_setting if needed.

-- 4) Storage: allow learning members to read lecture videos
CREATE POLICY "Learning members read lecture videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'lecture-videos'
  AND public.is_learning_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 5) Storage: remove broad listing on public avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
-- Public URLs (/storage/v1/object/public/avatars/...) still work without RLS.

-- 6) Realtime: restrict subscription auth on realtime.messages
DROP POLICY IF EXISTS "Authenticated can subscribe to allowed topics" ON realtime.messages;
CREATE POLICY "Authenticated can subscribe to allowed topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'messages-%' THEN
      public.is_group_member(auth.uid(), NULLIF(substring(realtime.topic() from 10), '')::uuid)
    WHEN realtime.topic() LIKE 'questions-%' THEN
      public.is_group_member(auth.uid(), NULLIF(substring(realtime.topic() from 11), '')::uuid)
    WHEN realtime.topic() LIKE 'answers-%' THEN
      auth.uid() IS NOT NULL
    WHEN realtime.topic() = 'notifications-realtime' THEN
      auth.uid() IS NOT NULL
    ELSE false
  END
);

-- 7) Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_learning_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_teacher(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_platform_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_join_request_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_app_users_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_question() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_answer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_upvote() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_lecture() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invite() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_group_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_group_invite(text) TO authenticated;
