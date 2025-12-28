-- Create free_usage_ledger table to track free tier usage per month
CREATE TABLE public.free_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_start DATE NOT NULL,
  resumes_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_start)
);

-- Enable RLS
ALTER TABLE public.free_usage_ledger ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own free usage"
ON public.free_usage_ledger
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all usage
CREATE POLICY "Service role can manage free usage"
ON public.free_usage_ledger
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_free_usage_ledger_updated_at
BEFORE UPDATE ON public.free_usage_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();