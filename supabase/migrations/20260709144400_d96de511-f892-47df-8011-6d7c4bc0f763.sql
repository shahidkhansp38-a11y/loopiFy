-- 1. Teacher-only group creation
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.study_groups;
CREATE POLICY "Teachers can create groups"
ON public.study_groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by AND public.is_teacher(auth.uid()));

-- 2. Resources: group-scoped visibility
DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.resources;
CREATE POLICY "Resources visible to members or global"
ON public.resources
FOR SELECT
TO authenticated
USING (
  group_id IS NULL
  OR public.is_group_member(auth.uid(), group_id)
  OR public.is_learning_member(auth.uid(), group_id)
);

-- 3. Revoke EXECUTE from PUBLIC and anon on all public SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

-- 4. Revoke EXECUTE from authenticated on trigger-only + helper functions
--    that must never be called directly via the Data API.
REVOKE EXECUTE ON FUNCTION public.can_view_deck(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit_deck(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_shared_deck() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_upvote() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_lecture() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_question() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_answer() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_assignment() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_submission_graded() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_join_request_decision() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_app_users_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_assignment_admin(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_platform_role(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;