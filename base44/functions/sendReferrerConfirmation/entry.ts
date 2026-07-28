import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const escapeHtml = (str) => String(str == null ? '' : str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const emailHtml = (raw_referrer, raw_referred) => {
  const referrer_name = escapeHtml(raw_referrer);
  const referred_client_name = escapeHtml(raw_referred);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Confirmation - DDalton Designs</title>
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
    .highlight-box { background: #F5F2EE; border-left: 4px solid #FF4F00; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .highlight-box p { margin: 0; font-weight: 600; color: #121212; }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn { display: inline-block; background-color: #FF4F00; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; }
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
        <h2>Referral Received!</h2>
        <p>Hi ${referrer_name},</p>
        <p>Thank you for thinking of me! Your referral has been successfully submitted. I truly appreciate your support.</p>
        <div class="highlight-box">
          <p>📋 You referred: ${referred_client_name}</p>
        </div>
        <p>I'll be reaching out to ${referred_client_name} shortly to discuss their design needs. I'll keep you in the loop every step of the way.</p>
        <p>Remember — when they become a paying client, you'll earn a <strong>$100 referral bonus</strong> within 30 days of their first payment.</p>
        <div class="btn-wrap">
          <a href="https://ddaltondesigns.com/my-referrals" class="btn">Track Your Referrals</a>
        </div>
        <p>Thanks again for spreading the word!</p>
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
    const { referrer_name, referrer_email, referred_client_name } = await req.json();

    if (!referrer_email) {
      return Response.json({ error: 'Missing referrer_email' }, { status: 400 });
    }

    // Only the referrer (owner) or an admin may send the confirmation email
    if (user.role !== 'admin' && user.email.toLowerCase() !== referrer_email.toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
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
        subject: `Your referral for ${referred_client_name} has been received!`,
        html: emailHtml(referrer_name, referred_client_name),
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