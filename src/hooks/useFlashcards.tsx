import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { applySM2, INITIAL_SM2, Rating } from '@/lib/sm2';

export interface Deck {
  id: string;
  owner_id: string;
  group_id: string | null;
  lecture_id: string | null;
  title: string;
  description: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint: string | null;
  image_url: string | null;
}

export interface CardWithReview extends Card {
  review?: {
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    due_at: string;
  };
}

export function useDecks(groupId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from('flashcard_decks').select('*').order('created_at', { ascending: false });
    if (groupId) q = q.eq('group_id', groupId);
    else q = q.is('group_id', null).eq('owner_id', user.id);
    const { data } = await q;
    const list = (data ?? []) as Deck[];
    setDecks(list);

    if (list.length) {
      // due counts: cards in these decks with review due, plus brand-new cards (no review row)
      const deckIds = list.map((d) => d.id);
      const { data: allCards } = await supabase
        .from('flashcards')
        .select('id, deck_id')
        .in('deck_id', deckIds);
      const cardIds = (allCards ?? []).map((c) => c.id);
      const { data: reviews } = cardIds.length
        ? await supabase
            .from('flashcard_reviews')
            .select('card_id, due_at')
            .eq('user_id', user.id)
            .in('card_id', cardIds)
        : { data: [] };
      const reviewMap = new Map<string, string>();
      (reviews ?? []).forEach((r: any) => reviewMap.set(r.card_id, r.due_at));
      const now = Date.now();
      const counts: Record<string, number> = {};
      (allCards ?? []).forEach((c: any) => {
        const due = reviewMap.get(c.id);
        const isDue = !due || new Date(due).getTime() <= now;
        if (isDue) counts[c.deck_id] = (counts[c.deck_id] ?? 0) + 1;
      });
      setDueCounts(counts);
    } else {
      setDueCounts({});
    }
    setLoading(false);
  }, [user, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const createDeck = async (input: {
    title: string;
    description?: string;
    lecture_id?: string | null;
    is_shared?: boolean;
  }) => {
    if (!user) return;
    const { error } = await supabase.from('flashcard_decks').insert({
      owner_id: user.id,
      group_id: groupId ?? null,
      lecture_id: input.lecture_id ?? null,
      title: input.title,
      description: input.description ?? null,
      is_shared: !!input.is_shared,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    toast({ title: 'Deck created' });
    load();
  };

  const deleteDeck = async (id: string) => {
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    load();
  };

  return { decks, dueCounts, loading, createDeck, deleteDeck, reload: load };
}

export function useDeckCards(deckId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<CardWithReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!deckId || !user) return;
    setLoading(true);
    const { data: rawCards } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    const list = (rawCards ?? []) as Card[];
    const ids = list.map((c) => c.id);
    const { data: reviews } = ids.length
      ? await supabase
          .from('flashcard_reviews')
          .select('*')
          .eq('user_id', user.id)
          .in('card_id', ids)
      : { data: [] };
    const map = new Map<string, any>();
    (reviews ?? []).forEach((r: any) => map.set(r.card_id, r));
    setCards(list.map((c) => ({ ...c, review: map.get(c.id) })));
    setLoading(false);
  }, [deckId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const addCard = async (input: { front: string; back: string; hint?: string }) => {
    if (!deckId) return;
    const { error } = await supabase.from('flashcards').insert({
      deck_id: deckId,
      front: input.front,
      back: input.back,
      hint: input.hint ?? null,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    toast({ title: 'Card added' });
    load();
  };

  const bulkAdd = async (rows: Array<{ front: string; back: string }>) => {
    if (!deckId || !rows.length) return;
    const payload = rows.map((r) => ({ deck_id: deckId, front: r.front, back: r.back }));
    const { error } = await supabase.from('flashcards').insert(payload);
    if (error) {
      toast({ variant: 'destructive', title: 'Import failed', description: error.message });
      return;
    }
    toast({ title: `Added ${rows.length} cards` });
    load();
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    load();
  };

  const rateCard = async (cardId: string, rating: Rating) => {
    if (!user) return;
    const current = cards.find((c) => c.id === cardId);
    const prev = current?.review
      ? {
          ease_factor: Number(current.review.ease_factor),
          interval_days: current.review.interval_days,
          repetitions: current.review.repetitions,
          due_at: current.review.due_at,
        }
      : INITIAL_SM2;
    const next = applySM2(prev, rating);
    await supabase.from('flashcard_reviews').upsert(
      {
        user_id: user.id,
        card_id: cardId,
        ease_factor: next.ease_factor,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        due_at: next.due_at,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,card_id' }
    );
  };

  return { cards, loading, addCard, bulkAdd, deleteCard, rateCard, reload: load };
}
