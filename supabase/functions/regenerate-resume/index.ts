import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ATSIssue {
  category: 'formatting' | 'content' | 'keywords';
  type: 'error' | 'warning';
  message: string;
  fix: string;
}

interface ATSReport {
  score: number;
  issues: ATSIssue[];
  keywordCoverage: {
    found: string[];
    missing: string[];
    coverage: number;
  };
  formattingPassed: boolean;
  explanation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeContent, atsReport, jobDescription, emphasis } = await req.json();
    
    if (!resumeContent || !atsReport) {
      return new Response(JSON.stringify({ error: 'Resume content and ATS report are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Starting resume regeneration based on ATS feedback...');
    console.log('Current score:', atsReport.score);
    console.log('Issues count:', atsReport.issues?.length || 0);

    const prompt = `You are an expert resume writer and ATS optimization specialist. Your task is to improve the following resume based on ATS validation feedback to achieve a score of 90% or higher.

CURRENT RESUME:
${JSON.stringify(resumeContent, null, 2)}

ATS VALIDATION FEEDBACK:
- Current Score: ${atsReport.score}/100
- Issues: ${JSON.stringify(atsReport.issues, null, 2)}
- Missing Keywords: ${atsReport.keywordCoverage?.missing?.join(', ') || 'None specified'}
- Found Keywords: ${atsReport.keywordCoverage?.found?.join(', ') || 'None specified'}
- Formatting Status: ${atsReport.formattingPassed ? 'Passed' : 'Failed'}
- Explanation: ${atsReport.explanation}

${jobDescription ? `TARGET JOB DESCRIPTION:
${jobDescription}` : ''}

${emphasis ? `EMPHASIS: Focus on ${emphasis}` : ''}

INSTRUCTIONS:
1. Fix ALL formatting issues mentioned in the feedback
2. Address ALL content issues and warnings
3. Naturally incorporate the missing keywords where relevant
4. Improve quantified achievements with metrics
5. Ensure proper section headings (Experience, Education, Skills, etc.)
6. Maintain professional tone and accuracy
7. Keep the same overall structure but optimize content

Return the improved resume as a JSON object with the exact same structure:
{
  "name": "<name>",
  "email": "<email>",
  "location": "<location>",
  "summary": "<improved professional summary incorporating missing keywords>",
  "experience": [
    {
      "title": "<job title>",
      "company": "<company>",
      "period": "<time period>",
      "description": "<improved bullet points with metrics and keywords>"
    }
  ],
  "skills": ["skill1", "skill2"],
  "projects": [
    {
      "name": "<project name>",
      "description": "<description with relevant keywords>"
    }
  ],
  "emphasis": "${emphasis || 'skills'}",
  "generatedAt": "${new Date().toISOString()}",
  "regeneratedFromScore": ${atsReport.score}
}

IMPORTANT: Return ONLY valid JSON, no markdown or explanations.`;

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
    
    console.log('AI response received, parsing improved resume...');

    // Parse the JSON response
    let improvedResume;
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
      improvedResume = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse improved resume. Please try again.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Resume regeneration complete');

    return new Response(JSON.stringify({ 
      improvedResume,
      previousScore: atsReport.score 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regenerate-resume function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
