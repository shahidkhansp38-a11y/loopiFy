import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (input: { title: string; description?: string; is_shared?: boolean }) => Promise<void> | void;
  showShare?: boolean;
}

export function AddDeckDialog({ open, onOpenChange, onCreate, showShare }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shared, setShared] = useState(true);

  const submit = async () => {
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), description: description.trim() || undefined, is_shared: showShare ? shared : false });
    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>New flashcard deck</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DSA — Trees" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {showShare && (
            <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
              <div>
                <p className="font-medium text-sm">Share with group</p>
                <p className="text-xs text-muted-foreground">All members can study this deck</p>
              </div>
              <Switch checked={shared} onCheckedChange={setShared} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="loopify-gradient" onClick={submit} disabled={!title.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
