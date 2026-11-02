/**
 * Review requests: invite a client to write a review, collect it, approve it.
 *
 * Two of these routes are public, because the client following the emailed
 * link is a stranger to Access. The token is what authorises them: it is
 * minted here, never accepted from the admin UI, and it stops working the
 * moment a review is submitted. Neither public route can read or write
 * anything except the one row its token names.
 */

import { sendEmail, escapeHtml } from '../lib/email';
import { emailShell } from '../lib/template';
import * as db from '../lib/db';
import { json, badRequest, notFound } from '../lib/http';

const SITE = 'https://ddaltondesigns.com';

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Looks a request up by token. Returns null for anything unusable. */
async function findByToken(env: Env, token: unknown) {
  if (typeof token !== 'string' || !/^[0-9a-f]{48}$/.test(token)) return null;
  const row = await env.DB.prepare('SELECT * FROM review_request WHERE token = ?')
    .bind(token)
    .first<Record<string, unknown>>();
  return row ?? null;
}

/**
 * The invite email. `reminder` only changes the framing — same link, same
 * token — so a nudge reads as a nudge rather than as a duplicate of the first
 * message.
 */
function inviteEmail(name: string, token: string, reminder: boolean) {
  const link = `${SITE}/review/${token}`;
  const sName = escapeHtml(name);

  const opening = reminder
    ? `<p>I know you're busy, so this is just a gentle nudge — I asked a little while back whether you'd be willing to leave a short review, and the link is still open.</p>
       <p>A sentence or two is plenty, and if now isn't a good time, feel free to ignore this one.</p>`
    : `<p>Thanks again for trusting me with your project. If you have two minutes, I'd be grateful for a short review — a sentence or two about how it went is plenty.</p>
       <p>Word of mouth is how this business grows, and hearing it in your words means more to the next person than anything I could write myself.</p>`;

  return {
    replyTo: 'derek@ddaltondesigns.com',
    subject: reminder
      ? `A quick nudge, ${name} — your review link is still open`
      : `${name}, would you share a few words about working together?`,
    html: emailShell({
      title: 'Share your experience - DDalton Designs',
      body: `<h2>Hi ${sName},</h2>
        ${opening}
        <div class="btn-wrap">
          <a href="${link}" class="btn">Write Your Review</a>
        </div>
        <p style="font-size:13px;color:#666;">This link is just for you and can only be used once. Nothing is published until I've read it — and if you'd rather not, no hard feelings at all.</p>
        <p>— Derek Dalton<br>DDalton Designs<br><a href="mailto:derek@ddaltondesigns.com" style="color:#FF4F00;">derek@ddaltondesigns.com</a></p>`,
    }),
  };
}

/** POST /api/sendReviewRequest — admin. Creates the invite and emails it. */
export async function sendReviewRequest(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return badRequest('Expected a JSON body');

  const { client_id, client_name, client_email } = payload;
  if (typeof client_name !== 'string' || client_name.trim().length < 2) {
    return badRequest('Invalid client name');
  }
  if (
    typeof client_email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email) ||
    client_email.length > 254
  ) {
    return badRequest('Invalid client email');
  }

  const name = client_name.trim();
  const email = client_email.trim().toLowerCase();
  const token = newToken();
  const now = new Date().toISOString();

  const row = await db.create(env.DB, 'review_request', {
    token,
    client_id: typeof client_id === 'string' && client_id ? client_id : null,
    client_name: name,
    client_email: email,
    status: 'sent',
    sent_at: now,
  });

  await sendEmail(env, { to: email, ...inviteEmail(name, token, false) });

  return json({ success: true, id: row.id });
}

/**
 * POST /api/resendReviewRequest — admin. Sends the same invite again.
 *
 * Deliberately reuses the original token rather than minting a new one: the
 * first email is still sitting in their inbox, and invalidating that link
 * would punish the client who eventually goes looking for it.
 */
export async function resendReviewRequest(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = payload?.id;
  if (typeof id !== 'string' || !id) return badRequest('Missing id');

  const row = await db.get<Record<string, unknown>>(env.DB, 'review_request', id);
  if (!row) return notFound('Review request not found');
  if (row.status !== 'sent') {
    return badRequest(
      row.status === 'submitted'
        ? 'They have already written a review — it is waiting for your approval.'
        : 'That request is closed, so there is nothing to remind them about.',
    );
  }

  await sendEmail(env, {
    to: String(row.client_email),
    ...inviteEmail(String(row.client_name), String(row.token), true),
  });
  // sent_at becomes the last time they were contacted, which is what the
  // admin list needs in order to show how long a reminder has been pending.
  await db.update(env.DB, 'review_request', id, { sent_at: new Date().toISOString() });

  return json({ success: true });
}

/** POST /api/getReviewInvite — public. Tells the review page whose form it is. */
export async function getReviewInvite(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const row = await findByToken(env, payload?.token);
  if (!row) return notFound('This review link is not valid.');

  // Only the first name and the state of the link — never the email, the
  // client id, or anything else the row holds.
  return json({
    client_name: row.client_name,
    already_submitted: row.status !== 'sent',
  });
}

/** POST /api/submitReview — public. Stores the review and burns the link. */
export async function submitReview(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return badRequest('Expected a JSON body');

  const row = await findByToken(env, payload.token);
  if (!row) return notFound('This review link is not valid.');
  if (row.status !== 'sent') {
    return badRequest('This review has already been submitted. Thank you!');
  }

  const { quote, rating, client_title, client_company } = payload;
  if (typeof quote !== 'string' || quote.trim().length < 10 || quote.length > 2000) {
    return badRequest('Please write at least a sentence (and under 2000 characters).');
  }
  const stars = Number(rating);
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return badRequest('Invalid rating');

  const optional = (v: unknown) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null;

  await db.update(env.DB, 'review_request', String(row.id), {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    quote: quote.trim(),
    rating: Math.round(stars),
    client_title: optional(client_title),
    client_company: optional(client_company),
  });

  await sendEmail(env, {
    to: 'derek@ddaltondesigns.com',
    subject: `⭐ ${row.client_name} left you a ${Math.round(stars)}-star review`,
    html:
      `<p><strong>${escapeHtml(String(row.client_name))}</strong> submitted a review.</p>` +
      `<p><strong>Rating:</strong> ${Math.round(stars)} / 5</p>` +
      `<blockquote>${escapeHtml(quote.trim())}</blockquote>` +
      `<p>Approve it in the admin panel to turn it into a testimonial.</p>`,
  });

  return json({ success: true });
}

/**
 * POST /api/approveReview — admin. Copies the review into `testimonial`.
 *
 * featured is 0 on purpose: approving says the words are fine, not that they
 * belong on the homepage. Publishing stays a separate decision on the
 * Testimonials page.
 */
export async function approveReview(req: Request, env: Env): Promise<Response> {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = payload?.id;
  if (typeof id !== 'string' || !id) return badRequest('Missing id');

  const row = await db.get<Record<string, unknown>>(env.DB, 'review_request', id);
  if (!row) return notFound('Review not found');
  if (row.status !== 'submitted') return badRequest('That review is not awaiting approval.');

  const testimonial = await db.create(env.DB, 'testimonial', {
    client_name: row.client_name,
    client_title: row.client_title,
    client_company: row.client_company,
    quote: row.quote,
    rating: row.rating ?? 5,
    featured: 0,
    order: 0,
  });

  await db.update(env.DB, 'review_request', id, {
    status: 'approved',
    testimonial_id: testimonial.id,
  });

  return json({ success: true, testimonial_id: testimonial.id });
}
