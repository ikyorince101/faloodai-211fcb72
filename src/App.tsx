import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionProvider } from "@/contexts/MotionContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import JobTracker from "./pages/JobTracker";
import ResumeWorkspace from "./pages/ResumeWorkspace";
import InterviewPractice from "./pages/InterviewPractice";
import StoryBank from "./pages/StoryBank";
import ProfileHub from "./pages/ProfileHub";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MotionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<JobTracker />} />
              <Route path="/resume" element={<ResumeWorkspace />} />
              <Route path="/interview" element={<InterviewPractice />} />
              <Route path="/stories" element={<StoryBank />} />
              <Route path="/profile" element={<ProfileHub />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </MotionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
