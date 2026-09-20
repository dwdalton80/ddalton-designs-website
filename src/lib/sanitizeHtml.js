// Minimal allowlist-based HTML sanitizer for rich-text content stored in the DB.
// Strips scripts, event handlers, and javascript: URLs while preserving safe
// formatting tags produced by the Quill editor.
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ol', 'ul', 'li', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'a', 'img',
]);

const ALLOWED_ATTRS = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  span: new Set(['style']),
  div: new Set(['style', 'class']),
  p: new Set(['style']),
  li: new Set(['data-list']),
};

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function sanitizeUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return null;
  if (SAFE_URL.test(trimmed)) return trimmed;
  return null;
}

export function sanitizeHtml(input) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(String(input ?? ''), 'text/html');
  const body = doc.body;

  const walk = (node) => {
    // Process children first so mutations don't skip nodes.
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();

    // Drop script/style entirely.
    if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object' || tag === 'embed') {
      node.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: replace element with its (already sanitized) children.
      while (node.firstChild) {
        node.parentNode.insertBefore(node.firstChild, node);
      }
      node.remove();
      return;
    }

    // Filter attributes.
    const allowed = ALLOWED_ATTRS[tag] || new Set();
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || !allowed.has(name)) {
        node.removeAttribute(attr.name);
        return;
      }
      if (name === 'href' || name === 'src') {
        const safe = sanitizeUrl(attr.value);
        if (safe === null) {
          node.removeAttribute(attr.name);
        } else {
          node.setAttribute(name, safe);
        }
      }
    });

    // Force safe rel on links.
    if (tag === 'a') {
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  };

  // Sanitize body's children rather than body itself — walk() would otherwise
  // treat <body> as a disallowed tag and unwrap/remove it, emptying the tree.
  Array.from(body.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) walk(child);
  });
  return body.innerHTML;
}