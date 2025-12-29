import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TRANSCRIPT_LENGTH = 10000;
const MAX_QUESTION_LENGTH = 1000;
const MAX_FOLLOWUP_LENGTH = 500;
const MAX_COMPETENCY_LENGTH = 100;
const MAX_ARRAY_LENGTH = 10;
const MAX_ROLE_LENGTH = 200;

const VALID_MODES = ['behavioral', 'technical', 'case_study', 'mixed', 'custom', 'system_design'] as const;
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

type ValidMode = typeof VALID_MODES[number];
type ValidDifficulty = typeof VALID_DIFFICULTIES[number];

interface CoachingRequest {
  transcript: string;
  question: string;
  followUps?: string[];
  competencies?: string[];
  mode: ValidMode;
  difficulty: ValidDifficulty;
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
  retryConstraints: string[];
  writtenFeedback: string[];
}

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength).trim();
}

function validateMode(mode: unknown): ValidMode {
  if (typeof mode === "string" && VALID_MODES.includes(mode as ValidMode)) {
    return mode as ValidMode;
  }
  return "behavioral";
}

function validateDifficulty(difficulty: unknown): ValidDifficulty {
  if (typeof difficulty === "string" && VALID_DIFFICULTIES.includes(difficulty as ValidDifficulty)) {
    return difficulty as ValidDifficulty;
  }
  return "medium";
}

function validateStringArray(arr: unknown, maxLength: number, maxItems: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === "string")
    .map(item => item.slice(0, maxLength).trim())
    .filter(Boolean);
}

function validateRequest(body: unknown): CoachingRequest | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body" };
  }

  const raw = body as Record<string, unknown>;
  
  const transcript = sanitizeString(raw.transcript, MAX_TRANSCRIPT_LENGTH);
  const question = sanitizeString(raw.question, MAX_QUESTION_LENGTH);

  if (!transcript) {
    return { error: "Transcript is required" };
  }
  if (!question) {
    return { error: "Question is required" };
  }

  return {
    transcript,
    question,
    followUps: validateStringArray(raw.followUps, MAX_FOLLOWUP_LENGTH, MAX_ARRAY_LENGTH),
    competencies: validateStringArray(raw.competencies, MAX_COMPETENCY_LENGTH, MAX_ARRAY_LENGTH),
    mode: validateMode(raw.mode),
    difficulty: validateDifficulty(raw.difficulty),
    targetRole: sanitizeString(raw.targetRole, MAX_ROLE_LENGTH) || undefined,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = validateRequest(body);
    
    if ("error" in validationResult) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { transcript, question, followUps, competencies, mode, difficulty, targetRole } = validationResult;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Generating coaching feedback for:', question.substring(0, 50) + '...');

    // Determine rubric dimensions based on mode
    const isTechnical = mode === 'technical' || mode === 'system_design';
    const rubricDimensions = isTechnical
      ? ['Structure', 'Specificity', 'Impact', 'Ownership', 'Tradeoffs', 'Depth']
      : ['Structure', 'Specificity', 'Impact', 'Ownership', 'Reflection', 'Brevity'];

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

Provide comprehensive feedback. Evaluate using STAR method for behavioral questions or technical accuracy for technical questions.

RUBRIC DIMENSIONS TO SCORE (0-5 scale):
${rubricDimensions.map(d => `- ${d}`).join('\n')}

Score Meanings:
0 = Not demonstrated
1 = Poor
2 = Below expectations  
3 = Meets expectations
4 = Exceeds expectations
5 = Exceptional

Respond with ONLY valid JSON (no markdown):
{
  "overallFeedback": "2-3 sentence summary",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "rubric": [
    ${rubricDimensions.map(d => `{"dimension": "${d}", "score": 3, "feedback": "Brief feedback on ${d.toLowerCase()}"}`).join(',\n    ')}
  ],
  "overallScore": 65,
  "spokenFeedback": "Conversational 15-30 second coaching: 1 specific strength + 1 specific fix + retry prompt. Be encouraging but direct.",
  "writtenFeedback": [
    "Detailed bullet point 1 about what worked well",
    "Detailed bullet point 2 about specific improvement area",
    "Detailed bullet point 3 with actionable advice"
  ],
  "retryConstraints": [
    "For retry: Try starting with the bottom-line result first",
    "For retry: Add specific numbers or metrics",
    "For retry: Keep it under 90 seconds"
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
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
      
      // Ensure scores are 0-5 scale
      coaching.rubric = coaching.rubric.map(r => ({
        ...r,
        score: Math.min(5, Math.max(0, Math.round(r.score > 5 ? r.score / 20 : r.score)))
      }));
      
      // Calculate overall score as percentage from 0-5 rubric
      const totalScore = coaching.rubric.reduce((sum, r) => sum + r.score, 0);
      const maxScore = coaching.rubric.length * 5;
      coaching.overallScore = Math.round((totalScore / maxScore) * 100);
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      coaching = {
        overallFeedback: 'Your answer was received. Keep practicing to improve your interview skills.',
        strengths: ['Attempted to answer the question'],
        improvements: ['Add more specific examples', 'Use the STAR method'],
        rubric: rubricDimensions.map(d => ({ 
          dimension: d, 
          score: 2, 
          feedback: 'Could be improved' 
        })),
        overallScore: 40,
        spokenFeedback: 'Good effort! Try to include more specific examples and quantify your impact next time.',
        writtenFeedback: [
          'Consider adding more context about the situation',
          'Include specific actions you personally took',
          'Quantify the results when possible'
        ],
        retryConstraints: [
          'For retry: Start with the result',
          'For retry: Add specific numbers',
          'For retry: Be more concise'
        ]
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
