/**
 * Ports of sendEstimate / sendInvoice.
 *
 * Email bodies are reproduced exactly as Base44 sent them — clients have
 * received these before and there's no reason for the wording to shift just
 * because the hosting moved.
 */

import * as db from '../lib/db';
import { sendEmail } from '../lib/email';
import { json, badRequest, notFound, lineItemsText, money } from '../lib/http';

const SIGNATURE =
  'Best,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com\n(580) 916-0098';

export async function sendEstimate(req: Request, env: Env): Promise<Response> {
  const { estimateId, pdf_url } = (await req.json()) as { estimateId?: string; pdf_url?: string };
  if (!estimateId) return badRequest('estimateId is required');

  const est = await db.get<Record<string, any>>(env.DB, 'estimate', estimateId);
  if (!est) return notFound('Estimate');

  const taxLine = est.tax_rate
    ? `Tax (${est.tax_rate}%): $${money(((est.subtotal || 0) * est.tax_rate) / 100)}\n`
    : '';
  const discountLine = est.discount ? `Discount: -$${est.discount}\n` : '';
  const validLine = est.valid_until ? `Valid Until: ${est.valid_until}\n\n` : '';
  const pdfLine = pdf_url ? `\nDownload your estimate PDF here:\n${pdf_url}\n\n` : '';

  await sendEmail(env, {
    to: est.client_email,
    subject: 'Your Estimate is Ready — DDalton Designs',
    text:
      `Hi ${est.client_name},\n\nYour estimate from DDalton Designs is ready! Here's the breakdown:\n\n` +
      `${lineItemsText(est.line_items)}\n\nSubtotal: $${est.subtotal}\n${taxLine}${discountLine}` +
      `Total: $${est.total}\n\n${validLine}${pdfLine}` +
      `To accept or decline, just reply to this email and let me know.\n\n` +
      `Looking forward to working with you!\n\n${SIGNATURE}`,
  });

  await db.update(env.DB, 'estimate', estimateId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
    // Base44 normalised the stored address to lowercase on send; RLS matching
    // depended on it. Nothing matches on it now, but keeping the data
    // consistent avoids duplicate-looking client rows later.
    client_email: String(est.client_email).toLowerCase(),
  });

  return json({ success: true });
}

export async function sendInvoice(req: Request, env: Env): Promise<Response> {
  const { invoiceId, pdf_url } = (await req.json()) as { invoiceId?: string; pdf_url?: string };
  if (!invoiceId) return badRequest('invoiceId is required');

  const inv = await db.get<Record<string, any>>(env.DB, 'invoice', invoiceId);
  if (!inv) return notFound('Invoice');

  const taxLine = inv.tax_rate
    ? `Tax (${inv.tax_rate}%): $${money(((inv.subtotal || 0) * inv.tax_rate) / 100)}\n`
    : '';
  const discountLine = inv.discount ? `Discount: -$${inv.discount}\n` : '';
  const dueLine = inv.due_date ? `Due Date: ${inv.due_date}\n\n` : '';
  const pdfLine = pdf_url ? `\nDownload your invoice PDF here:\n${pdf_url}\n\n` : '';

  await sendEmail(env, {
    to: inv.client_email,
    subject: 'Invoice from DDalton Designs',
    text:
      `Hi ${inv.client_name},\n\nPlease find your invoice below:\n\n` +
      `${lineItemsText(inv.line_items)}\n\nSubtotal: $${inv.subtotal}\n${taxLine}${discountLine}` +
      `Total Due: $${inv.total}\n\n${dueLine}${pdfLine}` +
      `Please send payment via your preferred method and reply to this email once it's sent.\n\n${SIGNATURE}`,
  });

  await db.update(env.DB, 'invoice', invoiceId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  });

  return json({ success: true });
}
