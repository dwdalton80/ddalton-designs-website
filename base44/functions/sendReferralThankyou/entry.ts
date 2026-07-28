import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const escapeHtml = (str) => String(str == null ? '' : str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const emailHtml = (raw_name, trackingUrl) => {
  const referrer_name = escapeHtml(raw_name);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You! - DDalton Designs</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F2EE; font-family: 'Inter', Arial, sans-serif; color: #121212; }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background-color: #121212; padding: 28px 36px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; color: #F5F2EE; font-family: Georgia, 'Times New Roman', serif; letter-spacing: -0.5px; }
    .header h1 span { color: #FF4F00; }
    .hero-bar { background-color: #FF4F00; padding: 18px 36px; text-align: center; }
    .hero-bar p { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px; }
    .body { padding: 36px; }
    .body h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #121212; }
    .body p { font-size: 15px; line-height: 1.7; color: #3a3a3a; margin: 0 0 14px; }
    .bonus-box { background: #121212; color: #F5F2EE; padding: 20px 24px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .bonus-box .amount { font-size: 36px; font-weight: 900; color: #FF4F00; font-family: Georgia, serif; }
    .bonus-box .label { font-size: 13px; color: #aaa; margin-top: 4px; }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn { display: inline-block; background-color: #FF4F00; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 50px; font-weight: 700; font-size: 15px; }
    .footer { background-color: #F5F2EE; padding: 20px 36px; text-align: center; border-top: 1px solid #e8e3dc; }
    .footer p { font-size: 12px; color: #888; margin: 4px 0; }
    .footer a { color: #888; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>DD<span>alton</span> Designs</h1>
      </div>
      <div class="hero-bar">
        <p>🎉 Thank You for Your Referral!</p>
      </div>
      <div class="body">
        <h2>You're the best, ${referrer_name}!</h2>
        <p>I just received your referral and I'm so grateful for your support. Word-of-mouth referrals are the most powerful way my business grows, and I don't take that lightly.</p>
        <p>I'll be reaching out to your referred client shortly. In the meantime, here's your reward reminder:</p>
        <div class="bonus-box">
          <div class="amount">$100</div>
          <div class="label">Referral bonus — paid within 30 days of their first payment</div>
        </div>
        <p>You can track the status of this referral in real-time using your personal tracking link:</p>
        <div class="btn-wrap">
          <a href="${trackingUrl}" class="btn">Track Your Referral</a>
        </div>
        <p>Thanks again — I'll keep you posted!</p>
        <p>— Derek Dalton<br>DDalton Designs</p>
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
    const { referral_id, referrer_email, referrer_name } = await req.json();

    if (!referral_id || !referrer_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only the referrer (owner) or an admin may send the thank-you email
    if (user.role !== 'admin' && user.email.toLowerCase() !== referrer_email.toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const trackingUrl = `https://ddaltondesigns.com/referral-tracker/${referral_id}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: referrer_email,
        subject: 'Thank you for your referral!',
        html: emailHtml(referrer_name, trackingUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send email');
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});