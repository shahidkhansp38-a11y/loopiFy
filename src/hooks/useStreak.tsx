import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  freezes_available: number;
}

export interface Goal {
  daily_minutes_goal: number;
  daily_cards_goal: number;
}

export interface DayActivity {
  activity_date: string;
  minutes_studied: number;
  cards_reviewed: number;
  assignments_submitted: number;
}

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export function useStreak() {
  const { user, sessionVersion } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [goal, setGoal] = useState<Goal>({ daily_minutes_goal: 20, daily_cards_goal: 20 });
  const [today, setToday] = useState<DayActivity | null>(null);
  const [history, setHistory] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceISO = since.toISOString().slice(0, 10);

    const [{ data: s }, { data: g }, { data: acts }] = await Promise.all([
      supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_goals').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('daily_activity')
        .select('activity_date, minutes_studied, cards_reviewed, assignments_submitted')
        .eq('user_id', user.id)
        .gte('activity_date', sinceISO)
        .order('activity_date', { ascending: true }),
    ]);

    setStreak(
      (s as Streak) ?? {
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
        freezes_available: 0,
      }
    );
    if (g) setGoal(g as Goal);
    const list = (acts ?? []) as DayActivity[];
    setHistory(list);
    const t = list.find((a) => a.activity_date === todayISO()) ?? {
      activity_date: todayISO(),
      minutes_studied: 0,
      cards_reviewed: 0,
      assignments_submitted: 0,
    };
    setToday(t);
    setLoading(false);
  }, [user, sessionVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const log = useCallback(
    async (params: { minutes?: number; cards?: number; submissions?: number }) => {
      if (!user) return;
      const { data } = await supabase.rpc('log_daily_activity', {
        _minutes: params.minutes ?? 0,
        _cards: params.cards ?? 0,
        _submissions: params.submissions ?? 0,
      });
      if (data) setStreak(data as Streak);
      load();
    },
    [user, load]
  );

  const updateGoal = async (next: Partial<Goal>) => {
    if (!user) return;
    const merged = { ...goal, ...next };
    await supabase
      .from('user_goals')
      .upsert({ user_id: user.id, ...merged }, { onConflict: 'user_id' });
    setGoal(merged);
  };

  return { streak, goal, today, history, loading, log, updateGoal, reload: load };
}
