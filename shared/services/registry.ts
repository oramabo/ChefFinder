// Service registry — the single source of truth for the platform's verticals.
//
// ezfind is a multi-vertical lead-gen platform. Each "service" is a mini-site
// that lives at ezfind.app/{slug} (the canonical path) and is also reachable at
// {slug}.ezfind.app (a memorable alias that 301-redirects to the path). The
// umbrella apex (ezfind.app) hosts provider registration and links to every
// mini-site.
//
// Adding a vertical = add an entry here (+ its content). Routing, prerender,
// sitemap, schema and the subdomain-redirect map all derive from this list.
export interface Service {
  slug: string; // mini-site path segment + subdomain label, e.g. "chefs" → /chefs, chefs.ezfind.app
  name: { he: string; en: string };
  // Programmatic SEO page URL prefixes for this vertical. Kept separate from the
  // mini-site slug so the keyword-rich pages (/private-chef, /שף-פרטי) don't have
  // to move when the mini-site lives at a shorter hub path (/chefs).
  seo: { slug: string; heSlug: string };
}

// The platform apex — the canonical host every mini-site path hangs off of, and
// the base for each service's subdomain alias.
export const APEX_HOST = "ezfind.app";

export const SERVICES: Service[] = [
  {
    slug: "chefs",
    name: { he: "שף פרטי", en: "Private Chef" },
    seo: { slug: "private-chef", heSlug: "שף-פרטי" },
  },
];

export function serviceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

// The subdomain label equals the slug (chefs.ezfind.app → the "chefs" service).
export function serviceBySubdomain(subdomain: string): Service | undefined {
  return SERVICES.find((s) => s.slug === subdomain);
}

// The canonical mini-site path for a service, e.g. "/chefs".
export function servicePath(service: Service): string {
  return `/${service.slug}`;
}

// The subdomain alias host for a service, e.g. "chefs.ezfind.app".
export function serviceSubdomainHost(service: Service, apex: string = APEX_HOST): string {
  return `${service.slug}.${apex}`;
}

// Map of alias subdomain host → canonical mini-site path, for the Worker's 301
// redirects (e.g. { "chefs.ezfind.app": "/chefs" }). Derived from the registry
// so new services get their redirect for free.
export function subdomainRedirects(apex: string = APEX_HOST): Record<string, string> {
  return Object.fromEntries(
    SERVICES.map((s) => [serviceSubdomainHost(s, apex), servicePath(s)]),
  );
}
