
-- ============ DECKS ============
CREATE TABLE public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decks_select_visible" ON public.flashcard_decks FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR (is_shared AND group_id IS NOT NULL AND public.is_learning_member(auth.uid(), group_id))
);
CREATE POLICY "decks_insert_own" ON public.flashcard_decks FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND (group_id IS NULL OR public.is_learning_member(auth.uid(), group_id))
);
CREATE POLICY "decks_update_own_or_admin" ON public.flashcard_decks FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_admin(auth.uid(), group_id)))
WITH CHECK (owner_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_admin(auth.uid(), group_id)));
CREATE POLICY "decks_delete_own_or_admin" ON public.flashcard_decks FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_admin(auth.uid(), group_id)));

CREATE TRIGGER decks_updated_at BEFORE UPDATE ON public.flashcard_decks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_decks_group ON public.flashcard_decks(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_decks_owner ON public.flashcard_decks(owner_id);

-- ============ CARDS ============
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Helper: can current user see this deck
CREATE OR REPLACE FUNCTION public.can_view_deck(_user_id uuid, _deck_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flashcard_decks d
    WHERE d.id = _deck_id
      AND (d.owner_id = _user_id
           OR (d.is_shared AND d.group_id IS NOT NULL AND public.is_learning_member(_user_id, d.group_id)))
  )
$$;
CREATE OR REPLACE FUNCTION public.can_edit_deck(_user_id uuid, _deck_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flashcard_decks d
    WHERE d.id = _deck_id
      AND (d.owner_id = _user_id
           OR (d.group_id IS NOT NULL AND public.is_group_admin(_user_id, d.group_id)))
  )
$$;
GRANT EXECUTE ON FUNCTION public.can_view_deck(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_deck(uuid, uuid) TO authenticated;

CREATE POLICY "cards_select_visible" ON public.flashcards FOR SELECT TO authenticated
USING (public.can_view_deck(auth.uid(), deck_id));
CREATE POLICY "cards_insert_editor" ON public.flashcards FOR INSERT TO authenticated
WITH CHECK (public.can_edit_deck(auth.uid(), deck_id));
CREATE POLICY "cards_update_editor" ON public.flashcards FOR UPDATE TO authenticated
USING (public.can_edit_deck(auth.uid(), deck_id))
WITH CHECK (public.can_edit_deck(auth.uid(), deck_id));
CREATE POLICY "cards_delete_editor" ON public.flashcards FOR DELETE TO authenticated
USING (public.can_edit_deck(auth.uid(), deck_id));

CREATE INDEX idx_flashcards_deck ON public.flashcards(deck_id);

-- ============ REVIEWS (per-user SM-2 state) ============
CREATE TABLE public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_reviews TO authenticated;
GRANT ALL ON public.flashcard_reviews TO service_role;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_own_all" ON public.flashcard_reviews FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_reviews_due ON public.flashcard_reviews(user_id, due_at);

-- ============ NOTIFICATIONS ============
CREATE OR REPLACE FUNCTION public.notify_new_shared_deck()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_shared AND NEW.group_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, group_id)
    SELECT m.user_id, 'new_deck', 'New Flashcard Deck',
           'A new deck was shared: ' || NEW.title,
           NEW.group_id
    FROM public.group_learning_members m
    WHERE m.group_id = NEW.group_id AND m.user_id <> NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_shared_deck
AFTER INSERT ON public.flashcard_decks
FOR EACH ROW EXECUTE FUNCTION public.notify_new_shared_deck();
