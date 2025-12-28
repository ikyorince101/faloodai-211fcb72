import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logStep("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Received event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Webhook error", { error: message });
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logStep("Processing checkout.session.completed", { sessionId: session.id });

  const customerId = session.customer as string;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    logStep("No customer email found in session");
    return;
  }

  // Find user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("Error fetching users", { error: userError.message });
    return;
  }

  const user = userData.users.find(u => u.email === customerEmail);
  if (!user) {
    logStep("User not found for email", { email: customerEmail });
    return;
  }

  // Upsert billing customer
  const { error: customerError } = await supabase
    .from("billing_customers")
    .upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
    }, { onConflict: "user_id" });

  if (customerError) {
    logStep("Error upserting billing customer", { error: customerError.message });
  } else {
    logStep("Billing customer upserted", { userId: user.id, customerId });
  }

  // Handle subscription if present
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await handleSubscriptionChange(subscription);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  logStep("Processing subscription change", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  const customerId = subscription.customer as string;

  // Get user_id from billing_customers
  const { data: customerData, error: customerError } = await supabase
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (customerError || !customerData) {
    // Try to find customer by Stripe lookup
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (customer.email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email === customer.email);
      
      if (user) {
        await supabase.from("billing_customers").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        }, { onConflict: "user_id" });

        await upsertSubscription(user.id, subscription);
        return;
      }
    }
    logStep("Could not find user for customer", { customerId });
    return;
  }

  await upsertSubscription(customerData.user_id, subscription);
}

async function upsertSubscription(userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  
  const { error } = await supabase
    .from("billing_subscriptions")
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, { onConflict: "stripe_subscription_id" });

  if (error) {
    logStep("Error upserting subscription", { error: error.message });
  } else {
    logStep("Subscription upserted", { userId, subscriptionId: subscription.id });
  }

  // Reset usage for new billing period
  await ensureUsageLedger(userId, subscription);
}

async function ensureUsageLedger(userId: string, subscription: Stripe.Subscription) {
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  const { error } = await supabase
    .from("usage_ledger")
    .upsert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      resumes_used: 0,
      interviews_used: 0,
    }, { 
      onConflict: "user_id,period_start,period_end",
      ignoreDuplicates: true 
    });

  if (error) {
    logStep("Error creating usage ledger", { error: error.message });
  } else {
    logStep("Usage ledger ensured", { userId, periodStart, periodEnd });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logStep("Processing subscription deletion", { subscriptionId: subscription.id });

  const { error } = await supabase
    .from("billing_subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logStep("Error updating subscription status", { error: error.message });
  } else {
    logStep("Subscription marked as canceled", { subscriptionId: subscription.id });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  logStep("Processing invoice.paid", { invoiceId: invoice.id });
  
  // Subscription renewal - ensure usage ledger is reset
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customerId = invoice.customer as string;

    const { data: customerData } = await supabase
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (customerData) {
      await ensureUsageLedger(customerData.user_id, subscription);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    const { error } = await supabase
      .from("billing_subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription as string);

    if (error) {
      logStep("Error updating subscription status", { error: error.message });
    }
  }
}
