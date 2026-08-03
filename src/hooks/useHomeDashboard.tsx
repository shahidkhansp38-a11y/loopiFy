import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HomeLecture {
  id: string;
  group_id: string;
  group_name: string;
  title: string;
  position: number;
  created_at: string;
  duration_seconds: number | null;
  progress_percent: number;
  completed: boolean;
  updated_at?: string | null;
}

export interface HomeClass {
  id: string;
  title: string;
  subject: string;
  group_id: string;
  teacher: string;
  time: string;
  kind: 'assignment' | 'lecture';
}

export interface HomeStats {
  lecturesCompletedWeek: number;
  quizzesCompletedWeek: number;
}

/**
 * Read-only aggregation for the Home dashboard. No writes, no schema changes.
 */
export function useHomeDashboard() {
  const { user, sessionVersion } = useAuth();
  const [lectures, setLectures] = useState<HomeLecture[]>([]);
  const [classes, setClasses] = useState<HomeClass[]>([]);
  const [stats, setStats] = useState<HomeStats>({
    lecturesCompletedWeek: 0,
    quizzesCompletedWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = Array.from(new Set((memberships ?? []).map((m) => m.group_id)));
      if (groupIds.length === 0) {
        setLectures([]);
        setClasses([]);
        setStats({ lecturesCompletedWeek: 0, quizzesCompletedWeek: 0 });
        setLoading(false);
        return;
      }

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const [groupsRes, lecturesRes, progressRes, assignmentsRes] = await Promise.all([
        supabase.from('study_groups').select('id, name, subject, created_by').in('id', groupIds),
        supabase
          .from('lectures')
          .select('id, group_id, title, position, created_at, duration_seconds')
          .in('group_id', groupIds)
          .order('position', { ascending: true }),
        supabase
          .from('lecture_progress')
          .select('lecture_id, progress_percent, completed, updated_at')
          .eq('user_id', user.id),
        supabase
          .from('assignments')
          .select('id, group_id, title, due_at, created_by')
          .in('group_id', groupIds)
          .gte('due_at', startOfDay.toISOString())
          .lte('due_at', endOfDay.toISOString())
          .order('due_at', { ascending: true }),
      ]);

      const groupMap: Record<string, { name: string; subject: string | null; created_by: string | null }> = {};
      (groupsRes.data ?? []).forEach((g: any) => {
        groupMap[g.id] = { name: g.name, subject: g.subject, created_by: g.created_by };
      });

      const progressMap: Record<string, any> = {};
      (progressRes.data ?? []).forEach((p: any) => {
        progressMap[p.lecture_id] = p;
      });

      const merged: HomeLecture[] = (lecturesRes.data ?? []).map((l: any) => {
        const p = progressMap[l.id];
        return {
          id: l.id,
          group_id: l.group_id,
          group_name: groupMap[l.group_id]?.name ?? 'Study Group',
          title: l.title,
          position: l.position,
          created_at: l.created_at,
          duration_seconds: l.duration_seconds,
          progress_percent: p?.progress_percent ?? 0,
          completed: !!p?.completed,
          updated_at: p?.updated_at ?? null,
        };
      });
      setLectures(merged);

      const lecturesCompletedWeek = (progressRes.data ?? []).filter(
        (p: any) => p.completed && p.updated_at && new Date(p.updated_at) >= weekAgo
      ).length;

      // Teacher names for today's items
      const teacherIds = Array.from(
        new Set(
          (assignmentsRes.data ?? [])
            .map((a: any) => a.created_by ?? groupMap[a.group_id]?.created_by)
            .filter(Boolean)
        )
      ) as string[];

      const nameMap: Record<string, string> = {};
      if (teacherIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', teacherIds);
        (profs ?? []).forEach((p: any) => {
          nameMap[p.user_id] = p.full_name ?? 'Instructor';
        });
      }

      const todays: HomeClass[] = (assignmentsRes.data ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        subject: groupMap[a.group_id]?.subject || groupMap[a.group_id]?.name || 'Session',
        group_id: a.group_id,
        teacher: nameMap[a.created_by ?? ''] ?? 'Instructor',
        time: a.due_at
          ? new Date(a.due_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : 'Today',
        kind: 'assignment' as const,
      }));

      // Lectures published today count as live sessions
      const todayISO = startOfDay.toISOString();
      merged
        .filter((l) => l.created_at >= todayISO)
        .slice(0, 3)
        .forEach((l) => {
          todays.push({
            id: l.id,
            title: l.title,
            subject: l.group_name,
            group_id: l.group_id,
            teacher: 'Instructor',
            time: new Date(l.created_at).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            }),
            kind: 'lecture',
          });
        });
      setClasses(todays);

      const { count: quizCount } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('submitted_at', weekAgo.toISOString());

      setStats({ lecturesCompletedWeek, quizzesCompletedWeek: quizCount ?? 0 });
    } finally {
      setLoading(false);
    }
  }, [user, sessionVersion]);

  useEffect(() => {
    load();
  }, [load]);

  return { lectures, classes, stats, loading, reload: load };
}
