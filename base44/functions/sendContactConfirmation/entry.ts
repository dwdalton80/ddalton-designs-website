import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const projectTypeLabels = {
  website: 'Website Design',
  logo: 'Logo & Brand Identity',
  marketing: 'Marketing Materials',
  other: 'Other',
};

const emailHtml = (name, project_type, budget, message) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Received - DDalton Designs</title>
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
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #F5F2EE; }
    .details-table td:first-child { font-weight: 600; color: #888; width: 38%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.6px; }
    .details-table td:last-child { color: #121212; }
    .message-box { background: #F5F2EE; border-left: 4px solid #FF4F00; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 15px; color: #3a3a3a; line-height: 1.7; }
    .steps { margin: 20px 0; padding: 0; list-style: none; }
    .steps li { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 14px; color: #3a3a3a; border-bottom: 1px solid #F5F2EE; }
    .steps li:last-child { border-bottom: none; }
    .step-num { width: 22px; height: 22px; background: #FF4F00; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
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
        <h2>Got it, ${name}!</h2>
        <p>Thanks for reaching out — your project request has been received. I'll review the details and get back to you within <strong>48 hours</strong> with a personalized response.</p>
        <p>Here's a summary of what you submitted:</p>
        <table class="details-table">
          <tr>
            <td>Project Type</td>
            <td>${projectTypeLabels[project_type] || project_type}</td>
          </tr>
          ${budget ? `<tr><td>Budget</td><td>${budget}</td></tr>` : ''}
        </table>
        <p><strong>Your message:</strong></p>
        <div class="message-box">${message}</div>
        <p>Here's what happens next:</p>
        <ul class="steps">
          <li><span class="step-num">1</span> I review your request and project details</li>
          <li><span class="step-num">2</span> I send you a personalized estimate within 48–72 hrs</li>
          <li><span class="step-num">3</span> We hop on a quick call to align on scope & timeline</li>
          <li><span class="step-num">4</span> We get to work!</li>
        </ul>
        <p>In the meantime, feel free to browse my portfolio or reach out directly if you have any questions.</p>
        <div class="btn-wrap">
          <a href="https://ddaltondesigns.com/portfolio" class="btn">View My Portfolio</a>
        </div>
        <p>Talk soon!</p>
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, project_type, budget, message } = await req.json();

    if (!email || !name) {
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
        to: email,
        subject: `Got your request, ${name}! I'll be in touch soon.`,
        html: emailHtml(name, project_type, budget, message),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send email');
    }

    // Notify Derek
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: 'derek@ddaltondesigns.com',
        subject: `📬 New Contact Form: ${name} — ${projectTypeLabels[project_type] || project_type}`,
        html: `<p><strong>${name}</strong> (${email}) submitted a contact form.</p><p><strong>Type:</strong> ${projectTypeLabels[project_type] || project_type}</p>${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}<p><strong>Message:</strong></p><blockquote>${message}</blockquote>`,
      }),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});