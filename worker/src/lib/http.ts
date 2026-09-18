/** Small response helpers, matching the shapes the frontend already expects. */

export const json = (data: unknown, status = 200): Response =>
  Response.json(data, { status });

export const badRequest = (message: string): Response => json({ error: message }, 400);
export const forbidden = (): Response => json({ error: 'Forbidden' }, 403);
export const notFound = (what: string): Response => json({ error: `${what} not found` }, 404);

/** Money formatting shared by the estimate, invoice and plan emails. */
export const money = (n: unknown): string => Number(n ?? 0).toFixed(2);

/**
 * Renders the `• description: qty × $rate = $total` lines used in estimate and
 * invoice emails. Kept identical to the Base44 output so sent mail doesn't
 * change shape mid-migration.
 */
export function lineItemsText(items: unknown): string {
  if (!Array.isArray(items)) return '';
  return items
    .map((i: Record<string, unknown>) => `• ${i.description}: ${i.quantity} × $${i.rate} = $${i.total}`)
    .join('\n');
}
