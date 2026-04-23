import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Plus, KeyRound, Crown, Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAppUser } from '@/hooks/useAppUser';
import { useLearningGroups } from '@/hooks/useLearning';
import { JoinByCodeDialog } from '@/components/JoinByCodeDialog';

export default function Learning() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isTeacher } = useAppUser();
  const { groups, loading } = useLearningGroups();
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass-effect border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-muted">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-xl font-bold text-foreground">Learning</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setJoinOpen(true)}>
                <KeyRound className="w-4 h-4 mr-1" />
                Join code
              </Button>
              {isTeacher && (
                <Button
                  size="sm"
                  className="loopify-gradient hover:opacity-90"
                  onClick={() => navigate('/groups')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground ml-9">
            Learn with expert teachers in structured groups
          </p>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl loopify-gradient flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No learning groups yet</h3>
            <p className="text-muted-foreground mb-6">
              {isTeacher
                ? 'Create a group to start adding lectures'
                : 'Join a group with an invite code to access lectures'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setJoinOpen(true)} variant="outline">
                <KeyRound className="w-4 h-4 mr-2" />
                Enter invite code
              </Button>
              {isTeacher && (
                <Button onClick={() => navigate('/groups')} className="loopify-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map((g, i) => (
              <motion.button
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate(`/learning/${g.id}`)}
                className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow text-left flex items-center gap-4 hover:border-primary/30 transition-all"
              >
                <div className="w-14 h-14 rounded-xl loopify-gradient flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{g.name}</h3>
                    {g.is_admin && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {g.subject || 'General'} · {g.lecture_count} lecture{g.lecture_count === 1 ? '' : 's'}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      <JoinByCodeDialog isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
