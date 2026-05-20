// src/app/api/admin/broadcasts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: broadcast } = await supabase
    .from("broadcasts")
    .select("id, subject, status, recipient_count, sent_at")
    .eq("id", id)
    .single();

  if (!broadcast) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const counts: Record<string, number> = { pending: 0, sending: 0, sent: 0, failed: 0 };
  for (const status of Object.keys(counts)) {
    const { count } = await supabase
      .from("broadcast_recipients")
      .select("id", { count: "exact", head: true })
      .eq("broadcast_id", id)
      .eq("status", status);
    counts[status] = count || 0;
  }

  const total = counts.pending + counts.sending + counts.sent + counts.failed;
  return NextResponse.json({ broadcast, counts, total });
}
