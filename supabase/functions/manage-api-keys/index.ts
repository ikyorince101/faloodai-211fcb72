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

// Input validation constants
const MAX_API_KEY_LENGTH = 500;
const VALID_PROVIDERS = ["openai", "deepgram"] as const;
const VALID_ACTIONS = ["list", "save", "validate", "delete", "get-for-use"] as const;

type ValidProvider = typeof VALID_PROVIDERS[number];
type ValidAction = typeof VALID_ACTIONS[number];

function validateProvider(provider: unknown): provider is ValidProvider {
  return typeof provider === "string" && VALID_PROVIDERS.includes(provider as ValidProvider);
}

function validateAction(action: unknown): action is ValidAction {
  return typeof action === "string" && VALID_ACTIONS.includes(action as ValidAction);
}

function validateApiKey(apiKey: unknown): apiKey is string {
  return typeof apiKey === "string" && 
         apiKey.length > 0 && 
         apiKey.length <= MAX_API_KEY_LENGTH &&
         /^[a-zA-Z0-9_\-]+$/.test(apiKey);
}

// Proper AES-GCM encryption using Web Crypto API
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = Deno.env.get("API_KEY_ENCRYPTION_SECRET");
  
  // If no encryption secret is set, use a derived key from service role key
  // In production, set API_KEY_ENCRYPTION_SECRET as a proper 256-bit key
  const secret = keyMaterial || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback-key-change-me";
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  // Derive a proper key using PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("lovable-api-keys-salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptKey(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  // Combine IV and ciphertext, then base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptKey(ciphertext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    logStep("Decryption failed, attempting legacy decode", { error: String(error) });
    // Fallback for legacy encoded keys (base64 + reversal)
    try {
      const reversed = ciphertext.split('').reverse().join('');
      return atob(reversed);
    } catch {
      throw new Error("Failed to decrypt API key");
    }
  }
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

    // Validate action
    if (!validateAction(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    switch (action) {
      case "list": {
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
        // Validate inputs
        if (!validateProvider(provider)) {
          return new Response(
            JSON.stringify({ error: "Invalid or unsupported provider" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        if (!validateApiKey(apiKey)) {
          return new Response(
            JSON.stringify({ error: "Invalid API key format" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Validate the key with external service
        let isValid = false;
        if (provider === "openai") {
          isValid = await validateOpenAIKey(apiKey);
        } else if (provider === "deepgram") {
          isValid = await validateDeepgramKey(apiKey);
        }

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid API key" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Encrypt with AES-GCM and store
        const encryptedKey = await encryptKey(apiKey);
        
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
        if (!validateProvider(provider)) {
          return new Response(
            JSON.stringify({ error: "Invalid provider" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

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

        const decryptedKey = await decryptKey(keyData.encrypted_key);
        
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
        if (!validateProvider(provider)) {
          return new Response(
            JSON.stringify({ error: "Invalid provider" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
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
        if (!validateProvider(provider)) {
          return new Response(
            JSON.stringify({ error: "Invalid provider" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
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

        const decryptedKey = await decryptKey(keyData.encrypted_key);
        logStep("Key retrieved for use", { provider });

        return new Response(
          JSON.stringify({ apiKey: decryptedKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
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
