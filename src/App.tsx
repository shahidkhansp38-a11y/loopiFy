import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { CallProvider } from "@/components/call/CallProvider";
import BottomNav from "@/components/BottomNav";
import AppLayout from "@/components/AppLayout";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Landing = lazy(() => import("./pages/Landing"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Groups = lazy(() => import("./pages/Groups"));
const Learning = lazy(() => import("./pages/Learning"));
const LearningGroup = lazy(() => import("./pages/LearningGroup"));
const AITutor = lazy(() => import("./pages/AITutor"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Resources = lazy(() => import("./pages/Resources"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Only show splash on first load in the session
  useEffect(() => {
    const seen = sessionStorage.getItem('splash_seen');
    if (seen) setShowSplash(false);
    else sessionStorage.setItem('splash_seen', '1');
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        }>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/welcome" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:groupId" element={<LearningGroup />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
          <BottomNav />
        </Suspense>
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CallProvider>
            <AppContent />
          </CallProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
