import { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise = null;

/** Loads the Turnstile script once, however many widgets ask for it. */
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.onload = () => resolve(window.turnstile);
    el.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget.
 *
 * Renders nothing when VITE_TURNSTILE_SITE_KEY is unset, which is how local
 * development and any build made before the widget existed keep working — the
 * worker's verifyTurnstile is skipped in exactly the same condition, when
 * TURNSTILE_SECRET_KEY is unset. Set one without the other and the form
 * breaks, so they go together.
 */
export default function Turnstile({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return undefined;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !ref.current) return;
        widgetId.current = turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          callback: (token) => onToken(token),
          // A token is single-use and expires; clearing it forces the widget to
          // re-run rather than letting the form submit something stale.
          'expired-callback': () => onToken(''),
          'error-callback': () => { onToken(''); setFailed(true); },
          theme: 'auto',
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;

  return (
    <div>
      <div ref={ref} />
      {failed && (
        <p className="text-xs text-muted-foreground mt-1.5">
          The verification check couldn't load. If sending fails, email derek@ddaltondesigns.com directly.
        </p>
      )}
    </div>
  );
}

/** True when a token is required before the form may be submitted. */
export const turnstileEnabled = Boolean(SITE_KEY);
