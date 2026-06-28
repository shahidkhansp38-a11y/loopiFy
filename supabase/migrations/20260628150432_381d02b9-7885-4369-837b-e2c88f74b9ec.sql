
-- ============ STREAKS ============
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  freezes_available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_own_all" ON public.user_streaks FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ DAILY ACTIVITY ============
CREATE TABLE public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_studied INTEGER NOT NULL DEFAULT 0,
  cards_reviewed INTEGER NOT NULL DEFAULT 0,
  assignments_submitted INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_activity TO authenticated;
GRANT ALL ON public.daily_activity TO service_role;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_own_all" ON public.daily_activity FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_activity_user_date ON public.daily_activity(user_id, activity_date DESC);

-- ============ GOALS ============
CREATE TABLE public.user_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_minutes_goal INTEGER NOT NULL DEFAULT 20,
  daily_cards_goal INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goals TO authenticated;
GRANT ALL ON public.user_goals TO service_role;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own_all" ON public.user_goals FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ LOG ACTIVITY RPC ============
CREATE OR REPLACE FUNCTION public.log_daily_activity(
  _minutes INTEGER DEFAULT 0,
  _cards INTEGER DEFAULT 0,
  _submissions INTEGER DEFAULT 0,
  _activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.user_streaks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_streak public.user_streaks%ROWTYPE;
  v_goal public.user_goals%ROWTYPE;
  v_today public.daily_activity%ROWTYPE;
  v_goal_met BOOLEAN;
  v_day_gap INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Upsert activity
  INSERT INTO public.daily_activity (user_id, activity_date, minutes_studied, cards_reviewed, assignments_submitted)
  VALUES (v_user, _activity_date, GREATEST(_minutes,0), GREATEST(_cards,0), GREATEST(_submissions,0))
  ON CONFLICT (user_id, activity_date) DO UPDATE
    SET minutes_studied = public.daily_activity.minutes_studied + GREATEST(_minutes,0),
        cards_reviewed = public.daily_activity.cards_reviewed + GREATEST(_cards,0),
        assignments_submitted = public.daily_activity.assignments_submitted + GREATEST(_submissions,0),
        updated_at = now()
  RETURNING * INTO v_today;

  -- Ensure goal row
  INSERT INTO public.user_goals (user_id) VALUES (v_user) ON CONFLICT DO NOTHING;
  SELECT * INTO v_goal FROM public.user_goals WHERE user_id = v_user;

  v_goal_met := (v_today.minutes_studied >= v_goal.daily_minutes_goal)
             OR (v_today.cards_reviewed >= v_goal.daily_cards_goal)
             OR (v_today.assignments_submitted > 0);

  -- Ensure streak row
  INSERT INTO public.user_streaks (user_id) VALUES (v_user) ON CONFLICT DO NOTHING;
  SELECT * INTO v_streak FROM public.user_streaks WHERE user_id = v_user;

  IF v_goal_met THEN
    IF v_streak.last_active_date IS NULL THEN
      v_streak.current_streak := 1;
    ELSIF v_streak.last_active_date = _activity_date THEN
      -- already counted today
      NULL;
    ELSE
      v_day_gap := _activity_date - v_streak.last_active_date;
      IF v_day_gap = 1 THEN
        v_streak.current_streak := v_streak.current_streak + 1;
      ELSIF v_day_gap > 1 AND v_streak.freezes_available > 0 AND v_day_gap = 2 THEN
        v_streak.freezes_available := v_streak.freezes_available - 1;
        v_streak.current_streak := v_streak.current_streak + 1;
      ELSE
        v_streak.current_streak := 1;
      END IF;
    END IF;

    v_streak.last_active_date := _activity_date;
    IF v_streak.current_streak > v_streak.longest_streak THEN
      v_streak.longest_streak := v_streak.current_streak;
    END IF;
    -- Grant one freeze every 7 streak days
    IF v_streak.current_streak > 0 AND v_streak.current_streak % 7 = 0 THEN
      v_streak.freezes_available := LEAST(v_streak.freezes_available + 1, 3);
    END IF;

    UPDATE public.user_streaks
       SET current_streak = v_streak.current_streak,
           longest_streak = v_streak.longest_streak,
           last_active_date = v_streak.last_active_date,
           freezes_available = v_streak.freezes_available,
           updated_at = now()
     WHERE user_id = v_user
     RETURNING * INTO v_streak;
  END IF;

  RETURN v_streak;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_daily_activity(integer, integer, integer, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_daily_activity(integer, integer, integer, date) TO authenticated;
