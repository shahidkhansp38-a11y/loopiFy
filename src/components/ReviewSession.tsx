import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Lightbulb } from 'lucide-react';
import { CardWithReview } from '@/hooks/useFlashcards';
import { Rating } from '@/lib/sm2';
import { useStreak } from '@/hooks/useStreak';

interface Props {
  cards: CardWithReview[];
  onRate: (cardId: string, rating: Rating) => Promise<void>;
  onClose: () => void;
}

const filterDue = (cards: CardWithReview[]) => {
  const now = Date.now();
  return cards.filter((c) => !c.review || new Date(c.review.due_at).getTime() <= now);
};

export function ReviewSession({ cards, onRate, onClose }: Props) {
  const dueCards = useMemo(() => filterDue(cards), [cards]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const { log } = useStreak();

  const current = dueCards[idx];

  const rate = async (rating: Rating) => {
    if (!current) return;
    await onRate(current.id, rating);
    setReviewed((r) => r + 1);
    setFlipped(false);
    setShowHint(false);
    if (idx + 1 >= dueCards.length) {
      // Session done — log activity
      log({ cards: reviewed + 1, minutes: Math.max(1, Math.round((reviewed + 1) / 6)) });
      setIdx(idx + 1);
    } else {
      setIdx(idx + 1);
    }
  };

  if (!dueCards.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-1">All caught up</h3>
        <p className="text-muted-foreground mb-6">No cards due right now. Come back tomorrow.</p>
        <Button onClick={onClose} variant="outline">Back to deck</Button>
      </div>
    );
  }

  if (idx >= dueCards.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-1">Session complete</h3>
        <p className="text-muted-foreground mb-6">{reviewed} cards reviewed. Streak logged.</p>
        <Button onClick={onClose} className="loopify-gradient">Done</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground">
            {idx + 1} / {dueCards.length}
          </span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + (flipped ? '-b' : '-f')}
              initial={{ rotateY: flipped ? -90 : 0, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => !flipped && setFlipped(true)}
              className="w-full min-h-[40vh] p-8 rounded-3xl bg-card border border-border/50 loopify-card-shadow cursor-pointer flex flex-col items-center justify-center text-center"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {flipped ? 'Answer' : 'Question'}
              </p>
              <p className="text-2xl font-semibold text-foreground whitespace-pre-wrap">
                {flipped ? current.back : current.front}
              </p>
              {!flipped && current.hint && (
                <div className="mt-6">
                  {showHint ? (
                    <p className="text-sm text-primary italic">{current.hint}</p>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowHint(true); }}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Lightbulb className="w-4 h-4" /> Show hint
                    </button>
                  )}
                </div>
              )}
              {!flipped && (
                <p className="text-xs text-muted-foreground mt-8">Tap card to reveal</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {flipped && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="grid grid-cols-4 gap-2 mt-6"
          >
            <Button variant="outline" className="h-14 rounded-xl flex-col gap-0.5 text-destructive border-destructive/30" onClick={() => rate('again')}>
              <span className="font-semibold">Again</span>
              <span className="text-[10px] opacity-70">&lt;1d</span>
            </Button>
            <Button variant="outline" className="h-14 rounded-xl flex-col gap-0.5" onClick={() => rate('hard')}>
              <span className="font-semibold">Hard</span>
              <span className="text-[10px] opacity-70">1d</span>
            </Button>
            <Button variant="outline" className="h-14 rounded-xl flex-col gap-0.5 text-primary border-primary/30" onClick={() => rate('good')}>
              <span className="font-semibold">Good</span>
              <span className="text-[10px] opacity-70">{(current.review?.interval_days || 6)}d+</span>
            </Button>
            <Button className="h-14 rounded-xl flex-col gap-0.5 loopify-gradient" onClick={() => rate('easy')}>
              <span className="font-semibold">Easy</span>
              <span className="text-[10px] opacity-80">long</span>
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
