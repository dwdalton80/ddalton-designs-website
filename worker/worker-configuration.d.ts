/** Bindings available to the Worker. Kept hand-written and small. */
interface Env {
  /** D1 database holding the migrated Base44 entities. */
  DB: D1Database;
  /** Resend API key — set with `wrangler secret put RESEND_API_KEY`. */
  RESEND_API_KEY: string;
  /** e.g. "ddaltondesigns.cloudflareaccess.com" */
  ACCESS_TEAM_DOMAIN: string;
  /** Access application audience (AUD) tag. */
  ACCESS_AUD: string;
}
