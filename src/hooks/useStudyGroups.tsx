import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  created_by: string | null;
  max_members: number | null;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export function useStudyGroups() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, sessionVersion } = useAuth();
  const { toast } = useToast();

  const fetchGroups = async (isRetry = false) => {
    if (!user) return;
    
    try {
      // Fetch all public groups
      const { data: publicGroups, error: publicError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // Fetch user's memberships
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Fetch member counts per group
      const groupIds = (publicGroups || []).map(g => g.id);
      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) throw countError;

      const countMap: Record<string, number> = {};
      (memberCounts || []).forEach(m => {
        countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
      });

      const memberGroupIds = new Set(memberships?.map(m => m.group_id) || []);

      // Add membership status and member count to groups
      const groupsWithStatus = (publicGroups || []).map(group => ({
        ...group,
        is_member: memberGroupIds.has(group.id),
        member_count: countMap[group.id] || 0
      }));

      setGroups(groupsWithStatus);

      // Filter my groups
      const myGroupsList = groupsWithStatus.filter(g => g.is_member);
      setMyGroups(myGroupsList);
    } catch (error: any) {
      const isJwtExpired = error?.code === 'PGRST303' || /JWT/i.test(error?.message || '');
      if (isJwtExpired && !isRetry) {
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          return fetchGroups(true);
        }
      }
      console.error('Error fetching groups:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load study groups'
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description: string, subject: string, isPublic: boolean = true, maxMembers: number = 6) => {
    if (!user) return null;

    try {
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name,
          description,
          subject,
          is_public: isPublic,
          created_by: user.id,
          max_members: maxMembers
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Layer the new learning system on top: register teacher as group admin
      // and as a learning member. Errors here are non-fatal (e.g. user is not a teacher).
      await supabase.from('group_admins').insert({ group_id: group.id, admin_id: user.id });
      await supabase.from('group_learning_members').insert({ group_id: group.id, user_id: user.id });

      toast({
        title: 'Success!',
        description: `"${name}" group created successfully`
      });

      await fetchGroups();
      return group;
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create group'
      });
      return null;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      // Check if group is full
      const group = groups.find(g => g.id === groupId);
      if (group && group.member_count !== undefined && group.max_members) {
        if (group.member_count >= group.max_members) {
          toast({
            variant: 'destructive',
            title: 'Group Full',
            description: 'This group has reached its member limit'
          });
          return false;
        }
      }

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: 'Joined!',
        description: 'You have joined the group'
      });

      await fetchGroups();
      return true;
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to join group'
      });
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Left group',
        description: 'You have left the group'
      });

      await fetchGroups();
      return true;
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to leave group'
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user, sessionVersion]);

  const updateGroupLimit = async (groupId: string, newLimit: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('study_groups')
        .update({ max_members: newLimit })
        .eq('id', groupId)
        .eq('created_by', user.id);

      if (error) throw error;

      toast({
        title: 'Updated!',
        description: `Member limit changed to ${newLimit}`
      });

      await fetchGroups();
      return true;
    } catch (error: any) {
      console.error('Error updating group limit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update member limit'
      });
      return false;
    }
  };

  const updateGroupDetails = async (
    groupId: string,
    updates: { name?: string; subject?: string }
  ) => {
    if (!user) return false;
    const payload: Record<string, string> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.subject !== undefined) payload.subject = updates.subject.trim();
    if (payload.name === '') {
      toast({ variant: 'destructive', title: 'Error', description: 'Name cannot be empty' });
      return false;
    }
    try {
      const { error } = await supabase
        .from('study_groups')
        .update(payload)
        .eq('id', groupId)
        .eq('created_by', user.id);
      if (error) throw error;
      toast({ title: 'Updated!', description: 'Group details saved' });
      await fetchGroups();
      return true;
    } catch (error: any) {
      console.error('Error updating group details:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update group' });
      return false;
    }
  };

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroupLimit,
    updateGroupDetails,
    refetch: fetchGroups
  };
}
