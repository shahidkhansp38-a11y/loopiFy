import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: { title: string; description?: string; video_url?: string; duration_seconds?: number }) => Promise<boolean>;
}

export function AddLectureDialog({ isOpen, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;
    setLoading(true);
    const ok = await onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      video_url: videoUrl.trim(),
      duration_seconds: duration ? parseInt(duration) * 60 : undefined,
    });
    setLoading(false);
    if (ok) {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setDuration('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-3xl p-6 loopify-card-shadow border border-border/50 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl loopify-gradient flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Add Lecture</h2>
                    <p className="text-sm text-muted-foreground">Paste a video link</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Introduction to Algorithms"
                    className="h-12 rounded-xl border-2"
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Video URL</label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    type="url"
                    className="h-12 rounded-xl border-2"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Duration (minutes, optional)</label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="45"
                    type="number"
                    min="1"
                    max="600"
                    className="h-12 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will students learn?"
                    className="rounded-xl border-2 min-h-[80px] resize-none"
                    maxLength={500}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !title.trim() || !videoUrl.trim()}
                  className="w-full h-12 rounded-xl loopify-gradient hover:opacity-90"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Lecture'}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
