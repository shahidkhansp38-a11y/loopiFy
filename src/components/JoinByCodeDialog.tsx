import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { redeemInvite } from '@/hooks/useLearning';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJoined?: (groupId: string) => void;
}

export function JoinByCodeDialog({ isOpen, onClose, onJoined }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const groupId = await redeemInvite(code.trim().toUpperCase());
      toast({ title: 'Joined group', description: 'Welcome aboard!' });
      onClose();
      setCode('');
      onJoined?.(groupId);
      navigate(`/learning/${groupId}`);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Could not join', description: err.message });
    } finally {
      setLoading(false);
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
            <div className="bg-card rounded-3xl p-6 loopify-card-shadow border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl loopify-gradient flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Join with code</h2>
                    <p className="text-sm text-muted-foreground">Enter the invite code from your teacher</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={12}
                  className="h-14 rounded-xl border-2 text-center text-xl font-mono tracking-widest"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full h-12 rounded-xl loopify-gradient hover:opacity-90"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Group'}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
