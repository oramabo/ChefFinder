import { CITIES, type City } from "./cities.ts";
import { SEO_EVENTS, type SeoEvent } from "./events.ts";
import { SERVICES, type Service } from "../services/registry.ts";

export type SeoPageKind = "city" | "event-city" | "kosher-city";

export interface SeoPage {
  serviceSlug: string; // which registered service (vertical) this page belongs to
  kind: SeoPageKind;
  path: string; // English route path, e.g. /private-chef/tel-aviv
  hePath: string; // Hebrew canonical path, e.g. /שף-פרטי/תל-אביב
  citySlug: string;
  eventSlug?: string;
  title: string; // <title>
  h1: string;
  description: string; // meta description
}

// ---- private-chef vertical page generators ----
// URL prefixes come from the service's SEO slugs (keyword-rich: /private-chef,
// /שף-פרטי), kept independent of the mini-site hub slug (/chefs) so these pages
// don't move. Kosher is a "kosher-" / "-כשר" variant of the same base. Pages are
// tagged with the mini-site slug (serviceSlug). Paths are byte-identical to the
// previous hard-coded ones.
function cityPage(service: Service, city: City): SeoPage {
  return {
    serviceSlug: service.slug,
    kind: "city",
    path: `/${service.seo.slug}/${city.slug}`,
    hePath: `/${service.seo.heSlug}/${city.heSlug}`,
    citySlug: city.slug,
    title: `שף פרטי ב${city.he} | הזמנת שף לאירוע`,
    h1: `שף פרטי ב${city.he}`,
    description: `מחפשים שף פרטי ב${city.he}? מלאו טופס קצר וקבלו הצעות משפים מקצועיים באזור ${city.region}. שירות שף פרטי לאירועים, ארוחות וחגיגות.`,
  };
}

function eventCityPage(service: Service, event: SeoEvent, city: City): SeoPage {
  return {
    serviceSlug: service.slug,
    kind: "event-city",
    path: `/${service.seo.slug}/${event.slug}-${city.slug}`,
    hePath: `/${service.seo.heSlug}/${event.heSlug}-${city.heSlug}`,
    citySlug: city.slug,
    eventSlug: event.slug,
    title: `שף פרטי ל${event.heFor} ב${city.he} | השף שלי`,
    h1: `שף פרטי ל${event.heFor} ב${city.he}`,
    description: `שף פרטי ל${event.heFor} ב${city.he}. מלאו טופס קצר וקבלו הצעות משפים מקצועיים. תפריט מותאם, חוויה קולינרית בבית.`,
  };
}

function kosherCityPage(service: Service, city: City): SeoPage {
  return {
    serviceSlug: service.slug,
    kind: "kosher-city",
    path: `/kosher-${service.seo.slug}/${city.slug}`,
    hePath: `/${service.seo.heSlug}-כשר/${city.heSlug}`,
    citySlug: city.slug,
    title: `שף פרטי כשר ב${city.he} | בישול כשר לאירועים`,
    h1: `שף פרטי כשר ב${city.he}`,
    description: `שף פרטי כשר ב${city.he} לאירועים וארוחות. מלאו טופס קצר וקבלו הצעות משפים מקצועיים עם תפריט כשר מותאם.`,
  };
}

// The full programmatic page set for the private-chef vertical.
function privateChefPages(service: Service): SeoPage[] {
  const pages: SeoPage[] = [];
  for (const city of CITIES) {
    pages.push(cityPage(service, city));
    pages.push(kosherCityPage(service, city));
    for (const event of SEO_EVENTS) {
      pages.push(eventCityPage(service, event, city));
    }
  }
  return pages;
}

// Each service slug → the builder for its programmatic pages. Adding a vertical
// means adding a registry entry and (if it has programmatic SEO pages) a builder
// here; allSeoPages(), the sitemap, routing and prerender all pick it up.
const PAGE_BUILDERS: Record<string, (service: Service) => SeoPage[]> = {
  chefs: privateChefPages,
};

// The full cartesian set of programmatic pages, across every registered service.
export function allSeoPages(): SeoPage[] {
  return SERVICES.flatMap((service) => PAGE_BUILDERS[service.slug]?.(service) ?? []);
}

export function seoPagesByKind(kind: SeoPageKind): SeoPage[] {
  return allSeoPages().filter((p) => p.kind === kind);
}

// Percent-decode a pathname so a Hebrew URL (which the browser/router hands us
// percent-encoded) matches the decoded paths stored on each page.
function decodePath(path: string): string {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}

// Resolve a page by either its English or its Hebrew (canonical) path. Both URLs
// are prerendered and render the same content; the Hebrew one is canonical.
export function seoPageByPath(path: string): SeoPage | undefined {
  const decoded = decodePath(path);
  return allSeoPages().find((p) => p.path === decoded || p.hePath === decoded);
}
