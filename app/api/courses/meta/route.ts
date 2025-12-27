import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request);

    const { data, error } = await supabase
      .from("courses")
      .select("category")
      .eq("is_published", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts = new Map<string, number>();
    for (const row of data || []) {
      const category = typeof row?.category === "string" ? row.category.trim() : "";
      if (!category) continue;
      counts.set(category, (counts.get(category) || 0) + 1);
    }

    const categories = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
