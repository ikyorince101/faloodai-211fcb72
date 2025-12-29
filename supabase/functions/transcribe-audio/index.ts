import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_PATH_LENGTH = 500;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit)

// Validate audio path format: should be {uuid}/{filename}
function validateAudioPath(path: unknown): string | null {
  if (typeof path !== "string") return null;
  if (path.length === 0 || path.length > MAX_PATH_LENGTH) return null;
  
  // Reject path traversal attempts
  if (path.includes("..") || path.startsWith("/") || path.includes("://")) {
    return null;
  }
  
  // Should match pattern like: user-id/filename.webm
  const pathPattern = /^[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_.]+$/;
  if (!pathPattern.test(path)) {
    return null;
  }
  
  return path;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const audioPath = validateAudioPath(body.audioPath);
    
    if (!audioPath) {
      return new Response(JSON.stringify({ error: 'Invalid audio path format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Transcribing audio from:', audioPath);

    // Get signed URL for the audio file
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: urlData, error: urlError } = await supabase.storage
      .from('audio')
      .createSignedUrl(audioPath, 300);

    if (urlError || !urlData?.signedUrl) {
      console.error('Error getting signed URL:', urlError);
      throw new Error('Failed to access audio file');
    }

    console.log('Got signed URL, fetching audio...');

    // Download the audio file with size check
    const audioResponse = await fetch(urlData.signedUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file');
    }

    // Check content length if available
    const contentLength = audioResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Audio file too large (max 25MB)' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audioBlob = await audioResponse.blob();
    
    // Additional size check after download
    if (audioBlob.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Audio file too large (max 25MB)' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Audio fetched, transcribing with Whisper API...');

    // Use OpenAI Whisper API for transcription
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', whisperResponse.status, errorText);
      
      if (whisperResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Fallback: return placeholder transcript
      return new Response(JSON.stringify({ 
        transcript: '[Audio transcription unavailable - please try again]',
        segments: [],
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text || '[No speech detected]';
    
    // Convert Whisper segments to our format with speaker diarization attempt
    // Note: Whisper doesn't do speaker diarization, so we'll use a simple heuristic
    // based on pauses and question detection
    const segments: Array<{speaker: string; text: string; isQuestion: boolean}> = [];
    
    if (whisperData.segments && whisperData.segments.length > 0) {
      let currentSpeaker = 'Speaker 1';
      let lastEndTime = 0;
      
      for (const seg of whisperData.segments) {
        const text = seg.text?.trim() || '';
        if (!text) continue;
        
        // Simple heuristic: if there's a significant pause (>2s), switch speakers
        if (seg.start - lastEndTime > 2) {
          currentSpeaker = currentSpeaker === 'Speaker 1' ? 'Speaker 2' : 'Speaker 1';
        }
        
        // Detect if this segment is a question
        const isQuestion = /\?$/.test(text) || 
          /^(tell me|describe|explain|what|how|why|when|where|who|can you|could you|would you)/i.test(text);
        
        segments.push({
          speaker: currentSpeaker,
          text,
          isQuestion
        });
        
        lastEndTime = seg.end || seg.start;
      }
    } else {
      // If no segments, just return the full transcript as one segment
      segments.push({
        speaker: 'Speaker 1',
        text: transcript,
        isQuestion: false
      });
    }

    console.log('Transcription complete:', transcript.substring(0, 100) + '...', 'Segments:', segments.length);

    return new Response(JSON.stringify({ 
      transcript,
      segments,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
