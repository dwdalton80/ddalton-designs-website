import { useEffect } from 'react';

const SITE = 'https://ddaltondesigns.com';
const DEFAULT_IMAGE = 'https://assets.ddaltondesigns.com/site/2cbe21348_generated_image.png';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-route <head> management for the SPA (no extra dependency).
 * Sets title, description, canonical, Open Graph / Twitter tags and robots.
 * Note: crawlers that don't execute JS still only see index.html defaults —
 * pair with prerendering for full coverage.
 */
export default function Seo({ title, description, path, image, noindex = false }) {
  useEffect(() => {
    const url = `${SITE}${path ?? window.location.pathname}`.replace(/\/$/, '') || SITE;
    const img = image || DEFAULT_IMAGE;
    document.title = title;
    setCanonical(url);
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:image', img);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, path, image, noindex]);
  return null;
}
