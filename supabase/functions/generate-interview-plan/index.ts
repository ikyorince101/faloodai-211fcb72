import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionPlan {
  questions: Array<{
    id: number;
    question: string;
    competencies: string[];
    followUps: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  estimatedDuration: number;
  mode: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, difficulty, duration, targetRole, seniority, jobDescription, storyTags } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Generating interview plan:', { mode, difficulty, duration, targetRole });

    const questionCount = Math.max(3, Math.floor(duration / 5)); // ~5 min per question

    const prompt = `You are an expert interview coach. Generate a structured mock interview plan.

PARAMETERS:
- Mode: ${mode} (behavioral/technical/system_design/executive/mixed)
- Difficulty: ${difficulty} (easy/medium/hard)
- Duration: ${duration} minutes (generate ${questionCount} questions)
- Target Role: ${targetRole || 'General'}
- Seniority: ${seniority || 'Mid-level'}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}
${storyTags?.length > 0 ? `- Candidate's Story Tags (areas of experience): ${storyTags.join(', ')}` : ''}

INSTRUCTIONS:
1. Generate ${questionCount} interview questions appropriate for the mode and difficulty
2. For BEHAVIORAL mode: Use STAR-format questions (Tell me about a time when...)
3. For TECHNICAL mode: Include coding concepts, algorithms, or system knowledge
4. For SYSTEM_DESIGN mode: Include architecture and scalability scenarios
5. For EXECUTIVE mode: Focus on leadership, strategy, and stakeholder management
6. For MIXED mode: Combine 2-3 question types
7. Each question should have 2-3 follow-up probes to dig deeper
8. Tag each question with relevant competencies

Respond with ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "id": 1,
      "question": "Main interview question here",
      "competencies": ["competency1", "competency2"],
      "followUps": ["Follow-up probe 1", "Follow-up probe 2"],
      "difficulty": "medium"
    }
  ],
  "estimatedDuration": ${duration},
  "mode": "${mode}"
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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(JSON.stringify({ error: 'OpenAI API key issue. Please check your API key.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response received');

    let plan: QuestionPlan;
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
      plan = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback plan
      plan = {
        questions: [
          {
            id: 1,
            question: "Tell me about a challenging project you led and how you handled obstacles.",
            competencies: ["leadership", "problem-solving"],
            followUps: ["What was the biggest challenge?", "How did you measure success?"],
            difficulty: "medium"
          },
          {
            id: 2,
            question: "Describe a time when you had to influence stakeholders without direct authority.",
            competencies: ["influence", "communication"],
            followUps: ["What approach did you take?", "What was the outcome?"],
            difficulty: "medium"
          },
          {
            id: 3,
            question: "Walk me through how you prioritize competing demands.",
            competencies: ["prioritization", "time-management"],
            followUps: ["Can you give a specific example?", "How do you communicate trade-offs?"],
            difficulty: "easy"
          }
        ],
        estimatedDuration: duration,
        mode: mode
      };
    }

    console.log('Generated plan with', plan.questions.length, 'questions');

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-interview-plan function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
