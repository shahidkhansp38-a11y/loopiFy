import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Assignment {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  due_at: string | null;
  max_points: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string | null;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
}

export function useAssignments(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!groupId || !user) return;
    setLoading(true);
    const { data: a } = await supabase
      .from('assignments')
      .select('*')
      .eq('group_id', groupId)
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    setAssignments((a ?? []) as Assignment[]);

    const ids = (a ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: s } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .in('assignment_id', ids);
      const map: Record<string, Submission> = {};
      (s ?? []).forEach((row) => {
        map[row.assignment_id] = row as Submission;
      });
      setMySubmissions(map);
    } else {
      setMySubmissions({});
    }
    setLoading(false);
  }, [groupId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const createAssignment = async (input: {
    title: string;
    description?: string;
    due_at?: string | null;
    max_points?: number;
  }) => {
    if (!groupId || !user) return;
    const { error } = await supabase.from('assignments').insert({
      group_id: groupId,
      created_by: user.id,
      title: input.title,
      description: input.description ?? null,
      due_at: input.due_at ?? null,
      max_points: input.max_points ?? 100,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    toast({ title: 'Assignment created' });
    load();
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    load();
  };

  const submit = async (assignmentId: string, content: string, fileUrl?: string | null) => {
    if (!user) return;
    const existing = mySubmissions[assignmentId];
    if (existing) {
      const { error } = await supabase
        .from('submissions')
        .update({ content, file_url: fileUrl ?? null, submitted_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Failed', description: error.message });
        return;
      }
    } else {
      const { error } = await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        content,
        file_url: fileUrl ?? null,
      });
      if (error) {
        toast({ variant: 'destructive', title: 'Failed', description: error.message });
        return;
      }
    }
    toast({ title: 'Submitted' });
    load();
  };

  return { assignments, mySubmissions, loading, createAssignment, deleteAssignment, submit, reload: load };
}

export function useAssignmentSubmissions(assignmentId: string | undefined) {
  const [submissions, setSubmissions] = useState<Array<Submission & { profile?: { full_name: string | null } }>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    const rows = (data ?? []) as Submission[];

    // Fetch profiles for names
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let profileMap: Record<string, { full_name: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      (profs ?? []).forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name };
      });
    }
    setSubmissions(rows.map((r) => ({ ...r, profile: profileMap[r.user_id] })));
    setLoading(false);
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const grade = async (id: string, grade: number, feedback: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('submissions')
      .update({ grade, feedback, graded_by: user.id, graded_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    toast({ title: 'Graded' });
    load();
  };

  return { submissions, loading, grade, reload: load };
}
