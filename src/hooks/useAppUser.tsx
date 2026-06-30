import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type PlatformRole = 'student' | 'teacher' | 'admin';

export interface AppUser {
  id: string;
  platform_role: PlatformRole;
  onboarding_completed: boolean;
}

export function useAppUser() {
  const { user, sessionVersion } = useAuth();
  const { toast } = useToast();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = useCallback(async () => {
    if (!user) {
      setAppUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('app_users')
      .select('id, platform_role, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('useAppUser fetch error', error);
      setLoading(false);
      return;
    }

    if (!data) {
      // Backfill if missing (e.g. older accounts)
      const { data: created } = await supabase
        .from('app_users')
        .insert({ id: user.id, platform_role: 'student', onboarding_completed: false })
        .select('id, platform_role, onboarding_completed')
        .single();
      setAppUser(created as AppUser);
    } else {
      setAppUser(data as AppUser);
    }
    setLoading(false);
  }, [user, sessionVersion]);

  useEffect(() => {
    fetchAppUser();
  }, [fetchAppUser]);

  const completeOnboarding = async (role: 'student' | 'teacher') => {
    if (!user) return false;
    const { error } = await supabase
      .from('app_users')
      .update({ platform_role: role, onboarding_completed: true })
      .eq('id', user.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Could not save role', description: error.message });
      return false;
    }
    await fetchAppUser();
    return true;
  };

  return {
    appUser,
    loading,
    isTeacher: appUser?.platform_role === 'teacher' || appUser?.platform_role === 'admin',
    isAdmin: appUser?.platform_role === 'admin',
    isStudent: appUser?.platform_role === 'student',
    needsOnboarding: !!user && !!appUser && !appUser.onboarding_completed,
    completeOnboarding,
    refetch: fetchAppUser,
  };
}
