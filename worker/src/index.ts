/**
 * DDalton Designs API Worker.
 *
 * Replaces the Base44 backend functions. One route per former function, so the
 * frontend's `base44.functions.invoke('sendInvoice', payload)` becomes
 * `POST /api/sendInvoice` with the same body and the same response shape.
 *
 * Auth model: /api/* sits behind Cloudflare Access except for the routes in
 * PUBLIC_ROUTES. The app has one class of authenticated user, so a valid Access
 * token for this application IS the admin check that used to read
 * `user.role !== 'admin'`. The verification below is defence in depth — Access
 * should already have rejected the request before it reaches the Worker.
 */

import { authenticate } from './lib/access';
import { json, forbidden } from './lib/http';
import { createTask, updateTask, deleteTask } from './routes/tasks';
import { sendEstimate, sendInvoice } from './routes/billing';
import { sendProjectPlan } from './routes/plans';
import { sendContactConfirmation } from './routes/contact';
import {
  sendLeadQualification,
  sendReferrerConfirmation,
  sendReferralThankyou,
  sendReferralStatusUpdate,
} from './routes/referrals';

type Handler = (req: Request, env: Env, actor: string) => Promise<Response>;

/** Reachable without authentication. Keep this list as small as possible. */
const PUBLIC_ROUTES: Record<string, Handler> = {
  sendContactConfirmation: (req, env) => sendContactConfirmation(req, env),
};

/** Require a valid Cloudflare Access token. */
const ADMIN_ROUTES: Record<string, Handler> = {
  createTask,
  updateTask: (req, env) => updateTask(req, env),
  deleteTask: (req, env) => deleteTask(req, env),
  sendEstimate: (req, env) => sendEstimate(req, env),
  sendInvoice: (req, env) => sendInvoice(req, env),
  sendProjectPlan: (req, env) => sendProjectPlan(req, env),
  sendLeadQualification: (req, env) => sendLeadQualification(req, env),
  sendReferrerConfirmation: (req, env) => sendReferrerConfirmation(req, env),
  sendReferralThankyou: (req, env) => sendReferralThankyou(req, env),
  sendReferralStatusUpdate: (req, env) => sendReferralStatusUpdate(req, env),
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const name = url.pathname.slice('/api/'.length);

    const publicHandler = PUBLIC_ROUTES[name];
    const handler = publicHandler ?? ADMIN_ROUTES[name];
    if (!handler) return json({ error: 'Not found' }, 404);

    const isPublic = publicHandler !== undefined;

    let actor = 'public';
    if (!isPublic) {
      const identity = await authenticate(request, env);
      if (!identity) return forbidden();
      actor = identity.sub || identity.email;
    }

    try {
      return await handler(request, env, actor);
    } catch (err) {
      console.error(`${name} failed:`, err);
      const message = err instanceof Error ? err.message : 'Unexpected error';
      // The admin UI surfaces this string; the public route must not leak
      // internal detail to anonymous callers.
      return json({ error: isPublic ? 'Something went wrong' : message }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
