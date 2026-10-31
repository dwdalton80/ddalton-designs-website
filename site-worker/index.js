/**
 * Website Worker (static assets + SEO layer).
 *
 * Runs in front of the Vite build so that:
 *  - unknown URLs return a real HTTP 404 (the SPA fallback used to answer 200),
 *  - every public page gets its own <title>/description/canonical/OG tags in the
 *    server HTML, plus a <noscript> text summary for crawlers without JS,
 *  - /portfolio/<id> permanently redirects to /portfolio/<slug>,
 *  - /sitemap.xml is generated from the database (includes every portfolio item).
 *
 * The /api/* routes are handled by the separate API Worker; its more specific
 * route pattern wins before a request ever reaches this Worker.
 */
import { ROUTE_META, SITE, slugify, portfolioMeta as baseMeta } from '../src/lib/seo-meta.js';

const DEFAULT_IMAGE = 'https://assets.ddaltondesigns.com/site/2cbe21348_generated_image.png';

// Paths that are valid SPA routes but should not be indexed or described.
const APP_ROUTE = /^\/(admin(\/.*)?|review\/[^/]+)$/;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function loadPortfolio(env) {
  if (!env.DB) return null;
  try {
    const { results } = await env.DB
      .prepare('SELECT id, title, category, cover_image, images, description, client_name, updated_date FROM portfolio_item ORDER BY featured DESC, "order"')
      .all();
    return results;
  } catch {
    return null; // never let a DB hiccup take the whole site down
  }
}

function coverOf(item) {
  if (item.cover_image) return item.cover_image;
  try { return JSON.parse(item.images || '[]')[0] || null; } catch { return null; }
}

function portfolioMeta(item) {
  return { ...baseMeta(item), h1: item.title, summary: item.description || '', image: coverOf(item) };
}

/** Rewrite the SPA shell's <head> and add a no-JS summary to the body. */
function render(shell, { meta, path, status, noindex }) {
  const url = `${SITE}${path === '/' ? '/' : path}`;
  const image = meta.image || DEFAULT_IMAGE;
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  const set = (attr) => ({ element: (el) => el.setAttribute(attr[0], attr[1]) });
  const content = (v) => ({ element: (el) => el.setAttribute('content', v) });

  const rw = new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(meta.title) })
    .on('meta[name="description"]', content(meta.description))
    .on('meta[name="robots"]', content(robots))
    .on('link[rel="canonical"]', { element: (el) => el.setAttribute('href', url) })
    .on('meta[property="og:title"]', content(meta.title))
    .on('meta[property="og:description"]', content(meta.description))
    .on('meta[property="og:url"]', content(url))
    .on('meta[property="og:image"]', content(image))
    .on('meta[name="twitter:title"]', content(meta.title))
    .on('meta[name="twitter:description"]', content(meta.description))
    .on('meta[name="twitter:image"]', content(image));

  if (!noindex && meta.h1) {
    const nav = Object.entries(ROUTE_META)
      .filter(([p]) => p !== '/privacy' && p !== '/terms')
      .map(([p, m]) => `<li><a href="${p}">${esc(m.h1)}</a></li>`).join('');
    rw.on('body', {
      element: (el) => el.append(
        `<noscript><main><h1>${esc(meta.h1)}</h1><p>${esc(meta.summary || meta.description)}</p><nav><ul>${nav}</ul></nav></main></noscript>`,
        { html: true },
      ),
    });
  }

  const res = rw.transform(new Response(shell.body, { status, headers: shell.headers }));
  return res;
}

async function sitemap(env) {
  const items = (await loadPortfolio(env)) || [];
  const today = new Date().toISOString().slice(0, 10);
  // No lastmod on the static routes. It used to be stamped with today's date
  // on every request, which told crawlers the whole site changed daily and
  // trains them to ignore the field. Omitting it is better than lying; the
  // portfolio entries below carry a real date from the database.
  const urls = Object.keys(ROUTE_META).map((p) => ({
    loc: `${SITE}${p === '/' ? '/' : p}`, priority: p === '/' ? '1.0' : ['/privacy', '/terms'].includes(p) ? '0.3' : '0.8',
  }));
  for (const it of items) {
    const slug = slugify(it.title) || it.id;
    urls.push({ loc: `${SITE}/portfolio/${slug}`, lastmod: (it.updated_date || today).slice(0, 10), priority: '0.6' });
  }
  const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // www served the entire site at a second set of URLs. The canonical tags
    // pointed at the apex so Google mostly coped, but every page genuinely
    // existed twice. 301 so the duplicate resolves rather than competes.
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    const isRead = request.method === 'GET' || request.method === 'HEAD';

    if (isRead && path === '/sitemap.xml') return sitemap(env);

    // Real files (JS/CSS/images/robots.txt/manifest.json...) pass straight through.
    if (isRead && path !== '/') {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }
    if (!isRead) return env.ASSETS.fetch(request);

    const shell = await env.ASSETS.fetch(new Request(new URL('/index.html', url), { headers: request.headers }));

    if (ROUTE_META[path]) {
      return render(shell, { meta: ROUTE_META[path], path, status: 200 });
    }

    if (path.startsWith('/portfolio/')) {
      const param = decodeURIComponent(path.slice('/portfolio/'.length));
      const items = await loadPortfolio(env);
      if (items) {
        const bySlug = items.find((i) => (slugify(i.title) || i.id) === param);
        const byId = bySlug ? null : items.find((i) => i.id === param);
        if (byId) {
          return Response.redirect(`${SITE}/portfolio/${slugify(byId.title) || byId.id}`, 301);
        }
        if (bySlug) {
          return render(shell, { meta: portfolioMeta(bySlug), path, status: 200 });
        }
        return render(shell, { meta: { title: 'Page Not Found | DDalton Designs', description: 'This page could not be found.' }, path, status: 404, noindex: true });
      }
      // DB unavailable: serve the SPA as before rather than erroring.
      return render(shell, { meta: ROUTE_META['/portfolio'], path, status: 200, noindex: true });
    }

    if (APP_ROUTE.test(path)) {
      return render(shell, { meta: { title: 'DDalton Designs', description: 'Private page.' }, path, status: 200, noindex: true });
    }

    return render(shell, {
      meta: { title: 'Page Not Found | DDalton Designs', description: 'This page could not be found.' },
      path, status: 404, noindex: true,
    });
  },
};
