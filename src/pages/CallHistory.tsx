import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Loader2,
  Video,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CallRow {
  id: string;
  caller_id: string;
  callee_id: string;
  status: string;
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
  end_reason: string | null;
  group_id: string | null;
}

interface Entry extends CallRow {
  peerName: string;
  outgoing: boolean;
}

type Filter = 'all' | 'connected' | 'missed' | 'rejected';

const STATUS_LABEL: Record<string, string> = {
  connected: 'Connected',
  accepted: 'Connected',
  ended: 'Completed',
  missed: 'Missed',
  rejected: 'Declined',
  busy: 'Busy',
  failed: 'Failed',
  ringing: 'Not answered',
};

function bucket(status: string, answered: string | null): Filter {
  if (status === 'rejected') return 'rejected';
  if (status === 'missed' || status === 'busy' || status === 'ringing') return 'missed';
  if (answered || status === 'connected' || status === 'accepted' || status === 'ended')
    return 'connected';
  return 'missed';
}

function durationOf(row: CallRow) {
  if (!row.answered_at || !row.ended_at) return null;
  const secs = Math.max(
    0,
    Math.round((new Date(row.ended_at).getTime() - new Date(row.answered_at).getTime()) / 1000)
  );
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function stampOf(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'd MMM yyyy, h:mm a');
}

export default function CallHistory() {
  const { user, loading: authLoading, sessionVersion } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('calls')
        .select('*')
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      const rows = (data || []) as CallRow[];
      const peerIds = Array.from(
        new Set(rows.map((r) => (r.caller_id === user.id ? r.callee_id : r.caller_id)))
      );

      let names: Record<string, string> = {};
      if (peerIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', peerIds);
        names = Object.fromEntries(
          (profiles || []).map((p) => [p.user_id, p.full_name || 'Study buddy'])
        );
      }

      if (cancelled) return;
      setEntries(
        rows.map((r) => {
          const outgoing = r.caller_id === user.id;
          const peerId = outgoing ? r.callee_id : r.caller_id;
          return { ...r, outgoing, peerName: names[peerId] || 'Study buddy' };
        })
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, sessionVersion]);

  const visible = entries.filter((e) => filter === 'all' || bucket(e.status, e.answered_at) === filter);

  const iconFor = (e: Entry) => {
    const b = bucket(e.status, e.answered_at);
    if (b === 'missed') return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (b === 'rejected') return <PhoneOff className="w-4 h-4 text-destructive" />;
    return e.outgoing ? (
      <PhoneOutgoing className="w-4 h-4 text-primary" />
    ) : (
      <PhoneIncoming className="w-4 h-4 text-primary" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground">Call history</h1>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'connected', 'missed', 'rejected'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                  filter === f ? 'grad-brand text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl grad-brand flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-semibold text-foreground mb-1">No calls yet</h2>
            <p className="text-sm text-muted-foreground">
              Your connected, missed and declined calls will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((e, i) => {
              const duration = durationOf(e);
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.03 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full grad-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {e.peerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{e.peerName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {iconFor(e)}
                      <span>
                        {e.outgoing ? 'Outgoing' : 'Incoming'} ·{' '}
                        {STATUS_LABEL[e.status] || e.status}
                        {duration ? ` · ${duration}` : ''}
                      </span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground text-right whitespace-nowrap">
                    {stampOf(e.created_at)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
