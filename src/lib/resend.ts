import { Resend } from "resend";
import { chunk } from "./chunk";

const resendApiKey = process.env.RESEND_API_KEY || "re_placeholder";

export const resend = new Resend(resendApiKey);

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Daniel Philip <daniel@danielphilip.com>";

export const RESEND_WEBHOOK_SECRET =
  process.env.RESEND_WEBHOOK_SECRET || "";

export interface Attachment {
  filename: string;
  content: string; // base64
  type: string;
}

export interface BatchMessage {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
  attachments?: Attachment[];
}

export interface BatchResult {
  to: string;
  id: string | null;
  error: string | null;
}

/**
 * Send any number of messages using Resend's batch API (100 per call).
 * Returns one result per input message, in the same order.
 */
export async function sendBatch(messages: BatchMessage[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for (const group of chunk(messages, 100)) {
    const payload = group.map((m) => ({
      from: EMAIL_FROM,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      headers: m.headers,
      attachments: m.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
        content_type: a.type,
      })),
    }));

    try {
      const { data, error } = await resend.batch.send(payload);
      if (error) {
        for (const m of group) results.push({ to: m.to, id: null, error: error.message });
        continue;
      }
      const sent = (data?.data ?? []) as Array<{ id: string }>;
      group.forEach((m, i) => {
        const id = sent[i]?.id ?? null;
        results.push({ to: m.to, id, error: id ? null : "no id returned" });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "batch send failed";
      for (const m of group) results.push({ to: m.to, id: null, error: msg });
    }
  }

  return results;
}
