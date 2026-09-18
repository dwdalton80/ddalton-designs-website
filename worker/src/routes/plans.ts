/** Port of sendProjectPlan. */

import * as db from '../lib/db';
import { sendEmail, escapeHtml } from '../lib/email';
import { emailShell } from '../lib/template';
import { json, badRequest, notFound } from '../lib/http';

export async function sendProjectPlan(req: Request, env: Env): Promise<Response> {
  const { planId } = (await req.json()) as { planId?: string };
  if (!planId) return badRequest('planId is required');

  const plan = await db.get<Record<string, any>>(env.DB, 'project_plan', planId);
  if (!plan) return notFound('Project plan');
  if (!plan.client_email) return badRequest('Plan has no client email');

  const deliverables = (Array.isArray(plan.deliverables) ? plan.deliverables : [])
    .filter(Boolean)
    .map((d: unknown) => `<li><span class="dot"></span> ${escapeHtml(d)}</li>`)
    .join('');

  const body = `<h2>${escapeHtml(plan.title)}</h2>
        ${plan.description ? `<p>${escapeHtml(plan.description)}</p>` : ''}
        <table class="details-table">
          ${plan.timeline ? `<tr><td>Timeline</td><td>${escapeHtml(plan.timeline)}</td></tr>` : ''}
          ${
            Number(plan.total_amount) > 0
              ? `<tr><td>Project Value</td><td>$${Number(plan.total_amount).toLocaleString()}</td></tr>`
              : ''
          }
        </table>
        ${plan.scope ? `<h3>Scope of Work</h3><div class="message-box">${escapeHtml(plan.scope)}</div>` : ''}
        ${deliverables ? `<h3>Deliverables</h3><ul class="services">${deliverables}</ul>` : ''}
        <p>To approve this plan and move forward, just reply to this email and let me know. I'll send over the next steps and any agreement to sign.</p>
        <p>Looking forward to working with you!</p>
        <p>— Derek Dalton<br>DDalton Designs<br><a href="mailto:derek@ddaltondesigns.com" style="color:#FF4F00;">derek@ddaltondesigns.com</a></p>`;

  await sendEmail(env, {
    to: plan.client_email,
    subject: `Project Plan: ${plan.title} — DDalton Designs`,
    html: emailShell({ title: 'Project Plan - DDalton Designs', body }),
  });

  await db.update(env.DB, 'project_plan', planId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  });

  return json({ success: true });
}
