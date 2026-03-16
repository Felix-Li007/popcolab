import 'server-only';
import { Resend } from 'resend';
import type { ReactElement } from 'react';

export type ResendEmailPayload = {
  to: string;
  from: string;
  subject: string;
  react: ReactElement;
};

export async function sendResendEmail(
  payload: ResendEmailPayload
): Promise<{ id: string | null }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    react: payload.react,
    // html: "<p>It works!</p>",
  });

  // from: "Acme <onboarding@resend.dev>",
  //   to: ["delivered@resend.dev"],
  //     subject: "Hello from Next.js",
  //       html: "<p>It works!</p>",

  if (error) {
    throw new Error(
      `Failed to send email with Resend: ${error.name ?? 'ResendError'} ${error.message ?? 'Unknown error.'}`
    );
  }

  if (typeof data?.id !== 'string' || data.id.length === 0) {
    throw new Error('Resend accepted the request but returned no message id.');
  }

  return {
    id: data.id,
  };
}
