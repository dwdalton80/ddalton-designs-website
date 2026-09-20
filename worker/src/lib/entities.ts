/**
 * Entity registry.
 *
 * Base44 derived the writable shape of each entity from base44/entities/*.jsonc
 * and enforced it server-side. Nothing does that for us now, so the allowlists
 * below are the enforcement point: an entity name that isn't a key here is not
 * addressable, and a field that isn't in its `fields` list is dropped before it
 * reaches SQL.
 *
 * This matters more than it looks. The generic CRUD endpoint takes an entity
 * name from the client; without the registry that becomes "write any column of
 * any table", including id and created_by_id.
 */

export interface EntitySpec {
  table: string;
  /** Columns a client may write. The id and timestamp columns are excluded by design. */
  fields: readonly string[];
  /** Columns safe to sort by. */
  sortable: readonly string[];
  /**
   * Readable without authentication.
   *
   * Mirrors the original Base44 RLS, where PortfolioItem and Testimonial were
   * the only entities with public read — the marketing site renders both on
   * pages anyone can visit. Everything else stays behind Access. Writes are
   * always admin-only regardless of this flag.
   */
  publicRead?: boolean;
}

const COMMON_SORT = ['created_date', 'updated_date'] as const;

export const ENTITIES: Record<string, EntitySpec> = {
  Client: {
    table: 'client',
    fields: ['name', 'email', 'phone', 'company', 'notes'],
    sortable: [...COMMON_SORT, 'name', 'email'],
  },
  ClientRequest: {
    table: 'client_request',
    fields: ['name', 'email', 'phone', 'project_type', 'message', 'status', 'budget', 'description'],
    sortable: [...COMMON_SORT, 'status'],
  },
  ClientFile: {
    table: 'client_file',
    fields: ['client_email', 'client_name', 'file_url', 'file_name', 'file_size', 'notes'],
    sortable: [...COMMON_SORT, 'file_name'],
  },
  Estimate: {
    table: 'estimate',
    fields: [
      'client_id', 'client_name', 'client_email', 'line_items', 'subtotal',
      'tax_rate', 'discount', 'total', 'status', 'sent_at', 'notes', 'valid_until',
    ],
    sortable: [...COMMON_SORT, 'status', 'total', 'valid_until'],
  },
  Invoice: {
    table: 'invoice',
    fields: [
      'estimate_id', 'client_id', 'client_name', 'client_email', 'line_items',
      'subtotal', 'tax_rate', 'discount', 'total', 'status', 'sent_at',
      'paid_amount', 'due_date', 'payment_terms', 'notes', 'pdf_url',
    ],
    sortable: [...COMMON_SORT, 'status', 'total', 'due_date'],
  },
  ProjectPlan: {
    table: 'project_plan',
    fields: [
      'client_id', 'client_email', 'title', 'description', 'scope', 'deliverables',
      'timeline', 'total_amount', 'status', 'sent_at', 'signed_at',
      'client_signature', 'client_name_signed',
    ],
    sortable: [...COMMON_SORT, 'status', 'title'],
  },
  PortfolioItem: {
    table: 'portfolio_item',
    fields: ['title', 'category', 'cover_image', 'images', 'description', 'url', 'client_name', 'featured', 'order'],
    sortable: [...COMMON_SORT, 'order', 'title', 'category', 'featured'],
    publicRead: true,
  },
  Testimonial: {
    table: 'testimonial',
    fields: ['client_name', 'client_title', 'client_company', 'quote', 'description', 'avatar_url', 'rating', 'featured', 'order'],
    sortable: [...COMMON_SORT, 'order', 'rating', 'featured'],
    publicRead: true,
  },
  Referral: {
    table: 'referral',
    fields: [
      'referrer_name', 'referrer_email', 'referred_client_name', 'referred_client_email',
      'status', 'referral_date', 'conversion_date', 'payout_amount', 'payout_status', 'notes',
    ],
    sortable: [...COMMON_SORT, 'status', 'payout_status', 'referral_date'],
  },
  Task: {
    table: 'task',
    fields: ['title', 'project_name', 'estimated_hours', 'actual_hours', 'status', 'due_date', 'notes', 'priority'],
    sortable: [...COMMON_SORT, 'status', 'priority', 'due_date'],
  },
  Expense: {
    table: 'expense',
    fields: ['date', 'description', 'category', 'amount', 'vendor', 'notes', 'receipt_url'],
    sortable: [...COMMON_SORT, 'date', 'amount', 'category'],
  },
};

export function getSpec(name: string): EntitySpec | null {
  return Object.prototype.hasOwnProperty.call(ENTITIES, name) ? (ENTITIES[name] as EntitySpec) : null;
}

/** Drops any field not on the entity's allowlist. */
export function pickWritable(spec: EntitySpec, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of spec.fields) {
    if (key in data) out[key] = data[key];
  }
  return out;
}

/**
 * Base44's sort syntax: "field" ascending, "-field" descending.
 * Returns null for anything not on the sortable allowlist, so an unexpected
 * value falls back to the default rather than being interpolated into SQL.
 */
export function parseSort(spec: EntitySpec, sort: unknown): { column: string; dir: 'ASC' | 'DESC' } | null {
  if (typeof sort !== 'string' || sort.length === 0) return null;
  const dir = sort.startsWith('-') ? 'DESC' : 'ASC';
  const raw = sort.startsWith('-') ? sort.slice(1) : sort;
  if (!spec.sortable.includes(raw)) return null;
  return { column: raw, dir };
}

/** Operations that only read. */
export const READ_OPS = new Set(['list', 'filter', 'get']);

/** True when this entity/op pair may be served without authentication. */
export function isPublicRead(spec: EntitySpec, op: string): boolean {
  return spec.publicRead === true && READ_OPS.has(op);
}
