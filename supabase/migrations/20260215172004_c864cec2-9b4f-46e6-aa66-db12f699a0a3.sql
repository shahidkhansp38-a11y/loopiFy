-- Update default max_members from 50 to 6
ALTER TABLE public.study_groups ALTER COLUMN max_members SET DEFAULT 6;