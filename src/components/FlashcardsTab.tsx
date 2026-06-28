import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Play, Trash2, Pencil, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDecks, useDeckCards, Deck } from '@/hooks/useFlashcards';
import { AddDeckDialog } from './AddDeckDialog';
import { AddCardDialog } from './AddCardDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { ReviewSession } from './ReviewSession';

interface Props {
  groupId?: string | null;
  canEdit: boolean;
}

export function FlashcardsTab({ groupId, canEdit }: Props) {
  const { decks, dueCounts, createDeck, deleteDeck } = useDecks(groupId);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [reviewDeck, setReviewDeck] = useState<Deck | null>(null);
  const [newDeckOpen, setNewDeckOpen] = useState(false);

  if (reviewDeck) {
    return <ReviewView deck={reviewDeck} onClose={() => setReviewDeck(null)} />;
  }

  if (editingDeck) {
    return <DeckEditor deck={editingDeck} onClose={() => setEditingDeck(null)} canEdit={canEdit} />;
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Button onClick={() => setNewDeckOpen(true)} className="loopify-gradient w-full h-12 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New deck
        </Button>
      )}

      {decks.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No flashcard decks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((d, i) => {
            const due = dueCounts[d.id] ?? 0;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{d.title}</h3>
                    {d.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{d.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {due > 0 ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {due} due
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          All caught up
                        </span>
                      )}
                      {d.is_shared && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-border/50">
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingDeck(d)}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => { if (confirm('Delete this deck?')) deleteDeck(d.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" className="loopify-gradient" onClick={() => setReviewDeck(d)}>
                    <Play className="w-4 h-4 mr-1" /> Study
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddDeckDialog
        open={newDeckOpen}
        onOpenChange={setNewDeckOpen}
        onCreate={createDeck}
        showShare={!!groupId}
      />
    </div>
  );
}

function ReviewView({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const { cards, rateCard } = useDeckCards(deck.id);
  return <ReviewSession cards={cards} onRate={rateCard} onClose={onClose} />;
}

function DeckEditor({ deck, onClose, canEdit }: { deck: Deck; onClose: () => void; canEdit: boolean }) {
  const { cards, addCard, bulkAdd, deleteCard } = useDeckCards(deck.id);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onClose} className="text-sm text-primary mb-1">← Back to decks</button>
          <h2 className="text-lg font-bold text-foreground">{deck.title}</h2>
          <p className="text-xs text-muted-foreground">{cards.length} cards</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button size="sm" className="loopify-gradient" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Card
            </Button>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No cards yet</div>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => (
            <div key={c.id} className="p-3 rounded-xl bg-card border border-border/50">
              <p className="font-medium text-foreground text-sm">{c.front}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.back}</p>
              {canEdit && (
                <div className="flex justify-end mt-1">
                  <Button size="sm" variant="ghost" className="text-destructive h-7"
                    onClick={() => { if (confirm('Delete card?')) deleteCard(c.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddCardDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addCard} />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={bulkAdd} />
    </div>
  );
}
