import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export function useAIConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all conversations for the user
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    setConversations(data || []);
    setLoading(false);
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data?.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at
    })) || []);
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage?: string) => {
    if (!user) return null;

    const title = firstMessage 
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'New conversation';

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setCurrentConversation(data);
    setMessages([]);
    setConversations(prev => [data, ...prev]);
    return data;
  }, [user]);

  // Add a message to the current conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ) => {
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    const newMessage: AIMessage = {
      id: data.id,
      role: data.role as 'user' | 'assistant',
      content: data.content,
      created_at: data.created_at
    };

    setMessages(prev => [...prev, newMessage]);

    // Update conversation's updated_at
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return newMessage;
  }, []);

  // Update the last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(async (
    conversationId: string,
    content: string
  ) => {
    const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
    
    if (lastAssistant) {
      await supabase
        .from('ai_messages')
        .update({ content })
        .eq('id', lastAssistant.id);
    }
  }, [messages]);

  // Select a conversation
  const selectConversation = useCallback(async (conversation: AIConversation) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }

    return true;
  }, [currentConversation]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    setMessages,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    selectConversation,
    deleteConversation,
    startNewChat,
    fetchConversations
  };
}
