/**
 * Port of sendContactConfirmation — the only public endpoint.
 *
 * Everything else is behind Cloudflare Access. This one is reachable by anyone
 * who can load the contact form, so it keeps the input validation the Base44
 * version had (which existed to stop the endpoint being used as an open relay)
 * and adds a Turnstile check, which Base44's RLS was implicitly standing in for.
 */

import { sendEmail, escapeHtml } from '../lib/email';
import { emailShell, safeUrl } from '../lib/template';
import * as db from '../lib/db';
import { json, badRequest } from '../lib/http';

const PROJECT_TYPES = ['website', 'logo', 'marketing', 'other'] as const;

const PROJECT_TYPE_LABELS: Record<string, string> = {
  website: 'Website Design',
  logo: 'Logo & Brand Identity',
  marketing: 'Marketing Materials',
  other: 'Other',
};

async function verifyTurnstile(env: Env, token: unknown, ip: string | null): Promise<boolean> {
  // Allows local development and staged rollout: with no secret configured the
  // check is skipped rather than failing closed and breaking the form.
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token || typeof token !== 'string') return false;

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const out = (await res.json()) as { success?: boolean };
  return out.success === true;
}

export async function sendContactConfirmation(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json()) as Record<string, unknown>;
  const { name, email, project_type, budget, message, file_name, file_url, turnstileToken } = payload;

  if (!email || !name || !message) return badRequest('Missing required fields');

  const emailStr = String(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr) || emailStr.length > 254) {
    return badRequest('Invalid email');
  }
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
    return badRequest('Invalid name');
  }
  if (typeof message !== 'string' || message.trim().length < 5 || message.length > 5000) {
    return badRequest('Invalid message');
  }
  if (project_type && !PROJECT_TYPES.includes(project_type as (typeof PROJECT_TYPES)[number])) {
    return badRequest('Invalid project type');
  }

  if (!(await verifyTurnstile(env, turnstileToken, req.headers.get('CF-Connecting-IP')))) {
    return badRequest('Verification failed');
  }

  const typeLabel = PROJECT_TYPE_LABELS[String(project_type)] || String(project_type ?? '');

  const sName = escapeHtml(name);
  const sEmail = escapeHtml(emailStr);
  const sTypeLabel = escapeHtml(typeLabel);
  const sMessage = escapeHtml(message);
  const sFileName = escapeHtml(file_name);
  const sFileUrl = safeUrl(file_url);

  const fileSection =
    file_name && sFileUrl
      ? `<p><strong>Attached file:</strong> <a href="${sFileUrl}" style="color:#FF4F00;">${sFileName}</a></p>`
      : '';
  const budgetRow = budget ? `<tr><td>Budget</td><td>${escapeHtml(budget)}</td></tr>` : '';

  // 1. Confirmation to the person who submitted the form.
  await sendEmail(env, {
    to: emailStr,
    subject: `Got your request, ${name}! I'll be in touch soon.`,
    html: emailShell({
      title: 'Request Received - DDalton Designs',
      body: `<h2>Got it, ${sName}!</h2>
        <p>Thanks for reaching out — your project request has been received. I'll review the details and get back to you within <strong>48 hours</strong> with a personalized response.</p>
        <p>Here's a summary of what you submitted:</p>
        <table class="details-table">
          <tr><td>Project Type</td><td>${sTypeLabel}</td></tr>
          ${budgetRow}
        </table>
        <p><strong>Your message:</strong></p>
        <div class="message-box">${sMessage}</div>
        ${fileSection}
        <p>Here's what happens next:</p>
        <ul class="steps">
          <li><span class="step-num">1</span> I review your request and project details</li>
          <li><span class="step-num">2</span> I send you a personalized estimate within 48–72 hrs</li>
          <li><span class="step-num">3</span> We hop on a quick call to align on scope &amp; timeline</li>
          <li><span class="step-num">4</span> We get to work!</li>
        </ul>
        <p>Talk soon!</p>
        <p>— Derek Dalton<br>DDalton Designs<br><a href="mailto:derek@ddaltondesigns.com" style="color:#FF4F00;">derek@ddaltondesigns.com</a></p>`,
    }),
  });

  // 2. Internal notification.
  const attachmentLine =
    file_name && sFileUrl ? `<p><strong>Attachment:</strong> <a href="${sFileUrl}">${sFileName}</a></p>` : '';

  await sendEmail(env, {
    to: 'derek@ddaltondesigns.com',
    replyTo: emailStr,
    subject: `📬 New Contact Form: ${name} — ${typeLabel}`,
    html:
      `<p><strong>${sName}</strong> (${sEmail}) submitted a contact form.</p>` +
      `<p><strong>Type:</strong> ${sTypeLabel}</p>` +
      (budget ? `<p><strong>Budget:</strong> ${escapeHtml(budget)}</p>` : '') +
      `<p><strong>Message:</strong></p><blockquote>${sMessage}</blockquote>${attachmentLine}`,
  });

  // Base44 stored the submission as a ClientRequest via the form's own entity
  // create call. That path is gone with the SDK, so the record is written here —
  // otherwise submissions would email through but never reach the admin list.
  await db.create(env.DB, 'client_request', {
    name: String(name).trim(),
    email: emailStr.toLowerCase(),
    phone: payload.phone,
    project_type: project_type ?? null,
    message: String(message).trim(),
    budget: budget ?? null,
    status: 'new',
  });

  return json({ success: true });
}
