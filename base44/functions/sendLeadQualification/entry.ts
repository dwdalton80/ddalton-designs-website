import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const escapeHtml = (str) => String(str == null ? '' : str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const emailHtml = (referred_client_name, referrer_name) => {
  const sReferred = escapeHtml(referred_client_name);
  const sReferrer = escapeHtml(referrer_name);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DDalton Designs - Introduction</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F2EE; font-family: 'Inter', Arial, sans-serif; color: #121212; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background-color: #121212; padding: 28px 36px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; color: #F5F2EE; font-family: Georgia, 'Times New Roman', serif; letter-spacing: -0.5px; }
    .header h1 span { color: #FF4F00; }
    .body { padding: 36px; }
    .body h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #121212; }
    .body p { font-size: 15px; line-height: 1.7; color: #3a3a3a; margin: 0 0 14px; }
    .services { margin: 20px 0; padding: 0; list-style: none; }
    .services li { font-size: 15px; color: #3a3a3a; padding: 8px 0; border-bottom: 1px solid #F5F2EE; display: flex; align-items: center; gap: 10px; }
    .services li:last-child { border-bottom: none; }
    .dot { width: 8px; height: 8px; background: #FF4F00; border-radius: 50%; flex-shrink: 0; }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn { display: inline-block; background-color: #FF4F00; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; margin: 0 6px 10px; }
    .btn-outline { background-color: transparent; color: #121212; border: 2px solid #121212; }
    .footer { background-color: #F5F2EE; padding: 20px 36px; text-align: center; border-top: 1px solid #e8e3dc; }
    .footer p { font-size: 12px; color: #888; margin: 4px 0; }
    .footer a { color: #888; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>DD<span>alton</span> Designs</h1>
      </div>
      <div class="body">
        <h2>You've Been Referred!</h2>
        <p>Hi ${sReferred},</p>
        <p><strong>${sReferrer}</strong> thought you might benefit from working with me — I'm Derek Dalton, a designer specializing in bold, intentional work for businesses that want to stand out.</p>
        <p>Here's what I do:</p>
        <ul class="services">
          <li><span class="dot"></span> <strong>Web Design</strong> — Modern, responsive websites that convert</li>
          <li><span class="dot"></span> <strong>Logo & Brand Identity</strong> — Distinctive visuals that resonate</li>
          <li><span class="dot"></span> <strong>Marketing Materials</strong> — Compelling print and digital design</li>
        </ul>
        <p>I'd love to learn about your project and see how I can help. Check out my portfolio or reach out directly to start the conversation.</p>
        <div class="btn-wrap">
          <a href="https://ddaltondesigns.com/portfolio" class="btn">View Portfolio</a>
          <a href="https://ddaltondesigns.com/contact" class="btn btn-outline">Get in Touch</a>
        </div>
        <p>Looking forward to connecting!</p>
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
    if (!user) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
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
        subject: `${referrer_name} thought you'd love DDalton Designs`,
        html: emailHtml(referred_client_name, referrer_name),
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