"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createSupabaseClient> | null = null;

// Helper to sync session to cookies
function syncSessionToCookies(session: any) {
  if (typeof window === "undefined" || !session) return;
  
  try {
    // Get the Supabase project ref from the URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "";
    
    if (!projectRef) return;

    // Supabase cookie names
    const accessTokenCookie = `sb-${projectRef}-auth-token`;
    const refreshTokenCookie = `sb-${projectRef}-auth-token-code-verifier`;
    
    // Set cookies with session data
    if (session.access_token) {
      document.cookie = `${accessTokenCookie}=${session.access_token}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    }
    if (session.refresh_token) {
      document.cookie = `${refreshTokenCookie}=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    }
  } catch (error) {
    console.error("Error syncing session to cookies:", error);
  }
}

export function createClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase client can only be used on the client side");
  }

  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    client = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    
    // Listen for auth state changes and sync to cookies
    client.auth.onAuthStateChange((_event, session) => {
      syncSessionToCookies(session);
    });
    
    // Sync initial session
    client.auth.getSession().then(({ data: { session } }) => {
      syncSessionToCookies(session);
    });
  }
  return client;
}

