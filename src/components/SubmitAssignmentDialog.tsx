import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Submission } from '@/hooks/useAssignments';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existing?: Submission;
  onSubmit: (content: string, fileUrl?: string | null) => Promise<void> | void;
  readOnly?: boolean;
}

export function SubmitAssignmentDialog({ isOpen, onClose, existing, onSubmit, readOnly }: Props) {
  const [content, setContent] = useState(existing?.content ?? '');
  const [fileUrl, setFileUrl] = useState(existing?.file_url ?? '');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!content.trim() && !fileUrl.trim()) return;
    setBusy(true);
    await onSubmit(content.trim(), fileUrl.trim() || null);
    setBusy(false);
    onClose();
  };

  const locked = readOnly || (existing && existing.grade !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Your submission' : 'Submit assignment'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="content">Answer</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={5000}
              disabled={!!locked}
              placeholder="Type your answer here…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">Attachment URL (optional)</Label>
            <Input
              id="file"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…"
              disabled={!!locked}
            />
          </div>
          {existing?.grade !== null && existing?.grade !== undefined && (
            <div className="p-3 rounded-xl bg-muted">
              <div className="text-sm font-semibold text-foreground">Grade: {existing.grade}</div>
              {existing.feedback && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{existing.feedback}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!locked && (
            <Button className="loopify-gradient" onClick={send} disabled={busy || (!content.trim() && !fileUrl.trim())}>
              {existing ? 'Update submission' : 'Submit'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
