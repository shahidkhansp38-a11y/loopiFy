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
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGroups = async () => {
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

      const memberGroupIds = new Set(memberships?.map(m => m.group_id) || []);

      // Add membership status to groups
      const groupsWithStatus = (publicGroups || []).map(group => ({
        ...group,
        is_member: memberGroupIds.has(group.id)
      }));

      setGroups(groupsWithStatus);

      // Filter my groups
      const myGroupsList = groupsWithStatus.filter(g => g.is_member);
      setMyGroups(myGroupsList);
    } catch (error: any) {
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
  }, [user]);

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    refetch: fetchGroups
  };
}
