import { CITIES, type City } from "./cities.ts";
import { SEO_EVENTS, type SeoEvent } from "./events.ts";

export type SeoPageKind = "city" | "event-city" | "kosher-city";

// The two languages each page is published in. `he` is served at the Hebrew
// path (hePath), `en` at the English path (path); they are separate, indexable,
// hreflang-linked pages.
export type Locale = "he" | "en";

export interface SeoPage {
  kind: SeoPageKind;
  path: string; // English route path, e.g. /private-chef/tel-aviv
  hePath: string; // Hebrew canonical path, e.g. /שף-פרטי/תל-אביב
  citySlug: string;
  eventSlug?: string;
  title: string; // <title>
  h1: string;
  description: string; // meta description
}

function cityPage(city: City): SeoPage {
  return {
    kind: "city",
    path: `/private-chef/${city.slug}`,
    hePath: `/שף-פרטי/${city.heSlug}`,
    citySlug: city.slug,
    title: `שף פרטי ב${city.he} | הזמנת שף לאירוע`,
    h1: `שף פרטי ב${city.he}`,
    description: `מחפשים שף פרטי ב${city.he}? מלאו טופס קצר וקבלו הצעות משפים מקצועיים באזור ${city.region}. שירות שף פרטי לאירועים, ארוחות וחגיגות.`,
  };
}

function eventCityPage(event: SeoEvent, city: City): SeoPage {
  return {
    kind: "event-city",
    path: `/private-chef/${event.slug}-${city.slug}`,
    hePath: `/שף-פרטי/${event.heSlug}-${city.heSlug}`,
    citySlug: city.slug,
    eventSlug: event.slug,
    title: `שף פרטי ל${event.heFor} ב${city.he} | השף שלי`,
    h1: `שף פרטי ל${event.heFor} ב${city.he}`,
    description: `שף פרטי ל${event.heFor} ב${city.he}. מלאו טופס קצר וקבלו הצעות משפים מקצועיים. תפריט מותאם, חוויה קולינרית בבית.`,
  };
}

function kosherCityPage(city: City): SeoPage {
  return {
    kind: "kosher-city",
    path: `/kosher-private-chef/${city.slug}`,
    hePath: `/שף-פרטי-כשר/${city.heSlug}`,
    citySlug: city.slug,
    title: `שף פרטי כשר ב${city.he} | בישול כשר לאירועים`,
    h1: `שף פרטי כשר ב${city.he}`,
    description: `שף פרטי כשר ב${city.he} לאירועים וארוחות. מלאו טופס קצר וקבלו הצעות משפים מקצועיים עם תפריט כשר מותאם.`,
  };
}

// The full cartesian set of programmatic pages.
export function allSeoPages(): SeoPage[] {
  const pages: SeoPage[] = [];
  for (const city of CITIES) {
    pages.push(cityPage(city));
    pages.push(kosherCityPage(city));
    for (const event of SEO_EVENTS) {
      pages.push(eventCityPage(event, city));
    }
  }
  return pages;
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

// Resolve a page by either its English or its Hebrew path. Both URLs are
// prerendered, each rendering its own language; they are hreflang alternates.
export function seoPageByPath(path: string): SeoPage | undefined {
  const decoded = decodePath(path);
  return allSeoPages().find((p) => p.path === decoded || p.hePath === decoded);
}

// Which language a pathname addresses on a resolved page: the Hebrew path → he,
// the English path → en.
export function localeForPath(page: SeoPage, path: string): Locale {
  return decodePath(path) === page.hePath ? "he" : "en";
}

// The path for a page in a given locale.
export function pathForLocale(page: SeoPage, locale: Locale): string {
  return locale === "he" ? page.hePath : page.path;
}
