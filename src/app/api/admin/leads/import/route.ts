// src/app/api/admin/leads/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { chunk } from "@/lib/chunk";

/**
 * POST /api/admin/leads/import
 * Body: { rows: Array<{ email: string; first_name?: string; phone?: string; status?: string; source?: string }> }
 * Upserts into leads (dedupe on email), in chunks.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : null;
    if (!rows) {
      return NextResponse.json({ error: "rows[] required" }, { status: 400 });
    }

    const cleaned = rows
      .map((r: Record<string, unknown>) => ({
        email: String(r.email || "").toLowerCase().trim(),
        first_name: r.first_name ? String(r.first_name) : null,
        phone: r.phone ? String(r.phone) : null,
        status: r.status ? String(r.status) : "Lead",
        source: r.source ? String(r.source) : "csv-import",
        updated_at: new Date().toISOString(),
      }))
      .filter((r: { email: string }) => r.email.includes("@"));

    let upserted = 0;
    for (const group of chunk(cleaned, 500)) {
      const { error } = await supabase
        .from("leads")
        .upsert(group, { onConflict: "email" });
      if (error) {
        return NextResponse.json(
          { error: `Upsert failed after ${upserted}: ${error.message}` },
          { status: 500 }
        );
      }
      upserted += group.length;
    }

    return NextResponse.json({ success: true, upserted, skipped: rows.length - cleaned.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
