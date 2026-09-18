/**
 * Generic entity CRUD, replacing `base44.entities.<Name>.<op>()`.
 *
 * Routed as POST /api/entities/<Name>/<op>. The entity name comes from the
 * client, so every request is checked against the registry allowlist before it
 * reaches SQL — see lib/entities.ts for why that is the security boundary here.
 *
 * All of these sit behind Cloudflare Access. There is no per-row tenancy left in
 * the app, so "authenticated" is the whole authorisation model; the allowlists
 * constrain *what* can be written, not *who* may write it.
 */

import * as db from '../lib/db';
import { getSpec, pickWritable, parseSort, type EntitySpec } from '../lib/entities';
import { json, badRequest, notFound } from '../lib/http';

const MAX_LIMIT = 500;

/** Columns that may appear in a filter, plus the writable ones. */
function filterableColumns(spec: EntitySpec): Set<string> {
  return new Set([...spec.fields, 'id', 'created_date', 'updated_date']);
}

async function list(db_: D1Database, spec: EntitySpec, body: Record<string, unknown>): Promise<Response> {
  const sort = parseSort(spec, body.sort);
  const limit = Math.min(Number(body.limit) > 0 ? Number(body.limit) : 100, MAX_LIMIT);
  const skip = Number(body.skip) > 0 ? Number(body.skip) : 0;

  const order = sort ? `"${sort.column}" ${sort.dir}` : 'created_date DESC';
  const rows = await db_
    .prepare(`SELECT * FROM ${spec.table} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .bind(limit, skip)
    .all();

  return json(db.decodeRows(spec.table, rows.results ?? []));
}

async function filter(db_: D1Database, spec: EntitySpec, body: Record<string, unknown>): Promise<Response> {
  const query = (body.query ?? {}) as Record<string, unknown>;
  const allowed = filterableColumns(spec);

  const clauses: string[] = [];
  const binds: unknown[] = [];

  for (const [key, value] of Object.entries(query)) {
    // An unknown key is a client bug or an probe; refuse rather than silently
    // returning the whole table, which is what ignoring it would do.
    if (!allowed.has(key)) return badRequest(`Cannot filter on "${key}"`);
    if (value === null) {
      clauses.push(`"${key}" IS NULL`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) return json([]);
      clauses.push(`"${key}" IN (${value.map(() => '?').join(', ')})`);
      binds.push(...value);
    } else {
      clauses.push(`"${key}" = ?`);
      binds.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
    }
  }

  const sort = parseSort(spec, body.sort);
  const order = sort ? `"${sort.column}" ${sort.dir}` : 'created_date DESC';
  const limit = Math.min(Number(body.limit) > 0 ? Number(body.limit) : 100, MAX_LIMIT);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = await db_
    .prepare(`SELECT * FROM ${spec.table} ${where} ORDER BY ${order} LIMIT ?`)
    .bind(...binds, limit)
    .all();

  return json(db.decodeRows(spec.table, rows.results ?? []));
}

export async function handleEntity(
  entityName: string,
  op: string,
  req: Request,
  env: Env,
  actor: string,
): Promise<Response> {
  const spec = getSpec(entityName);
  if (!spec) return notFound(`Entity "${entityName}"`);

  const body = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;

  switch (op) {
    case 'list':
      return list(env.DB, spec, body);

    case 'filter':
      return filter(env.DB, spec, body);

    case 'get': {
      const id = String(body.id ?? '');
      if (!id) return badRequest('id is required');
      const row = await db.get(env.DB, spec.table, id);
      return row ? json(row) : notFound(entityName);
    }

    case 'create': {
      const data = pickWritable(spec, (body.data ?? body) as Record<string, unknown>);
      const created = await db.create(env.DB, spec.table, data, actor);
      return json(created);
    }

    case 'update': {
      const id = String(body.id ?? '');
      if (!id) return badRequest('id is required');
      const data = pickWritable(spec, (body.data ?? {}) as Record<string, unknown>);
      const updated = await db.update(env.DB, spec.table, id, data);
      return updated ? json(updated) : notFound(entityName);
    }

    case 'delete': {
      const id = String(body.id ?? '');
      if (!id) return badRequest('id is required');
      await db.remove(env.DB, spec.table, id);
      return json({ success: true });
    }

    default:
      return notFound(`Operation "${op}"`);
  }
}
