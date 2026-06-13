
-- ASSIGNMENTS
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  max_points INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning members can view group assignments"
  ON public.assignments FOR SELECT TO authenticated
  USING (public.is_learning_member(auth.uid(), group_id));

CREATE POLICY "Group admins can insert assignments"
  ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id) AND created_by = auth.uid());

CREATE POLICY "Group admins can update assignments"
  ON public.assignments FOR UPDATE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id))
  WITH CHECK (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins can delete assignments"
  ON public.assignments FOR DELETE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE INDEX idx_assignments_group ON public.assignments(group_id, due_at DESC);

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade NUMERIC,
  feedback TEXT,
  graded_by UUID,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Helper: admin of the submission's assignment's group
CREATE OR REPLACE FUNCTION public.is_assignment_admin(_user_id uuid, _assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = _assignment_id
      AND public.is_group_admin(_user_id, a.group_id)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_assignment_admin(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_assignment_admin(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Students view own submissions; admins view all"
  ON public.submissions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_assignment_admin(auth.uid(), assignment_id)
  );

CREATE POLICY "Students insert own submission for member groups"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id
        AND public.is_learning_member(auth.uid(), a.group_id)
    )
  );

CREATE POLICY "Students update own ungraded; admins grade any"
  ON public.submissions FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND grade IS NULL)
    OR public.is_assignment_admin(auth.uid(), assignment_id)
  )
  WITH CHECK (
    (user_id = auth.uid() AND grade IS NULL)
    OR public.is_assignment_admin(auth.uid(), assignment_id)
  );

CREATE POLICY "Students delete own ungraded; admins delete any"
  ON public.submissions FOR DELETE TO authenticated
  USING (
    (user_id = auth.uid() AND grade IS NULL)
    OR public.is_assignment_admin(auth.uid(), assignment_id)
  );

CREATE INDEX idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_user ON public.submissions(user_id);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications: new assignment -> notify learning members
CREATE OR REPLACE FUNCTION public.notify_new_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, group_id)
  SELECT m.user_id, 'new_assignment', 'New Assignment',
         'New assignment posted: ' || NEW.title,
         NEW.group_id
  FROM public.group_learning_members m
  WHERE m.group_id = NEW.group_id AND m.user_id <> NEW.created_by;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_new_assignment() FROM anon, public;

CREATE TRIGGER trg_notify_new_assignment
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_assignment();

-- Notifications: submission graded -> notify student
CREATE OR REPLACE FUNCTION public.notify_submission_graded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a_title TEXT;
  a_group UUID;
BEGIN
  IF NEW.grade IS NOT NULL AND (OLD.grade IS DISTINCT FROM NEW.grade) THEN
    SELECT title, group_id INTO a_title, a_group
    FROM public.assignments WHERE id = NEW.assignment_id;

    INSERT INTO public.notifications (user_id, type, title, message, group_id)
    VALUES (NEW.user_id, 'submission_graded', 'Submission Graded',
            'Your submission for "' || a_title || '" was graded.',
            a_group);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_submission_graded() FROM anon, public;

CREATE TRIGGER trg_notify_submission_graded
  AFTER UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_graded();
