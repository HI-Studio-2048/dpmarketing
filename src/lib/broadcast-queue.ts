// src/lib/broadcast-queue.ts
import { supabase } from "./supabase-server";
import { sendBatch, type BatchMessage, type Attachment } from "./resend";
import { chunk } from "./chunk";
import { detectCountry, COUNTRY_PREFIXES } from "./phone-country";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://team.danielphilip.com";
const PER_RUN_BATCH = 1000;
const STUCK_MINUTES = 15;

interface DrainResult {
  sent: number;
  failed: number;
  remaining: number;
  capReached: boolean;
  paused: boolean;
}

interface RecipientRow {
  id: string;
  broadcast_id: string;
  lead_id: string | null;
  email: string;
  first_name: string | null;
  attempts: number;
}

export interface SegmentFilter {
  status?: string;
  source?: string;
  platform?: string;
  tags?: string;
  date_from?: string;
  date_to?: string;
  country?: string;
  exclude_bounced?: boolean;
}

/** Build the base leads query with all segment filters applied. */
function buildSegmentQuery(segment: SegmentFilter | undefined) {
  let query = supabase
    .from("leads")
    .select("id, email, first_name, phone")
    .eq("unsubscribed", false);

  if (segment?.status) query = query.eq("status", segment.status);
  if (segment?.source) query = query.ilike("source", `%${segment.source}%`);
  if (segment?.platform) query = query.eq("platform", segment.platform);
  if (segment?.tags) {
    const tagList = segment.tags.split(",").map((t) => t.trim()).filter(Boolean);
    for (const tag of tagList) {
      query = query.contains("tags", [tag]);
    }
  }
  if (segment?.date_from) query = query.gte("created_at", `${segment.date_from}T00:00:00Z`);
  if (segment?.date_to) query = query.lte("created_at", `${segment.date_to}T23:59:59Z`);

  // Country: apply phone prefix filter via ilike for efficiency
  if (segment?.country) {
    const prefixes = COUNTRY_PREFIXES[segment.country];
    if (prefixes && prefixes.length > 0) {
      // Use OR filter on phone prefixes
      const phoneFilters = prefixes.map((p) => `phone.ilike.p:${p}%,phone.ilike.${p}%`).join(",");
      query = query.or(phoneFilters);
    }
  }

  if (segment?.exclude_bounced) {
    // Exclude leads that have bounced emails — done client-side after fetch
  }

  return query;
}

/** Count leads matching a segment without inserting recipients. */
export async function countSegment(segment: SegmentFilter | undefined): Promise<number> {
  const pageSize = 1000;
  let total = 0;
  for (let from = 0; ; from += pageSize) {
    const query = buildSegmentQuery(segment);
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(`count: failed to read leads: ${error.message}`);
    if (!data?.length) break;
    total += data.length;
    if (data.length < pageSize) break;
  }
  return total;
}

/** Insert pending recipient rows for a broadcast, excluding unsubscribed leads. */
export async function enqueueBroadcast(
  broadcastId: string,
  segment: SegmentFilter | undefined
): Promise<number> {
  const pageSize = 1000;
  const leads: Array<{ id: string; email: string; first_name: string | null; phone: string | null }> = [];
  for (let from = 0; ; from += pageSize) {
    const query = buildSegmentQuery(segment);
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(`enqueue: failed to read leads: ${error.message}`);
    if (!data?.length) break;
    leads.push(...data);
    if (data.length < pageSize) break;
  }

  const rows = leads.map((l: { id: string; email: string; first_name: string | null }) => ({
    broadcast_id: broadcastId,
    lead_id: l.id,
    email: l.email,
    first_name: l.first_name,
    status: "pending",
  }));

  let inserted = 0;
  for (const group of chunk(rows, 500)) {
    const { data: insData, error: insErr } = await supabase
      .from("broadcast_recipients")
      .upsert(group, { onConflict: "broadcast_id,email", ignoreDuplicates: true })
      .select("id");
    if (insErr) throw new Error(`enqueue: insert failed: ${insErr.message}`);
    inserted += insData?.length ?? 0;
  }
  return inserted;
}

async function getSettings() {
  const { data, error } = await supabase
    .from("email_settings")
    .select("daily_max, warmup_curve, warmup_started_on, paused")
    .eq("id", true)
    .single();
  if (error || !data) {
    throw new Error(`drain: failed to read email_settings: ${error?.message ?? "no row"}`);
  }
  return data;
}


async function countPending(): Promise<number> {
  const { count } = await supabase
    .from("broadcast_recipients")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count || 0;
}

/** Flip any of the given broadcasts to 'sent' once they have no pending/sending rows left. */
async function markCompletedBroadcasts(broadcastIds: string[]): Promise<void> {
  for (const bid of broadcastIds) {
    const { count } = await supabase
      .from("broadcast_recipients")
      .select("id", { count: "exact", head: true })
      .eq("broadcast_id", bid)
      .in("status", ["pending", "sending"]);
    if ((count || 0) === 0) {
      await supabase
        .from("broadcasts")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", bid);
    }
  }
}

/** Process one bounded batch. Returns counts + whether more work/cap remains. */
export async function drainOnce(): Promise<DrainResult> {
  const settings = await getSettings();
  if (settings.paused) {
    return { sent: 0, failed: 0, remaining: await countPending(), capReached: false, paused: true };
  }

  // Reclaim crashed 'sending' rows first.
  await supabase.rpc("reclaim_stuck_recipients", { p_older_than_minutes: STUCK_MINUTES });

  const claimLimit = PER_RUN_BATCH;
  const { data: claimed, error: claimErr } = await supabase.rpc("claim_broadcast_batch", {
    p_limit: claimLimit,
  });
  if (claimErr) throw new Error(`drain: claim failed: ${claimErr.message}`);
  const batch = (claimed || []) as RecipientRow[];
  if (batch.length === 0) {
    return { sent: 0, failed: 0, remaining: 0, capReached: false, paused: false };
  }

  // Set warmup_started_on the first time we ever send.
  if (!settings.warmup_started_on) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("email_settings").update({ warmup_started_on: today }).eq("id", true);
  }

  // Fetch the broadcast subject/body/attachments for the claimed rows.
  const broadcastIds = [...new Set(batch.map((r) => r.broadcast_id))];
  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("id, subject, html_body, attachments_json")
    .in("id", broadcastIds);
  const byId = new Map(
    (broadcasts || []).map((b: { id: string; subject: string; html_body: string; attachments_json?: unknown }) => [b.id, b])
  );

  let sent = 0;
  let failed = 0;

  // Build personalized messages.
  const messages: BatchMessage[] = batch.map((r) => {
    const b = byId.get(r.broadcast_id);
    const unsubscribeUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(r.email)}`;
    const html = (b?.html_body || "")
      .replace(/{{first_name}}/g, r.first_name || "")
      .replace(/{{email}}/g, r.email)
      .replace(/{{unsubscribe_url}}/g, unsubscribeUrl);
    const attachments = (b as { attachments_json?: Attachment[] })?.attachments_json || undefined;
    return {
      to: r.email,
      subject: b?.subject || "",
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      attachments,
    };
  });

  const results = await sendBatch(messages);

  // results are in the same order as `batch`.
  for (let i = 0; i < batch.length; i++) {
    const r = batch[i];
    const res = results[i];
    const b = byId.get(r.broadcast_id);
    if (res.id) {
      await supabase.from("email_logs").insert({
        lead_id: r.lead_id,
        email: r.email,
        campaign_type: "broadcast",
        broadcast_id: r.broadcast_id,
        subject: b?.subject || "",
        resend_id: res.id,
        status: "sent",
      });
      await supabase
        .from("broadcast_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    } else {
      const giveUp = r.attempts >= 3;
      await supabase
        .from("broadcast_recipients")
        .update({ status: giveUp ? "failed" : "pending", error: res.error })
        .eq("id", r.id);
      failed++;
    }
  }

  // Mark broadcasts complete when no pending/sending rows remain.
  await markCompletedBroadcasts(broadcastIds);

  return { sent, failed, remaining: await countPending(), capReached: false, paused: false };
}
