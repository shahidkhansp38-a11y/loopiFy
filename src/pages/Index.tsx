import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Users,
  Bot,
  BookOpen,
  GraduationCap,
  Search,
  Bell,
  User,
  Crown,
  ChevronRight,
  Loader2,
  Layers,
  Video,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAppUser } from '@/hooks/useAppUser';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { useNotifications } from '@/hooks/useNotifications';
import { useStreak } from '@/hooks/useStreak';
import SearchDialog from '@/components/SearchDialog';
import NotificationPopover from '@/components/NotificationPopover';
import { StreakChip } from '@/components/StreakChip';
import { GoalRing } from '@/components/GoalRing';
import { GoalSettingsDialog } from '@/components/GoalSettingsDialog';

const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

export default function Index() {
  const { user, loading } = useAuth();
  const { isTeacher, needsOnboarding, loading: appUserLoading } = useAppUser();
  const { myGroups, loading: groupsLoading } = useStudyGroups();
  const { unreadCount, notifications } = useNotifications();
  const { streak, today, goal } = useStreak();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/welcome');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !appUserLoading && user && needsOnboarding) navigate('/onboarding');
  }, [loading, appUserLoading, user, needsOnboarding, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!user) return null;

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'Learner';
  const initial = firstName.charAt(0).toUpperCase();
  const minutes = today?.minutes_studied ?? 0;
  const cards = today?.cards_reviewed ?? 0;
  const currentStreak = streak?.current_streak ?? 0;
  const recent = (notifications ?? []).slice(0, 3);

  const quickActions = [
    { icon: Layers, label: 'Flashcards', route: '/flashcards', tint: 'bg-primary/10 text-primary' },
    { icon: Users, label: 'Groups', route: '/groups', tint: 'bg-secondary/10 text-secondary' },
    { icon: BookOpen, label: 'Resources', route: '/resources', tint: 'bg-accent/10 text-accent' },
    { icon: Video, label: 'Video Call', route: '/video-call', tint: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass"
      >
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5"
            aria-label="Open profile"
          >
            <div className="w-10 h-10 rounded-full grad-brand flex items-center justify-center text-white font-bold shadow-glow">
              {initial}
            </div>
            <div className="text-left">
              <p className="text-[11px] text-muted-foreground leading-none">{greet()},</p>
              <p className="text-sm font-semibold text-foreground leading-tight">{firstName} 👋</p>
            </div>
            {isTeacher && (
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] grad-brand text-white px-2 py-0.5 rounded-full font-semibold">
                <Crown className="w-3 h-3" />
                Teacher
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full card-premium flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="Search"
            >
              <Search className="w-4.5 h-4.5 text-foreground" />
            </button>
            <NotificationPopover>
              <button
                className="w-10 h-10 rounded-full card-premium flex items-center justify-center relative hover:scale-105 transition-transform"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
                )}
              </button>
            </NotificationPopover>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-3xl px-4 py-5 space-y-6">
        {/* Hero AI Card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <button
            onClick={() => navigate('/ai-tutor')}
            className="relative w-full text-left overflow-hidden rounded-[26px] grad-brand text-white p-5 shadow-glow animate-pulse-glow"
          >
            {/* shimmer band */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40 animate-shimmer"
              style={{
                backgroundImage:
                  'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
            />
            <div className="relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30">
                <Bot className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">
                    Loopi AI
                  </p>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xl font-bold font-display leading-tight">
                  Your study copilot is ready
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Ask anything. Get explanations, examples, and quizzes in seconds.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold">
                  Start chatting <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </button>
        </motion.section>

        {/* Today's Mission */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground font-display">Today's Mission</h2>
            <button
              onClick={() => setGoalsOpen(true)}
              className="text-xs text-muted-foreground font-medium hover:text-foreground"
            >
              Adjust
            </button>
          </div>
          <div className="card-premium p-4 flex items-center gap-4">
            <GoalRing onClick={() => setGoalsOpen(true)} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <StreakChip onClick={() => setGoalsOpen(true)} />
                <span className="text-[11px] text-muted-foreground">
                  {currentStreak > 0 ? 'Keep the fire alive' : 'Start your streak today'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {minutes}
                    <span className="text-muted-foreground font-normal">/{goal.daily_minutes_goal}m</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Focus</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {cards}
                    <span className="text-muted-foreground font-normal">/{goal.daily_cards_goal}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cards</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Continue Learning */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground font-display">Continue Learning</h2>
            <button
              onClick={() => navigate('/learning')}
              className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-0.5"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {groupsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myGroups.length === 0 ? (
            <div className="card-premium p-6 text-center">
              <div className="w-14 h-14 rounded-2xl grad-accent mx-auto mb-3 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold text-foreground mb-1">Start your first course</p>
              <p className="text-xs text-muted-foreground mb-4">
                Join a study group and pick up where the class left off.
              </p>
              <Button
                onClick={() => navigate('/groups')}
                className="grad-brand text-white hover:opacity-90 border-0 rounded-full"
              >
                Explore Study Hub
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 hide-scrollbar snap-x">
              {myGroups.slice(0, 6).map((group, i) => (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/learning/${group.id}`)}
                  className="snap-start shrink-0 w-[220px] card-premium p-4 text-left"
                >
                  <div className="w-full h-20 rounded-2xl grad-brand mb-3 flex items-end p-3">
                    <BookOpen className="w-6 h-6 text-white/90" />
                  </div>
                  <p className="font-semibold text-sm text-foreground line-clamp-1">{group.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2.5">
                    {group.subject || 'Study Group'}
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full grad-accent" style={{ width: `${20 + ((i * 17) % 70)}%` }} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-base font-bold text-foreground font-display mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(a.route)}
                className="card-premium p-4 flex items-center gap-3 text-left"
              >
                <div className={`w-11 h-11 rounded-2xl ${a.tint} flex items-center justify-center`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">Tap to open</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground font-display">Recent Activity</h2>
            <Zap className="w-4 h-4 text-warning" />
          </div>
          {recent.length === 0 ? (
            <div className="card-premium p-5 text-center">
              <p className="text-sm font-medium text-foreground">All caught up ✨</p>
              <p className="text-xs text-muted-foreground mt-1">
                New activity from your groups shows up here.
              </p>
            </div>
          ) : (
            <div className="card-premium divide-y divide-border/60 overflow-hidden">
              {recent.map((n: any) => (
                <div key={n.id} className="p-3.5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {n.title || n.message || 'New update'}
                    </p>
                    {n.message && n.title && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Profile teaser */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button
            onClick={() => navigate('/profile')}
            className="w-full card-premium p-4 flex items-center gap-3 text-left"
          >
            <div className="w-12 h-12 rounded-full grad-brand flex items-center justify-center text-white font-bold shadow-glow">
              {initial || <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {user.user_metadata?.full_name || 'Your Profile'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.section>
      </main>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <GoalSettingsDialog open={goalsOpen} onOpenChange={setGoalsOpen} />
    </div>
  );
}
