import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PARSE-DOCUMENT] ${step}${detailsStr}`);
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new Error("No file provided");
    }

    const fileName = file.name.toLowerCase();
    logStep("Processing file", { fileName, size: file.size, type: file.type });

    let extractedText = "";

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      // Plain text files
      extractedText = await file.text();
      logStep("Extracted text from plain text file", { length: extractedText.length });
    } else if (fileName.endsWith(".docx")) {
      // Word documents
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      logStep("Extracted text from DOCX", { length: extractedText.length });

      if (result.messages.length > 0) {
        logStep("Mammoth warnings", { messages: result.messages });
      }
    } else if (fileName.endsWith(".doc")) {
      throw new Error("Legacy .doc format is not supported. Please save as .docx");
    } else {
      throw new Error(`Unsupported file format: ${fileName}. Please upload .docx, .txt, or .md files.`);
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("Could not extract enough text from the document");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: extractedText,
        fileName: file.name,
        fileSize: file.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
