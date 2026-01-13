import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { full_name?: string; bio?: string; avatar_url?: string }) => {
    if (!user || !profile) return { error: new Error('No user or profile') };
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully!');
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return { error: error as Error };
    } finally {
      setUpdating(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: new Error('No user') };
    
    setUpdating(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Remove old avatar if exists
      await supabase.storage.from('avatars').remove([fileName]);
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      await updateProfile({ avatar_url: avatarUrl });
      
      return { url: avatarUrl, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return { url: null, error: error as Error };
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    loading,
    updating,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
}
