import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const statusConfig = {
  contacted: {
    emoji: '📞',
    label: 'In Contact',
    color: '#2563eb',
    message: "Great news — I've reached out to your referred client and we're in conversation about their project needs.",
  },
  converted: {
    emoji: '🎉',
    label: 'Converted to Client!',
    color: '#16a34a',
    message: "Amazing news! Your referral has converted into a paying client. Your <strong>$100 referral bonus</strong> will be processed within 30 days. Thank you so much!",
  },
  rejected: {
    emoji: '📋',
    label: 'Not a Fit',
    color: '#6b7280',
    message: "Unfortunately, this referral wasn't the right fit at this time. Please don't let that discourage you — future referrals are always welcome!",
  },
};

const emailHtml = (referrer_name, referred_client_name, status) => {
  const cfg = statusConfig[status] || { emoji: '📋', label: 'Updated', color: '#FF4F00', message: 'Your referral status has been updated.' };
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Update - DDalton Designs</title>
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
    .status-badge { display: inline-block; background-color: ${cfg.color}1a; color: ${cfg.color}; padding: 6px 14px; border-radius: 50px; font-weight: 700; font-size: 13px; margin-bottom: 20px; border: 1px solid ${cfg.color}40; }
    .highlight-box { background: #F5F2EE; border-left: 4px solid #FF4F00; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .highlight-box p { margin: 0; color: #3a3a3a; font-size: 15px; line-height: 1.6; }
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
      <div class="body">
        <h2>Referral Update</h2>
        <p>Hi ${referrer_name},</p>
        <p>Here's the latest on your referral for <strong>${referred_client_name}</strong>:</p>
        <div class="status-badge">${cfg.emoji} ${cfg.label}</div>
        <div class="highlight-box">
          <p>${cfg.message}</p>
        </div>
        <p>You can always check your referral history and status on your dashboard.</p>
        <div class="btn-wrap">
          <a href="https://ddaltondesigns.com/my-referrals" class="btn">View My Referrals</a>
        </div>
        <p>Thanks for your continued support!</p>
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
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { referrer_email, referrer_name, status, referred_client_name } = await req.json();

    if (!referrer_email || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
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
        subject: `Referral Update: ${referred_client_name}`,
        html: emailHtml(referrer_name, referred_client_name, status),
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