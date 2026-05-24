import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referrer_name, referrer_email, referred_client_name } = await req.json();

    if (!referrer_email) {
      return Response.json({ error: 'Missing referrer_email' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: referrer_email,
        subject: 'Your Referral Has Been Received',
        text: `Hi ${referrer_name},

Thank you for referring ${referred_client_name} to DDalton Designs! We've received your referral and will reach out to them within 48 hours to discuss their design needs.

You can track the status of your referral anytime by visiting your referral portal:
https://ddaltondesigns.com/my-referrals

We'll keep you updated every step of the way. Once they become a client, you'll earn your $100 referral bonus!

Best regards,
Derek Dalton
DDalton Designs`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send email');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});