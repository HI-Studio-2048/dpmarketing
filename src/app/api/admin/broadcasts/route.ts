import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { enqueueBroadcast } from "@/lib/broadcast-queue";

/**
 * POST /api/admin/broadcasts
 *
 * Create a broadcast and enqueue its recipients. Sending happens asynchronously
 * via /api/email/broadcast-drain (cron + self-chain), warmup-capped.
 *
 * Body:
 * - subject: string
 * - html_body: string (supports {{first_name}}, {{email}}, {{unsubscribe_url}})
 * - segment_json: { status?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, html_body, segment_json, attachments } = body;

    if (!subject || !html_body) {
      return NextResponse.json(
        { error: "subject and html_body are required" },
        { status: 400 }
      );
    }

    const { data: broadcast, error: bErr } = await supabase
      .from("broadcasts")
      .insert({
        subject,
        html_body,
        segment_json: segment_json || {},
        attachments_json: attachments || null,
        status: "sending",
      })
      .select()
      .single();

    if (bErr || !broadcast) {
      console.error("Error creating broadcast:", bErr);
      return NextResponse.json({ error: "Failed to create broadcast" }, { status: 500 });
    }

    const enqueued = await enqueueBroadcast(broadcast.id, segment_json);

    await supabase
      .from("broadcasts")
      .update({ recipient_count: enqueued })
      .eq("id", broadcast.id);

    // Kick off the first drain immediately (best-effort).
    const url = new URL("/api/email/broadcast-drain", request.url);
    void fetch(url.toString(), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
      enqueued,
      message: "Broadcast queued; sending will ramp per warmup schedule.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Broadcast API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
