import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useMessages(groupId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!groupId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profile:profiles!messages_user_id_fkey(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Handle the profile join - it may come as array or object
      const formattedMessages = (data || []).map(msg => ({
        ...msg,
        profile: Array.isArray(msg.profile) ? msg.profile[0] : msg.profile
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  const sendMessage = async (content: string) => {
    if (!groupId || !user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!groupId || !user) return;

    const channel = supabase
      .channel(`messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch the new message with profile info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              profile:profiles!messages_user_id_fkey(full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const formattedMessage = {
              ...data,
              profile: Array.isArray(data.profile) ? data.profile[0] : data.profile
            };
            setMessages(prev => {
              // Prevent duplicates
              if (prev.some(m => m.id === formattedMessage.id)) return prev;
              return [...prev, formattedMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages
  };
}
