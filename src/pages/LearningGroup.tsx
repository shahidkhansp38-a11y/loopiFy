import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Crown,
  Check,
  Trash2,
  Loader2,
  Users,
  KeyRound,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useLectures, useGroupInvites, useJoinRequests, Lecture } from '@/hooks/useLearning';
import { supabase } from '@/integrations/supabase/client';
import { AddLectureDialog } from '@/components/AddLectureDialog';
import { VideoEmbed } from '@/components/VideoEmbed';
import { AssignmentsTab } from '@/components/AssignmentsTab';
import { useToast } from '@/hooks/use-toast';

export default function LearningGroup() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lectures, progress, isAdmin, loading, addLecture, deleteLecture, upsertProgress, markCompleted } =
    useLectures(groupId);
  const [groupName, setGroupName] = useState<string>('');
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!groupId) return;
    supabase
      .from('study_groups')
      .select('name')
      .eq('id', groupId)
      .maybeSingle()
      .then(({ data }) => setGroupName(data?.name ?? ''));
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (activeLecture) {
    const p = progress[activeLecture.id];
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setActiveLecture(null)} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate">{activeLecture.title}</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
          {activeLecture.video_url ? (
            <VideoEmbed
              url={activeLecture.video_url}
              onProgress={(percent, seconds) => upsertProgress(activeLecture.id, percent, seconds)}
            />
          ) : (
            <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              Video unavailable
            </div>
          )}

          {activeLecture.description && (
            <p className="text-muted-foreground">{activeLecture.description}</p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your progress</span>
              <span className="font-medium text-foreground">{p?.progress_percent ?? 0}%</span>
            </div>
            <Progress value={p?.progress_percent ?? 0} />
          </div>

          <Button
            onClick={() => markCompleted(activeLecture.id)}
            disabled={p?.completed}
            className="w-full h-12 rounded-xl loopify-gradient hover:opacity-90"
          >
            {p?.completed ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Mark as completed
              </>
            )}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/learning')} className="p-2 -ml-2 rounded-full hover:bg-muted">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-xl font-bold text-foreground truncate">{groupName || 'Group'}</h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            {isAdmin && (
              <Button size="sm" className="loopify-gradient hover:opacity-90" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Lecture
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs defaultValue="lectures" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl">
            <TabsTrigger value="lectures" className="rounded-lg">Lectures</TabsTrigger>
            <TabsTrigger value="manage" className="rounded-lg" disabled={!isAdmin}>
              Manage
            </TabsTrigger>
            <TabsTrigger value="invites" className="rounded-lg" disabled={!isAdmin}>
              Invites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lectures" className="mt-6">
            {lectures.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No lectures yet</p>
                {isAdmin && (
                  <Button onClick={() => setAddOpen(true)} className="loopify-gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Add first lecture
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {lectures.map((lec, i) => {
                  const p = progress[lec.id];
                  return (
                    <motion.div
                      key={lec.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow"
                    >
                      <button
                        onClick={() => setActiveLecture(lec)}
                        className="w-full text-left flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          {p?.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate">{lec.title}</h3>
                            {lec.duration_seconds && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {Math.round(lec.duration_seconds / 60)} min
                              </span>
                            )}
                          </div>
                          {lec.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {lec.description}
                            </p>
                          )}
                          {p && p.progress_percent > 0 && (
                            <div className="mt-2">
                              <Progress value={p.progress_percent} className="h-1" />
                            </div>
                          )}
                        </div>
                      </button>
                      {isAdmin && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this lecture?')) deleteLecture(lec.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            {isAdmin && groupId && <ManageStudents groupId={groupId} />}
          </TabsContent>

          <TabsContent value="invites" className="mt-6">
            {isAdmin && groupId && <InvitesPanel groupId={groupId} />}
          </TabsContent>
        </Tabs>
      </main>

      <AddLectureDialog isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={addLecture} />
    </div>
  );
}

function ManageStudents({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { requests, decide } = useJoinRequests(groupId);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('group_learning_members')
      .select('id, user_id, created_at')
      .eq('group_id', groupId);
    setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const remove = async (id: string) => {
    if (!confirm('Remove this student?')) return;
    const { error } = await supabase.from('group_learning_members').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Pending requests ({requests.length})
        </h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between gap-2">
                <div className="text-sm text-foreground truncate">
                  {r.profiles?.full_name ?? r.user_id.slice(0, 8)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide(r.id, 'rejected')}>
                    Reject
                  </Button>
                  <Button size="sm" className="loopify-gradient" onClick={() => decide(r.id, 'approved')}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-3">Students ({members.length})</h3>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students yet — share an invite code.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between">
                <span className="text-sm text-foreground font-mono">{m.user_id.slice(0, 8)}...</span>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(m.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InvitesPanel({ groupId }: { groupId: string }) {
  const { invites, generateInvite, revokeInvite } = useGroupInvites(groupId);
  const { toast } = useToast();

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied', description: code });
  };

  return (
    <div className="space-y-4">
      <Button onClick={generateInvite} className="loopify-gradient w-full h-12 rounded-xl">
        <KeyRound className="w-4 h-4 mr-2" />
        Generate new invite code
      </Button>

      {invites.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No invite codes yet</p>
      ) : (
        <div className="space-y-2">
          {invites.map((inv) => (
            <div key={inv.id} className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between gap-2">
              <div className="font-mono text-lg font-bold text-foreground tracking-widest">
                {inv.invite_code}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => copy(inv.invite_code)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokeInvite(inv.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
