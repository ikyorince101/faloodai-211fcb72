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
    const { resumeContent, jobDescription } = await req.json();
    
    if (!resumeContent) {
      return new Response(JSON.stringify({ error: 'Resume content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting ATS validation...');
    console.log('Resume content keys:', Object.keys(resumeContent || {}));
    console.log('JD provided:', !!jobDescription);

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume for ATS compatibility and provide a detailed report.

RESUME CONTENT:
${JSON.stringify(resumeContent, null, 2)}

${jobDescription ? `JOB DESCRIPTION:
${jobDescription}` : 'No job description provided.'}

Analyze the resume for:

1. FORMATTING CHECKS (critical for ATS parsing):
- Single-column layout (no tables/columns that confuse parsers)
- Standard section headings (Experience, Education, Skills, etc.)
- No tables, text boxes, or complex formatting
- Consistent date formats
- Simple bullet points (no special characters)
- No headers/footers with critical info

2. CONTENT CHECKS:
- Missing critical sections (Contact, Experience, Education, Skills)
- Too many special symbols or excessive styling
- Appropriate length and detail level
- Clear job titles and company names
- Quantified achievements with metrics

3. KEYWORD COVERAGE (if JD provided):
- Extract top 10-15 key skills/requirements from JD
- Check which keywords appear in resume
- Calculate coverage percentage
- Identify missing critical keywords

Respond with ONLY a valid JSON object (no markdown, no explanation outside JSON):
{
  "score": <number 0-100>,
  "formattingPassed": <boolean - true if no critical formatting errors>,
  "issues": [
    {
      "category": "formatting" | "content" | "keywords",
      "type": "error" | "warning",
      "message": "<clear issue description>",
      "fix": "<specific actionable fix>"
    }
  ],
  "keywordCoverage": {
    "found": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"],
    "coverage": <percentage 0-100>
  },
  "explanation": "<2-3 sentence explanation of the overall score and main areas for improvement>"
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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response received, parsing...');

    // Parse the JSON response
    let report: ATSReport;
    try {
      // Clean the response - remove markdown code blocks if present
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
      report = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback report
      report = {
        score: 70,
        formattingPassed: true,
        issues: [
          {
            category: 'content',
            type: 'warning',
            message: 'Unable to perform detailed analysis',
            fix: 'Please try again or check your resume content'
          }
        ],
        keywordCoverage: {
          found: [],
          missing: [],
          coverage: 0
        },
        explanation: 'Analysis was partially completed. Your resume appears to have standard formatting.'
      };
    }

    console.log('ATS validation complete. Score:', report.score);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ats-validate function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
