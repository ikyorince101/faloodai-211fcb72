import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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

// Free tier limits
const FREE_LIMITS = {
  resumes: 3,
};

// Get current month start date (first day of month)
function getCurrentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// Get next month start date (for reset info)
function getNextMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for active subscription in database first
    let { data: subscription } = await supabaseClient
      .from("billing_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    let isPro = !!subscription;
    logStep("DB subscription check", { isPro, subscriptionId: subscription?.stripe_subscription_id });

    // If no subscription in DB, check Stripe directly and sync if found
    if (!isPro) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        
        // Find customer by email
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          logStep("Found Stripe customer", { customerId });

          // Check for active subscription
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const stripeSub = subscriptions.data[0];
            logStep("Found active Stripe subscription", { subscriptionId: stripeSub.id });

            try {
              // Sync billing_customer - check if exists first
              const { data: existingCustomer } = await supabaseClient
                .from("billing_customers")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

              if (existingCustomer) {
                await supabaseClient
                  .from("billing_customers")
                  .update({ stripe_customer_id: customerId })
                  .eq("user_id", user.id);
              } else {
                await supabaseClient
                  .from("billing_customers")
                  .insert({ user_id: user.id, stripe_customer_id: customerId });
              }
              logStep("Billing customer synced");

              // Sync subscription - check if exists first
              const priceId = stripeSub.items.data[0]?.price?.id;
              const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
              const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

              const { data: existingSub } = await supabaseClient
                .from("billing_subscriptions")
                .select("id")
                .eq("stripe_subscription_id", stripeSub.id)
                .maybeSingle();

              if (existingSub) {
                await supabaseClient
                  .from("billing_subscriptions")
                  .update({
                    status: stripeSub.status,
                    price_id: priceId,
                    current_period_start: periodStart,
                    current_period_end: periodEnd,
                    cancel_at_period_end: stripeSub.cancel_at_period_end,
                  })
                  .eq("id", existingSub.id);
              } else {
                await supabaseClient
                  .from("billing_subscriptions")
                  .insert({
                    user_id: user.id,
                    stripe_subscription_id: stripeSub.id,
                    status: stripeSub.status,
                    price_id: priceId,
                    current_period_start: periodStart,
                    current_period_end: periodEnd,
                    cancel_at_period_end: stripeSub.cancel_at_period_end,
                  });
              }
              logStep("Subscription synced to database");
              isPro = true;

              // Refetch subscription from DB
              const { data: syncedSub } = await supabaseClient
                .from("billing_subscriptions")
                .select("*")
                .eq("user_id", user.id)
                .eq("status", "active")
                .maybeSingle();

              subscription = syncedSub;

              // Ensure usage ledger exists
              const { data: existingLedger } = await supabaseClient
                .from("usage_ledger")
                .select("id")
                .eq("user_id", user.id)
                .gte("period_end", new Date().toISOString())
                .maybeSingle();

              if (!existingLedger) {
                await supabaseClient
                  .from("usage_ledger")
                  .insert({
                    user_id: user.id,
                    period_start: periodStart,
                    period_end: periodEnd,
                    resumes_used: 0,
                    interviews_used: 0,
                  });
                logStep("Created usage ledger for synced subscription");
              }
            } catch (syncError) {
              logStep("Sync error", { error: syncError instanceof Error ? syncError.message : String(syncError) });
              // Still mark as Pro since we found the subscription in Stripe
              isPro = true;
            }
          }
        }
      }
    }

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
        .maybeSingle();

      if (usageData) {
        usage = {
          resumes_used: usageData.resumes_used,
          interviews_used: usageData.interviews_used,
        };
      }
      logStep("Usage check", usage);
    }

    // Get free tier usage for non-pro users
    let freeUsage = { resumes_used: 0 };
    const monthStart = getCurrentMonthStart();
    const nextMonthStart = getNextMonthStart();

    if (!isPro) {
      const { data: freeUsageData } = await supabaseClient
        .from("free_usage_ledger")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_start", monthStart)
        .maybeSingle();

      if (freeUsageData) {
        freeUsage = {
          resumes_used: freeUsageData.resumes_used,
        };
      }
      logStep("Free usage check", { ...freeUsage, monthStart });
    }

    // Calculate free resumes remaining
    const freeResumesRemaining = FREE_LIMITS.resumes - freeUsage.resumes_used;

    // Determine plan tier
    let plan: 'PRO' | 'FREE_TRIAL' | 'FREE_BYOK' = 'FREE_TRIAL';
    if (isPro) {
      plan = 'PRO';
    } else if (hasApiKeys) {
      plan = 'FREE_BYOK';
    }

    const response = {
      plan,
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
      freeUsage: !isPro ? {
        resumes: { used: freeUsage.resumes_used, limit: FREE_LIMITS.resumes },
        resetsOn: nextMonthStart,
      } : null,
      canGenerateResume: isPro 
        ? usage.resumes_used < PRO_LIMITS.resumes 
        : (freeResumesRemaining > 0 || hasApiKeys),
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
