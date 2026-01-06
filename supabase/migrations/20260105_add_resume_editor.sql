-- Resume editor tables
CREATE TABLE IF NOT EXISTS public.resume_editor_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  doc_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resume_editor_docs_unique_resume UNIQUE (resume_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.resume_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('replace','insert_after','delete')),
  target_quote TEXT NOT NULL,
  replacement_text TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  section_hint TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_resume_editor_docs_user ON public.resume_editor_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_editor_docs_resume ON public.resume_editor_docs(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_user ON public.resume_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_resume ON public.resume_suggestions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_status ON public.resume_suggestions(status);

-- RLS
ALTER TABLE public.resume_editor_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own editor docs" ON public.resume_editor_docs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own editor docs" ON public.resume_editor_docs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own editor docs" ON public.resume_editor_docs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own editor docs" ON public.resume_editor_docs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users select own suggestions" ON public.resume_suggestions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own suggestions" ON public.resume_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own suggestions" ON public.resume_suggestions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own suggestions" ON public.resume_suggestions
  FOR DELETE USING (auth.uid() = user_id);
