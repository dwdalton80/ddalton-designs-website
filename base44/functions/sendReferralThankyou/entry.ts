import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referral_id, referrer_email, referrer_name, token } = await req.json();

    const secretToken = Deno.env.get('FUNCTION_SECRET_TOKEN');
    if (!secretToken || token !== secretToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!referral_id || !referrer_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trackingUrl = `${new URL(req.url).origin}/referral-tracker/${referral_id}`;

    await base44.integrations.Core.SendEmail({
      to: referrer_email,
      subject: 'Thank You for Your Referral!',
      body: `Hi ${referrer_name},

Thank you for referring a client to DDalton Designs! I appreciate your support and will be in touch with them shortly.

You can track the status of your referral here: ${trackingUrl}

Once the referral converts to a paid project, you'll receive a $100 bonus within 30 days.

Best regards,
Derek Dalton
DDalton Designs`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});