/**
 * Download every Base44-hosted asset referenced by the app or its data.
 *
 *   node migration/fetch-assets.mjs
 *
 * Reads migration/base44-export.json plus index.html and src/, downloads each
 * asset into migration/assets/files/<prefix>/, and writes a manifest mapping
 * the original URL to its planned R2 key.
 *
 * These URLs die when the Base44 subscription is cancelled, so this must run
 * (and be verified) before cancelling anything.
 *
 * Re-runnable: already-downloaded files are skipped unless --force is passed.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = 'migration/assets';
const FILES = join(ROOT, 'files');
const FORCE = process.argv.includes('--force');
const CONCURRENCY = 4;

const isBase44 = (u) => /^https:\/\/(base44\.app|media\.base44\.com)\//.test(u);
const URL_RE = /https:\/\/(?:base44\.app|media\.base44\.com)\/[^\s"'<>)\\]+/g;

// ---------------------------------------------------------------- discovery

const found = new Map(); // url -> { prefix, sources:Set }

function add(url, prefix, source) {
  // Strip Base44's on-the-fly resize suffix (/v1/fill/w_1200,h_630/<name>)
  // so we archive the original rather than a derived thumbnail.
  const clean = url.replace(/\/v1\/fill\/[^/]+\/[^/]+$/, '');
  if (!isBase44(clean)) return;
  if (!found.has(clean)) found.set(clean, { prefix, sources: new Set() });
  found.get(clean).sources.add(source);
}

// 1. Asset URLs in the exported data, categorised by entity.
const exportPath = 'migration/base44-export.json';
if (!existsSync(exportPath)) {
  console.error(`missing ${exportPath} — run the export first`);
  process.exit(1);
}
const data = JSON.parse(readFileSync(exportPath, 'utf8')).data;

const PREFIX_BY_ENTITY = {
  PortfolioItem: 'portfolio',
  Testimonial: 'portfolio',
  ClientFile: 'client-files',
  ClientRequest: 'client-files',
  Invoice: 'invoices',
  Expense: 'receipts',
};

for (const [entity, rows] of Object.entries(data)) {
  const prefix = PREFIX_BY_ENTITY[entity] || 'misc';
  for (const u of JSON.stringify(rows).match(URL_RE) || []) add(u, prefix, entity);
}

// 2. Hardcoded URLs in the shipped HTML and source.
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?|css|html|json)$/.test(e.name)) {
      for (const u of readFileSync(p, 'utf8').match(URL_RE) || []) add(u, 'site', p);
    }
  }
}
for (const p of ['index.html']) {
  if (existsSync(p)) for (const u of readFileSync(p, 'utf8').match(URL_RE) || []) add(u, 'site', p);
}
for (const d of ['src', 'public']) if (existsSync(d)) walk(d);

// ---------------------------------------------------------------- download

const entries = [...found.entries()].map(([url, meta]) => {
  // Both URL shapes end in <hash>_<originalname>, which is already unique.
  const base = decodeURIComponent(url.split('/').pop().split('?')[0]);
  const key = `${meta.prefix}/${base}`;
  return { url, key, local: join(FILES, key), sources: [...meta.sources] };
});

console.log(`Discovered ${entries.length} Base44 assets`);
const byPrefix = {};
for (const e of entries) byPrefix[e.key.split('/')[0]] = (byPrefix[e.key.split('/')[0]] || 0) + 1;
for (const [p, n] of Object.entries(byPrefix)) console.log(`  ${p}: ${n}`);
console.log();

let ok = 0, skipped = 0;
const failed = [];

async function download(e) {
  if (!FORCE && existsSync(e.local) && statSync(e.local).size > 0) { skipped++; return; }
  mkdirSync(dirname(e.local), { recursive: true });
  const res = await fetch(e.url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty body');
  writeFileSync(e.local, buf);
  e.bytes = buf.length;
  e.contentType = res.headers.get('content-type') || 'application/octet-stream';
  ok++;
}

const queue = [...entries];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const e = queue.shift();
    try {
      await download(e);
      process.stdout.write('.');
    } catch (err) {
      failed.push({ url: e.url, error: String(err.message || err) });
      process.stdout.write('x');
    }
  }
}));
console.log('\n');

// Fill in size/type for files that were skipped this run.
for (const e of entries) {
  if (e.bytes === undefined && existsSync(e.local)) e.bytes = statSync(e.local).size;
}

mkdirSync(ROOT, { recursive: true });
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify({
  generated_at: new Date().toISOString(),
  count: entries.length,
  failed,
  assets: entries.map(({ url, key, bytes, contentType, sources }) => ({ url, key, bytes, contentType, sources })),
}, null, 2));

const total = entries.reduce((n, e) => n + (e.bytes || 0), 0);
console.log(`downloaded ${ok}, skipped ${skipped}, failed ${failed.length}`);
console.log(`total ${(total / 1024 / 1024).toFixed(1)} MB`);
console.log(`manifest: ${join(ROOT, 'manifest.json')}`);
if (failed.length) {
  console.log('\nFAILED — these will break when Base44 is cancelled:');
  for (const f of failed) console.log(`  ${f.error}  ${f.url}`);
  process.exitCode = 1;
}
