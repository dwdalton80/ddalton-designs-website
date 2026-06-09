import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { estimateId } = await req.json();
    if (!estimateId) {
      return Response.json({ error: 'estimateId is required' }, { status: 400 });
    }

    const est = await base44.asServiceRole.entities.Estimate.get(estimateId);
    if (!est) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const registerUrl = 'https://ddaltondesigns.com/register';
    const portalUrl = 'https://ddaltondesigns.com/portal';

    // Send estimate notification email via Resend (no invite yet — that comes on acceptance)
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: [est.client_email],
        subject: `Your Estimate is Ready — DDalton Designs`,
        text: `Hi ${est.client_name},\n\nYour estimate from DDalton Designs is ready to view!\n\nTo see the full breakdown, create your free client portal account using the link below — it only takes a moment, and your estimate will be waiting for you as soon as you log in:\n\n${registerUrl}\n\nAlready have an account? View it here:\n${portalUrl}\n\nThrough your portal you can review the estimate details, ask questions, and accept when you're ready.\n\nLooking forward to working with you!\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com\n(580) 916-0098`,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(errData.message || 'Failed to send email via Resend');
    }

    await base44.asServiceRole.entities.Estimate.update(estimateId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      client_email: est.client_email.toLowerCase(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});