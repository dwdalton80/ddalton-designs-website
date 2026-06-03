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

    // Invite the client so they can log into the portal
    try {
      await base44.users.inviteUser(est.client_email, 'user');
    } catch (_) {
      // User may already exist — that's fine
    }

    // Send email via Resend
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
        text: `Hi ${est.client_name},\n\nGreat news — your estimate from DDalton Designs is ready to view!\n\nTo see your estimate, log in to your Client Portal using the link below:\n\n${portalUrl}\n\nYou'll receive a separate email with your login invitation shortly. Once logged in, you'll be able to view your estimate, invoices, project plans, and send me messages directly.\n\nIf you have any questions in the meantime, feel free to reply to this email.\n\nLooking forward to working with you!\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com`,
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