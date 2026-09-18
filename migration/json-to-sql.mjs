/**
 * Turn the Base44 export into D1 INSERT statements.
 *
 *   node migration/json-to-sql.mjs migration/base44-export.json > migration/data.sql
 *   npx wrangler d1 execute ddalton-designs --remote --file=migration/data.sql
 *
 * Load order respects foreign keys (client -> estimate -> invoice).
 * Re-runnable: every statement is INSERT OR REPLACE.
 *
 * No BEGIN/COMMIT: D1 rejects explicit SQL transactions ("please use the
 * state.storage.transaction() APIs instead") and wraps file execution itself.
 * Plain sqlite3 is happy either way, so omitting them keeps one file that
 * loads into both.
 */

import { readFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('usage: node migration/json-to-sql.mjs <base44-export.json>');
  process.exit(1);
}

const { data } = JSON.parse(readFileSync(src, 'utf8'));

const COMMON = ['id', 'created_date', 'updated_date', 'created_by_id'];

// entity -> [table, scalar columns, json columns, boolean columns]
const MAP = {
  Client:        ['client',         ['name','email','phone','company','notes'], [], []],
  ClientRequest: ['client_request', ['name','email','phone','project_type','message','status','budget','description'], [], []],
  Estimate:      ['estimate',       ['client_id','client_name','client_email','subtotal','tax_rate','discount','total','status','sent_at','notes','valid_until'], ['line_items'], []],
  Invoice:       ['invoice',        ['estimate_id','client_id','client_name','client_email','subtotal','tax_rate','discount','total','status','sent_at','paid_amount','due_date','payment_terms','notes','pdf_url'], ['line_items'], []],
  ProjectPlan:   ['project_plan',   ['client_id','client_email','title','description','scope','timeline','total_amount','status','sent_at','signed_at','client_signature','client_name_signed'], ['deliverables'], []],
  PortfolioItem: ['portfolio_item', ['title','category','cover_image','description','url','client_name','order'], ['images'], ['featured']],
  Testimonial:   ['testimonial',    ['client_name','client_title','client_company','quote','description','avatar_url','rating','order'], [], ['featured']],
  Referral:      ['referral',       ['referrer_name','referrer_email','referred_client_name','referred_client_email','status','referral_date','conversion_date','payout_amount','payout_status','notes'], [], []],
  ClientFile:    ['client_file',    ['client_email','client_name','file_url','file_name','file_size','notes'], [], []],
  Expense:       ['expense',        ['date','description','category','amount','vendor','notes','receipt_url'], [], []],
  Task:          ['task',           ['title','project_name','estimated_hours','actual_hours','status','due_date','notes','priority'], [], []],
};

// Parent tables first — foreign keys are enforced.
const ORDER = ['Client','ClientRequest','Estimate','Invoice','ProjectPlan',
               'PortfolioItem','Testimonial','Referral','ClientFile','Expense','Task'];

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

function lit(val, { json = false, bool = false } = {}) {
  if (json) return q(JSON.stringify(Array.isArray(val) ? val : (val ?? [])));
  if (bool) return val ? 1 : 0;
  if (val === null || val === undefined || val === '') return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? 1 : 0;
  return q(val);
}

// ORDER is a reserved word; quote any column that needs it.
const col = (c) => (c === 'order' ? '"order"' : c);

let total = 0;
const out = ['PRAGMA foreign_keys = ON;', ''];

for (const entity of ORDER) {
  const rows = data?.[entity];
  if (!Array.isArray(rows) || rows.length === 0) {
    out.push(`-- ${entity}: no records`, '');
    continue;
  }
  const [table, scalars, jsons, bools] = MAP[entity];
  const cols = [...COMMON, ...scalars, ...jsons, ...bools];

  out.push(`-- ${entity} -> ${table} (${rows.length} records)`);
  for (const r of rows) {
    const vals = [
      lit(r.id),
      lit(r.created_date ?? new Date().toISOString()),
      lit(r.updated_date ?? r.created_date ?? new Date().toISOString()),
      lit(r.created_by_id),
      ...scalars.map((c) => lit(r[c])),
      ...jsons.map((c) => lit(r[c], { json: true })),
      ...bools.map((c) => lit(r[c], { bool: true })),
    ];
    out.push(
      `INSERT OR REPLACE INTO ${table} (${cols.map(col).join(', ')}) VALUES (${vals.join(', ')});`
    );
    total++;
  }
  out.push('');
}

process.stdout.write(out.join('\n') + '\n');
console.error(`${total} rows across ${ORDER.length} tables`);
