import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; description?: string; due_at?: string | null; max_points?: number }) => Promise<void> | void;
}

export function AddAssignmentDialog({ isOpen, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [maxPoints, setMaxPoints] = useState(100);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      max_points: maxPoints || 100,
    });
    setBusy(false);
    setTitle('');
    setDescription('');
    setDueAt('');
    setMaxPoints(100);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>New assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Chapter 3 problems" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="Instructions for students" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pts">Max points</Label>
              <Input id="pts" type="number" min={1} max={1000} value={maxPoints} onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="loopify-gradient" onClick={submit} disabled={busy || !title.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
