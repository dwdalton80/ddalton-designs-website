# DDalton Designs — Developer Handoff

A guide for any developer taking over this project. Read this first.

---

## 1. What this app is

**DDalton Designs** is the client-facing website and operations portal for a freelance design & photography studio (Derek Dalton). It does three jobs in one codebase:

1. **Public marketing site** — portfolio, services, about, contact, referrals.
2. **Client portal** — logged-in clients view estimates, invoices, project plans, files, and message the studio.
3. **Admin back-office** — the studio owner manages clients, estimates, invoices, tasks, portfolio, testimonials, referrals, expenses, project plans, and portal messages.

It is built on **Base44** (backend-as-a-service: auth, database, integrations, hosting). The frontend is **React + Vite + Tailwind CSS** with shadcn/ui components. There is no separate backend server to run — all data, auth, and integrations are provided by Base44.

**Live URL:** https://ddalton-designs.base44.app
**(Custom domain — ask the owner for the connected domain before linking to it externally.)**

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
| Backend / DB / Auth / Integrations | Base44 (`@base44/sdk`) |

Key packages already installed — **do not add new libraries without checking the installed list first**; only the packages in `package.json` are supported by the platform build.

---

## 3. Getting started locally

1. Clone the repo.
2. `npm install`
3. Create `.env.local`:
   ```
   VITE_BASE44_APP_ID=<app id from Base44 dashboard>
   VITE_BASE44_APP_BASE_URL=https://ddalton-designs.base44.app
   ```
4. `npm run dev`
5. Publish changes from the Base44 dashboard (the repo is 2-way synced via GitHub — pushes to `main` are reflected in the builder).

> **Note:** GitHub 2-way sync requires the Builder plan or higher, and only the app owner can do the initial connection.

---

## 4. Project structure

```
src/
  App.jsx                # Router — all routes live here (source of truth for pages)
  main.jsx               # Entry point
  index.css              # Design tokens (colors, fonts) — :root + .dark
  tailwind.config.js     # Token → Tailwind class mapping
  pages/                 # Page components (public, admin/, portal/)
  components/            # Shared components + ui/ (shadcn) + admin/
  lib/                   # AuthContext, ThemeContext, utils, sanitizeHtml, invoicePdf
  api/base44Client.js    # Pre-initialized Base44 SDK client
base44/
  entities/              # JSON schemas + RLS rules for each data type
  functions/             # Backend functions (Deno, entry.ts) — external API calls
  workflows/             # Automated trigger→action workflows (.jsonc)
  connectors/            # OAuth connector configs (instagram, linkedin, facebook_pages)
public/                  # Static assets, robots.txt
```

**Import rule:** always use the `@/` alias (`@/components/...`, `@/lib/...`). Never use relative `src/` paths — they break on moves.

---

## 5. Routing & access control

Routes are defined in `src/App.jsx`. Access is enforced two ways:

- **Client-side:** `ProtectedRoute` (`src/components/ProtectedRoute.jsx`) wraps authenticated routes and redirects unauthenticated users to `/login`.
- **Server-side:** **Row-Level Security (RLS)** on each entity in `base44/entities/*.jsonc`. This is the real security boundary — frontend gating is just UX. **Always check RLS when changing data access.**

### Public routes (no login)
`/` (Home), `/portfolio`, `/portfolio/:id`, `/about`, `/services`, `/contact`, `/referrals`, `/client-referrals`, `/terms`, `/privacy`

### Auth routes
`/login`, `/register` *(registration is disabled — see §9)*, `/forgot-password`, `/reset-password`

### Protected routes (login required)
- `/my-referrals`, `/referral-tracker/:id` — referral portal for referrers
- `/portal` — client portal (estimates, invoices, plans, files, messages)
- `/admin/*` — admin back-office (admin role only)

### Admin sub-routes (under `/admin`)
`/admin` (dashboard), `requests`, `clients`, `estimates`, `invoices`, `tasks`, `portfolio`, `messages`, `plans`, `expenses`, `referrals`, `testimonials`

---

## 6. Data model (entities)

All entity schemas live in `base44/entities/`. Every record has built-in `id`, `created_date`, `updated_date`, `created_by_id` (do not redeclare these).

| Entity | Purpose | Who can read | Who can write |
|---|---|---|---|
| **Client** | Studio's client directory | Admin only | Admin only |
| **ClientRequest** | Public contact-form submissions | Admin only | Anyone (create) |
| **Estimate** | Price estimates sent to clients | Admin + the matched client (by email) | Admin; client can accept/decline |
| **Invoice** | Invoices (convert from estimates) | Admin + matched client | Admin only |
| **ProjectPlan** | Scope/timeline plans for client sign-off | Admin + matched client | Admin; client can sign |
| **PortfolioItem** | Portfolio projects (auto-posted to socials) | Public (everyone) | Admin only |
| **Testimonial** | Client reviews shown on home page | Public | Admin only |
| **PortalMessage** | Threaded messages between client & admin | Admin + matched client | Admin + matched client (create) |
| **ClientFile** | Files uploaded by/for a client | Admin + matched client | Admin + matched client (create) |
| **Referral** | Referral + payout tracking | Admin + the referrer (by email) | Anyone (create); admin (update) |
| **Expense** | Business expense tracking | Admin only | Admin only |
| **Task** | Internal task tracking | Admin only | Admin only |
| **User** | Built-in — app users (admins & clients) | Built-in security (admins manage others) | — |

### Critical data conventions
- **Emails are normalized to lowercase** everywhere (frontend + backend functions) for case-insensitive RLS matching. Always lowercase client/referrer emails on input.
- RLS matches records to users by `data.client_email === "{{user.email}}"` (or `referrer_email`). If you add an email field, lowercase it or RLS breaks.
- **Never store large content (base64, PDFs, blobs)** in entity fields — upload via `UploadPublicFile`/`UploadPrivateFile` and store the URL.

---

## 7. Backend functions (`base44/functions/*/entry.ts`)

Deno TypeScript handlers for anything that needs server-side logic or external APIs. Invoke from the frontend via `base44.functions.invoke('name', payload)`.

| Function | What it does |
|---|---|
| `sendContactConfirmation` | Contact form → confirmation email + internal notification + invites client to portal |
| `sendEstimate` | Sends estimate email to client |
| `sendInvoice` | Sends invoice email to client |
| `handleEstimateAccept` | Processes client estimate acceptance |
| `sendPortalInvite` | Sends portal invite email |
| `sendLeadQualification` | Admin-only: sends referral intro email |
| `sendReferrerConfirmation` | Sends referral confirmation email (admin or referrer only) |
| `sendReferralThankyou` | Sends thank-you email to referrer |
| `sendReferralStatusUpdate` | Admin-only: sends referral status update email |
| `postPortfolioToInstagram` | Posts a portfolio item to Instagram Business |
| `postPortfolioToLinkedin` | Posts a portfolio item to the DDalton Designs LinkedIn company page |
| `createTask` / `updateTask` / `deleteTask` | Task CRUD wrappers |

### Security rules already enforced (preserve these)
- All email-sending functions call `base44.auth.me()` to authenticate the caller.
- Admin-only functions check `user.role === 'admin'`.
- Referrer confirmation is restricted to admin **or** the referrer themselves.
- All user input in email templates is HTML-escaped to prevent injection/XSS.
- Portfolio descriptions are sanitized via an allowlist (`src/lib/sanitizeHtml.js`).
- URL fields are validated to `http`/`https` only.

### Secrets
- `RESEND_API_KEY` — used by all email functions (set in dashboard → Secrets). Do not commit it.

---

## 8. Automations (workflows)

Workflows live in `base44/workflows/*.jsonc`. They trigger on entity events.

| Workflow | Trigger | Action |
|---|---|---|
| Auto-publish portfolio to Instagram | `PortfolioItem` created (with cover image) | Calls `postPortfolioToInstagram` |
| Auto-publish portfolio to LinkedIn | `PortfolioItem` created (with cover image) | Calls `postPortfolioToLinkedin` |

> **Facebook:** The Facebook Pages connector is authorized, and a `postPortfolioToFacebook` function is intended for auto-posting to the DDalton Designs Facebook Page. Verify it exists and that its matching workflow is active before relying on it.

---

## 9. Auth & user management

- The platform owns auth (tokens, sessions, email verification, password reset). **Do not implement auth backend logic.**
- Auth pages exist at `src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — all four routes are registered in `App.jsx`.
- **Public registration is disabled.** Clients are invited by the admin via `base44.users.inviteUser(email, 'user')` (see `sendContactConfirmation` / `sendPortalInvite`). Do not re-enable public sign-up without the owner's OK.
- Roles: `admin` (studio owner) and `user` (clients). Only admins can invite admins.
- User records can't be created/imported directly — users join via invite.

---

## 10. Social media integrations

Three OAuth connectors are authorized (dashboard → Integrations):

- **Instagram Business** — auto-posts portfolio items.
- **LinkedIn** — auto-posts to the **DDalton Designs company page only** (page-name filtering enforced in `postPortfolioToLinkedin`).
- **Facebook Pages** — posts to the **DDalton Designs Facebook Page only** (page-name filtering in the Facebook posting function).

**Hard rule:** automated posting is restricted to the "DDalton Designs" business accounts/pages. Do not change the page-name filter logic — it prevents posting to personal or wrong accounts.

Before editing any connector-backed function, load its usage guide via `get_connectors_info(["<integration_type>"])` — the guides have provider-specific API details.

---

## 11. Design system

- Tokens are defined in `src/index.css` (`:root` for light, `.dark` for dark) and mapped in `tailwind.config.js`.
- Use token classes (`bg-primary`, `font-display`, `text-accent`, etc.) — **never hardcode hex values** in JSX.
- Brand accent color: **coral/orange** (`#FF4F00` / `--accent`).
- Fonts: `Playfair Display` (display/headings) + `Inter` (body).
- Shared nav/footer: `src/components/PublicNav.jsx`, `src/components/PublicFooter.jsx`.
- Theme toggle: `src/components/ThemeToggle.jsx` + `src/lib/ThemeContext.jsx`.

---

## 12. Conventions to follow

- **ESM only** — no `require()` / `module.exports`.
- `cn` comes from `@/lib/utils`. `createPageUrl` comes from `@/utils`.
- shadcn components: import each from its own file (`@/components/ui/button`, etc.).
- Icons: `lucide-react` only, and only icons that exist.
- Write Tailwind classes as **literal strings** (the build purges dynamic names).
- New components/pages → new files, ~50 lines or less. Don't bloat existing files.
- Let errors bubble up — no try/catch unless it's a user-facing form/auth flow.
- Edit `src/App.jsx` surgically — never rewrite it; preserve the auth scaffold and all existing routes.
- Entity files (`base44/entities/*.jsonc`) are stored as objects — always write the **complete schema**, no placeholders.

---

## 13. Common tasks

**Add a portfolio item:** Admin → Portfolio → New. Fill title, category (`website` | `logo` | `marketing` | `app development`), cover image, description, images. On save, it auto-posts to Instagram + LinkedIn (if workflows active).

**Estimate → Invoice flow:** Admin → Estimates → create estimate → send → client accepts (portal) → admin converts to invoice → send invoice. PDFs generate client-side via `src/lib/invoicePdf.js`.

**Add a client:** Either they submit the contact form (auto-invited) or admin invites them from Clients. Clients must be invited — they cannot self-register.

**Change the home page:** The `/` route in `App.jsx` points to `Home.jsx`. Edit there.

**Add a new entity:** Create `base44/entities/<Name>.jsonc` with full schema + RLS. Use it via `base44.entities.<Name>` in the SDK.

---

## 14. Where things live (quick map)

| You want to… | Look at… |
|---|---|
| Change a route | `src/App.jsx` |
| Change colors/fonts | `src/index.css` + `tailwind.config.js` |
| Change who can access data | `base44/entities/<Name>.jsonc` (RLS) |
| Edit an email template | `base44/functions/send*/entry.ts` |
| Fix social auto-posting | `base44/functions/postPortfolioTo*.ts` + `base44/workflows/*.jsonc` |
| Fix the client portal | `src/pages/portal/*` |
| Fix the admin dashboard | `src/pages/admin/*` + `src/components/admin/*` |
| Fix PDF generation | `src/lib/invoicePdf.js` |
| Sanitize rich text | `src/lib/sanitizeHtml.js` |

---

## 15. Gotchas

- **RLS is the security boundary.** A missing or loose rule exposes data to any logged-in user; a too-tight rule locks users out of their own records. Load the RLS guide before editing any `rls` block.
- **Emails must be lowercase** or RLS email matching silently fails.
- **Registration is intentionally disabled** — don't re-enable it.
- **Social posting is page-name-locked** to "DDalton Designs" — don't remove that filter.
- **GitHub sync backs up code only**, not database records.
- **Don't recreate auth pages** — they exist and are functional; edit in place only on request.

---

## 16. Contacts & escalation

- App owner: Derek Dalton (derek@ddaltondesigns.com)
- Platform support: https://app.base44.com/support
- Base44 docs: https://docs.base44.com

---

*Last updated: 2026-09-17. Update this document whenever you make a structural change.*