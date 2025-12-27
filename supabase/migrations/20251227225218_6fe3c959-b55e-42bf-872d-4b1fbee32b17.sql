-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false);

-- Storage policies for audio bucket
-- Users can only access their own audio files under /{user_id}/audio/

CREATE POLICY "Users can view their own audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own audio files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);