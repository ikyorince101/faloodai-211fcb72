import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_PATH_LENGTH = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
      return new Response(JSON.stringify({ error: 'Audio file too large (max 10MB)' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audioBlob = await audioResponse.blob();
    
    // Additional size check after download
    if (audioBlob.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Audio file too large (max 10MB)' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const base64Audio = await blobToBase64(audioBlob);

    console.log('Audio fetched, transcribing with AI...');

    // Use Gemini for transcription with speaker diarization
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Transcribe this audio recording with speaker diarization. Identify different speakers and label them.

Return a JSON object with this exact structure:
{
  "transcript": "the full transcript text",
  "segments": [
    {"speaker": "Speaker 1", "text": "what they said", "isQuestion": false},
    {"speaker": "Speaker 2", "text": "what they said", "isQuestion": true}
  ]
}

Rules:
- Label speakers as "Speaker 1", "Speaker 2", etc.
- Set "isQuestion" to true if the segment contains a question or interview-style prompt (e.g., "Tell me about...", "Describe a time when...", "What would you do if...")
- If only one speaker, still include them in segments
- If audio is unclear or silent, return {"transcript": "[inaudible]", "segments": []}
- Return ONLY valid JSON, no other text`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:audio/webm;base64,${base64Audio}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
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

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Parse the JSON response
    let transcript = '[No speech detected]';
    let segments: Array<{speaker: string; text: string; isQuestion: boolean}> = [];
    
    try {
      // Handle potential markdown code blocks
      let jsonContent = rawContent;
      if (rawContent.startsWith('```')) {
        jsonContent = rawContent.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      
      const parsed = JSON.parse(jsonContent);
      transcript = parsed.transcript || '[No speech detected]';
      segments = parsed.segments || [];
    } catch (parseError) {
      console.error('Failed to parse diarization JSON:', parseError);
      // Fallback: use raw content as transcript
      transcript = rawContent || '[No speech detected]';
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

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}
