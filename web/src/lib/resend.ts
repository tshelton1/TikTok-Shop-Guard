import { Resend } from "resend";

import { APP_NAME } from "@/lib/constants";

let resendClient: Resend | null = null;

/** Default verified sender for TikTok Shop Guard transactional mail. */
export const DEFAULT_RESEND_FROM_EMAIL = "support@mail.tiktokshopguard.com";

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * From address for outbound mail.
 * Requires the `mail.tiktokshopguard.com` domain to be verified in Resend.
 */
export function getResendFromAddress() {
  const email =
    process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_RESEND_FROM_EMAIL;

  if (email.includes("<")) {
    return email;
  }

  return `${APP_NAME} <${email}>`;
}

export async function sendTransactionalEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  const resend = getResend();

  return resend.emails.send({
    from: options.from ?? getResendFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo ?? DEFAULT_RESEND_FROM_EMAIL,
  });
}
