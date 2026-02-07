import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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
  const supabase = await createServerClient(request);

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  if (!profile?.is_admin) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true as const, user };
}
