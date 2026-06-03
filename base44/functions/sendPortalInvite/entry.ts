import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { clientName, clientEmail } = await req.json();
    if (!clientEmail) {
      return Response.json({ error: 'clientEmail is required' }, { status: 400 });
    }

    const portalUrl = 'https://ddalton-designs.base44.app/portal';
    const registerUrl = 'https://ddalton-designs.base44.app/register';

    // Invite the user to the app so they can set a password
    try {
      await base44.users.inviteUser(clientEmail, 'user');
    } catch (_) {
      // User may already exist — that's fine
    }

    // Send branded welcome email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: [clientEmail],
        subject: `Welcome to the DDalton Designs Client Portal`,
        text: `Hi ${clientName},\n\nYour estimate has been accepted — welcome to the DDalton Designs Client Portal!\n\nYour portal gives you a dedicated space to:\n• View and track your invoices\n• Review and sign project plans\n• Send messages directly to Derek\n• Upload and manage project files\n\nTo get started, create your account here:\n${registerUrl}\n\nOnce registered, you can log in anytime at:\n${portalUrl}\n\nIf you have any questions, just reply to this email.\n\nLooking forward to working with you!\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com\n(580) 916-0098`,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(errData.message || 'Failed to send portal invite email');
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});