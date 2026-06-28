import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImport: (rows: Array<{ front: string; back: string }>) => Promise<void> | void;
}

export function BulkImportDialog({ open, onOpenChange, onImport }: Props) {
  const [text, setText] = useState('');

  const parse = (raw: string) => {
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
        const [front, ...rest] = line.split(sep);
        return { front: front?.trim(), back: rest.join(sep).trim() };
      })
      .filter((r) => r.front && r.back);
  };

  const rows = parse(text);

  const submit = async () => {
    if (!rows.length) return;
    await onImport(rows);
    setText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import cards</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          One card per line. Separate front and back with a comma, semicolon, or tab.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={`What is a binary tree?, A tree where each node has at most 2 children\nBig-O of binary search, O(log n)`}
        />
        <p className="text-xs text-muted-foreground">{rows.length} cards detected</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="loopify-gradient" onClick={submit} disabled={!rows.length}>
            Import {rows.length || ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
