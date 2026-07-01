// Service registry — the single source of truth for the platform's verticals.
//
// ezfind is a multi-vertical lead-gen platform. Each "service" is a mini-site
// that lives at ezfind.app/{slug} (the canonical path) and is also reachable at
// {subdomain}.ezfind.app (a memorable alias that 301-redirects to the path).
// The umbrella apex (ezfind.app) hosts provider registration and links to every
// mini-site.
//
// Adding a vertical = add an entry here (+ its content). Routing, prerender,
// sitemap, schema and the subdomain-redirect map all derive from this list, so
// no plumbing has to change per service.
export interface Service {
  slug: string; // canonical path segment, e.g. "private-chef" → ezfind.app/private-chef
  heSlug: string; // Hebrew path segment, e.g. "שף-פרטי"
  subdomain: string; // memorable alias host label, e.g. "chef" → chef.ezfind.app
  name: { he: string; en: string };
}

// The platform apex. The canonical host every mini-site path hangs off of, and
// the base for each service's subdomain alias.
export const APEX_HOST = "ezfind.app";

export const SERVICES: Service[] = [
  {
    slug: "private-chef",
    heSlug: "שף-פרטי",
    subdomain: "chef",
    name: { he: "שף פרטי", en: "Private Chef" },
  },
];

export function serviceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function serviceBySubdomain(subdomain: string): Service | undefined {
  return SERVICES.find((s) => s.subdomain === subdomain);
}

// The canonical mini-site path for a service, e.g. "/private-chef".
export function servicePath(service: Service): string {
  return `/${service.slug}`;
}

// The subdomain alias host for a service, e.g. "chef.ezfind.app".
export function serviceSubdomainHost(service: Service, apex: string = APEX_HOST): string {
  return `${service.subdomain}.${apex}`;
}

// Map of alias subdomain host → canonical mini-site path, for the Worker's 301
// redirects (e.g. { "chef.ezfind.app": "/private-chef" }). Derived from the
// registry so new services get their redirect for free.
export function subdomainRedirects(apex: string = APEX_HOST): Record<string, string> {
  return Object.fromEntries(
    SERVICES.map((s) => [serviceSubdomainHost(s, apex), servicePath(s)]),
  );
}
