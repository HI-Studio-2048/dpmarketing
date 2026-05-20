import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { sendBroadcast } from "@/lib/email-sender";

/**
 * POST /api/admin/broadcasts
 *
 * Create and send a broadcast email to a segment.
 *
 * Body:
 * - subject: email subject
 * - html_body: email body (supports {{first_name}}, {{email}}, {{unsubscribe_url}})
 * - segment_json: filter criteria (e.g., { status: "Lead" })
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, html_body, segment_json } = body;

    if (!subject || !html_body) {
      return NextResponse.json(
        { error: "subject and html_body are required" },
        { status: 400 }
      );
    }

    // Find recipients based on segment
    let query = supabase.from("leads").select("email").eq("unsubscribed", false);

    // Apply filters from segment_json
    if (segment_json?.status) {
      query = query.eq("status", segment_json.status);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error("Error fetching recipients:", leadsError);
      return NextResponse.json(
        { error: "Failed to fetch recipients" },
        { status: 500 }
      );
    }

    const recipientEmails = (leads || []).map((l: { email: string }) => l.email);

    // Create broadcast record
    const { data: broadcastData, error: broadcastError } = await supabase
      .from("broadcasts")
      .insert({
        subject,
        html_body,
        segment_json,
        status: "sending",
        recipient_count: recipientEmails.length,
      })
      .select()
      .single();

    if (broadcastError) {
      console.error("Error creating broadcast:", broadcastError);
      return NextResponse.json(
        { error: "Failed to create broadcast" },
        { status: 500 }
      );
    }

    const broadcastId = broadcastData.id;

    // Send the broadcast
    const { sent, failed } = await sendBroadcast(
      broadcastId,
      recipientEmails,
      subject,
      html_body
    );

    // Update broadcast status
    await supabase
      .from("broadcasts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", broadcastId);

    return NextResponse.json({
      success: true,
      broadcast_id: broadcastId,
      sent,
      failed,
      total: recipientEmails.length,
    });
  } catch (error) {
    console.error("Broadcast API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
