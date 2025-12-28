import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-API-KEYS] ${step}${detailsStr}`);
};

// Simple encryption using base64 + reversal (in production, use proper encryption)
function encryptKey(key: string): string {
  const encoded = btoa(key);
  return encoded.split('').reverse().join('');
}

function decryptKey(encrypted: string): string {
  const reversed = encrypted.split('').reverse().join('');
  return atob(reversed);
}

async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateDeepgramKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      headers: { Authorization: `Token ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
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

    const body = await req.json();
    const { action, provider, apiKey } = body;

    switch (action) {
      case "list": {
        // Return list of connected providers (no actual keys)
        const { data: keys, error } = await supabaseClient
          .from("api_keys")
          .select("provider, last_verified_at, created_at")
          .eq("user_id", user.id);

        if (error) throw error;
        logStep("Listed keys", { count: keys?.length });

        return new Response(
          JSON.stringify({ keys }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "save": {
        if (!provider || !apiKey) {
          throw new Error("Provider and apiKey are required");
        }

        // Validate the key
        let isValid = false;
        if (provider === "openai") {
          isValid = await validateOpenAIKey(apiKey);
        } else if (provider === "deepgram") {
          isValid = await validateDeepgramKey(apiKey);
        } else {
          throw new Error("Unsupported provider");
        }

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid API key" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Encrypt and store
        const encryptedKey = encryptKey(apiKey);
        
        // First check if key exists, then update or insert
        const { data: existing } = await supabaseClient
          .from("api_keys")
          .select("id")
          .eq("user_id", user.id)
          .eq("provider", provider)
          .maybeSingle();

        let error;
        if (existing) {
          const result = await supabaseClient
            .from("api_keys")
            .update({
              encrypted_key: encryptedKey,
              last_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          error = result.error;
        } else {
          const result = await supabaseClient
            .from("api_keys")
            .insert({
              user_id: user.id,
              provider,
              encrypted_key: encryptedKey,
              last_verified_at: new Date().toISOString(),
            });
          error = result.error;
        }

        if (error) {
          logStep("Database error", { error: error.message, code: error.code });
          throw error;
        }
        logStep("Key saved", { provider });

        return new Response(
          JSON.stringify({ success: true, provider, verified: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "validate": {
        if (!provider) {
          throw new Error("Provider is required");
        }

        // Get stored key and validate
        const { data: keyData, error } = await supabaseClient
          .from("api_keys")
          .select("encrypted_key")
          .eq("user_id", user.id)
          .eq("provider", provider)
          .single();

        if (error || !keyData) {
          return new Response(
            JSON.stringify({ error: "No key found for provider" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }

        const decryptedKey = decryptKey(keyData.encrypted_key);
        
        let isValid = false;
        if (provider === "openai") {
          isValid = await validateOpenAIKey(decryptedKey);
        } else if (provider === "deepgram") {
          isValid = await validateDeepgramKey(decryptedKey);
        }

        if (isValid) {
          await supabaseClient
            .from("api_keys")
            .update({ last_verified_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("provider", provider);
        }

        logStep("Key validated", { provider, isValid });

        return new Response(
          JSON.stringify({ valid: isValid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "delete": {
        if (!provider) {
          throw new Error("Provider is required");
        }

        const { error } = await supabaseClient
          .from("api_keys")
          .delete()
          .eq("user_id", user.id)
          .eq("provider", provider);

        if (error) throw error;
        logStep("Key deleted", { provider });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "get-for-use": {
        // Internal use only - get decrypted key for backend operations
        if (!provider) {
          throw new Error("Provider is required");
        }

        const { data: keyData, error } = await supabaseClient
          .from("api_keys")
          .select("encrypted_key")
          .eq("user_id", user.id)
          .eq("provider", provider)
          .single();

        if (error || !keyData) {
          return new Response(
            JSON.stringify({ error: "No key found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }

        const decryptedKey = decryptKey(keyData.encrypted_key);
        logStep("Key retrieved for use", { provider });

        return new Response(
          JSON.stringify({ apiKey: decryptedKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        throw new Error("Invalid action");
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
