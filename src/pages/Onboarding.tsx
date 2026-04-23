import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, Users, ArrowRight, Check, BookOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAppUser } from '@/hooks/useAppUser';

type Step = 0 | 1 | 2;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { appUser, loading, completeOnboarding, needsOnboarding } = useAppUser();
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && appUser && !needsOnboarding) navigate('/');
  }, [loading, appUser, needsOnboarding, navigate]);

  const finish = async () => {
    if (!role) return;
    setSubmitting(true);
    const ok = await completeOnboarding(role);
    setSubmitting(false);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex gap-2">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-3xl loopify-gradient flex items-center justify-center mx-auto loopify-shadow">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-3">
                    Welcome to LoopiFy
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Learn with expert teachers in structured groups — lectures, chat, progress, all in one place.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl text-base loopify-gradient hover:opacity-90 loopify-shadow"
                  onClick={() => setStep(1)}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="role"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Who are you?</h2>
                  <p className="text-muted-foreground">Choose how you'll use LoopiFy</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setRole('student')}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      role === 'student'
                        ? 'border-primary bg-primary/5 loopify-shadow'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Student</h3>
                          {role === 'student' && <Check className="w-5 h-5 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Join groups, watch lectures, track progress, chat with peers.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setRole('teacher')}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                      role === 'teacher'
                        ? 'border-primary bg-primary/5 loopify-shadow'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl loopify-gradient flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Teacher 👑</h3>
                          {role === 'teacher' && <Check className="w-5 h-5 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create groups, add lectures, manage students, generate invites.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <Button
                  size="lg"
                  disabled={!role}
                  className="w-full h-14 rounded-2xl loopify-gradient hover:opacity-90 disabled:opacity-50"
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {role === 'teacher' ? 'Ready to teach' : 'Ready to learn'}
                  </h2>
                  <p className="text-muted-foreground">Here's what to do next</p>
                </div>

                {role === 'teacher' ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-start gap-3">
                      <PlusCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Create your first group</h4>
                        <p className="text-sm text-muted-foreground">
                          You'll automatically be the admin and can add lectures.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-start gap-3">
                      <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Add lectures</h4>
                        <p className="text-sm text-muted-foreground">
                          Paste a video link to start building your curriculum.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-start gap-3">
                      <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Invite students</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate an invite code or approve join requests.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-start gap-3">
                      <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Find a group</h4>
                        <p className="text-sm text-muted-foreground">
                          Discover public groups or enter a teacher's invite code.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-start gap-3">
                      <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Watch lectures</h4>
                        <p className="text-sm text-muted-foreground">
                          Open the Learning tab — your progress is saved automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  disabled={submitting}
                  className="w-full h-14 rounded-2xl loopify-gradient hover:opacity-90"
                  onClick={finish}
                >
                  {submitting ? 'Setting up...' : 'Enter LoopiFy'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
