-- Add live_overlay_minutes_used column to usage_ledger for Pro users
ALTER TABLE public.usage_ledger 
ADD COLUMN IF NOT EXISTS live_overlay_minutes_used INTEGER NOT NULL DEFAULT 0;

-- Add live_overlay_minutes_used to free_usage_ledger for potential future use
ALTER TABLE public.free_usage_ledger 
ADD COLUMN IF NOT EXISTS live_overlay_minutes_used INTEGER NOT NULL DEFAULT 0;

-- Add 'live_overlay' to practice_mode enum if needed
-- First check if it exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'live_overlay' 
        AND enumtypid = 'practice_mode'::regtype
    ) THEN
        ALTER TYPE practice_mode ADD VALUE 'live_overlay';
    END IF;
END$$;