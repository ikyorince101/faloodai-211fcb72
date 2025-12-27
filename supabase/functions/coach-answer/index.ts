import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoachingRequest {
  transcript: string;
  question: string;
  followUps?: string[];
  competencies?: string[];
  mode: string;
  difficulty: string;
  targetRole?: string;
}

interface RubricScore {
  dimension: string;
  score: number;
  feedback: string;
}

interface CoachingResponse {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  rubric: RubricScore[];
  overallScore: number;
  spokenFeedback: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, question, followUps, competencies, mode, difficulty, targetRole }: CoachingRequest = await req.json();
    
    if (!transcript || !question) {
      return new Response(JSON.stringify({ error: 'Transcript and question are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating coaching feedback for:', question.substring(0, 50) + '...');

    const prompt = `You are an expert interview coach providing feedback on a candidate's answer.

INTERVIEW CONTEXT:
- Mode: ${mode}
- Difficulty: ${difficulty}
- Target Role: ${targetRole || 'General'}
${competencies?.length ? `- Competencies Being Assessed: ${competencies.join(', ')}` : ''}

QUESTION ASKED:
${question}

${followUps?.length ? `FOLLOW-UP PROBES (for context):
${followUps.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : ''}

CANDIDATE'S ANSWER:
${transcript}

Provide comprehensive feedback. Evaluate the answer using the STAR method (Situation, Task, Action, Result) for behavioral questions, or technical accuracy and clarity for technical questions.

Respond with ONLY valid JSON (no markdown):
{
  "overallFeedback": "2-3 sentence summary of the answer quality",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2"],
  "rubric": [
    {"dimension": "Clarity", "score": 75, "feedback": "Brief feedback"},
    {"dimension": "Structure", "score": 80, "feedback": "Brief feedback"},
    {"dimension": "Specificity", "score": 70, "feedback": "Brief feedback"},
    {"dimension": "Relevance", "score": 85, "feedback": "Brief feedback"},
    {"dimension": "Impact", "score": 72, "feedback": "Brief feedback"}
  ],
  "overallScore": 76,
  "spokenFeedback": "A conversational 2-3 sentence coaching tip that would be spoken aloud to the candidate. Be encouraging but specific about one key improvement."
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let coaching: CoachingResponse;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      coaching = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback response
      coaching = {
        overallFeedback: 'Your answer was received. Keep practicing to improve your interview skills.',
        strengths: ['Attempted to answer the question'],
        improvements: ['Add more specific examples', 'Use the STAR method'],
        rubric: [
          { dimension: 'Clarity', score: 70, feedback: 'Could be clearer' },
          { dimension: 'Structure', score: 65, feedback: 'Consider using STAR format' },
          { dimension: 'Specificity', score: 60, feedback: 'Add more details' },
          { dimension: 'Relevance', score: 75, feedback: 'Mostly on topic' },
          { dimension: 'Impact', score: 65, feedback: 'Quantify your results' }
        ],
        overallScore: 67,
        spokenFeedback: 'Good effort! Try to include more specific examples and quantify your impact next time.'
      };
    }

    console.log('Coaching generated. Overall score:', coaching.overallScore);

    return new Response(JSON.stringify(coaching), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in coach-answer function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
