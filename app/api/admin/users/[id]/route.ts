import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = await request.json();
    const { is_admin } = body as { is_admin?: boolean };

    if (typeof is_admin !== "boolean") {
      return NextResponse.json({ error: "is_admin must be a boolean" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_profiles")
      .update({ is_admin, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("id,email,first_name,last_name,display_name,avatar_url,is_admin,created_at,last_signin_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
