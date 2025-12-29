import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PARSE-RESUME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { resumeText } = await req.json();
    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error("Resume text is too short or empty");
    }

    logStep("Parsing resume", { textLength: resumeText.length });

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const systemPrompt = `You are an expert resume parser. Extract structured information from the resume text provided.
Your task is to identify and extract:
1. Work history (companies, roles, dates, descriptions)
2. Skills (technical and soft skills)
3. Projects (name, description, technologies used)
4. Education (if present)

Return a JSON object with this exact structure:
{
  "fullName": "string or null",
  "email": "string or null",
  "location": "string or null",
  "workHistory": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "YYYY-MM or approximate",
      "endDate": "YYYY-MM, Present, or null",
      "description": "Brief description of responsibilities and achievements",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "skills": [
    { "name": "Skill Name", "level": "beginner|intermediate|advanced|expert", "category": "technical|soft|language" }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project does",
      "technologies": ["tech1", "tech2"],
      "url": "optional URL or null"
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "graduationYear": "YYYY or null"
    }
  ],
  "targetRoles": ["inferred role 1", "inferred role 2"],
  "seniority": "entry|mid|senior|staff|principal|director|vp|c-level"
}

Be thorough and extract as much information as possible. For skills, infer the level based on context (years mentioned, expertise demonstrated). For seniority, infer from job titles and experience.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please parse the following resume and extract structured information:\n\n${resumeText}` }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(JSON.stringify({ error: "OpenAI API key issue. Please check your API key." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    logStep("AI response received", { contentLength: content.length });

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse resume data");
    }

    logStep("Resume parsed successfully", { 
      workHistoryCount: parsedData.workHistory?.length || 0,
      skillsCount: parsedData.skills?.length || 0,
      projectsCount: parsedData.projects?.length || 0,
    });

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
