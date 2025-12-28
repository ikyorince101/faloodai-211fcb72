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

// Get current month start date (first day of month)
function getCurrentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

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
      .maybeSingle();

    // Pro user - track in usage_ledger
    if (subscription) {
      // Get or create usage ledger for current period
      const { data: existingUsage } = await supabaseClient
        .from("usage_ledger")
        .select("*")
        .eq("user_id", user.id)
        .eq("period_start", subscription.current_period_start)
        .eq("period_end", subscription.current_period_end)
        .maybeSingle();

      const column = type === "resume" ? "resumes_used" : "interviews_used";

      if (existingUsage) {
        // Increment existing usage
        const newValue = (existingUsage[column] || 0) + 1;
        const { error } = await supabaseClient
          .from("usage_ledger")
          .update({ [column]: newValue })
          .eq("id", existingUsage.id);

        if (error) throw error;
        logStep("Pro usage incremented", { column, newValue });

        return new Response(
          JSON.stringify({ success: true, plan: "PRO", [column]: newValue }),
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
        logStep("New pro usage ledger created", newUsage);

        return new Response(
          JSON.stringify({ success: true, plan: "PRO", [column]: 1 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Free user - track resume usage in free_usage_ledger
    if (type === "resume") {
      const monthStart = getCurrentMonthStart();

      // Get or create free usage ledger for current month
      const { data: existingFreeUsage } = await supabaseClient
        .from("free_usage_ledger")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_start", monthStart)
        .maybeSingle();

      if (existingFreeUsage) {
        // Increment existing usage
        const newValue = (existingFreeUsage.resumes_used || 0) + 1;
        const { error } = await supabaseClient
          .from("free_usage_ledger")
          .update({ resumes_used: newValue })
          .eq("id", existingFreeUsage.id);

        if (error) throw error;
        logStep("Free resume usage incremented", { resumes_used: newValue, monthStart });

        return new Response(
          JSON.stringify({ success: true, plan: "FREE", resumes_used: newValue }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        // Create new free usage ledger entry
        const { error } = await supabaseClient
          .from("free_usage_ledger")
          .insert({
            user_id: user.id,
            month_start: monthStart,
            resumes_used: 1,
          });

        if (error) throw error;
        logStep("New free usage ledger created", { resumes_used: 1, monthStart });

        return new Response(
          JSON.stringify({ success: true, plan: "FREE", resumes_used: 1 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Free user trying to use interview - requires API keys
    logStep("Free user interview attempt - requires API keys");
    return new Response(
      JSON.stringify({ success: true, plan: "FREE_BYOK", message: "Interviews require API keys or Pro subscription" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
