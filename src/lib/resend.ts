import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

export const resend = new Resend(resendApiKey);

export const EMAIL_FROM = process.env.EMAIL_FROM || "Daniel Philip <daniel@danielphilip.com>";

export const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || "";

if (!RESEND_WEBHOOK_SECRET) {
  console.warn("Missing RESEND_WEBHOOK_SECRET - webhook verification will fail");
}
