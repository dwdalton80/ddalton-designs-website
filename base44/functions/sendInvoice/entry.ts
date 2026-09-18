import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { invoiceId, pdf_url } = await req.json();
    if (!invoiceId) {
      return Response.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const inv = await base44.asServiceRole.entities.Invoice.get(invoiceId);
    if (!inv) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const lineItems = (inv.line_items || [])
      .map(i => `• ${i.description}: ${i.quantity} × $${i.rate} = $${i.total}`)
      .join('\n');

    const taxLine = inv.tax_rate
      ? `Tax (${inv.tax_rate}%): $${((inv.subtotal || 0) * inv.tax_rate / 100).toFixed(2)}\n`
      : '';
    const discountLine = inv.discount
      ? `Discount: -$${inv.discount}\n`
      : '';
    const pdfLine = pdf_url ? `\nDownload your invoice PDF here:\n${pdf_url}\n\n` : '';

    const textBody = `Hi ${inv.client_name},\n\nPlease find your invoice below:\n\n${lineItems}\n\nSubtotal: $${inv.subtotal}\n${taxLine}${discountLine}Total Due: $${inv.total}\n\n${inv.due_date ? `Due Date: ${inv.due_date}\n\n` : ''}${pdfLine}Please send payment via your preferred method and reply to this email once it's sent.\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com\n(580) 916-0098`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DDalton Designs <derek@ddaltondesigns.com>',
        to: [inv.client_email.toLowerCase()],
        subject: `Invoice from DDalton Designs`,
        text: textBody,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      throw new Error(errData.message || 'Failed to send invoice email via Resend');
    }

    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});