import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Bot, BookOpen, Video, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    icon: Sparkles,
    gradient: true,
    title: 'Welcome to LoopiFy',
    subtitle: 'Your peer learning companion',
    description: 'Connect with fellow students, share knowledge, and ace your academics together.',
    bg: 'from-primary/10 to-secondary/10',
  },
  {
    icon: Users,
    gradient: false,
    title: 'Study Groups',
    subtitle: 'Learn with your peers',
    description: 'Create or join study groups for your subjects. Chat, ask questions, and help each other grow.',
    bg: 'from-blue-50 to-indigo-50',
  },
  {
    icon: Bot,
    gradient: false,
    title: 'AI Tutor',
    subtitle: 'Your 24/7 learning assistant',
    description: 'Stuck on a concept? Ask the AI tutor anytime. Get instant, clear explanations on any topic.',
    bg: 'from-violet-50 to-purple-50',
  },
  {
    icon: BookOpen,
    gradient: false,
    title: 'Shared Resources',
    subtitle: 'All your study material in one place',
    description: 'Share notes, links and resources with your group. Never miss an important study material again.',
    bg: 'from-emerald-50 to-teal-50',
  },
  {
    icon: Video,
    gradient: false,
    title: 'Video Sessions',
    subtitle: 'Study face to face, online',
    description: 'Host or join live video study sessions with your group from anywhere, anytime.',
    bg: 'from-orange-50 to-amber-50',
  },
];

export default function Landing() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const next = () => {
    if (current < slides.length - 1) goTo(current + 1);
  };

  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  const slide = slides[current];
  const Icon = slide.icon;
  const isLast = current === slides.length - 1;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Skip button */}
      <div className="flex justify-end p-4 pt-6">
        <button
          onClick={() => navigate('/auth')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          Skip
        </button>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            {/* Illustration card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={`w-48 h-48 rounded-[40px] bg-gradient-to-br ${slide.bg} flex items-center justify-center mb-10 loopify-card-shadow`}
            >
              {slide.gradient ? (
                <div className="w-24 h-24 rounded-3xl loopify-gradient flex items-center justify-center loopify-shadow">
                  <Icon className="w-12 h-12 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center loopify-shadow">
                  <Icon className="w-12 h-12 text-primary-foreground" />
                </div>
              )}
            </motion.div>

            {/* Text */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs font-semibold text-primary uppercase tracking-widest mb-2"
            >
              {slide.subtitle}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-foreground mb-4 leading-tight"
            >
              {slide.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-muted-foreground text-sm leading-relaxed"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-10 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        {isLast ? (
          <div className="space-y-3">
            <Button
              className="w-full h-14 rounded-2xl text-base font-semibold loopify-gradient hover:opacity-90"
              onClick={() => navigate('/auth')}
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="ghost"
              className="w-full h-12 text-muted-foreground"
              onClick={() => navigate('/auth')}
            >
              Already have an account? Sign in
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {current > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                className="h-14 w-14 rounded-2xl border-2 shrink-0"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              className="flex-1 h-14 rounded-2xl text-base font-semibold loopify-gradient hover:opacity-90"
              onClick={next}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
