import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Question {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  content: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  answer_count?: number;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  has_upvoted?: boolean;
}

export function useGroupQuestions(groupId: string | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    if (!groupId || !user) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('group_questions')
        .select(`
          *,
          profile:profiles!group_questions_user_id_fkey(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get answer counts
      const questionIds = (data || []).map(q => q.id);
      const { data: answerCounts } = await supabase
        .from('question_answers')
        .select('question_id')
        .in('question_id', questionIds);

      const countMap = (answerCounts || []).reduce((acc, a) => {
        acc[a.question_id] = (acc[a.question_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const formattedQuestions = (data || []).map(q => ({
        ...q,
        profile: Array.isArray(q.profile) ? q.profile[0] : q.profile,
        answer_count: countMap[q.id] || 0
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  const askQuestion = async (title: string, content: string) => {
    if (!groupId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('group_questions')
        .insert({
          group_id: groupId,
          user_id: user.id,
          title,
          content
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Question posted!',
        description: 'Your peers can now help answer it.'
      });

      return data;
    } catch (error: any) {
      console.error('Error asking question:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post question'
      });
      return null;
    }
  };

  const markResolved = async (questionId: string, resolved: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_questions')
        .update({ is_resolved: resolved })
        .eq('id', questionId);

      if (error) throw error;
      await fetchQuestions();
      return true;
    } catch (error) {
      console.error('Error updating question:', error);
      return false;
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      await fetchQuestions();
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Real-time subscription
  useEffect(() => {
    if (!groupId || !user) return;

    const channel = supabase
      .channel(`questions-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_questions',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, fetchQuestions]);

  return {
    questions,
    loading,
    askQuestion,
    markResolved,
    deleteQuestion,
    refetch: fetchQuestions
  };
}

export function useQuestionAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnswers = useCallback(async () => {
    if (!questionId || !user) {
      setAnswers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('question_answers')
        .select(`
          *,
          profile:profiles!question_answers_user_id_fkey(full_name, avatar_url)
        `)
        .eq('question_id', questionId)
        .order('is_accepted', { ascending: false })
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check which answers user has upvoted
      const answerIds = (data || []).map(a => a.id);
      const { data: upvotes } = await supabase
        .from('answer_upvotes')
        .select('answer_id')
        .eq('user_id', user.id)
        .in('answer_id', answerIds);

      const upvotedSet = new Set((upvotes || []).map(u => u.answer_id));

      const formattedAnswers = (data || []).map(a => ({
        ...a,
        profile: Array.isArray(a.profile) ? a.profile[0] : a.profile,
        has_upvoted: upvotedSet.has(a.id)
      }));

      setAnswers(formattedAnswers);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  }, [questionId, user]);

  const postAnswer = async (content: string) => {
    if (!questionId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('question_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Answer posted!',
        description: 'Thanks for helping your peer.'
      });

      return data;
    } catch (error: any) {
      console.error('Error posting answer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post answer'
      });
      return null;
    }
  };

  const toggleUpvote = async (answerId: string, hasUpvoted: boolean) => {
    if (!user) return false;

    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase
          .from('answer_upvotes')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', user.id);

        await supabase
          .from('question_answers')
          .update({ upvotes: answers.find(a => a.id === answerId)!.upvotes - 1 })
          .eq('id', answerId);
      } else {
        // Add upvote
        await supabase
          .from('answer_upvotes')
          .insert({ answer_id: answerId, user_id: user.id });

        await supabase
          .from('question_answers')
          .update({ upvotes: answers.find(a => a.id === answerId)!.upvotes + 1 })
          .eq('id', answerId);
      }

      await fetchAnswers();
      return true;
    } catch (error) {
      console.error('Error toggling upvote:', error);
      return false;
    }
  };

  const acceptAnswer = async (answerId: string) => {
    if (!user) return false;

    try {
      // Unaccept all other answers first
      await supabase
        .from('question_answers')
        .update({ is_accepted: false })
        .eq('question_id', questionId);

      // Accept this answer
      const { error } = await supabase
        .from('question_answers')
        .update({ is_accepted: true })
        .eq('id', answerId);

      if (error) throw error;
      await fetchAnswers();
      return true;
    } catch (error) {
      console.error('Error accepting answer:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [fetchAnswers]);

  // Real-time subscription
  useEffect(() => {
    if (!questionId || !user) return;

    const channel = supabase
      .channel(`answers-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_answers',
          filter: `question_id=eq.${questionId}`
        },
        () => {
          fetchAnswers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId, user, fetchAnswers]);

  return {
    answers,
    loading,
    postAnswer,
    toggleUpvote,
    acceptAnswer,
    refetch: fetchAnswers
  };
}
