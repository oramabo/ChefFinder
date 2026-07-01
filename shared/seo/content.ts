// Differentiated content + structured data for each programmatic SEO page.
//
// Everything a programmatic page shows — its intro, cards, menu, FAQ and
// JSON-LD — is derived here from the city and event data. The goal is that no
// two pages read alike: a birthday page in Herzliya and a kosher page in Ashdod
// share a template but not their words, price band, cuisines or FAQ. Thin,
// swap-the-name pages get buried; these don't.
import type { SeoPage } from "./pages.ts";
import { cityBySlug, type City } from "./cities.ts";
import { eventBySlug, type SeoEvent } from "./events.ts";
import {
  REVIEWS_ARE_REAL,
  aggregateRating,
  reviewsForCity,
  type Aggregate,
  type Review,
} from "./reviews.ts";

// Brand name kept local to `shared/` so this module stays isomorphic (no import
// from `src/`). Mirror of BRAND.he in src/lib/brand.ts.
export const BRAND_HE = "ezfind";

export interface Faq {
  q: string;
  a: string;
}

export interface Highlight {
  title: string;
  body: string;
}

export interface PageContent {
  city: City;
  event?: SeoEvent;
  kosher: boolean;
  intro: string; // differentiated opening paragraph
  priceFrom: number;
  priceTo: number;
  cuisines: string[];
  highlights: Highlight[];
  menu?: string[]; // event menu ideas, when applicable
  faq: Faq[];
  // Populated only when REVIEWS_ARE_REAL — otherwise empty / null so no rating
  // UI or schema is emitted (see shared/seo/reviews.ts).
  reviews: Review[];
  rating: Aggregate | null;
}

export function priceBand(from: number, to: number): string {
  return `₪${from}–₪${to} לאורח`;
}

// Resolve the full, differentiated content for a page. Returns null if the
// page's city (or an event page's event) can't be resolved.
export function pageContent(page: SeoPage): PageContent | null {
  const city = cityBySlug(page.citySlug);
  if (!city) return null;
  const event = page.eventSlug ? eventBySlug(page.eventSlug) : undefined;
  if (page.eventSlug && !event) return null;
  const kosher = page.kind === "kosher-city";

  const priceFrom = city.priceFrom;
  const priceTo = city.priceTo;

  const intro = event
    ? `${event.blurb} ב${city.he} תקבלו שף שמגיע עד הבית עם הכל, מבשל בזמן אמת ומשאיר מטבח נקי.`
    : kosher
      ? `שף פרטי כשר ב${city.he} לאירועים ולארוחות — תפריט כשר מלא בהשגחה, שמבושל ומוגש אצלכם בבית. ${city.blurb}`
      : `${city.blurb} שף פרטי ב${city.he} מגיע עד הבית, מתאים תפריט אישית ודואג לכל שלב — מהקנייה ועד הפינוי.`;

  const highlights: Highlight[] = [
    {
      title: "טווח מחירים",
      body: `שף פרטי ${event ? `ל${event.heFor} ` : ""}ב${city.he} עולה לרוב ${priceBand(
        priceFrom,
        priceTo,
      )}, בהתאם לתפריט ולמספר המשתתפים.`,
    },
    {
      title: "איך זה עובד",
      body: `ממלאים טופס קצר, ועד 3 שפים מקצועיים באזור ${city.region} חוזרים אליכם עם הצעה מותאמת — בלי התחייבות.`,
    },
    event
      ? {
          title: `תפריט ל${event.heFor}`,
          body: event.menu.join(" · "),
        }
      : kosher
        ? {
            title: "כשרות מלאה",
            body: `אפשר להתאים תפריט כשר בהשגחה לצד מטבח ${city.cuisines.slice(0, 2).join(" ו")} — לפי רמת הכשרות שאתם צריכים.`,
          }
        : {
            title: "סוגי מטבח",
            body: `ב${city.he} בולטים ${city.cuisines.join(", ")} — תפריט מותאם לאירוע ולטעם שלכם.`,
          },
  ];

  return {
    city,
    event,
    kosher,
    intro,
    priceFrom,
    priceTo,
    cuisines: city.cuisines,
    highlights,
    menu: event?.menu,
    faq: faqFor(city, event, kosher),
    reviews: REVIEWS_ARE_REAL ? reviewsForCity(city.slug) : [],
    rating: REVIEWS_ARE_REAL ? aggregateRating() : null,
  };
}

// Build a page-specific FAQ. Shared spine (price, how many chefs, coverage,
// cuisines) plus an event- or kosher-specific question, so every page's
// FAQPage schema and on-page accordion differ.
function faqFor(city: City, event: SeoEvent | undefined, kosher: boolean): Faq[] {
  const forEvent = event ? `ל${event.heFor} ` : "";
  const kosherNote = kosher ? "כשר " : "";
  const faq: Faq[] = [
    {
      q: `כמה עולה שף פרטי ${kosherNote}${forEvent}ב${city.he}?`,
      a: `המחיר תלוי במספר האורחים ובתפריט, ולרוב נע בין ${priceBand(
        city.priceFrom,
        city.priceTo,
      )}. מלאו טופס וקבלו הצעות מדויקות משפים ב${city.he}.`,
    },
    {
      q: "כמה שפים יחזרו אליי?",
      a: "עד 3 שפים מקצועיים ומאומתים יחזרו אליכם עם הצעה מותאמת, כדי שתוכלו להשוות ולבחור.",
    },
    {
      q: `מאילו אזורים מגיעים השפים?`,
      a: `השפים פועלים ב${city.he} ובכל אזור ${city.region}, ומגיעים עד הבית עם הציוד והמצרכים.`,
    },
  ];

  if (event) {
    faq.push({
      q: `מה כולל תפריט ל${event.heFor}?`,
      a: `תפריט אופייני כולל ${event.menu.join(", ")}. השף מתאים את המנות למספר האורחים, להעדפות ולתקציב.`,
    });
  } else if (kosher) {
    faq.push({
      q: `האם התפריט באמת כשר?`,
      a: `כן. אפשר להזמין תפריט כשר בהשגחה ב${city.he}, כולל הפרדת בשרי/חלבי וכלים לפי הצורך. ציינו את רמת הכשרות בטופס והשפים יתאימו את עצמם.`,
    });
  } else {
    faq.push({
      q: `אילו סוגי מטבח אפשר להזמין ב${city.he}?`,
      a: `בין היתר ${city.cuisines.join(", ")}. אפשר לשלב סגנונות ולהתאים תפריט אישי לאירוע.`,
    });
  }

  return faq;
}

// JSON-LD blocks for a page: LocalBusiness + Service + BreadcrumbList + FAQPage.
// `baseUrl` (the site origin, from VITE_SITE_URL) makes breadcrumb item URLs
// absolute; when absent the paths are used as-is.
export function pageJsonLd(page: SeoPage, baseUrl?: string): Record<string, unknown>[] {
  const content = pageContent(page);
  if (!content) return [];
  const { city, event, kosher, priceFrom, priceTo } = content;
  // Canonical URLs use the Hebrew path, percent-encoded so they're valid.
  const abs = (path: string) => {
    const enc = encodeURI(path);
    return baseUrl ? `${baseUrl}${enc}` : enc;
  };

  const name = event
    ? `שף פרטי ל${event.heFor} ב${city.he}`
    : kosher
      ? `שף פרטי כשר ב${city.he}`
      : `שף פרטי ב${city.he}`;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND_HE,
    description: content.intro,
    areaServed: { "@type": "City", name: city.he },
    priceRange: priceBand(priceFrom, priceTo),
    address: {
      "@type": "PostalAddress",
      addressRegion: city.region,
      addressCountry: "IL",
    },
    url: abs(page.hePath),
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: kosher ? "שף פרטי כשר" : "שף פרטי",
    areaServed: { "@type": "City", name: city.he },
    provider: { "@type": "LocalBusiness", name: BRAND_HE },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ILS",
      lowPrice: priceFrom,
      highPrice: priceTo,
    },
    description: page.description,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "דף הבית", item: abs("/") },
      { "@type": "ListItem", position: 2, name: "שף פרטי", item: abs("/find-a-chef") },
      { "@type": "ListItem", position: 3, name, item: abs(page.hePath) },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // AggregateRating + Review are attached ONLY when the reviews are real (i.e.
  // REVIEWS_ARE_REAL is true, so content.rating is non-null). Emitting rating
  // schema for seed/fake reviews is a manual-action risk that can strip all rich
  // results — the gate lives in shared/seo/reviews.ts.
  if (content.rating) {
    const aggregateRatingLd = {
      "@type": "AggregateRating",
      ratingValue: content.rating.ratingValue,
      reviewCount: content.rating.reviewCount,
      bestRating: content.rating.bestRating,
    };
    const reviewLd = content.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
    }));
    (localBusiness as Record<string, unknown>).aggregateRating = aggregateRatingLd;
    if (reviewLd.length) (localBusiness as Record<string, unknown>).review = reviewLd;
    (service as Record<string, unknown>).aggregateRating = aggregateRatingLd;
  }

  return [localBusiness, service, breadcrumb, faqPage];
}
