/**
 * D1 access, shaped to replace the Base44 entity SDK.
 *
 * Base44 gave every entity `.get()`, `.create()`, `.update()`, `.delete()` and
 * returned plain objects with JSON fields already parsed. These helpers give
 * the route handlers the same shape so the ported logic reads like the original
 * rather than being rewritten around SQL.
 *
 * Two things the SDK did implicitly and we must do explicitly:
 *   - ids: Base44 generated them; we mint one on create.
 *   - JSON columns: line_items / images / deliverables are TEXT in SQLite, so
 *     they are parsed on read and stringified on write.
 */

// Columns stored as JSON text, by table.
const JSON_COLUMNS: Record<string, string[]> = {
  estimate: ['line_items'],
  invoice: ['line_items'],
  project_plan: ['deliverables'],
  portfolio_item: ['images'],
};

// Columns stored as INTEGER 0/1 that the app treats as booleans.
const BOOL_COLUMNS: Record<string, string[]> = {
  portfolio_item: ['featured'],
  testimonial: ['featured'],
};

export function newId(): string {
  // Base44 ids were 24 hex chars; matching the shape keeps exported data and
  // newly created rows visually consistent.
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function decodeRow<T extends Record<string, unknown>>(table: string, row: T | null): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = { ...row };
  for (const col of JSON_COLUMNS[table] ?? []) {
    if (typeof out[col] === 'string') {
      try {
        out[col] = JSON.parse(out[col] as string);
      } catch {
        out[col] = [];
      }
    }
  }
  for (const col of BOOL_COLUMNS[table] ?? []) {
    if (out[col] !== undefined && out[col] !== null) out[col] = Boolean(out[col]);
  }
  return out as T;
}

function encodeValue(table: string, col: string, value: unknown): unknown {
  if ((JSON_COLUMNS[table] ?? []).includes(col)) return JSON.stringify(value ?? []);
  if ((BOOL_COLUMNS[table] ?? []).includes(col)) return value ? 1 : 0;
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

/** Decodes a set of rows read straight from D1 (list/filter paths). */
export function decodeRows<T extends Record<string, unknown>>(table: string, rows: T[]): T[] {
  return rows.map((r) => decodeRow(table, r) as T);
}

export async function get<T extends Record<string, unknown>>(
  db: D1Database,
  table: string,
  id: string,
): Promise<T | null> {
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<T>();
  return decodeRow(table, row);
}

export async function create<T extends Record<string, unknown>>(
  db: D1Database,
  table: string,
  data: Record<string, unknown>,
  createdBy?: string,
): Promise<T> {
  const id = newId();
  const now = new Date().toISOString();

  // Undefined means "not supplied" — let the column default apply rather than
  // writing an explicit NULL over it.
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);

  const cols = ['id', 'created_date', 'updated_date', 'created_by_id', ...entries.map(([k]) => k)];
  const vals = [id, now, now, createdBy ?? null, ...entries.map(([k, v]) => encodeValue(table, k, v))];

  const quoted = cols.map((c) => (c === 'order' ? '"order"' : c));
  const placeholders = cols.map(() => '?').join(', ');

  await db
    .prepare(`INSERT INTO ${table} (${quoted.join(', ')}) VALUES (${placeholders})`)
    .bind(...vals)
    .run();

  return (await get<T>(db, table, id)) as T;
}

export async function update<T extends Record<string, unknown>>(
  db: D1Database,
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<T | null> {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return get<T>(db, table, id);

  const sets = entries.map(([k]) => `${k === 'order' ? '"order"' : k} = ?`);
  sets.push('updated_date = ?');

  const vals = [...entries.map(([k, v]) => encodeValue(table, k, v)), new Date().toISOString(), id];

  await db.prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return get<T>(db, table, id);
}

export async function remove(db: D1Database, table: string, id: string): Promise<void> {
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}
