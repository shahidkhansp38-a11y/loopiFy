import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Users,
  Bot,
  BookOpen,
  Search,
  Bell,
  Crown,
  ChevronRight,
  Loader2,
  Layers,
  ArrowRight,
  Flame,
  PlayCircle,
  Clock,
  Video,
  Trophy,
  Medal,
  Target,
  Award,
  Timer,
  GraduationCap,
  Brain,
  FileCheck,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAppUser } from '@/hooks/useAppUser';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { useNotifications } from '@/hooks/useNotifications';
import { useStreak } from '@/hooks/useStreak';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import SearchDialog from '@/components/SearchDialog';
import NotificationPopover from '@/components/NotificationPopover';
import { GoalRing } from '@/components/GoalRing';
import { GoalSettingsDialog } from '@/components/GoalSettingsDialog';
import { WeekDots } from '@/components/home/WeekDots';
import { StatTile } from '@/components/home/StatTile';
import { AchievementChip } from '@/components/home/AchievementChip';

const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

const SUBTITLES = [
  'Small reps today, big grades later.',
  'One lecture at a time — you got this.',
  'Consistency beats cramming, always.',
  'Your future self is watching. Impress them.',
  'Focus mode: on. Distractions: off.',
];

export default function Index() {
  const { user, loading } = useAuth();
  const { isTeacher, needsOnboarding, loading: appUserLoading } = useAppUser();
  const { myGroups, loading: groupsLoading } = useStudyGroups();
  const { unreadCount } = useNotifications();
  const { streak, today, goal, history } = useStreak();
  const { lectures, classes, stats } = useHomeDashboard();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/welcome');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !appUserLoading && user && needsOnboarding) navigate('/onboarding');
  }, [loading, appUserLoading, user, needsOnboarding, navigate]);

  const subtitle = useMemo(
    () => SUBTITLES[new Date().getDate() % SUBTITLES.length],
    []
  );

  const activeDates = useMemo(() => {
    const s = new Set<string>();
    (history ?? []).forEach((h) => {
      if (h.minutes_studied > 0 || h.cards_reviewed > 0 || h.assignments_submitted > 0) {
        s.add(h.activity_date);
      }
    });
    return s;
  }, [history]);

  const weekTotals = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const iso = weekAgo.toISOString().slice(0, 10);
    return (history ?? [])
      .filter((h) => h.activity_date >= iso)
      .reduce(
        (acc, h) => ({
          minutes: acc.minutes + h.minutes_studied,
          cards: acc.cards + h.cards_reviewed,
        }),
        { minutes: 0, cards: 0 }
      );
  }, [history]);

  const totalCards = useMemo(
    () => (history ?? []).reduce((a, h) => a + h.cards_reviewed, 0),
    [history]
  );
  const totalSubmissions = useMemo(
    () => (history ?? []).reduce((a, h) => a + h.assignments_submitted, 0),
    [history]
  );

  const resume = useMemo(() => {
    const started = lectures
      .filter((l) => !l.completed && l.progress_percent > 0)
      .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
    if (started.length) return started[0];
    return lectures.find((l) => !l.completed) ?? null;
  }, [lectures]);

  const recommended = useMemo(
    () => lectures.filter((l) => !l.completed && l.id !== resume?.id).slice(0, 8),
    [lectures, resume]
  );

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

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'Learner';
  const initial = firstName.charAt(0).toUpperCase();
  const minutes = today?.minutes_studied ?? 0;
  const cards = today?.cards_reviewed ?? 0;
  const currentStreak = streak?.current_streak ?? 0;
  const goalMet =
    minutes >= goal.daily_minutes_goal || cards >= goal.daily_cards_goal;

  const quickActions = [
    {
      icon: Bot,
      label: 'AI Tutor',
      hint: 'Ask anything',
      route: '/ai-tutor',
      grad: 'grad-brand',
    },
    {
      icon: Users,
      label: 'Study Groups',
      hint: 'Learn together',
      route: '/groups',
      grad: 'grad-accent',
    },
    {
      icon: Layers,
      label: 'Flashcards',
      hint: 'Spaced repeat',
      route: '/flashcards',
      grad: 'grad-sunset',
    },
    {
      icon: BookOpen,
      label: 'Notes',
      hint: 'VTU resources',
      route: '/resources',
      grad: 'grad-brand',
    },
  ];

  const achievements = [
    {
      icon: Flame,
      title: 'Week Warrior',
      caption: '7-day study streak',
      unlocked: currentStreak >= 7,
      grad: 'grad-sunset',
    },
    {
      icon: Trophy,
      title: 'Unstoppable',
      caption: '30-day study streak',
      unlocked: currentStreak >= 30,
      grad: 'grad-brand',
    },
    {
      icon: Medal,
      title: 'Century Club',
      caption: '100 flashcards reviewed',
      unlocked: totalCards >= 100,
      grad: 'grad-accent',
    },
    {
      icon: Award,
      title: 'First Submit',
      caption: 'Turned in an assignment',
      unlocked: totalSubmissions >= 1,
      grad: 'grad-brand',
    },
    {
      icon: Target,
      title: 'Goal Getter',
      caption: "Hit today's study goal",
      unlocked: goalMet,
      grad: 'grad-accent',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              <p className="text-[11px] text-muted-foreground leading-none">LoopiFy</p>
              <p className="text-sm font-semibold text-foreground leading-tight">{firstName}</p>
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

      <main className="mx-auto max-w-3xl px-4 pt-4 pb-2 space-y-7">
        {/* 1. Greeting */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-sm font-medium text-muted-foreground">{greet()},</p>
          <h1 className="text-[28px] leading-tight font-bold font-display text-foreground">
            {firstName} <span className="grad-text">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </motion.section>

        {/* 2. Study Streak */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="relative overflow-hidden rounded-[24px] grad-brand text-white p-5 shadow-glow">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/15 blur-2xl"
            />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center">
                <Flame className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-display leading-none">
                    {currentStreak}
                  </span>
                  <span className="text-sm text-white/80">
                    day{currentStreak === 1 ? '' : 's'} streak
                  </span>
                </div>
                <p className="text-xs text-white/75 mt-1">
                  {goalMet ? "Today's goal complete ✅" : 'Keep the fire alive today'}
                </p>
              </div>
              <button onClick={() => setGoalsOpen(true)} aria-label="Adjust goals">
                <GoalRing size={56} />
              </button>
            </div>

            <div className="relative mt-4">
              <WeekDots activeDates={activeDates} />
            </div>

            <div className="relative mt-4 flex items-center gap-4 rounded-2xl bg-white/15 backdrop-blur-md px-3.5 py-2.5">
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {minutes}
                  <span className="text-white/70 font-normal">/{goal.daily_minutes_goal}m</span>
                </p>
                <p className="text-[10px] uppercase tracking-wide text-white/70">Focus today</p>
              </div>
              <div className="w-px h-8 bg-white/25" />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {cards}
                  <span className="text-white/70 font-normal">/{goal.daily_cards_goal}</span>
                </p>
                <p className="text-[10px] uppercase tracking-wide text-white/70">Cards today</p>
              </div>
              <button
                onClick={() => setGoalsOpen(true)}
                className="text-[11px] font-semibold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                Adjust
              </button>
            </div>
          </div>
        </motion.section>

        {/* 3. Continue Learning */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          ) : resume ? (
            <motion.div whileTap={{ scale: 0.99 }} className="card-premium p-4">
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-2xl grad-accent flex items-center justify-center shrink-0">
                  <PlayCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold line-clamp-1">
                    {resume.group_name}
                  </p>
                  <p className="font-semibold text-foreground line-clamp-2 leading-snug">
                    {resume.title}
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>{Math.round(resume.progress_percent)}% complete</span>
                  {resume.duration_seconds ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(resume.duration_seconds / 60)} min
                    </span>
                  ) : null}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, resume.progress_percent)}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full grad-brand"
                  />
                </div>
              </div>
              <Button
                onClick={() => navigate(`/learning/${resume.group_id}`)}
                className="mt-3.5 w-full grad-brand text-white hover:opacity-90 border-0 rounded-2xl h-11"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
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
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/learning/${group.id}`)}
                  className="snap-start shrink-0 w-[220px] card-premium p-4 text-left"
                >
                  <div className="w-full h-20 rounded-2xl grad-brand mb-3 flex items-end p-3">
                    <BookOpen className="w-6 h-6 text-white/90" />
                  </div>
                  <p className="font-semibold text-sm text-foreground line-clamp-1">{group.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {group.subject || 'Study Group'}
                  </p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>

        {/* 4. Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-base font-bold text-foreground font-display mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 + i * 0.05 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(a.route)}
                className={`relative overflow-hidden rounded-[22px] ${a.grad} text-white p-4 text-left shadow-glow`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/15 blur-xl"
                />
                <div className="relative w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/25 flex items-center justify-center mb-3">
                  <a.icon className="w-5 h-5" />
                </div>
                <p className="relative font-semibold text-sm">{a.label}</p>
                <p className="relative text-[11px] text-white/75">{a.hint}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* 5. Upcoming Classes */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground font-display">Today's Classes</h2>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </div>
          {classes.length === 0 ? (
            <div className="card-premium p-5 text-center">
              <p className="text-sm font-medium text-foreground">No classes today 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the free time for flashcards or a quick AI session.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {classes.slice(0, 4).map((c) => (
                <motion.div
                  key={`${c.kind}-${c.id}`}
                  whileTap={{ scale: 0.99 }}
                  className="card-premium p-3.5 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-2xl grad-accent flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {c.subject} · {c.teacher}
                    </p>
                    <p className="text-[11px] text-primary font-semibold inline-flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {c.time}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(
                        c.kind === 'lecture'
                          ? `/learning/${c.group_id}`
                          : `/video-call?groupId=${c.group_id}`
                      )
                    }
                    className="grad-brand text-white border-0 rounded-full h-9 px-4 hover:opacity-90"
                  >
                    Join
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* 6. Recommended Resources */}
        {recommended.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground font-display">Recommended</h2>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 hide-scrollbar snap-x">
              {recommended.map((r) => (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/learning/${r.group_id}`)}
                  className="snap-start shrink-0 w-[190px] card-premium p-3.5 text-left"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Lecture
                  </span>
                  <p className="font-semibold text-sm text-foreground line-clamp-2 mt-2 leading-snug">
                    {r.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
                    {r.group_name}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* 7. Weekly Statistics */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-base font-bold text-foreground font-display mb-3">This Week</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={Timer}
              value={(weekTotals.minutes / 60).toFixed(1)}
              label="Hours studied"
              tint="grad-brand"
              delay={0.32}
            />
            <StatTile
              icon={PlayCircle}
              value={stats.lecturesCompletedWeek}
              label="Lectures completed"
              tint="grad-accent"
              delay={0.36}
            />
            <StatTile
              icon={Brain}
              value={weekTotals.cards}
              label="Flashcards reviewed"
              tint="grad-sunset"
              delay={0.4}
            />
            <StatTile
              icon={FileCheck}
              value={stats.quizzesCompletedWeek}
              label="Quizzes completed"
              tint="grad-brand"
              delay={0.44}
            />
          </div>
        </motion.section>

        {/* 8. Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground font-display">Achievements</h2>
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 hide-scrollbar snap-x">
            {achievements.map((a) => (
              <AchievementChip key={a.title} {...a} />
            ))}
          </div>
        </motion.section>
      </main>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <GoalSettingsDialog open={goalsOpen} onOpenChange={setGoalsOpen} />
    </div>
  );
}
