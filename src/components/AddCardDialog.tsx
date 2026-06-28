import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (input: { front: string; back: string; hint?: string }) => Promise<void> | void;
}

export function AddCardDialog({ open, onOpenChange, onAdd }: Props) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');

  const submit = async () => {
    if (!front.trim() || !back.trim()) return;
    await onAdd({ front: front.trim(), back: back.trim(), hint: hint.trim() || undefined });
    setFront(''); setBack(''); setHint('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add card</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Front (question)</Label>
            <Textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Back (answer)</Label>
            <Textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Hint (optional)</Label>
            <Input value={hint} onChange={(e) => setHint(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
          <Button className="loopify-gradient" onClick={submit} disabled={!front.trim() || !back.trim()}>
            Add another
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
