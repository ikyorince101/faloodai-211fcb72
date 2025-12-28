import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INCREMENT-USAGE] ${step}${detailsStr}`);
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

    const { type } = await req.json();
    if (!type || !["resume", "interview"].includes(type)) {
      throw new Error("Invalid usage type. Must be 'resume' or 'interview'");
    }
    logStep("Usage type", { type });

    // Get active subscription
    const { data: subscription } = await supabaseClient
      .from("billing_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      // Free user - no usage tracking needed
      logStep("Free user, no usage tracking");
      return new Response(
        JSON.stringify({ success: true, plan: "FREE_BYOK" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get or create usage ledger for current period
    const { data: existingUsage } = await supabaseClient
      .from("usage_ledger")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_start", subscription.current_period_start)
      .eq("period_end", subscription.current_period_end)
      .single();

    const column = type === "resume" ? "resumes_used" : "interviews_used";

    if (existingUsage) {
      // Increment existing usage
      const newValue = (existingUsage[column] || 0) + 1;
      const { error } = await supabaseClient
        .from("usage_ledger")
        .update({ [column]: newValue })
        .eq("id", existingUsage.id);

      if (error) throw error;
      logStep("Usage incremented", { column, newValue });

      return new Response(
        JSON.stringify({ success: true, [column]: newValue }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Create new usage ledger entry
      const newUsage = {
        user_id: user.id,
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end,
        resumes_used: type === "resume" ? 1 : 0,
        interviews_used: type === "interview" ? 1 : 0,
      };

      const { error } = await supabaseClient
        .from("usage_ledger")
        .insert(newUsage);

      if (error) throw error;
      logStep("New usage ledger created", newUsage);

      return new Response(
        JSON.stringify({ success: true, [column]: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
