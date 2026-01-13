
-- Create questions/doubts table for peer learning
CREATE TABLE public.group_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.question_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.group_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create upvotes tracking table
CREATE TABLE public.answer_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.question_answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(answer_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_questions
CREATE POLICY "Members can view group questions"
ON public.group_questions FOR SELECT
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can ask questions"
ON public.group_questions FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can update own questions"
ON public.group_questions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
ON public.group_questions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for question_answers
CREATE POLICY "Members can view answers"
ON public.question_answers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.group_questions q
  WHERE q.id = question_id AND is_group_member(auth.uid(), q.group_id)
));

CREATE POLICY "Members can post answers"
ON public.question_answers FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND EXISTS (
  SELECT 1 FROM public.group_questions q
  WHERE q.id = question_id AND is_group_member(auth.uid(), q.group_id)
));

CREATE POLICY "Users can update own answers"
ON public.question_answers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
ON public.question_answers FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for answer_upvotes
CREATE POLICY "Members can view upvotes"
ON public.answer_upvotes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.question_answers a
  JOIN public.group_questions q ON q.id = a.question_id
  WHERE a.id = answer_id AND is_group_member(auth.uid(), q.group_id)
));

CREATE POLICY "Members can upvote"
ON public.answer_upvotes FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND EXISTS (
  SELECT 1 FROM public.question_answers a
  JOIN public.group_questions q ON q.id = a.question_id
  WHERE a.id = answer_id AND is_group_member(auth.uid(), q.group_id)
));

CREATE POLICY "Users can remove own upvotes"
ON public.answer_upvotes FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for questions and answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.question_answers;

-- Trigger for updated_at
CREATE TRIGGER update_group_questions_updated_at
BEFORE UPDATE ON public.group_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_question_answers_updated_at
BEFORE UPDATE ON public.question_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
