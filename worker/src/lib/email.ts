/**
 * Resend email.
 *
 * Unchanged from Base44 apart from where the API key comes from: Deno's
 * `Deno.env.get('RESEND_API_KEY')` becomes the Worker's `env.RESEND_API_KEY`.
 * The HTTP call itself is Web-standard fetch and ports as-is.
 */

export const FROM = 'DDalton Designs <derek@ddaltondesigns.com>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail(env: Env, opts: EmailOptions): Promise<void> {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).map((a) => a.toLowerCase());

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: opts.subject,
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.html ? { html: opts.html } : {}),
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `Resend failed with HTTP ${res.status}`);
  }
}

/**
 * Escape user-supplied text before interpolating it into an HTML email body.
 * The Base44 functions did this and the handoff lists it as a security rule to
 * preserve — dropping it would reintroduce HTML injection via form fields.
 */
export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
