import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referred_client_name, referred_client_email, referrer_name } = await req.json();

    if (!referred_client_email) {
      return Response.json({ error: 'Missing referred_client_email' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: referred_client_email,
        subject: `${referrer_name} Referred You to DDalton Designs`,
        text: `Hi ${referred_client_name},

${referrer_name} recently referred you to DDalton Designs for your design needs. We specialize in creating bold, intentional design that helps businesses stand out.

Here's what we offer:
• Web Design - Modern, responsive websites that convert
• Logo & Brand Identity - Distinctive visual identities that resonate
• Marketing Materials - Compelling designs for print and digital

We'd love to discuss how we can help bring your vision to life. Visit our portfolio to see what we've created for other clients, or let's schedule a quick call to talk about your project.

Get started:
https://ddaltondesigns.com

Looking forward to connecting!

Best regards,
Derek Dalton
DDalton Designs
derek@ddaltondesigns.com`,
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