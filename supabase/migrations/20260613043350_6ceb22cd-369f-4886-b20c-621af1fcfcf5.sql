
REVOKE EXECUTE ON FUNCTION public.is_assignment_admin(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_assignment() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_submission_graded() FROM authenticated, anon, public;
