import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { signIn, signUp, resetPasswordForEmail, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Safe same-origin relative redirect target (e.g. after OAuth consent bounces here).
  const rawNext = searchParams.get('next') ?? '';
  const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [user, navigate, nextPath]);

  const clearErrors = () => setErrors({});

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        if (!z.string().email().safeParse(email).success) {
          setErrors({ email: 'Please enter a valid email address' });
          triggerShake();
          setIsLoading(false);
          return;
        }

        const { error } = await resetPasswordForEmail(email);
        if (error) {
          setErrors({ form: error.message });
          triggerShake();
          toast({
            variant: "destructive",
            title: "Request Failed",
            description: error.message,
          });
        } else {
          setResetSent(true);
          toast({
            title: "Email Sent!",
            description: "Check your inbox for the password reset link.",
          });
        }
      } else if (mode === 'login') {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          triggerShake();
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          setErrors({ form: getErrorMessage(error.message) });
          triggerShake();
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: getErrorMessage(error.message),
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
        }
      } else {
        const result = signupSchema.safeParse({ fullName, email, password, confirmPassword });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          triggerShake();
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrors({ form: getErrorMessage(error.message) });
          triggerShake();
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: getErrorMessage(error.message),
          });
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to LoopiFy! Let's start learning together.",
          });
        }
      }
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('User already registered')) {
      return 'This email is already registered. Try logging in instead.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please verify your email before logging in.';
    }
    return message;
  };

  const switchMode = () => {
    if (mode === 'forgot') {
      setMode('login');
    } else {
      setMode(mode === 'login' ? 'signup' : 'login');
    }
    clearErrors();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setResetSent(false);
  };

  const goToForgotPassword = () => {
    setMode('forgot');
    clearErrors();
    setPassword('');
    setResetSent(false);
  };

  const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.95 },
  };

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            variants={cardVariants}
            initial="initial"
            animate={shake ? "shake" : "animate"}
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative"
          >
            <motion.div
              variants={shakeVariants}
              animate={shake ? "shake" : ""}
              className="bg-card rounded-3xl p-8 loopify-card-shadow border border-border/50"
            >
              {/* Logo/Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="w-16 h-16 rounded-2xl loopify-gradient flex items-center justify-center loopify-shadow">
                  {mode === 'forgot' ? (
                    <Mail className="w-8 h-8 text-primary-foreground" />
                  ) : mode === 'login' ? (
                    <Lock className="w-8 h-8 text-primary-foreground" />
                  ) : (
                    <User className="w-8 h-8 text-primary-foreground" />
                  )}
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {mode === 'forgot' 
                    ? 'Forgot Password?' 
                    : mode === 'login' 
                      ? 'Welcome Back' 
                      : 'Create Account'}
                </h1>
                <p className="text-muted-foreground">
                  {mode === 'forgot'
                    ? 'Enter your email to receive a reset link'
                    : mode === 'login' 
                      ? 'Login to continue learning' 
                      : 'Join LoopiFy and start learning together'}
                </p>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {errors.form && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                  >
                    <p className="text-sm text-destructive text-center">{errors.form}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      key="fullName"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) clearErrors();
                          }}
                          className={`pl-12 h-14 rounded-xl border-2 text-base transition-all ${
                            errors.fullName 
                              ? 'border-destructive focus:border-destructive' 
                              : 'border-input focus:border-primary'
                          }`}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive mt-1 ml-1">{errors.fullName}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) clearErrors();
                      }}
                      className={`pl-12 h-14 rounded-xl border-2 text-base transition-all ${
                        errors.email 
                          ? 'border-destructive focus:border-destructive' 
                          : 'border-input focus:border-primary'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive ml-1">{errors.email}</p>
                  )}
                </div>

                {/* Password - Hidden in forgot mode */}
                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) clearErrors();
                        }}
                        className={`pl-12 pr-12 h-14 rounded-xl border-2 text-base transition-all ${
                          errors.password 
                            ? 'border-destructive focus:border-destructive' 
                            : 'border-input focus:border-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive ml-1">{errors.password}</p>
                    )}
                  </div>
                )}

                {/* Forgot Password Link - Only in login mode */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={goToForgotPassword}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Confirm Password */}
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      key="confirmPassword"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1"
                    >
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) clearErrors();
                          }}
                          className={`pl-12 pr-12 h-14 rounded-xl border-2 text-base transition-all ${
                            errors.confirmPassword 
                              ? 'border-destructive focus:border-destructive' 
                              : 'border-input focus:border-primary'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive ml-1">{errors.confirmPassword}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reset Email Sent Success */}
                {mode === 'forgot' && resetSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Check your email!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We've sent a password reset link to<br />
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={switchMode}
                      className="mt-2"
                    >
                      Back to Login
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {/* Submit Button */}
                    <motion.div
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 rounded-xl text-lg font-semibold loopify-gradient hover:opacity-90 transition-opacity loopify-shadow"
                      >
                        {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : mode === 'forgot' ? (
                          'SEND RESET LINK'
                        ) : mode === 'login' ? (
                          'LOGIN'
                        ) : (
                          'REGISTER'
                        )}
                      </Button>
                    </motion.div>

                    {mode !== 'forgot' && (
                      <>
                        <div className="relative my-2">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isLoading}
                          onClick={async () => {
                            setIsLoading(true);
                            const result = await lovable.auth.signInWithOAuth('google', {
                              redirect_uri: window.location.origin + nextPath,
                            });
                            if (result.error) {
                              toast({
                                variant: 'destructive',
                                title: 'Google Sign-in Failed',
                                description: result.error.message,
                              });
                              setIsLoading(false);
                              return;
                            }
                            if (result.redirected) return;
                          }}
                          className="w-full h-14 rounded-xl text-base font-medium border-2"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </Button>
                      </>
                    )}
                  </>
                )}
              </form>

              {/* Switch Mode */}
              {!(mode === 'forgot' && resetSent) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-center"
                >
                  <button
                    onClick={switchMode}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    {mode === 'forgot'
                      ? 'Back to Login'
                      : mode === 'login' 
                        ? "Don't have an account? Sign up" 
                        : 'Already have an account? Login'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold loopify-gradient-text">LoopiFy</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Learn Together, Grow Together</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
