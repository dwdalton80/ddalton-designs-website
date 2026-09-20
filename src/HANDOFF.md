# DDalton Designs — Developer Handoff

A guide for any developer taking over this project. Read this first.

> **This app used to run on Base44 and no longer does.** It was migrated to
> Cloudflare (Workers + D1 + R2 + Access). If you find a doc, comment, or
> tutorial that talks about the Base44 SDK, RLS rules, or `base44.auth`, it
> predates the migration. `worker/README.md` is the authoritative reference for
> the backend; `migration/` holds the migration scripts and the DNS runbook.

---

## 1. What this app is

**DDalton Designs** is the client-facing website and operations tool for a freelance design & photography studio (Derek Dalton). It does two jobs in one codebase:

1. **Public marketing site** — portfolio, services, about, contact, referrals.
2. **Admin back-office** — the studio owner manages clients, estimates, invoices, tasks, portfolio, testimonials, referrals, expenses, and project plans.

It is **no-login for clients.** Estimates, invoices, and project plans are emailed to clients (PDF link + full details in the body); clients accept, pay, or sign by replying to the email, and the admin manually updates statuses in the dashboard. Clients send files through the contact form. Referrals are submitted via a public form, and referrers get status updates by email (no tracker dashboard).

There is exactly **one** class of authenticated user: the studio owner. Cloudflare Access is what authenticates them.

**Live URL:** https://ddaltondesigns.com

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 (Vite, ESM only — no `require()`) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| Routing | react-router-dom v6 |
| Data fetching | @tanstack/react-query |
| Animations | framer-motion |
| Rich text | react-quill |
| PDF generation | jspdf + html2canvas (client-side, in `src/lib/invoicePdf.js`) |
| Icons | lucide-react |
| Frontend hosting | Cloudflare Workers (static assets, `wrangler.json` at the repo root) |
| API | Cloudflare Worker — `worker/`, TypeScript, serves `/api/*` |
| Database | Cloudflare D1 (SQLite) — `ddalton-designs` |
| File storage | Cloudflare R2 — `ddalton-designs-assets` (public), `ddalton-designs-private` (private) |
| Auth | Cloudflare Access (Zero Trust) |
| Email | Resend |

---

## 3. Getting started locally

1. Clone the repo.
2. `npm install` (frontend), then `cd worker && npm install` (API).
3. Frontend: `npm run dev` — Vite dev server.
4. API: `cd worker && npm run dev` — `wrangler dev`.

No `.env.local` and no API keys are needed to run the frontend. There are no
`VITE_*` variables; the API is same-origin at `/api`.

**Deploying** — two separate Workers, each deployed from its own config:

```bash
npm run build && npx wrangler deploy --config wrangler.json   # frontend
cd worker && npm run deploy                                    # API
```

> Always pass `--config`. A bare `wrangler deploy` inside `worker/` picks up the
> **root** `wrangler.json` and deploys the wrong project. The worker's npm
> scripts already pin it; the root one is the trap.

---

## 4. Project structure

```
src/
  App.jsx                # Router — all routes live here (source of truth for pages)
  main.jsx               # Entry point
  index.css              # Design tokens (colors, fonts) — :root + .dark
  pages/                 # Page components (public, admin/)
  components/            # Shared components + ui/ (shadcn) + admin/
  lib/                   # ThemeContext, utils, sanitizeHtml, invoicePdf, PageNotFound
  api/client.js          # API client — the Base44 SDK's replacement
  api/base44Client.js    # Thin re-export of client.js (kept so page imports still resolve)
worker/                  # The API. See worker/README.md — start there.
  src/index.ts           # Router: PUBLIC_ROUTES vs ADMIN_ROUTES, entity CRUD, files
  src/routes/            # One module per former Base44 function
  src/lib/access.ts      # Access JWT verification
  src/lib/entities.ts    # Entity registry — the real write boundary
  wrangler.jsonc         # Bindings: D1, both R2 buckets, Access vars
migration/               # Export/load scripts, schema.sql, DNS cutover runbook
base44/                  # Legacy source of record. Not executed. See §8.
wrangler.json            # Frontend Worker (static assets) config
```

**Import rule:** always use the `@/` alias (`@/components/...`, `@/lib/...`). Never use relative `src/` paths — they break on moves.

---

## 5. Routing & access control

Routes are defined in `src/App.jsx`. Access is enforced in two layers, and the
**first one is the real boundary**:

- **Cloudflare Access (the edge).** Authenticates the request before it reaches
  any Worker and injects a signed JWT. There is no login page in this app, no
  session code, and no user table.
- **The Worker (defence in depth).** `worker/src/lib/access.ts` verifies the JWT
  signature and the `aud` claim. `worker/src/lib/entities.ts` allowlists which
  entities and which fields a request may touch — the entity name arrives from
  the client, so this is what stops "write any column of any table".

There is deliberately **no `ProtectedRoute`** any more. Client-side gating was
only ever UX; the boundary now sits in front of the origin.

Two Access applications exist and both matter — the exact destinations and the
wildcard trap are documented in `worker/README.md`. In short: `/admin` and
`/api/*` require login, and a short list of public read endpoints is bypassed so
the marketing pages work for logged-out visitors.

### Public routes (no login)
`/` (Home), `/portfolio`, `/portfolio/:id`, `/about`, `/services`, `/contact`, `/referrals`, `/terms`, `/privacy`

### Auth routes
**None.** Access owns identity. `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`,
`ResetPassword.jsx`, `OAuthConsent.jsx` and `AuthContext` were deleted — don't
recreate them.

### Protected routes (Access required — admin only)
- `/admin/*` — admin back-office

> There is no client portal and no "My Referrals" tracker. Clients never log in.

### Admin sub-routes (under `/admin`)
`/admin` (dashboard), `requests`, `clients`, `estimates`, `invoices`, `tasks`, `portfolio`, `plans`, `expenses`, `referrals`, `testimonials`

---

## 6. Data model

Data lives in **D1**. `migration/schema.sql` is the schema of record (11 tables).
The app-level contract for each entity — table name, writable fields, sortable
columns, and whether it is public-read — is `worker/src/lib/entities.ts`.

| Entity | Purpose | Read | Write |
|---|---|---|---|
| **Client** | Studio's client directory | Access | Access |
| **ClientRequest** | Public contact-form submissions | Access | Anyone (via the contact route) |
| **Estimate** | Price estimates (emailed to clients) | Access | Access |
| **Invoice** | Invoices (emailed to clients) | Access | Access |
| **ProjectPlan** | Scope/timeline plans (emailed; signed by email reply) | Access | Access |
| **PortfolioItem** | Portfolio projects shown on the public site | **Public** (list/filter/get) | Access |
| **Testimonial** | Client reviews shown on home page | **Public** (list/filter/get) | Access |
| **ClientFile** | Files sent by clients via the contact form | Access | Access |
| **Referral** | Referral + payout tracking (email-based updates) | Access | Anyone (create) |
| **Expense** | Business expense tracking | Access | Access |
| **Task** | Internal task tracking | Access | Access |

> **No `User` table.** Access owns identity. **`PortalMessage` was dropped** with
> two-way messaging and is not in the schema.

Public read is **per operation, not per entity**: only `list`, `filter` and `get`
on PortfolioItem and Testimonial are open. Every write goes through Access.

### Critical data conventions
- **Emails are normalized to lowercase** everywhere. Matching records to people by email is still how referrals and client lookups work.
- **Never store large content (base64, PDFs, blobs)** in a column — upload via the file routes and store the URL.
- **Arrays are JSON TEXT** in D1 with a `json_valid()` check; booleans are `INTEGER` 0/1; money is `REAL`. `worker/src/lib/db.ts` handles the encode/decode.
- D1 rejects explicit `BEGIN TRANSACTION` / `COMMIT` — it manages its own batching.

---

## 7. The API (`worker/src/routes/*`)

TypeScript handlers, one module per former Base44 function. Called from the
frontend as `base44.functions.invoke('name', payload)`, which is now just
`POST /api/<name>`. Everything is POST except private file downloads.

| Route | What it does |
|---|---|
| `sendContactConfirmation` | Contact form → confirmation email + internal notification. **Public.** Also writes the `client_request` row itself. |
| `sendEstimate` | Emails the estimate (line items + PDF link); asks the client to reply to accept/decline |
| `sendInvoice` | Emails the invoice (line items + PDF link); asks the client to reply when paid |
| `sendProjectPlan` | Emails the project plan; asks the client to reply to sign |
| `sendLeadQualification` | Sends referral intro email to the referred person |
| `sendReferrerConfirmation` | Sends referral confirmation email to the referrer |
| `sendReferralThankyou` | Sends thank-you email to the referrer |
| `sendReferralStatusUpdate` | Sends a referral status update email |
| `createTask` / `updateTask` / `deleteTask` | Task CRUD wrappers |
| `entities/<Name>/<op>` | Generic entity CRUD, gated by the registry |
| `files/upload`, `files/<key>` | Upload (public or private bucket) and private download |
| `me` | Reports who Access says you are |

`sendContactConfirmation` is the **only** entry in `PUBLIC_ROUTES`. Everything
else requires a valid Access JWT.

### Email-only delivery flow
- The admin clicks **Send** on an estimate/invoice → the frontend generates the PDF client-side (`src/lib/invoicePdf.js`), uploads it, and passes the `pdf_url` to the route, which emails the client a download link plus the full line-item breakdown.
- The client replies by email to accept/pay/sign → the admin manually updates the status in the dashboard.

### Security rules already enforced (preserve these)
- Admin routes authenticate via the Access JWT (`authenticate()`); there is no role string to check, because Access only admits admins.
- All user input in email templates is HTML-escaped to prevent injection/XSS.
- Portfolio descriptions are sanitized via an allowlist (`src/lib/sanitizeHtml.js`).
- URL fields are validated to `http`/`https` only.
- The contact route validates email format, name and message length, and project type before sending, so it can't be used as an open relay.

### Secrets
- `RESEND_API_KEY` — set with `cd worker && npx wrangler secret put RESEND_API_KEY`. Never commit it. Everything else in `wrangler.jsonc` is non-secret config.

---

## 8. The `base44/` directory

Kept as the **source of record for the original behaviour** — entity schemas and
the Deno function handlers the Worker routes were ported from. Nothing in it
executes any more, and nothing imports it. It is a reference for "what did this
used to do", useful when a ported route looks wrong.

Workflows are gone: the two social auto-publish workflows were archived when the
connectors were removed. There are no trigger-driven automations.

---

## 9. Auth

- **Cloudflare Access is the entire auth system.** No tokens to attach, no
  refresh, no storage, no password handling, no user records.
- `base44.auth.me()` still exists in `src/api/client.js`, but it just asks the
  Worker who Access says you are (`POST /api/me`).
- To grant someone admin: add their email to the Access policy in the Cloudflare
  Zero Trust dashboard. That is the whole process.
- If `me()` rejects, the client reloads once to re-trigger the Access login — the
  retry is guarded by a `sessionStorage` flag so a failing API can't spin forever.

---

## 10. Integrations

> **No OAuth connectors.** The Instagram Business, LinkedIn, and Facebook Pages
> connectors and their auto-publish workflows were removed before the migration.
> Portfolio items are published on the public site only.

Resend is the only external service, used for all outbound email.

---

## 11. Design system

- Tokens are defined in `src/index.css` (`:root` for light, `.dark` for dark) and mapped in `tailwind.config.js`.
- Use token classes (`bg-primary`, `font-display`, `text-accent`, etc.) — **never hardcode hex values** in JSX.
- Brand accent color: **coral/orange** (`#FF4F00` / `--accent`).
- Fonts: `Playfair Display` (display/headings) + `Inter` (body).
- Shared nav/footer: `src/components/PublicNav.jsx`, `src/components/PublicFooter.jsx`.
- Theme toggle: `src/components/ThemeToggle.jsx` + `src/lib/ThemeContext.jsx`.
- `public/_headers` sets the CSP. **If you add an external script, font, image or API host, update it** or the browser silently blocks the resource in production. The inline GA snippet is allowlisted by sha256 hash — changing that snippet means recomputing the hash.

---

## 12. Conventions to follow

- **ESM only** — no `require()` / `module.exports`.
- `cn` comes from `@/lib/utils`. `createPageUrl` comes from `@/utils`.
- shadcn components: import each from its own file (`@/components/ui/button`, etc.).
- Icons: `lucide-react` only, and only icons that exist.
- Write Tailwind classes as **literal strings** (the build purges dynamic names).
- New components/pages → new files, ~50 lines or less. Don't bloat existing files.
- Let errors bubble up — no try/catch unless it's a user-facing form (or a non-critical upload that shouldn't block the main action).
- Edit `src/App.jsx` surgically — never rewrite it.
- Adding a field to an entity means touching **three** places: the D1 column (migration), `fields` in `worker/src/lib/entities.ts`, and the form. Miss the registry and the value is silently dropped before it reaches SQL.

---

## 13. Common tasks

**Add a portfolio item:** Admin → Portfolio → New. Fill title, category (`website` | `logo` | `marketing` | `app development`), cover image, description, images. Images upload to the **public** bucket via `UploadPublicFile` and are served from `assets.ddaltondesigns.com`. Do not switch these to `UploadFile` — that is the private bucket, and the images would 302 to an Access login for every visitor.

**Estimate → Invoice flow (email-only):** Admin → Estimates → create estimate → click **Send** (emails PDF + details to client) → client replies by email to accept → admin clicks **Mark Accepted & Invoice** (creates invoice + client record) → admin sends the invoice (emails PDF) → client pays externally and replies → admin records payment / marks paid. No online acceptance or payment.

**Project plan flow (email-only):** Admin → Project Plans → create plan → click **Send** → client replies to sign → admin clicks **Mark Signed**.

**Add a client:** Either they submit the contact form (creates a ClientRequest) or admin adds them manually from Clients.

**Add a new entity:** Add the table to D1, then register it in `worker/src/lib/entities.ts` with its `fields` and `sortable` allowlists. It is then addressable as `base44.entities.<Name>` from the frontend. An unregistered entity name is simply not addressable — that's by design.

**Run a SQL query against production data:** `cd worker && npx wrangler d1 execute ddalton-designs --remote --command "..."`.

---

## 14. Where things live (quick map)

| You want to… | Look at… |
|---|---|
| Change a route | `src/App.jsx` |
| Change colors/fonts | `src/index.css` + `tailwind.config.js` |
| Change who can access data | Access policy (Cloudflare dashboard) + `worker/src/lib/entities.ts` |
| Change the DB schema | `migration/schema.sql` + a `wrangler d1 execute` migration |
| Edit an email template | `worker/src/routes/*.ts` (+ `worker/src/lib/template.ts` for the shared shell) |
| Fix estimate/invoice email + PDF | `worker/src/routes/billing.ts` + `src/lib/invoicePdf.js` + admin pages |
| Fix the admin dashboard | `src/pages/admin/*` + `src/components/admin/*` |
| Sanitize rich text | `src/lib/sanitizeHtml.js` |
| Understand the API or Access setup | `worker/README.md` |
| See how data/assets were migrated | `migration/` |

---

## 15. Gotchas

- **Access is the security boundary, and it only works because the apex is bound to the Worker.** An Access app on a hostname that Cloudflare merely proxies to a third-party origin looks configured but never runs. This cost a day during the migration — see `worker/README.md`.
- **Public-read bypasses must name exact operations**, never `api/entities/PortfolioItem/*`. A wildcard also bypasses writes, and a bypassed request carries no JWT, so the admin's own saves come back 403.
- **The entity registry is the write boundary.** A field missing from `fields` is dropped silently — no error, no value.
- **Portfolio images must use `UploadPublicFile`.** `UploadFile` is the private bucket.
- **`--config` on every wrangler command.** The root `wrangler.json` shadows the worker's.
- **Emails should stay lowercase** or email-based record matching silently fails.
- **Don't recreate auth pages or a client portal** — both were removed on purpose.
- **CSP is only enforced in production** (`public/_headers`); `npm run preview` won't catch a violation. Check the console on the deployed site after changing external resources.
- **PDF email flow** generates the PDF in the browser, uploads it, and emails a link — if the upload fails, the email still sends with the full details in the body.

---

## 16. Contacts & escalation

- App owner: Derek Dalton (derek@ddaltondesigns.com)
- Hosting / DNS / DB / auth: Cloudflare dashboard, account `dwdalton80@gmail.com`
- Email delivery: Resend (`resend.com`), domain `ddaltondesigns.com`
- Domain registrar: GoDaddy (DNS is delegated to Cloudflare)

---
