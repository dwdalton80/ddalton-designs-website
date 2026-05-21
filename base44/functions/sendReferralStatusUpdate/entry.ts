import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referrer_email, referrer_name, status, referred_client_name } = await req.json();

    if (!referrer_email || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const statusMessages = {
      contacted: 'I\'ve reached out to the referred client to discuss their project needs.',
      converted: 'Great news! The referred client has become a paying customer. Your $100 referral bonus will be processed within 30 days.',
      rejected: 'Unfortunately, the referred client isn\'t a good fit for this project at this time.'
    };

    const message = statusMessages[status] || 'Your referral status has been updated.';

    await base44.integrations.Core.SendEmail({
      to: referrer_email,
      subject: `Referral Update: ${referred_client_name}`,
      body: `Hi ${referrer_name},

I have an update on your referral for ${referred_client_name}.

${message}

Thank you for your continued support!

Best regards,
Derek Dalton
DDalton Designs`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});