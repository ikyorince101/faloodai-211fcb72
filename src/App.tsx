import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { MotionProvider } from "@/contexts/MotionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import JobTracker from "./pages/JobTracker";
import JobDetail from "./pages/JobDetail";
import ResumeWorkspace from "./pages/ResumeWorkspace";
import InterviewPractice from "./pages/InterviewPractice";
import LiveInterviewRoom from "./pages/LiveInterviewRoom";
import LiveOverlay from "./pages/LiveOverlay";
import SessionDebrief from "./pages/SessionDebrief";
import StoryBank from "./pages/StoryBank";
import ProfileHub from "./pages/ProfileHub";
import SettingsPage from "./pages/Settings";
import BillingPage from "./pages/Billing";
import Analytics from "./pages/Analytics";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SuccessPage from "./pages/Success";
import CancelPage from "./pages/Cancel";
import ApiKeysPage from "./pages/ApiKeys";
import OnboardingPage from "./pages/Onboarding";
import Feedback from "./pages/Feedback";
import AdminDashboard from "./pages/AdminDashboard";
import ResumeEditor from "./pages/ResumeEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <MotionProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <VercelAnalytics />
            <BrowserRouter>
              <Routes>
                {/* Public Marketing Pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/cancel" element={<CancelPage />} />
                
                {/* Protected App Pages */}
                <Route path="/app" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/jobs" element={<ProtectedRoute><AppLayout><JobTracker /></AppLayout></ProtectedRoute>} />
                <Route path="/jobs/:jobId" element={<ProtectedRoute><AppLayout><JobDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/resume" element={<ProtectedRoute><AppLayout><ResumeWorkspace /></AppLayout></ProtectedRoute>} />
                <Route path="/resume-editor" element={<ProtectedRoute><AppLayout><ResumeEditor /></AppLayout></ProtectedRoute>} />
                <Route path="/interview" element={<ProtectedRoute><AppLayout><InterviewPractice /></AppLayout></ProtectedRoute>} />
                <Route path="/interview/live" element={<ProtectedRoute><AppLayout><LiveInterviewRoom /></AppLayout></ProtectedRoute>} />
                <Route path="/interview/live-overlay" element={<ProtectedRoute><LiveOverlay /></ProtectedRoute>} />
                <Route path="/session/:sessionId/debrief" element={<ProtectedRoute><AppLayout><SessionDebrief /></AppLayout></ProtectedRoute>} />
                <Route path="/session-debrief" element={<ProtectedRoute><AppLayout><SessionDebrief /></AppLayout></ProtectedRoute>} />
                <Route path="/stories" element={<ProtectedRoute><AppLayout><StoryBank /></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfileHub /></AppLayout></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
                <Route path="/settings/api-keys" element={<ProtectedRoute><AppLayout><ApiKeysPage /></AppLayout></ProtectedRoute>} />
                <Route path="/settings/billing" element={<ProtectedRoute><AppLayout><BillingPage /></AppLayout></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><AppLayout><Feedback /></AppLayout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </MotionProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
