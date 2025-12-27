-- FaloodAI Database Schema
-- ==========================================

-- ENUMS
-- ==========================================

-- Job application stages
CREATE TYPE public.job_stage AS ENUM (
  'saved',
  'applied',
  'screening',
  'phone_screen',
  'technical',
  'onsite',
  'final',
  'offer',
  'accepted',
  'rejected',
  'withdrawn'
);

-- Interview round outcomes
CREATE TYPE public.round_outcome AS ENUM (
  'pending',
  'passed',
  'failed',
  'cancelled',
  'rescheduled'
);

-- Practice session modes
CREATE TYPE public.practice_mode AS ENUM (
  'behavioral',
  'technical',
  'case_study',
  'mixed',
  'custom'
);

-- Practice session difficulty
CREATE TYPE public.practice_difficulty AS ENUM (
  'easy',
  'medium',
  'hard'
);

-- Practice session status
CREATE TYPE public.session_status AS ENUM (
  'in_progress',
  'completed',
  'abandoned'
);

-- Practice event types
CREATE TYPE public.event_type AS ENUM (
  'question_asked',
  'user_response',
  'ai_feedback',
  'session_start',
  'session_end'
);

-- ==========================================
-- TABLES
-- ==========================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  target_roles TEXT[],
  seniority TEXT,
  location TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  work_history JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stories table (STAR stories)
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  metrics JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs table (job applications)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  jd_text TEXT,
  stage public.job_stage NOT NULL DEFAULT 'saved',
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  applied_at TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resume versions table
CREATE TABLE public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  ats_report JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interview rounds table
CREATE TABLE public.interview_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL,
  round_date TIMESTAMPTZ,
  outcome public.round_outcome DEFAULT 'pending',
  questions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Practice sessions table
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  mode public.practice_mode NOT NULL DEFAULT 'behavioral',
  difficulty public.practice_difficulty NOT NULL DEFAULT 'medium',
  duration_minutes INTEGER DEFAULT 0,
  status public.session_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Practice events table
CREATE TABLE public.practice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  question_text TEXT,
  transcript_text TEXT,
  feedback JSONB DEFAULT '{}'::jsonb,
  rubric JSONB DEFAULT '{}'::jsonb,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Profiles
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Stories
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_created_at ON public.stories(created_at DESC);

-- Jobs
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_stage ON public.jobs(stage);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_follow_up_at ON public.jobs(follow_up_at) WHERE follow_up_at IS NOT NULL;

-- Resume versions
CREATE INDEX idx_resume_versions_user_id ON public.resume_versions(user_id);
CREATE INDEX idx_resume_versions_job_id ON public.resume_versions(job_id) WHERE job_id IS NOT NULL;

-- Interview rounds
CREATE INDEX idx_interview_rounds_user_id ON public.interview_rounds(user_id);
CREATE INDEX idx_interview_rounds_job_id ON public.interview_rounds(job_id);
CREATE INDEX idx_interview_rounds_date ON public.interview_rounds(round_date) WHERE round_date IS NOT NULL;

-- Practice sessions
CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_job_id ON public.practice_sessions(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_practice_sessions_status ON public.practice_sessions(status);

-- Practice events
CREATE INDEX idx_practice_events_session_id ON public.practice_events(session_id);
CREATE INDEX idx_practice_events_created_at ON public.practice_events(created_at);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Stories policies
CREATE POLICY "Users can view their own stories"
  ON public.stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Resume versions policies
CREATE POLICY "Users can view their own resume versions"
  ON public.resume_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume versions"
  ON public.resume_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume versions"
  ON public.resume_versions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume versions"
  ON public.resume_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Interview rounds policies
CREATE POLICY "Users can view their own interview rounds"
  ON public.interview_rounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview rounds"
  ON public.interview_rounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview rounds"
  ON public.interview_rounds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview rounds"
  ON public.interview_rounds FOR DELETE
  USING (auth.uid() = user_id);

-- Practice sessions policies
CREATE POLICY "Users can view their own practice sessions"
  ON public.practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice sessions"
  ON public.practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions"
  ON public.practice_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice sessions"
  ON public.practice_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Practice events policies (access via session ownership)
CREATE POLICY "Users can view events from their sessions"
  ON public.practice_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_events.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in their sessions"
  ON public.practice_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_events.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update events in their sessions"
  ON public.practice_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_events.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events in their sessions"
  ON public.practice_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_events.session_id
      AND user_id = auth.uid()
    )
  );

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();