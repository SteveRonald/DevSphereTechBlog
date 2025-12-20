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
    try {
      return cookieStore.get(name)?.value;
    } catch (error) {
      // cookieStore might not be available in all contexts
      return undefined;
    }
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
  
  // If we have an access token from header, we need to set it properly
  // The Supabase client will use it from the Authorization header in global headers
  // But we also need to ensure getUser() can use it
  if (accessTokenFromHeader) {
    // Set the session synchronously by directly setting the internal state
    // This is a workaround since setSession is async and might not complete in time
    try {
      // The token is already in the global headers, so getUser() should work
      // But we'll also try to set it as a session for getSession() to work
      client.auth.setSession({
        access_token: accessTokenFromHeader,
        refresh_token: "",
      } as any).catch(() => {
        // Ignore errors - we'll use getUser() which reads from headers
      });
    } catch (error) {
      // Ignore - token is in headers, getUser() will work
    }
  }
  
  return client;
}

