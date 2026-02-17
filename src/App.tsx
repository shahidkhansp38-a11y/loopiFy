import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Groups = lazy(() => import("./pages/Groups"));
const AITutor = lazy(() => import("./pages/AITutor"));
const VideoCall = lazy(() => import("./pages/VideoCall"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Resources = lazy(() => import("./pages/Resources"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              <Route path="/video-call" element={<VideoCall />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/resources" element={<Resources />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
