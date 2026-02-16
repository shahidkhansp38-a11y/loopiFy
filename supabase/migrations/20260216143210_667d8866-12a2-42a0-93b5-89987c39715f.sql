-- Create resources table for VTU study materials
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semester INTEGER NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'notes', -- notes, model_paper, solution
  external_url TEXT NOT NULL,
  description TEXT,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view resources
CREATE POLICY "Authenticated users can view resources"
ON public.resources FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can add resources
CREATE POLICY "Authenticated users can add resources"
ON public.resources FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can update own resources
CREATE POLICY "Users can update own resources"
ON public.resources FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Users can delete own resources
CREATE POLICY "Users can delete own resources"
ON public.resources FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Seed VTU B.E CSE resources for all 8 semesters
INSERT INTO public.resources (semester, subject, title, resource_type, external_url, description) VALUES
-- Semester 1
(1, 'Mathematics-I', 'M1 Model Question Paper 2024', 'model_paper', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-mathematics-i/', 'VTU M1 model papers with solutions'),
(1, 'Mathematics-I', 'M1 Complete Notes', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-mathematics-i/', 'Comprehensive M1 notes'),
(1, 'Applied Physics', 'Physics Model Paper & Solutions', 'model_paper', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-physics/', 'VTU Applied Physics papers'),
(1, 'Applied Physics', 'Physics Notes', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-physics/', 'Complete physics notes'),
(1, 'Principles of C Programming', 'C Programming Notes', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/c-programming/', 'C programming fundamentals'),
(1, 'Principles of C Programming', 'C Programming Model Paper', 'model_paper', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/c-programming/', 'Model papers with solutions'),
(1, 'Applied Chemistry', 'Chemistry Notes & Papers', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-chemistry/', 'Applied Chemistry complete resources'),
(1, 'Communicative English', 'English Notes', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/', 'Communicative English study material'),
-- Semester 2
(2, 'Mathematics-II', 'M2 Notes & Model Papers', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-mathematics-ii/', 'M2 complete study material'),
(2, 'Mathematics-II', 'M2 Model Paper Solutions', 'solution', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/engineering-mathematics-ii/', 'Solved model papers'),
(2, 'Introduction to Python', 'Python Programming Notes', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/', 'Python basics and programming'),
(2, 'Engineering Graphics', 'EG Notes & Drawings', 'notes', 'https://vtupulse.com/vtu-notes/1st-2nd-sem/', 'Engineering Graphics study material'),
-- Semester 3
(3, 'Mathematics-III', 'Transform Calculus & Numerical Methods', 'notes', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'M3 complete notes'),
(3, 'Mathematics-III', 'M3 Model Paper Solutions', 'solution', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'Solved M3 papers'),
(3, 'Data Structures', 'DSA Complete Notes', 'notes', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'Data Structures and Algorithms'),
(3, 'Data Structures', 'DSA Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'Model question papers with solutions'),
(3, 'Digital Design & Computer Organization', 'DDCO Notes', 'notes', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'DDCO complete study material'),
(3, 'Object Oriented Programming with Java', 'OOP Java Notes', 'notes', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'Java OOP concepts and programs'),
(3, 'Discrete Mathematics', 'DM Notes & Papers', 'notes', 'https://vtupulse.com/vtu-notes/3rd-sem-cse/', 'Discrete Mathematics study material'),
-- Semester 4
(4, 'Analysis & Design of Algorithms', 'ADA Notes', 'notes', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Algorithm design and analysis'),
(4, 'Analysis & Design of Algorithms', 'ADA Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Solved model papers'),
(4, 'Operating Systems', 'OS Complete Notes', 'notes', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Operating Systems concepts'),
(4, 'Operating Systems', 'OS Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Model papers with solutions'),
(4, 'Microcontrollers', 'Microcontrollers Notes', 'notes', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Microcontroller architecture and programming'),
(4, 'Database Management Systems', 'DBMS Notes', 'notes', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'DBMS complete study material'),
(4, 'Database Management Systems', 'DBMS Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Solved DBMS papers'),
(4, 'Linear Algebra', 'LA Notes', 'notes', 'https://vtupulse.com/vtu-notes/4th-sem-cse/', 'Linear Algebra for CSE'),
-- Semester 5
(5, 'Computer Networks', 'CN Complete Notes', 'notes', 'https://vtupulse.com/vtu-notes/5th-sem-cse/', 'Computer Networks study material'),
(5, 'Computer Networks', 'CN Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/5th-sem-cse/', 'Solved model papers'),
(5, 'Software Engineering', 'SE Notes', 'notes', 'https://vtupulse.com/vtu-notes/5th-sem-cse/', 'Software Engineering concepts'),
(5, 'Theory of Computation', 'TOC Notes', 'notes', 'https://vtupulse.com/vtu-notes/5th-sem-cse/', 'Automata and formal languages'),
(5, 'Theory of Computation', 'TOC Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/5th-sem-cse/', 'Solved TOC papers'),
(5, 'Artificial Intelligence', 'AI Notes', 'notes', 'https://vtupulse.com/vtu-notes/5th-sem-cse/', 'AI fundamentals and techniques'),
-- Semester 6
(6, 'System Software & Compiler Design', 'SSCD Notes', 'notes', 'https://vtupulse.com/vtu-notes/6th-sem-cse/', 'Compiler design study material'),
(6, 'System Software & Compiler Design', 'SSCD Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/6th-sem-cse/', 'Model papers with solutions'),
(6, 'Computer Graphics & Visualization', 'CGV Notes', 'notes', 'https://vtupulse.com/vtu-notes/6th-sem-cse/', 'Graphics and visualization'),
(6, 'Machine Learning', 'ML Notes', 'notes', 'https://vtupulse.com/vtu-notes/6th-sem-cse/', 'Machine Learning concepts'),
(6, 'Machine Learning', 'ML Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/6th-sem-cse/', 'Solved ML papers'),
(6, 'Web Technology', 'WT Notes', 'notes', 'https://vtupulse.com/vtu-notes/6th-sem-cse/', 'Web development technologies'),
-- Semester 7
(7, 'Big Data Analytics', 'BDA Notes', 'notes', 'https://vtupulse.com/vtu-notes/7th-sem-cse/', 'Big Data concepts and Hadoop'),
(7, 'Big Data Analytics', 'BDA Model Papers', 'model_paper', 'https://vtupulse.com/vtu-notes/7th-sem-cse/', 'Solved model papers'),
(7, 'Cloud Computing', 'CC Notes', 'notes', 'https://vtupulse.com/vtu-notes/7th-sem-cse/', 'Cloud Computing study material'),
(7, 'Internet of Things', 'IoT Notes', 'notes', 'https://vtupulse.com/vtu-notes/7th-sem-cse/', 'IoT architecture and protocols'),
(7, 'Information Security', 'IS Notes', 'notes', 'https://vtupulse.com/vtu-notes/7th-sem-cse/', 'Cryptography and security'),
-- Semester 8
(8, 'Project Work', 'Project Guidelines', 'notes', 'https://vtupulse.com/vtu-notes/8th-sem-cse/', 'Final year project guidelines'),
(8, 'Technical Seminar', 'Seminar Topics & Format', 'notes', 'https://vtupulse.com/vtu-notes/8th-sem-cse/', 'Technical seminar resources'),
(8, 'Internship', 'Internship Report Format', 'notes', 'https://vtupulse.com/vtu-notes/8th-sem-cse/', 'Internship documentation guidelines');