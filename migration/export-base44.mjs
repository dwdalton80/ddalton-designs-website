/**
 * Full data export from Base44.
 *
 * Run from the repo root, AFTER `npx base44 login`:
 *
 *   npx base44 exec < migration/export-base44.mjs > migration/base44-export.json
 *
 * `base44 exec` runs this server-side with a pre-authenticated `base44` global,
 * so there is no API key to manage and nothing to configure. It writes nothing
 * to disk itself — the JSON goes to stdout, which is why you redirect it.
 *
 * Progress messages go to stderr so they don't corrupt the JSON on stdout.
 */

const ENTITIES = [
  'Client',
  'ClientFile',
  'ClientRequest',
  'Estimate',
  'Expense',
  'Invoice',
  'PortfolioItem',
  'ProjectPlan',
  'Referral',
  'Task',
  'Testimonial',
  'User',
  // 'PortalMessage',  // dead since the portal was removed; uncomment to archive it anyway
];

// Max page size is 5,000; 1,000 keeps each response small and predictable.
const PAGE = 1000;

// Prefer the service role so nothing is hidden by row-level security, but fall
// back to the caller's own access when no service token is available.
// NOTE: `base44.asServiceRole.entities[name]` returns a proxy that only throws
// when you actually call it, so the fallback has to wrap the call, not the lookup.
async function listPage(name, skip, preferServiceRole) {
  if (preferServiceRole) {
    try {
      return { rows: await base44.asServiceRole.entities[name].list('created_date', PAGE, skip), mode: 'serviceRole' };
    } catch {
      // fall through to user access
    }
  }
  return { rows: await base44.entities[name].list('created_date', PAGE, skip), mode: 'user' };
}

async function dumpEntity(name) {
  const rows = [];
  let skip = 0;
  let mode = 'user';
  let useServiceRole = true;

  while (true) {
    const res = await listPage(name, skip, useServiceRole);
    mode = res.mode;
    if (res.mode === 'user') useServiceRole = false; // don't retry per page
    const page = res.rows;
    if (!Array.isArray(page)) break;
    rows.push(...page);
    if (page.length < PAGE) break;
    skip += PAGE;
  }

  console.error(`  ${name}: ${rows.length} records (${mode})`);
  return rows;
}

const out = {};
const counts = {};
const failed = {};

console.error('Exporting Base44 entities...');

for (const name of ENTITIES) {
  try {
    const rows = await dumpEntity(name);
    out[name] = rows;
    counts[name] = rows.length;
  } catch (err) {
    // Keep going — one unreadable entity shouldn't lose the whole export.
    console.error(`  ${name}: FAILED — ${err?.message || err}`);
    failed[name] = String(err?.message || err);
  }
}

console.error('\nSummary:');
for (const [k, v] of Object.entries(counts)) console.error(`  ${k.padEnd(16)} ${v}`);
if (Object.keys(failed).length) {
  console.error('\nFAILED entities (re-run or export from the dashboard):');
  for (const [k, v] of Object.entries(failed)) console.error(`  ${k}: ${v}`);
}

// Single JSON document on stdout.
console.log(JSON.stringify({
  exported_at: new Date().toISOString(),
  counts,
  failed,
  data: out,
}, null, 2));
