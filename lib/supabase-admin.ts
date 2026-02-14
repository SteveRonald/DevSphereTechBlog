import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireAdmin(request: NextRequest) {
  // 1. Try to get the access token from Authorization header
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  // 2. If no Authorization header, try to read the Supabase auth cookie
  if (!token) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "";
    if (projectRef) {
      const cookieName = `sb-${projectRef}-auth-token`;
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.split(";").find((c) => c.trim().startsWith(`${cookieName}=`));
      if (match) {
        const raw = match.split("=").slice(1).join("=").trim();
        try {
          token = decodeURIComponent(raw);
        } catch {
          token = raw;
        }
      }
    }
  }

  if (!token) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  // 3. Verify the token and get the user using the admin client (service role)
  const admin = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  // 4. Check if the user is an admin
  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true as const, user };
}
