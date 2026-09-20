/**
 * File upload and retrieval, replacing base44.integrations.Core.UploadFile and
 * UploadPublicFile.
 *
 * Two buckets, matching the split made during the asset migration:
 *   ASSETS         public  — served directly from assets.ddaltondesigns.com
 *   PRIVATE_FILES  private — no public domain; served only through this Worker
 *
 * On Base44 both kinds lived on a public /files/mp/public/ path guarded only by
 * an unguessable URL. Client files are genuinely private now: reading one goes
 * through GET /api/files/<key>, which is behind Access.
 */

import { json, badRequest, notFound } from '../lib/http';

const MAX_BYTES = 25 * 1024 * 1024;

const EXT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  heic: 'image/heic',
  eps: 'application/postscript',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

/** Strips path separators and anything else that could escape the prefix. */
function safeName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'file';
  return base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'file';
}

function randomPrefix(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/files/upload  (multipart/form-data)
 *   file        the upload
 *   visibility  "public" (default) | "private"
 *   prefix      optional folder, e.g. "portfolio" or "receipts"
 */
export async function uploadFile(req: Request, env: Env): Promise<Response> {
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest('Expected multipart/form-data');

  const file = form.get('file');
  if (!(file instanceof File)) return badRequest('file is required');
  if (file.size === 0) return badRequest('file is empty');
  if (file.size > MAX_BYTES) return badRequest('file exceeds 25MB');

  const isPrivate = String(form.get('visibility') ?? 'public') === 'private';
  const rawPrefix = String(form.get('prefix') ?? (isPrivate ? 'client-files' : 'uploads'));
  const prefix = rawPrefix.replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'uploads';

  const name = safeName(file.name || 'file');
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const key = `${prefix}/${randomPrefix()}_${name}`;

  const bucket = isPrivate ? env.PRIVATE_FILES : env.ASSETS;
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: EXT_TYPES[ext] ?? file.type ?? 'application/octet-stream' },
  });

  // Public objects are addressable on the asset domain; private ones only
  // through this Worker, so the caller never gets a directly-fetchable URL.
  const url = isPrivate ? `/api/files/${key}` : `${env.ASSETS_BASE_URL}/${key}`;

  return json({ file_url: url, file_name: file.name, file_size: file.size, key });
}

/** GET /api/files/<key> — streams a private object. Behind Access. */
export async function getPrivateFile(key: string, env: Env): Promise<Response> {
  if (!key) return badRequest('key is required');

  const obj = await env.PRIVATE_FILES.get(key);
  if (!obj) return notFound('File');

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  // These are client documents; never let a shared cache hold them.
  headers.set('Cache-Control', 'private, no-store');

  return new Response(obj.body, { headers });
}
