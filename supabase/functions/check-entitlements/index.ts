import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ENTITLEMENTS] ${step}${detailsStr}`);
};

// Pro tier limits
const PRO_LIMITS = {
  resumes: 100,
  interviews: 10,
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

    // Check for active subscription
    const { data: subscription } = await supabaseClient
      .from("billing_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const isPro = !!subscription;
    logStep("Subscription check", { isPro, subscriptionId: subscription?.stripe_subscription_id });

    // Check for API keys if not pro
    let hasApiKeys = false;
    if (!isPro) {
      const { data: apiKeys } = await supabaseClient
        .from("api_keys")
        .select("provider")
        .eq("user_id", user.id);

      hasApiKeys = (apiKeys?.length ?? 0) > 0;
      logStep("API keys check", { hasApiKeys, keyCount: apiKeys?.length });
    }

    // Get current usage for pro users
    let usage = { resumes_used: 0, interviews_used: 0 };
    if (isPro && subscription) {
      const { data: usageData } = await supabaseClient
        .from("usage_ledger")
        .select("*")
        .eq("user_id", user.id)
        .eq("period_start", subscription.current_period_start)
        .eq("period_end", subscription.current_period_end)
        .single();

      if (usageData) {
        usage = {
          resumes_used: usageData.resumes_used,
          interviews_used: usageData.interviews_used,
        };
      }
      logStep("Usage check", usage);
    }

    const response = {
      plan: isPro ? "PRO" : "FREE_BYOK",
      hasApiKeys,
      subscription: subscription ? {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
      usage: isPro ? {
        resumes: { used: usage.resumes_used, limit: PRO_LIMITS.resumes },
        interviews: { used: usage.interviews_used, limit: PRO_LIMITS.interviews },
      } : null,
      canGenerateResume: isPro 
        ? usage.resumes_used < PRO_LIMITS.resumes 
        : hasApiKeys,
      canRunInterview: isPro 
        ? usage.interviews_used < PRO_LIMITS.interviews 
        : hasApiKeys,
    };

    logStep("Response prepared", response);

    return new Response(
      JSON.stringify(response),
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
