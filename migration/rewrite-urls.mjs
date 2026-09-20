/**
 * Rewrite Base44 asset URLs in the exported data to their R2 equivalents.
 *
 *   node migration/rewrite-urls.mjs https://assets.ddaltondesigns.com
 *   node migration/rewrite-urls.mjs https://assets.ddaltondesigns.com --private https://files.ddaltondesigns.com
 *
 * Reads  migration/base44-export.json + migration/assets/manifest.json
 * Writes migration/base44-export.rewritten.json
 *
 * Then regenerate the SQL from the rewritten export:
 *   node migration/json-to-sql.mjs migration/base44-export.rewritten.json > migration/data.sql
 *
 * Handles URLs wherever they appear — including inside free text such as
 * ClientRequest.description ("Attachment: https://...") — and strips Base44's
 * /v1/fill/... resize suffix so rewritten links point at the original object.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const publicBase = process.argv[2];
const privIdx = process.argv.indexOf('--private');
const privateBase = privIdx > -1 ? process.argv[privIdx + 1] : null;

if (!publicBase || publicBase.startsWith('--')) {
  console.error('usage: node migration/rewrite-urls.mjs <public-base-url> [--private <private-base-url>]');
  process.exit(1);
}

const strip = (u) => u.replace(/\/+$/, '');
const PUB = strip(publicBase);
const PRIV = privateBase ? strip(privateBase) : null;

const exp = JSON.parse(readFileSync('migration/base44-export.json', 'utf8'));
const manifest = JSON.parse(readFileSync('migration/assets/manifest.json', 'utf8'));

// original URL -> new URL
const map = new Map();
for (const a of manifest.assets) {
  const isPrivate = a.key.startsWith('client-files/');
  const base = isPrivate ? (PRIV || PUB) : PUB;
  map.set(a.url, `${base}/${a.key}`);
}

const URL_RE = /https:\/\/(?:base44\.app|media\.base44\.com)\/[^\s"'<>)\\]+/g;

let hits = 0;
const unmapped = new Set();

function rewriteString(s) {
  return s.replace(URL_RE, (m) => {
    // Match the manifest's canonical form (resize suffix stripped).
    const canonical = m.replace(/\/v1\/fill\/[^/]+\/[^/]+$/, '');
    const next = map.get(canonical);
    if (next) { hits++; return next; }
    unmapped.add(m);
    return m;
  });
}

function walk(node) {
  if (typeof node === 'string') return rewriteString(node);
  if (Array.isArray(node)) return node.map(walk);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v);
    return out;
  }
  return node;
}

const rewritten = { ...exp, data: walk(exp.data) };

writeFileSync('migration/base44-export.rewritten.json', JSON.stringify(rewritten, null, 2));

console.log(`rewrote ${hits} URL references`);
console.log(`  public  -> ${PUB}`);
console.log(`  private -> ${PRIV || PUB + '  (no --private given; client files share the public base)'}`);
console.log('wrote migration/base44-export.rewritten.json');

// Nothing should remain — a leftover Base44 URL is an asset that dies on cancellation.
const remaining = (JSON.stringify(rewritten).match(URL_RE) || []).length;
if (remaining || unmapped.size) {
  console.log(`\nWARNING: ${remaining} Base44 URL(s) still present`);
  for (const u of unmapped) console.log(`  unmapped: ${u}`);
  process.exitCode = 1;
} else {
  console.log('\nno Base44 URLs remain in the data');
}
