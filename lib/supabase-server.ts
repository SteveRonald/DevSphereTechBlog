import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export function createServerClient(request?: NextRequest) {
  const cookieStore = cookies();
  
  // Get access token from Authorization header if present
  let accessTokenFromHeader: string | undefined;
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessTokenFromHeader = authHeader.substring(7);
    }
  }
  
  // Helper to get cookie value from either source
  const getCookie = (name: string): string | undefined => {
    // First try from request headers (for API routes)
    if (request) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const trimmed = cookie.trim();
          const equalIndex = trimmed.indexOf("=");
          if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim();
            // Handle URL-encoded values
            try {
              acc[key] = decodeURIComponent(value);
            } catch {
              acc[key] = value;
            }
          }
          return acc;
        }, {} as Record<string, string>);
        if (cookies[name]) {
          return cookies[name];
        }
      }
    }
    // Fallback to cookieStore (for server components)
    return cookieStore.get(name)?.value;
  };

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "x-client-info": "nextjs-server",
          ...(accessTokenFromHeader ? { 
            "Authorization": `Bearer ${accessTokenFromHeader}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          } : {}),
        },
      },
      cookies: {
        get(name: string) {
          return getCookie(name);
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
          } catch (error) {
            // Handle cookie setting errors (common in middleware)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", {
              ...options,
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 0,
            });
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    } as any
  );
  
  // If we have an access token from header, set it as the session
  // This ensures RLS policies can read auth.uid() correctly
  if (accessTokenFromHeader) {
    // Set the session so RLS policies work
    // We use a promise that resolves immediately but sets the session
    client.auth.setSession({
      access_token: accessTokenFromHeader,
      refresh_token: "",
    } as any).catch(() => {
      // Ignore errors - the token might be invalid, but we'll handle that in the API routes
    });
  }
  
  return client;
}

