import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { estimateId, pdf_url } = await req.json();
    if (!estimateId) {
      return Response.json({ error: 'estimateId is required' }, { status: 400 });
    }

    const est = await base44.asServiceRole.entities.Estimate.get(estimateId);
    if (!est) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const lineItems = (est.line_items || [])
      .map(i => `• ${i.description}: ${i.quantity} × $${i.rate} = $${i.total}`)
      .join('\n');
    const taxLine = est.tax_rate ? `Tax (${est.tax_rate}%): $${((est.subtotal || 0) * est.tax_rate / 100).toFixed(2)}\n` : '';
    const discountLine = est.discount ? `Discount: -$${est.discount}\n` : '';
    const validLine = est.valid_until ? `Valid Until: ${est.valid_until}\n\n` : '';
    const pdfLine = pdf_url ? `\nDownload your estimate PDF here:\n${pdf_url}\n\n` : '';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: [est.client_email.toLowerCase()],
        subject: `Your Estimate is Ready — DDalton Designs`,
        text: `Hi ${est.client_name},\n\nYour estimate from DDalton Designs is ready! Here's the breakdown:\n\n${lineItems}\n\nSubtotal: $${est.subtotal}\n${taxLine}${discountLine}Total: $${est.total}\n\n${validLine}${pdfLine}To accept or decline, just reply to this email and let me know.\n\nLooking forward to working with you!\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com\n(580) 916-0098`,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(errData.message || 'Failed to send email via Resend');
    }

    await base44.asServiceRole.entities.Estimate.update(estimateId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      client_email: est.client_email.toLowerCase(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});