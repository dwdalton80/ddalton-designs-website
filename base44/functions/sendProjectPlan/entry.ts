import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const escapeHtml = (str) => String(str == null ? '' : str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const emailHtml = (plan) => {
  const sTitle = escapeHtml(plan.title);
  const sDescription = escapeHtml(plan.description);
  const sScope = escapeHtml(plan.scope);
  const sTimeline = escapeHtml(plan.timeline);
  const sClient = escapeHtml(plan.client_email);
  const deliverables = (plan.deliverables || []).filter(Boolean).map(d => `<li><span class="dot"></span> ${escapeHtml(d)}</li>`).join('');
  const deliverablesSection = deliverables
    ? `<h3>Deliverables</h3><ul class="services">${deliverables}</ul>`
    : '';
  const scopeSection = plan.scope
    ? `<h3>Scope of Work</h3><div class="message-box">${sScope}</div>`
    : '';
  const descriptionSection = plan.description
    ? `<p>${sDescription}</p>`
    : '';
  const timelineRow = plan.timeline ? `<tr><td>Timeline</td><td>${sTimeline}</td></tr>` : '';
  const valueRow = plan.total_amount > 0 ? `<tr><td>Project Value</td><td>$${Number(plan.total_amount).toLocaleString()}</td></tr>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Plan - DDalton Designs</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F2EE; font-family: 'Inter', Arial, sans-serif; color: #121212; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background-color: #121212; padding: 28px 36px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; color: #F5F2EE; font-family: Georgia, 'Times New Roman', serif; letter-spacing: -0.5px; }
    .header h1 span { color: #FF4F00; }
    .body { padding: 36px; }
    .body h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #121212; }
    .body h3 { font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 700; margin: 22px 0 10px; color: #121212; }
    .body p { font-size: 15px; line-height: 1.7; color: #3a3a3a; margin: 0 0 14px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #F5F2EE; }
    .details-table td:first-child { font-weight: 600; color: #888; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.6px; }
    .details-table td:last-child { color: #121212; }
    .message-box { background: #F5F2EE; border-left: 4px solid #FF4F00; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 12px 0; font-size: 15px; color: #3a3a3a; line-height: 1.7; white-space: pre-wrap; }
    .services { margin: 12px 0; padding: 0; list-style: none; }
    .services li { font-size: 15px; color: #3a3a3a; padding: 8px 0; border-bottom: 1px solid #F5F2EE; display: flex; align-items: center; gap: 10px; }
    .services li:last-child { border-bottom: none; }
    .dot { width: 8px; height: 8px; background: #FF4F00; border-radius: 50%; flex-shrink: 0; }
    .footer { background-color: #F5F2EE; padding: 20px 36px; text-align: center; border-top: 1px solid #e8e3dc; }
    .footer p { font-size: 12px; color: #888; margin: 4px 0; }
    .footer a { color: #888; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>DD<span>alton</span> Designs</h1>
      </div>
      <div class="body">
        <h2>${sTitle}</h2>
        ${descriptionSection}
        <table class="details-table">
          ${timelineRow}
          ${valueRow}
        </table>
        ${scopeSection}
        ${deliverablesSection}
        <p>To approve this plan and move forward, just reply to this email and let me know. I'll send over the next steps and any agreement to sign.</p>
        <p>Looking forward to working with you!</p>
        <p>— Derek Dalton<br>DDalton Designs<br><a href="mailto:derek@ddaltondesigns.com" style="color:#FF4F00;">derek@ddaltondesigns.com</a></p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} DDalton Designs. All rights reserved.</p>
        <p><a href="https://ddaltondesigns.com/privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="https://ddaltondesigns.com/terms">Terms of Service</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return Response.json({ error: 'planId is required' }, { status: 400 });
    }

    const plan = await base44.asServiceRole.entities.ProjectPlan.get(planId);
    if (!plan) {
      return Response.json({ error: 'Project plan not found' }, { status: 404 });
    }
    if (!plan.client_email) {
      return Response.json({ error: 'Plan has no client email' }, { status: 400 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: [plan.client_email.toLowerCase()],
        subject: `Project Plan: ${plan.title} — DDalton Designs`,
        html: emailHtml(plan),
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(errData.message || 'Failed to send project plan email via Resend');
    }

    await base44.asServiceRole.entities.ProjectPlan.update(planId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});