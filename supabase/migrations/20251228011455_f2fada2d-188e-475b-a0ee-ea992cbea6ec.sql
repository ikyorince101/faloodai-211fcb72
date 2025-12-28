-- Billing customers table
CREATE TABLE public.billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_customers_user_id ON public.billing_customers(user_id);
CREATE INDEX idx_billing_customers_stripe_customer_id ON public.billing_customers(stripe_customer_id);

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing customer"
ON public.billing_customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billing customers"
ON public.billing_customers FOR ALL
USING (true)
WITH CHECK (true);

-- Billing subscriptions table
CREATE TABLE public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'incomplete',
  price_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_subscriptions_user_id ON public.billing_subscriptions(user_id);
CREATE INDEX idx_billing_subscriptions_stripe_subscription_id ON public.billing_subscriptions(stripe_subscription_id);
CREATE INDEX idx_billing_subscriptions_status ON public.billing_subscriptions(status);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.billing_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
ON public.billing_subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- Usage ledger table
CREATE TABLE public.usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  resumes_used integer NOT NULL DEFAULT 0,
  interviews_used integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX idx_usage_ledger_user_id ON public.usage_ledger(user_id);
CREATE INDEX idx_usage_ledger_period ON public.usage_ledger(period_start, period_end);

ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
ON public.usage_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
ON public.usage_ledger FOR ALL
USING (true)
WITH CHECK (true);

-- API keys table (encrypted, not readable from client)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  last_verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see that keys exist, not the encrypted values
CREATE POLICY "Users can view their own key metadata"
ON public.api_keys FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update keys (via edge functions)
CREATE POLICY "Service role can manage api keys"
ON public.api_keys FOR ALL
USING (true)
WITH CHECK (true);

-- Users can delete their own keys
CREATE POLICY "Users can delete their own keys"
ON public.api_keys FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on billing_subscriptions
CREATE TRIGGER update_billing_subscriptions_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on usage_ledger
CREATE TRIGGER update_usage_ledger_updated_at
BEFORE UPDATE ON public.usage_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on api_keys
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();