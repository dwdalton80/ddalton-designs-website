/**
 * Single source of truth for public-route SEO metadata.
 * Used by the <Seo> component in the browser AND by site-worker/index.js, which
 * injects the same tags into the HTML on the server so crawlers that don't run
 * JavaScript still see per-page titles, descriptions and canonicals.
 */
export const SITE = 'https://ddaltondesigns.com';

export const ROUTE_META = {
  '/': {
    title: 'Web Design & Logo Design in Durant, OK | DDalton Designs',
    description: 'Derek Dalton — bold web design, logo design, marketing materials and photography for businesses in Durant, Oklahoma and beyond. 15+ years of experience.',
    h1: 'Design That Demands Attention',
    summary: 'Web design, logo design, marketing materials and photography by Derek Dalton in Durant, Oklahoma.',
  },
  '/about': {
    title: 'About Derek Dalton | Durant, OK Web Designer',
    description: 'Meet Derek Dalton, a Durant, Oklahoma designer and photographer with 15+ years of experience building websites, logos and brand identities.',
    h1: 'Derek Dalton',
    summary: 'Designer and photographer with 15+ years of experience helping businesses build compelling visual identities.',
  },
  '/services': {
    title: 'Services: Web Design, Logos, Marketing & Photography | DDalton Designs',
    description: 'Custom websites, memorable logos, marketing materials and professional photography for Durant, Oklahoma businesses and beyond.',
    h1: 'Services',
    summary: 'Web design, logo design, marketing materials and photography.',
  },
  '/portfolio': {
    title: 'Portfolio: Websites, Apps & Branding | DDalton Designs',
    description: 'Selected web design, app development and branding projects by DDalton Designs.',
    h1: 'Portfolio',
    summary: 'Selected web design, app development and branding projects.',
  },
  '/contact': {
    title: 'Start a Project: Get a Free Quote | DDalton Designs',
    description: 'Tell Derek about your website, logo or marketing project and get a free quote.',
    h1: 'Start a Project',
    summary: 'Tell Derek about your website, logo or marketing project and get a free quote.',
  },
  '/referrals': {
    title: 'Refer & Earn up to $100 | DDalton Designs',
    description: 'Refer a business to DDalton Designs and earn up to $100 when they become a client.',
    h1: 'Refer & Earn',
    summary: 'Refer a business to DDalton Designs and earn a reward.',
  },
  '/privacy': {
    title: 'Privacy Policy | DDalton Designs',
    description: 'How DDalton Designs collects, uses and protects your information.',
    h1: 'Privacy Policy',
    summary: 'How DDalton Designs collects, uses and protects your information.',
  },
  '/terms': {
    title: 'Terms of Service | DDalton Designs',
    description: 'Terms of service for DDalton Designs web design, branding and photography work.',
    h1: 'Terms of Service',
    summary: 'Terms of service for DDalton Designs.',
  },
};

/** Lowercase, hyphenated slug of a portfolio title ("A & B" -> "a-and-b"). */
export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function portfolioPath(item) {
  return `/portfolio/${slugify(item.title) || item.id}`;
}

/** Title/description for a portfolio item — shared by the Worker and the page. */
export function portfolioMeta(item) {
  const cat = item.category ? `${item.category} project` : 'project';

  // Most projects here are named after the client, which made the description
  // read "Jingleheimer Novelties for Jingleheimer Novelties". Compare the two
  // slugified so punctuation differences ("Infinitely. Faithful") count as the
  // same name. client_name is still shown on the portfolio pages themselves —
  // this only drops the redundant half of the sentence.
  const client = item.client_name && slugify(item.client_name) !== slugify(item.title)
    ? ` for ${item.client_name}`
    : '';

  // "a app development project" — categories are free text, so pick the
  // article from the first letter rather than hardcoding "a".
  const kind = item.category || 'design';
  const article = /^[aeiou]/i.test(kind) ? 'an' : 'a';

  return {
    title: `${item.title} | ${cat[0].toUpperCase()}${cat.slice(1)} | DDalton Designs`,
    description: `${item.title}${client} — ${article} ${kind} project by DDalton Designs.`,
  };
}
