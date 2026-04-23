-- =========================================================================
-- 1. PLATFORM ROLE ENUM + APP_USERS TABLE
-- =========================================================================
CREATE TYPE public.platform_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_role public.platform_role NOT NULL DEFAULT 'student',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Security definer helpers
CREATE OR REPLACE FUNCTION public.get_platform_role(_user_id UUID)
RETURNS public.platform_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT platform_role FROM public.app_users WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = _user_id AND platform_role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_teacher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = _user_id AND platform_role IN ('teacher', 'admin')
  )
$$;

-- RLS: app_users
CREATE POLICY "Users view own app profile"
  ON public.app_users FOR SELECT
  USING (auth.uid() = id OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Users insert own app profile"
  ON public.app_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger blocks self-promotion to admin and any role tampering by admins-only paths
CREATE OR REPLACE FUNCTION public.guard_app_users_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only platform admins can set/change the admin role
  IF NEW.platform_role = 'admin' AND OLD.platform_role <> 'admin' THEN
    IF NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only platform admins can grant admin role';
    END IF;
  END IF;
  -- Demoting an admin requires admin
  IF OLD.platform_role = 'admin' AND NEW.platform_role <> 'admin' THEN
    IF NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only platform admins can revoke admin role';
    END IF;
  END IF;
  -- Changing role between student<->teacher allowed only by self or admin
  IF NEW.platform_role <> OLD.platform_role THEN
    IF auth.uid() <> NEW.id AND NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Cannot change another user role';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE POLICY "Users update own app profile"
  ON public.app_users FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_admin(auth.uid()));

CREATE TRIGGER app_users_guard
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.guard_app_users_update();

-- Auto-create app_users row on signup (extends existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.app_users (id, platform_role, onboarding_completed)
  VALUES (NEW.id, 'student', false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.app_users (id, platform_role, onboarding_completed)
SELECT id, 'student', false FROM auth.users
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 2. GROUP_ADMINS
-- =========================================================================
CREATE TABLE public.group_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, admin_id)
);

CREATE INDEX idx_group_admins_group ON public.group_admins(group_id);
CREATE INDEX idx_group_admins_admin ON public.group_admins(admin_id);

ALTER TABLE public.group_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_admins
    WHERE group_id = _group_id AND admin_id = _user_id
  ) OR public.is_platform_admin(_user_id)
$$;

CREATE POLICY "Admins of group view admins"
  ON public.group_admins FOR SELECT
  USING (public.is_group_admin(auth.uid(), group_id) OR admin_id = auth.uid());

CREATE POLICY "Teachers create group admin entry on group create"
  ON public.group_admins FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id
    AND public.is_teacher(auth.uid())
  );

CREATE POLICY "Group admins remove admins"
  ON public.group_admins FOR DELETE
  USING (public.is_group_admin(auth.uid(), group_id));

-- =========================================================================
-- 3. GROUP_LEARNING_MEMBERS (separate from existing group_members)
-- =========================================================================
CREATE TABLE public.group_learning_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_glm_group ON public.group_learning_members(group_id);
CREATE INDEX idx_glm_user ON public.group_learning_members(user_id);

ALTER TABLE public.group_learning_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_learning_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_learning_members
    WHERE group_id = _group_id AND user_id = _user_id
  ) OR public.is_group_admin(_user_id, _group_id)
$$;

CREATE POLICY "Members and admins view learning roster"
  ON public.group_learning_members FOR SELECT
  USING (public.is_learning_member(auth.uid(), group_id));

CREATE POLICY "Self can join (via invite/approval flow)"
  ON public.group_learning_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins remove members; users leave"
  ON public.group_learning_members FOR DELETE
  USING (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);

-- =========================================================================
-- 4. LECTURES
-- =========================================================================
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,                -- external URL (YouTube/Vimeo/etc)
  video_storage_path TEXT,       -- future: path inside lecture-videos bucket
  duration_seconds INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (video_url IS NOT NULL OR video_storage_path IS NOT NULL)
);

CREATE INDEX idx_lectures_group ON public.lectures(group_id);
CREATE INDEX idx_lectures_group_position ON public.lectures(group_id, position);

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning members view lectures"
  ON public.lectures FOR SELECT
  USING (public.is_learning_member(auth.uid(), group_id));

CREATE POLICY "Group admins create lectures"
  ON public.lectures FOR INSERT
  WITH CHECK (
    public.is_group_admin(auth.uid(), group_id)
    AND auth.uid() = created_by
  );

CREATE POLICY "Group admins update lectures"
  ON public.lectures FOR UPDATE
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins delete lectures"
  ON public.lectures FOR DELETE
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE TRIGGER lectures_updated_at
  BEFORE UPDATE ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 5. LECTURE_PROGRESS
-- =========================================================================
CREATE TABLE public.lecture_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed BOOLEAN NOT NULL DEFAULT false,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lecture_id, user_id)
);

CREATE INDEX idx_progress_user ON public.lecture_progress(user_id);
CREATE INDEX idx_progress_lecture ON public.lecture_progress(lecture_id);

ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress"
  ON public.lecture_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Group admins view group progress"
  ON public.lecture_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      WHERE l.id = lecture_progress.lecture_id
        AND public.is_group_admin(auth.uid(), l.group_id)
    )
  );

CREATE POLICY "Users upsert own progress"
  ON public.lecture_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON public.lecture_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER lecture_progress_updated_at
  BEFORE UPDATE ON public.lecture_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 6. GROUP_INVITES
-- =========================================================================
CREATE TABLE public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_code ON public.group_invites(invite_code);
CREATE INDEX idx_invites_group ON public.group_invites(group_id);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group admins view invites"
  ON public.group_invites FOR SELECT
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins create invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    public.is_group_admin(auth.uid(), group_id)
    AND auth.uid() = created_by
  );

CREATE POLICY "Group admins delete invites"
  ON public.group_invites FOR DELETE
  USING (public.is_group_admin(auth.uid(), group_id));

-- Validation trigger (replaces non-immutable CHECK)
CREATE OR REPLACE FUNCTION public.validate_invite()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_invite_trigger
  BEFORE INSERT OR UPDATE ON public.group_invites
  FOR EACH ROW EXECUTE FUNCTION public.validate_invite();

-- Secure RPC to redeem an invite (so students don't need SELECT on invites table)
CREATE OR REPLACE FUNCTION public.redeem_group_invite(_code TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite public.group_invites%ROWTYPE;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.group_invites WHERE invite_code = _code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  IF v_invite.max_uses IS NOT NULL AND v_invite.uses_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'Invite has reached its usage limit';
  END IF;

  INSERT INTO public.group_learning_members (group_id, user_id)
  VALUES (v_invite.group_id, v_user)
  ON CONFLICT DO NOTHING;

  UPDATE public.group_invites
    SET uses_count = uses_count + 1
    WHERE id = v_invite.id;

  RETURN v_invite.group_id;
END;
$$;

-- =========================================================================
-- 7. GROUP_JOIN_REQUESTS
-- =========================================================================
CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.join_request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id, status)
);

CREATE INDEX idx_jr_group_status ON public.group_join_requests(group_id, status);
CREATE INDEX idx_jr_user ON public.group_join_requests(user_id);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own join requests"
  ON public.group_join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Group admins view group join requests"
  ON public.group_join_requests FOR SELECT
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Users create own join request"
  ON public.group_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Group admins update join requests"
  ON public.group_join_requests FOR UPDATE
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Users cancel own pending request"
  ON public.group_join_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- When approved, auto-add to learning members
CREATE OR REPLACE FUNCTION public.handle_join_request_decision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    INSERT INTO public.group_learning_members (group_id, user_id)
    VALUES (NEW.group_id, NEW.user_id)
    ON CONFLICT DO NOTHING;
    NEW.decided_by := auth.uid();
    NEW.decided_at := now();
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    NEW.decided_by := auth.uid();
    NEW.decided_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER join_request_decision
  BEFORE UPDATE ON public.group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_join_request_decision();

-- =========================================================================
-- 8. STORAGE BUCKET FOR LECTURE VIDEOS (private; signed URLs in future)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lecture-videos', 'lecture-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Folder convention: <group_id>/<filename>
CREATE POLICY "Group admins read lecture videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lecture-videos'
    AND public.is_group_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Group admins upload lecture videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lecture-videos'
    AND public.is_group_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Group admins delete lecture videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lecture-videos'
    AND public.is_group_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- =========================================================================
-- 9. NOTIFICATION TRIGGERS FOR NEW LECTURES
-- =========================================================================
CREATE OR REPLACE FUNCTION public.notify_new_lecture()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, group_id)
  SELECT m.user_id, 'new_lecture', 'New Lecture',
         'A new lecture was added: ' || NEW.title,
         NEW.group_id
  FROM public.group_learning_members m
  WHERE m.group_id = NEW.group_id AND m.user_id <> NEW.created_by;
  RETURN NEW;
END;
$$;

CREATE TRIGGER lectures_notify
  AFTER INSERT ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lecture();

-- Allow notification inserts via security definer function (no direct INSERT policy needed)