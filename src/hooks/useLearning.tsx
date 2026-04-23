import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Lecture {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_storage_path: string | null;
  duration_seconds: number | null;
  position: number;
  created_by: string;
  created_at: string;
}

export interface LectureProgress {
  id: string;
  lecture_id: string;
  user_id: string;
  progress_percent: number;
  completed: boolean;
  last_position_seconds: number;
}

export interface LearningGroup {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  is_admin: boolean;
  lecture_count: number;
}

/**
 * Returns groups the user belongs to in the learning system, plus admin flag.
 */
export function useLearningGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LearningGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [memberRes, adminRes] = await Promise.all([
      supabase.from('group_learning_members').select('group_id').eq('user_id', user.id),
      supabase.from('group_admins').select('group_id').eq('admin_id', user.id),
    ]);

    const memberIds = new Set((memberRes.data ?? []).map((r) => r.group_id));
    const adminIds = new Set((adminRes.data ?? []).map((r) => r.group_id));
    const allIds = Array.from(new Set([...memberIds, ...adminIds]));

    if (allIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const [groupRes, lectureRes] = await Promise.all([
      supabase.from('study_groups').select('id, name, subject, description').in('id', allIds),
      supabase.from('lectures').select('group_id').in('group_id', allIds),
    ]);

    const counts: Record<string, number> = {};
    (lectureRes.data ?? []).forEach((l) => {
      counts[l.group_id] = (counts[l.group_id] ?? 0) + 1;
    });

    setGroups(
      (groupRes.data ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        subject: g.subject,
        description: g.description,
        is_admin: adminIds.has(g.id),
        lecture_count: counts[g.id] ?? 0,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, refetch: fetchGroups };
}

export function useLectures(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [progress, setProgress] = useState<Record<string, LectureProgress>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!groupId || !user) return;
    setLoading(true);

    const [lecRes, adminRes, progRes] = await Promise.all([
      supabase
        .from('lectures')
        .select('*')
        .eq('group_id', groupId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('group_admins')
        .select('id')
        .eq('group_id', groupId)
        .eq('admin_id', user.id)
        .maybeSingle(),
      supabase.from('lecture_progress').select('*').eq('user_id', user.id),
    ]);

    setLectures((lecRes.data ?? []) as Lecture[]);
    setIsAdmin(!!adminRes.data);

    const map: Record<string, LectureProgress> = {};
    (progRes.data ?? []).forEach((p) => {
      map[p.lecture_id] = p as LectureProgress;
    });
    setProgress(map);
    setLoading(false);
  }, [groupId, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addLecture = async (input: {
    title: string;
    description?: string;
    video_url?: string;
    duration_seconds?: number;
  }) => {
    if (!user || !groupId) return false;
    const { error } = await supabase.from('lectures').insert({
      group_id: groupId,
      title: input.title,
      description: input.description ?? null,
      video_url: input.video_url ?? null,
      duration_seconds: input.duration_seconds ?? null,
      position: lectures.length,
      created_by: user.id,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Could not add lecture', description: error.message });
      return false;
    }
    toast({ title: 'Lecture added' });
    await fetchAll();
    return true;
  };

  const deleteLecture = async (id: string) => {
    const { error } = await supabase.from('lectures').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not delete', description: error.message });
      return false;
    }
    await fetchAll();
    return true;
  };

  const upsertProgress = async (lectureId: string, percent: number, lastSeconds: number) => {
    if (!user) return;
    const completed = percent >= 95;
    const existing = progress[lectureId];
    if (existing) {
      await supabase
        .from('lecture_progress')
        .update({ progress_percent: percent, completed, last_position_seconds: lastSeconds })
        .eq('id', existing.id);
    } else {
      await supabase.from('lecture_progress').insert({
        lecture_id: lectureId,
        user_id: user.id,
        progress_percent: percent,
        completed,
        last_position_seconds: lastSeconds,
      });
    }
    fetchAll();
  };

  const markCompleted = async (lectureId: string) => {
    await upsertProgress(lectureId, 100, 0);
  };

  return { lectures, progress, isAdmin, loading, addLecture, deleteLecture, upsertProgress, markCompleted, refetch: fetchAll };
}

export function useGroupInvites(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const { data } = await supabase
      .from('group_invites')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    setInvites(data ?? []);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const generateInvite = async () => {
    if (!user || !groupId) return null;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('group_invites').insert({
      group_id: groupId,
      invite_code: code,
      created_by: user.id,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return null;
    }
    toast({ title: 'Invite code created', description: code });
    await fetchInvites();
    return code;
  };

  const revokeInvite = async (id: string) => {
    await supabase.from('group_invites').delete().eq('id', id);
    await fetchInvites();
  };

  return { invites, loading, generateInvite, revokeInvite, refetch: fetchInvites };
}

export async function redeemInvite(code: string) {
  const { data, error } = await supabase.rpc('redeem_group_invite', { _code: code });
  if (error) throw error;
  return data as string; // group id
}

export function useJoinRequests(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const { data } = await supabase
      .from('group_join_requests')
      .select('*, profiles!inner(full_name, avatar_url)')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    // profiles join may fail if RLS blocks; fall back without it
    if (!data) {
      const fallback = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending');
      setRequests(fallback.data ?? []);
    } else {
      setRequests(data);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('group_join_requests')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    toast({ title: status === 'approved' ? 'Approved' : 'Rejected' });
    await fetchRequests();
  };

  return { requests, loading, decide, refetch: fetchRequests };
}

export async function requestToJoin(groupId: string, userId: string, message?: string) {
  return supabase.from('group_join_requests').insert({
    group_id: groupId,
    user_id: userId,
    message: message ?? null,
    status: 'pending',
  });
}
