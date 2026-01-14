
-- Add foreign key constraints for profile joins
ALTER TABLE public.group_questions 
ADD CONSTRAINT group_questions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.question_answers 
ADD CONSTRAINT question_answers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
