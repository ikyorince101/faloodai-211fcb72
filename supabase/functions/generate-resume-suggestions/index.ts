// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestionPayload {
  suggestionId: string;
  type: "replace" | "insert_after" | "delete";
  targetQuote: string;
  replacementText?: string;
  reason: string;
  sectionHint?: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { docText, resumeId, jobDescription } = await req.json();

    if (!docText || typeof docText !== "string") {
      return new Response(JSON.stringify({ error: "docText required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert resume editor. Propose concise inline edits.
Return ONLY JSON array. Schema:
[
  {
    "suggestionId": "uuid",
    "type": "replace" | "insert_after" | "delete",
    "targetQuote": "exact substring from current resume text",
    "replacementText": "new text (required for replace/insert_after)",
    "reason": "short reason",
    "sectionHint": "optional section name",
    "confidence": 0.0-1.0
  }
]
Rules:
- targetQuote must exist verbatim in the provided text.
- Keep suggestions small and precise.
- Do not include narrative or markdown.`;

    const userPrompt = `Current resume text:\n${docText}\nResume Id: ${resumeId || "unknown"}\nJob Description (for relevance):\n${jobDescription || 'Not provided'}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error", errorText);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content || "";

    let parsed: SuggestionPayload[] = [];
    try {
      const obj = JSON.parse(content);
      if (Array.isArray(obj)) {
        parsed = obj as SuggestionPayload[];
      } else if (Array.isArray(obj?.suggestions)) {
        parsed = obj.suggestions as SuggestionPayload[];
      } else {
        throw new Error("Invalid suggestion container");
      }
    } catch (err) {
      console.error("Parse error", err);
      return new Response(JSON.stringify({ error: "Invalid JSON from model" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safe = parsed
      .filter((s) => s.suggestionId && s.targetQuote && s.reason)
      .map((s) => ({
        suggestionId: s.suggestionId,
        type: s.type,
        targetQuote: s.targetQuote,
        replacementText: s.replacementText,
        reason: s.reason,
        sectionHint: s.sectionHint,
        confidence: typeof s.confidence === "number" ? s.confidence : 0.5,
      }));

    return new Response(JSON.stringify(safe), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
