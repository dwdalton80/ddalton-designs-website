/**
 * Ports of sendLeadQualification, sendReferrerConfirmation,
 * sendReferralThankyou and sendReferralStatusUpdate.
 *
 * AUTH NOTE: on Base44, sendReferrerConfirmation and sendReferralThankyou
 * allowed "admin OR the referrer themselves", because referrers could log in to
 * /my-referrals. That portal was removed and there are no referrer logins any
 * more, so the second branch is unreachable and these are admin-only here. If
 * referrer logins ever come back, that check comes back with them.
 */

import { sendEmail, escapeHtml } from '../lib/email';
import { emailShell } from '../lib/template';
import { json, badRequest } from '../lib/http';

const SIGNOFF = '<p>— Derek Dalton<br>DDalton Designs</p>';

/** Introduction email sent to a referred prospect. */
export async function sendLeadQualification(req: Request, env: Env): Promise<Response> {
  const { referred_client_name, referred_client_email, referrer_name } = (await req.json()) as Record<
    string,
    string | undefined
  >;
  if (!referred_client_email) return badRequest('Missing referred_client_email');

  const body = `<h2>You've Been Referred!</h2>
        <p>Hi ${escapeHtml(referred_client_name)},</p>
        <p><strong>${escapeHtml(referrer_name)}</strong> thought you might benefit from working with me — I'm Derek Dalton, a designer specializing in bold, intentional work for businesses that want to stand out.</p>
        <p>Here's what I do:</p>
        <ul class="services">
          <li><span class="dot"></span> <strong>Web Design</strong> — Modern, responsive websites that convert</li>
          <li><span class="dot"></span> <strong>Logo &amp; Brand Identity</strong> — Distinctive visuals that resonate</li>
          <li><span class="dot"></span> <strong>Marketing Materials</strong> — Compelling print and digital design</li>
        </ul>
        <p>I'd love to learn about your project and see how I can help. Check out my portfolio or reach out directly to start the conversation.</p>
        <div class="btn-wrap">
          <a href="https://ddaltondesigns.com/portfolio" class="btn">View Portfolio</a>
          <a href="https://ddaltondesigns.com/contact" class="btn btn-outline">Get in Touch</a>
        </div>
        <p>Looking forward to connecting!</p>
        <p>— Derek Dalton<br>DDalton Designs<br><a href="mailto:derek@ddaltondesigns.com" style="color:#FF4F00;">derek@ddaltondesigns.com</a></p>`;

  await sendEmail(env, {
    to: referred_client_email,
    subject: `${referrer_name} thought you'd love DDalton Designs`,
    html: emailShell({ title: 'DDalton Designs - Introduction', body }),
  });

  return json({ success: true });
}

/** Confirms to the referrer that their referral was received. */
export async function sendReferrerConfirmation(req: Request, env: Env): Promise<Response> {
  const { referrer_name, referrer_email, referred_client_name } = (await req.json()) as Record<
    string,
    string | undefined
  >;
  if (!referrer_email) return badRequest('Missing referrer_email');

  const sReferred = escapeHtml(referred_client_name);

  const body = `<h2>Referral Received!</h2>
        <p>Hi ${escapeHtml(referrer_name)},</p>
        <p>Thank you for thinking of me! Your referral has been successfully submitted. I truly appreciate your support.</p>
        <div class="highlight-box">
          <p>📋 You referred: ${sReferred}</p>
        </div>
        <p>I'll be reaching out to ${sReferred} shortly to discuss their design needs. I'll keep you in the loop every step of the way.</p>
        <p>Remember — when they become a paying client, you'll earn a <strong>$100 referral bonus</strong> within 30 days of their first payment.</p>
        <p>I'll keep you in the loop with email updates as things progress.</p>
        <p>Thanks again for spreading the word!</p>
        ${SIGNOFF}`;

  await sendEmail(env, {
    to: referrer_email,
    subject: `Your referral for ${referred_client_name} has been received!`,
    html: emailShell({ title: 'Referral Received - DDalton Designs', body }),
  });

  return json({ success: true });
}

/** Thank-you to the referrer. */
export async function sendReferralThankyou(req: Request, env: Env): Promise<Response> {
  const { referral_id, referrer_email, referrer_name } = (await req.json()) as Record<
    string,
    string | undefined
  >;
  if (!referral_id || !referrer_email) return badRequest('Missing required fields');

  const body = `<h2>You're the best, ${escapeHtml(referrer_name)}!</h2>
        <p>I just received your referral and I'm so grateful for your support. Word-of-mouth referrals are the most powerful way my business grows, and I don't take that lightly.</p>
        <p>I'll be reaching out to your referred client shortly. In the meantime, here's your reward reminder:</p>
        <div class="bonus-box">
          <div class="amount">$100</div>
          <div class="label">Referral bonus — paid within 30 days of their first payment</div>
        </div>
        <p>I'll keep you posted on the progress — you'll get an email update each time the status changes.</p>
        <p>Thanks again — I'm grateful for your support!</p>
        ${SIGNOFF}`;

  await sendEmail(env, {
    to: referrer_email,
    subject: 'Thank you for your referral!',
    html: emailShell({ title: 'Thank You - DDalton Designs', body }),
  });

  return json({ success: true });
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; message: string }> = {
  contacted: {
    emoji: '📞',
    label: 'In Contact',
    color: '#2563eb',
    message: "Great news — I've reached out to your referred client and we're in conversation about their project needs.",
  },
  converted: {
    emoji: '🎉',
    label: 'Converted to Client!',
    color: '#16a34a',
    message:
      'Amazing news! Your referral has converted into a paying client. Your <strong>$100 referral bonus</strong> will be processed within 30 days. Thank you so much!',
  },
  rejected: {
    emoji: '📋',
    label: 'Not a Fit',
    color: '#6b7280',
    message:
      "Unfortunately, this referral wasn't the right fit at this time. Please don't let that discourage you — future referrals are always welcome!",
  },
};

/** Status-change notification to the referrer. */
export async function sendReferralStatusUpdate(req: Request, env: Env): Promise<Response> {
  const { referrer_email, referrer_name, status, referred_client_name } = (await req.json()) as Record<
    string,
    string | undefined
  >;
  if (!referrer_email || !status) return badRequest('Missing required fields');

  const cfg = STATUS_CONFIG[status] ?? {
    emoji: '📋',
    label: 'Updated',
    color: '#FF4F00',
    message: 'Your referral status has been updated.',
  };

  // cfg.message is our own copy and intentionally contains markup; the caller's
  // values are escaped.
  const body = `<h2>Referral Update</h2>
        <p>Hi ${escapeHtml(referrer_name)},</p>
        <p>Here's the latest on your referral for <strong>${escapeHtml(referred_client_name)}</strong>:</p>
        <div class="status-badge">${cfg.emoji} ${cfg.label}</div>
        <div class="highlight-box">
          <p>${cfg.message}</p>
        </div>
        <p>Thanks for your continued support!</p>
        ${SIGNOFF}`;

  await sendEmail(env, {
    to: referrer_email,
    subject: `Referral Update: ${referred_client_name}`,
    html: emailShell({
      title: 'Referral Update - DDalton Designs',
      body,
      extraCss: `
    .status-badge { display: inline-block; background-color: ${cfg.color}; color: #ffffff; padding: 8px 18px; border-radius: 50px; font-size: 14px; font-weight: 700; margin: 8px 0 4px; }`,
    }),
  });

  return json({ success: true });
}
