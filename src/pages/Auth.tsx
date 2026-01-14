import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
