
-- 1. Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System inserts via triggers (security definer), so no INSERT policy needed for users
-- But we need one for the trigger functions to work via security definer

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Trigger: notify group members when a new question is posted
CREATE OR REPLACE FUNCTION public.notify_new_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, group_id)
  SELECT gm.user_id, 'new_question', 'New Question',
    'A new question was posted: ' || NEW.title,
    NEW.group_id
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id AND gm.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_question
  AFTER INSERT ON public.group_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_question();

-- 3. Trigger: notify question author when an answer is posted
CREATE OR REPLACE FUNCTION public.notify_new_answer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q_user_id UUID;
  q_title TEXT;
BEGIN
  SELECT user_id, title INTO q_user_id, q_title
  FROM public.group_questions WHERE id = NEW.question_id;

  IF q_user_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, group_id)
    SELECT q_user_id, 'new_answer', 'New Answer',
      'Someone answered your question: ' || q_title,
      q.group_id
    FROM public.group_questions q WHERE q.id = NEW.question_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_answer
  AFTER INSERT ON public.question_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_answer();

-- 4. Trigger: notify answer author when their answer is upvoted
CREATE OR REPLACE FUNCTION public.notify_upvote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a_user_id UUID;
  q_title TEXT;
  q_group_id UUID;
BEGIN
  SELECT a.user_id, q.title, q.group_id INTO a_user_id, q_title, q_group_id
  FROM public.question_answers a
  JOIN public.group_questions q ON q.id = a.question_id
  WHERE a.id = NEW.answer_id;

  IF a_user_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, group_id)
    VALUES (a_user_id, 'upvote', 'Answer Upvoted',
      'Your answer was upvoted on: ' || q_title,
      q_group_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_answer_upvote
  AFTER INSERT ON public.answer_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_upvote();

-- 5. Security fix: Tighten profiles SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view shared group profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id
    )
  );

-- 6. Security fix: Add group_members UPDATE policy (only group creator can change roles)
CREATE POLICY "Group creators can update member roles"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups sg
      WHERE sg.id = group_members.group_id AND sg.created_by = auth.uid()
    )
  );
