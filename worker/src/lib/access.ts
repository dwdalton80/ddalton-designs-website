/**
 * Cloudflare Access authentication.
 *
 * On Base44 every admin function began with:
 *
 *   const user = await base44.auth.me();
 *   if (!user || user.role !== 'admin') return 403;
 *
 * Here that boundary moves to the edge. Access authenticates the caller before
 * the request reaches this Worker and injects a signed JWT; we verify the
 * signature and read the identity out of it. There is no user table, no
 * password handling, and no session code in the app.
 *
 * The app has exactly one class of authenticated user (the studio owner), so
 * "is this a valid Access token for our application" *is* the admin check.
 * Anyone Access lets through is an admin by definition — keep the Access policy
 * narrow and this stays true.
 */

export interface AccessIdentity {
  email: string;
  sub: string;
}

const JWT_HEADER = 'Cf-Access-Jwt-Assertion';

// JWKS changes rarely; refetching per request would add latency to every call.
let jwksCache: { keys: CryptoKey[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadKeys(teamDomain: string): Promise<CryptoKey[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;

  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Unable to fetch Access JWKS: HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: JsonWebKey[] };

  const imported = await Promise.all(
    keys.map((jwk) =>
      crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']),
    ),
  );

  jwksCache = { keys: imported, fetchedAt: now };
  return imported;
}

/**
 * Returns the caller's identity, or null if the request carries no valid
 * Access token. Callers translate null into a 403.
 */
export async function authenticate(request: Request, env: Env): Promise<AccessIdentity | null> {
  const token = request.headers.get(JWT_HEADER);
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [rawHeader, rawPayload, rawSignature] = parts as [string, string, string];

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(rawPayload)));
  } catch {
    return null;
  }

  // Audience must match this specific Access application, otherwise a token
  // minted for any other app on the same team would be accepted here.
  const aud = payload.aud;
  const audOk = Array.isArray(aud) ? aud.includes(env.ACCESS_AUD) : aud === env.ACCESS_AUD;
  if (!audOk) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < nowSec) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > nowSec) return null;

  const signed = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
  const signature = b64urlToBytes(rawSignature);

  const keys = await loadKeys(env.ACCESS_TEAM_DOMAIN);
  for (const key of keys) {
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
    if (ok) {
      return {
        email: String(payload.email ?? ''),
        sub: String(payload.sub ?? ''),
      };
    }
  }
  return null;
}
