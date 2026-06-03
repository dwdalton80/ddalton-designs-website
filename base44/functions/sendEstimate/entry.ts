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

    const portalUrl = 'https://ddalton-designs.base44.app/portal';

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
        text: `Hi ${est.client_name},\n\nGreat news — your estimate from DDalton Designs is ready to view!\n\nDerek will be in touch shortly to walk you through the details. If you have any questions in the meantime, feel free to reply to this email.\n\nLooking forward to working with you!\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com`,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(errData.message || 'Failed to send email via Resend');
    }

    await base44.asServiceRole.entities.Estimate.update(estimateId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});