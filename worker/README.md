# DDalton Designs API Worker

Replaces the Base44 backend functions. Each former function is a route, so the
frontend's `base44.functions.invoke('sendInvoice', payload)` becomes
`POST /api/sendInvoice` with the same body and the same response shape.

## Routes

| Route | Auth | Replaces |
|---|---|---|
| `POST /api/sendContactConfirmation` | **public** | `sendContactConfirmation` |
| `POST /api/createTask` | Access | `createTask` |
| `POST /api/updateTask` | Access | `updateTask` |
| `POST /api/deleteTask` | Access | `deleteTask` |
| `POST /api/sendEstimate` | Access | `sendEstimate` |
| `POST /api/sendInvoice` | Access | `sendInvoice` |
| `POST /api/sendProjectPlan` | Access | `sendProjectPlan` |
| `POST /api/sendLeadQualification` | Access | `sendLeadQualification` |
| `POST /api/sendReferrerConfirmation` | Access | `sendReferrerConfirmation` |
| `POST /api/sendReferralThankyou` | Access | `sendReferralThankyou` |
| `POST /api/sendReferralStatusUpdate` | Access | `sendReferralStatusUpdate` |

All 11 Base44 functions are ported. `postPortfolioToInstagram` and
`postPortfolioToLinkedin` are deliberately absent — the social connectors were
removed before the migration.

## How the Base44 concepts map

| Base44 | Here |
|---|---|
| `base44.auth.me()` + `role !== 'admin'` | Cloudflare Access JWT (`lib/access.ts`) |
| `base44.entities.X.get/create/update/delete` | D1 via `lib/db.ts` |
| `base44.asServiceRole.entities.X` | same — there is no per-row tenancy left |
| `Deno.env.get('RESEND_API_KEY')` | `env.RESEND_API_KEY` |
| Row-level security | Access at the edge + one admin |

### Why a valid Access token is the admin check

The app has exactly one class of authenticated user. The client portal and
referrer logins were removed, so `/admin/*` is the only authenticated surface.
Anyone Access admits is an admin by definition — **keep the Access policy narrow
and this stays true.** If you ever add a second Access application or widen the
policy, revisit this: `lib/access.ts` verifies the `aud` claim precisely so a
token minted for a different app is rejected.

## Setup

```bash
npm install

# 1. Zero Trust -> Access -> Add an application, covering ddaltondesigns.com/admin*
#    Policy: allow your email only. Then copy the team domain and AUD tag into
#    wrangler.jsonc vars:
#      ACCESS_TEAM_DOMAIN  e.g. ddaltondesigns.cloudflareaccess.com
#      ACCESS_AUD          the application's Audience tag

# 2. Secrets
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY   # optional; unset skips the check

# 3. Deploy
npm run deploy
```

`ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` must be set before deploying. With them
empty every admin route returns 403 — safe, but nothing works.

## Verified

- `tsc --noEmit` clean under `strict` + `noUncheckedIndexedAccess`
- `wrangler deploy --dry-run` builds (30.4 KiB / 9.1 KiB gzipped), all bindings resolve
- Local `wrangler dev` smoke tests:
  - every admin route returns 403 with no token **and** with a forged token
  - unknown routes 404, non-POST 405
  - the public contact route rejects missing fields, invalid email, overlong
    email, short name, short message and unknown project type — these are the
    open-relay protections carried over from Base44

Not yet exercised end to end: actual email delivery and the D1 writes behind
authenticated routes, both of which need the secrets above.

## Notes carried over from the Base44 implementation

- **Email bodies are reproduced verbatim.** Clients have received these before;
  the wording shouldn't drift because the hosting moved.
- **HTML escaping is preserved** on every interpolated value, and `safeUrl()`
  still restricts attachment links to http/https so a submitted `javascript:`
  URL can't become a live link in the notification email.
- **`sendReferrerConfirmation` / `sendReferralThankyou` were "admin OR the
  referrer"** on Base44, because referrers could log in at `/my-referrals`.
  That portal is gone, so the second branch is unreachable and both are
  admin-only here. If referrer logins return, that check returns with them.
- **`sendContactConfirmation` now writes the `client_request` row itself.** The
  form used to create it through the SDK; that path went away with the SDK, and
  without this submissions would email through but never appear in the admin
  list.
