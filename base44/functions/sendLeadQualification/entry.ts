import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referred_client_name, referred_client_email, referrer_name, token } = await req.json();

    const secretToken = Deno.env.get('FUNCTION_SECRET_TOKEN');
    if (!secretToken || token !== secretToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!referred_client_email) {
      return Response.json({ error: 'Missing referred_client_email' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: referred_client_email,
      subject: `${referrer_name} Referred You to DDalton Designs`,
      body: `Hi ${referred_client_name},

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
derek@ddaltondesigns.com`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});