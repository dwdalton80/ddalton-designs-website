/**
 * DDalton Designs API Worker.
 *
 * Replaces the Base44 backend functions. One Worker, one route per former
 * function, so the frontend's `base44.functions.invoke('name', payload)` calls
 * become `POST /api/<name>` with the same JSON body and the same response shape.
 *
 * Authentication: every route except the public ones requires a valid
 * Cloudflare Access JWT (see lib/access.ts). Access gates /api/* at the edge,
 * so an unauthenticated request should not reach here at all — the check below
 * is defence in depth for the case where the Access policy is misconfigured or
 * removed.
 */

import { authenticate } from './lib/access';
import { json, forbidden } from './lib/http';
import { createTask, updateTask, deleteTask } from './routes/tasks';
import { sendEstimate, sendInvoice } from './routes/billing';

type Handler = (req: Request, env: Env, actor: string) => Promise<Response>;

/** Routes requiring an authenticated (therefore admin) caller. */
const ADMIN_ROUTES: Record<string, Handler> = {
  createTask,
  updateTask: (req, env) => updateTask(req, env),
  deleteTask: (req, env) => deleteTask(req, env),
  sendEstimate: (req, env) => sendEstimate(req, env),
  sendInvoice: (req, env) => sendInvoice(req, env),
  // TODO (not yet ported): sendContactConfirmation (public), sendProjectPlan,
  // sendLeadQualification, sendReferrerConfirmation, sendReferralThankyou,
  // sendReferralStatusUpdate.
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found' }, 404);
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const name = url.pathname.slice('/api/'.length);
    const handler = ADMIN_ROUTES[name];
    if (!handler) return json({ error: 'Not found' }, 404);

    const identity = await authenticate(request, env);
    if (!identity) return forbidden();

    try {
      return await handler(request, env, identity.sub || identity.email);
    } catch (err) {
      // Base44 returned the raw message to the caller. Keep that for the admin
      // UI's error display, but log the full error for debugging.
      console.error(`${name} failed:`, err);
      const message = err instanceof Error ? err.message : 'Unexpected error';
      return json({ error: message }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
