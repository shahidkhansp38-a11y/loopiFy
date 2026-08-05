import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Video, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCall } from './CallProvider';

interface Member {
  user_id: string;
  full_name: string | null;
}

interface Props {
  groupId: string | null;
  groupName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartGroupCall?: () => void;
}

export function CallMemberPicker({ groupId, groupName, open, onOpenChange, onStartGroupCall }: Props) {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !groupId || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      const ids = (rows || []).map((r) => r.user_id).filter((id) => id !== user.id);
      if (ids.length === 0) {
        if (!cancelled) {
          setMembers([]);
          setLoading(false);
        }
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ids);

      if (!cancelled) {
        setMembers(
          ids.map((id) => ({
            user_id: id,
            full_name: profiles?.find((p) => p.user_id === id)?.full_name ?? null,
          }))
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, groupId, user]);

  const call = async (m: Member) => {
    onOpenChange(false);
    await startCall({ id: m.user_id, name: m.full_name || 'Study buddy' }, groupId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Video call {groupName ? `· ${groupName}` : ''}</DialogTitle>
        </DialogHeader>

        {onStartGroupCall && (
          <button
            onClick={() => {
              onOpenChange(false);
              onStartGroupCall();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl grad-brand text-white text-left"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Start group video call</p>
              <p className="text-[11px] text-white/80">Everyone in this group can join</p>
            </div>
            <Video className="w-4 h-4" />
          </button>
        )}

        {onStartGroupCall && (
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-1">
            Or call one member
          </p>
        )}



        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No other members in this group yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 py-1">
            {members.map((m) => (
              <button
                key={m.user_id}
                onClick={() => call(m)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full grad-brand flex items-center justify-center text-xs font-bold text-white">
                  {(m.full_name || '?')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <span className="flex-1 font-medium text-foreground truncate">
                  {m.full_name || 'Study buddy'}
                </span>
                <Video className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
