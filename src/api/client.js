/**
 * API client — drop-in replacement for the Base44 SDK.
 *
 * Exposes the same surface the app already calls (`base44.entities.X.list()`,
 * `base44.functions.invoke()`, `base44.integrations.Core.UploadFile()`), backed
 * by the Worker at /api instead. Keeping the shape identical means the ~38 files
 * that use it don't change, which keeps this migration reviewable: the data
 * layer swaps, the UI doesn't move.
 *
 * Auth is gone from this file on purpose. Cloudflare Access authenticates the
 * request before it reaches the app, so there are no tokens to attach, refresh
 * or store. `auth.me()` asks the Worker who Access says we are.
 */

const API = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function post(path, body) {
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Access cookies must ride along or every call reads as unauthenticated.
    credentials: 'same-origin',
    body: JSON.stringify(body ?? {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

/** Mirrors base44.entities.<Name> — list/filter/get/create/update/delete. */
function entity(name) {
  return {
    // Base44 signature: list(sort, limit, skip)
    list: (sort, limit, skip) => post(`entities/${name}/list`, { sort, limit, skip }),
    // Base44 signature: filter(query, sort, limit)
    filter: (query, sort, limit) => post(`entities/${name}/filter`, { query, sort, limit }),
    get: (id) => post(`entities/${name}/get`, { id }),
    create: (data) => post(`entities/${name}/create`, { data }),
    update: (id, data) => post(`entities/${name}/update`, { id, data }),
    delete: (id) => post(`entities/${name}/delete`, { id }),
  };
}

const ENTITY_NAMES = [
  'Client',
  'ClientRequest',
  'ClientFile',
  'Estimate',
  'Invoice',
  'ProjectPlan',
  'PortfolioItem',
  'Testimonial',
  'Referral',
  'Task',
  'Expense',
];

const entities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, entity(n)]));

async function upload(file, { visibility = 'public', prefix } = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('visibility', visibility);
  if (prefix) form.append('prefix', prefix);

  const res = await fetch(`${API}/files/upload`, {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Upload failed (${res.status})`, res.status);
  return data; // { file_url, file_name, file_size, key }
}

export const base44 = {
  entities,

  functions: {
    /** base44.functions.invoke('sendInvoice', payload) -> POST /api/sendInvoice */
    invoke: (name, payload) => post(name, payload),
  },

  integrations: {
    Core: {
      /** Client documents — private bucket, reachable only through the Worker. */
      UploadFile: ({ file }) => upload(file, { visibility: 'private' }),
      /** Portfolio images and other public assets — served from the asset domain. */
      UploadPublicFile: ({ file }) => upload(file, { visibility: 'public', prefix: 'portfolio' }),
      /** Kept for the one caller that used it; routed through the contact endpoint. */
      SendEmail: (payload) => post('sendContactConfirmation', payload),
    },
  },

  auth: {
    /**
     * Cloudflare Access owns identity. It has already authenticated the request
     * by the time any of this runs, so this only reports who that is.
     */
    me: async () => {
      const user = await post('me');
      // A successful round trip means Access let us through; clear the retry
      // guard so a later session expiry can reload again.
      try {
        sessionStorage.removeItem('ddd:auth-retry');
      } catch {
        /* ignore */
      }
      return user;
    },
    isAuthenticated: async () => {
      try {
        await post('me');
        return true;
      } catch {
        return false;
      }
    },
    /**
     * Access serves its own login page: a full navigation to a protected URL is
     * intercepted at the edge and answered with that login page, so reloading
     * is the correct way to re-authenticate.
     *
     * The guard matters. AdminLayout calls this whenever `me()` rejects, and a
     * plain reload would spin forever if the API is reachable but failing for
     * some other reason (misconfigured ACCESS_AUD, a 500, the Worker not
     * deployed). One attempt per tab, then we stop and let the error surface.
     */
    redirectToLogin: () => {
      const KEY = 'ddd:auth-retry';
      let alreadyTried = false;
      try {
        alreadyTried = sessionStorage.getItem(KEY) === '1';
        sessionStorage.setItem(KEY, '1');
      } catch {
        // Private mode or blocked storage: fall through and reload once.
      }
      if (alreadyTried) {
        console.error('Authentication failed after a reload; not retrying. Check that the API Worker is deployed and ACCESS_AUD / ACCESS_TEAM_DOMAIN are set.');
        return;
      }
      window.location.reload();
    },
    logout: () => {
      // Clears the Access session, then returns to the public site.
      window.location.href = `/cdn-cgi/access/logout?returnTo=${encodeURIComponent(window.location.origin)}`;
    },
  },
};

export { ApiError };
export default base44;
