// Differentiated, per-locale content + structured data for each programmatic
// page. Everything a page shows — title, h1, intro, cards, menu, FAQ and
// JSON-LD — is derived here from the city/event data in the requested language.
// The Hebrew page (/שף-פרטי/…) and the English page (/private-chef/…) are
// separate, indexable, hreflang-linked pages, each in genuine native copy.
import type { Locale, SeoPage } from "./pages.ts";
import { pathForLocale } from "./pages.ts";
import { cityBySlug, type City } from "./cities.ts";
import { eventBySlug, type SeoEvent } from "./events.ts";
import {
  REVIEWS_ARE_REAL,
  aggregateRating,
  reviewsForCity,
  type Aggregate,
  type Review,
} from "./reviews.ts";

// Brand name per locale, kept local to `shared/` so this module stays isomorphic.
const BRAND = { he: "השף שלי", en: "ezfind" } as const;

export interface Faq {
  q: string;
  a: string;
}

export interface Highlight {
  title: string;
  body: string;
}

export interface PageContent {
  locale: Locale;
  dir: "rtl" | "ltr";
  city: City;
  event?: SeoEvent;
  kosher: boolean;
  title: string; // <title>
  h1: string;
  description: string; // meta description
  intro: string; // differentiated opening paragraph
  priceFrom: number;
  priceTo: number;
  cuisines: string[]; // in the page's language
  highlights: Highlight[];
  menu?: string[]; // event menu ideas, in the page's language
  faq: Faq[];
  // Populated only when REVIEWS_ARE_REAL — otherwise empty / null so no rating
  // UI or schema is emitted (see shared/seo/reviews.ts).
  reviews: Review[];
  rating: Aggregate | null;
}

export function priceBand(from: number, to: number, locale: Locale): string {
  return locale === "he" ? `₪${from}–₪${to} לאורח` : `₪${from}–₪${to} per guest`;
}

// Localised display name for the page's subject (used in <h1>, schema name, …).
function subjectName(city: City, event: SeoEvent | undefined, kosher: boolean, locale: Locale): string {
  if (locale === "he") {
    if (event) return `שף פרטי ל${event.heFor} ב${city.he}`;
    return kosher ? `שף פרטי כשר ב${city.he}` : `שף פרטי ב${city.he}`;
  }
  if (event) return `Private Chef for ${event.enFor} in ${city.en}`;
  return kosher ? `Kosher Private Chef in ${city.en}` : `Private Chef in ${city.en}`;
}

// Title / h1 / meta description per locale.
function displayStrings(
  page: SeoPage,
  city: City,
  event: SeoEvent | undefined,
  kosher: boolean,
  locale: Locale,
): { title: string; h1: string; description: string } {
  // Hebrew reuses the canonical strings already on the page (single source).
  if (locale === "he") {
    return { title: page.title, h1: page.h1, description: page.description };
  }
  const h1 = subjectName(city, event, kosher, "en");
  if (event) {
    return {
      title: `Private Chef for ${event.enFor} in ${city.en} | ezfind`,
      h1,
      description: `Private chef for ${event.enFor.toLowerCase()} in ${city.en}. Fill a short form and get quotes from professional chefs. A custom menu and a culinary experience at home.`,
    };
  }
  if (kosher) {
    return {
      title: `Kosher Private Chef in ${city.en} | Kosher Catering for Events`,
      h1,
      description: `Kosher private chef in ${city.en} for events and meals. Fill a short form and get quotes from professional chefs with a tailored kosher menu.`,
    };
  }
  return {
    title: `Private Chef in ${city.en} | Book a Chef for Any Event`,
    h1,
    description: `Looking for a private chef in ${city.en}? Fill a short form and get quotes from professional chefs across ${city.enRegion}. Private chef service for events, dinners and celebrations.`,
  };
}

// Resolve the full, per-locale content for a page. Returns null if the page's
// city (or an event page's event) can't be resolved.
export function pageContent(page: SeoPage, locale: Locale): PageContent | null {
  const city = cityBySlug(page.citySlug);
  if (!city) return null;
  const event = page.eventSlug ? eventBySlug(page.eventSlug) : undefined;
  if (page.eventSlug && !event) return null;
  const kosher = page.kind === "kosher-city";
  const he = locale === "he";

  const priceFrom = city.priceFrom;
  const priceTo = city.priceTo;
  const cityName = he ? city.he : city.en;
  const region = he ? city.region : city.enRegion;
  const cuisines = he ? city.cuisines : city.enCuisines;
  const menu = event ? (he ? event.menu : event.enMenu) : undefined;

  const { title, h1, description } = displayStrings(page, city, event, kosher, locale);

  const intro = he
    ? event
      ? `${event.blurb} ב${cityName} תקבלו שף שמגיע עד הבית עם הכל, מבשל בזמן אמת ומשאיר מטבח נקי.`
      : kosher
        ? `שף פרטי כשר ב${cityName} לאירועים ולארוחות — תפריט כשר מלא בהשגחה, שמבושל ומוגש אצלכם בבית. ${city.blurb}`
        : `${city.blurb} שף פרטי ב${cityName} מגיע עד הבית, מתאים תפריט אישית ודואג לכל שלב — מהקנייה ועד הפינוי.`
    : event
      ? `${event.enBlurb} In ${cityName} you get a chef who comes to your home with everything, cooks in real time and leaves a clean kitchen.`
      : kosher
        ? `Kosher private chef in ${cityName} for events and meals — a full kosher menu under supervision, cooked and served at your home. ${city.enBlurb}`
        : `${city.enBlurb} A private chef in ${cityName} comes to your home, tailors the menu and handles every step — from shopping to cleanup.`;

  const highlights: Highlight[] = [
    {
      title: he ? "טווח מחירים" : "Price range",
      body: he
        ? `שף פרטי ${event ? `ל${event.heFor} ` : ""}ב${cityName} עולה לרוב ${priceBand(priceFrom, priceTo, "he")}, בהתאם לתפריט ולמספר המשתתפים.`
        : `A private chef ${event ? `for ${event.enFor} ` : ""}in ${cityName} typically costs ${priceBand(priceFrom, priceTo, "en")}, depending on the menu and number of guests.`,
    },
    {
      title: he ? "איך זה עובד" : "How it works",
      body: he
        ? `ממלאים טופס קצר, ועד 3 שפים מקצועיים באזור ${region} חוזרים אליכם עם הצעה מותאמת — בלי התחייבות.`
        : `Fill a short form and up to 3 professional chefs across ${region} get back to you with a tailored quote — no commitment.`,
    },
    event
      ? {
          title: he ? `תפריט ל${event.heFor}` : `Menu for ${event.enFor}`,
          body: (menu ?? []).join(he ? " · " : " · "),
        }
      : kosher
        ? {
            title: he ? "כשרות מלאה" : "Full kashrut",
            body: he
              ? `אפשר להתאים תפריט כשר בהשגחה לצד מטבח ${city.cuisines.slice(0, 2).join(" ו")} — לפי רמת הכשרות שאתם צריכים.`
              : `You can tailor a supervised kosher menu alongside ${city.enCuisines.slice(0, 2).join(" and ")} cuisine — to the level of kashrut you need.`,
          }
        : {
            title: he ? "סוגי מטבח" : "Cuisine styles",
            body: he
              ? `ב${cityName} בולטים ${cuisines.join(", ")} — תפריט מותאם לאירוע ולטעם שלכם.`
              : `In ${cityName}, ${cuisines.join(", ")} stand out — a menu tailored to your event and taste.`,
          },
  ];

  return {
    locale,
    dir: he ? "rtl" : "ltr",
    city,
    event,
    kosher,
    title,
    h1,
    description,
    intro,
    priceFrom,
    priceTo,
    cuisines,
    highlights,
    menu,
    faq: faqFor(city, event, kosher, locale),
    reviews: REVIEWS_ARE_REAL ? reviewsForCity(city.slug) : [],
    rating: REVIEWS_ARE_REAL ? aggregateRating() : null,
  };
}

// Build a page-specific FAQ in the page's language. Shared spine (price, how
// many chefs, coverage) plus an event- or kosher- or cuisine-specific question.
function faqFor(city: City, event: SeoEvent | undefined, kosher: boolean, locale: Locale): Faq[] {
  const he = locale === "he";
  const cityName = he ? city.he : city.en;
  const region = he ? city.region : city.enRegion;
  const band = priceBand(city.priceFrom, city.priceTo, locale);

  const faq: Faq[] = he
    ? [
        {
          q: `כמה עולה שף פרטי ${kosher ? "כשר " : ""}${event ? `ל${event.heFor} ` : ""}ב${cityName}?`,
          a: `המחיר תלוי במספר האורחים ובתפריט, ולרוב נע בין ${band}. מלאו טופס וקבלו הצעות מדויקות משפים ב${cityName}.`,
        },
        {
          q: "כמה שפים יחזרו אליי?",
          a: "עד 3 שפים מקצועיים ומאומתים יחזרו אליכם עם הצעה מותאמת, כדי שתוכלו להשוות ולבחור.",
        },
        {
          q: "מאילו אזורים מגיעים השפים?",
          a: `השפים פועלים ב${cityName} ובכל אזור ${region}, ומגיעים עד הבית עם הציוד והמצרכים.`,
        },
      ]
    : [
        {
          q: `How much does a ${kosher ? "kosher " : ""}private chef ${event ? `for ${event.enFor} ` : ""}in ${cityName} cost?`,
          a: `It depends on the number of guests and the menu, and typically runs ${band}. Fill a short form and get accurate quotes from chefs in ${cityName}.`,
        },
        {
          q: "How many chefs will contact me?",
          a: "Up to 3 professional, verified chefs get back to you with a tailored quote, so you can compare and choose.",
        },
        {
          q: "Which areas do the chefs cover?",
          a: `The chefs work in ${cityName} and across ${region}, and come to your home with the equipment and ingredients.`,
        },
      ];

  if (event) {
    const menu = (he ? event.menu : event.enMenu).join(", ");
    faq.push(
      he
        ? {
            q: `מה כולל תפריט ל${event.heFor}?`,
            a: `תפריט אופייני כולל ${menu}. השף מתאים את המנות למספר האורחים, להעדפות ולתקציב.`,
          }
        : {
            q: `What does a ${event.enFor.replace(/^an? /, "")} menu include?`,
            a: `A typical menu includes ${menu}. The chef tailors the dishes to the number of guests, preferences and budget.`,
          },
    );
  } else if (kosher) {
    faq.push(
      he
        ? {
            q: "האם התפריט באמת כשר?",
            a: `כן. אפשר להזמין תפריט כשר בהשגחה ב${cityName}, כולל הפרדת בשרי/חלבי וכלים לפי הצורך. ציינו את רמת הכשרות בטופס והשפים יתאימו את עצמם.`,
          }
        : {
            q: "Is the menu really kosher?",
            a: `Yes. You can order a supervised kosher menu in ${cityName}, including meat/dairy separation and dishes as needed. Note the level of kashrut in the form and the chefs will match it.`,
          },
    );
  } else {
    const cuisines = (he ? city.cuisines : city.enCuisines).join(", ");
    faq.push(
      he
        ? {
            q: `אילו סוגי מטבח אפשר להזמין ב${cityName}?`,
            a: `בין היתר ${cuisines}. אפשר לשלב סגנונות ולהתאים תפריט אישי לאירוע.`,
          }
        : {
            q: `What cuisine styles can I order in ${cityName}?`,
            a: `Among others: ${cuisines}. You can combine styles and tailor a personal menu for your event.`,
          },
    );
  }

  return faq;
}

// JSON-LD blocks for a page in a given locale: LocalBusiness + Service +
// BreadcrumbList + FAQPage (+ AggregateRating/Review when reviews are real).
// `baseUrl` (site origin, from VITE_SITE_URL) makes URLs absolute; when absent
// the paths are used as-is (percent-encoded so Hebrew URLs stay valid).
export function pageJsonLd(page: SeoPage, locale: Locale, baseUrl?: string): Record<string, unknown>[] {
  const content = pageContent(page, locale);
  if (!content) return [];
  const { city, event, kosher, priceFrom, priceTo } = content;
  const he = locale === "he";
  const brand = BRAND[locale];
  const selfPath = pathForLocale(page, locale);
  const abs = (path: string) => {
    const enc = encodeURI(path);
    return baseUrl ? `${baseUrl}${enc}` : enc;
  };

  const name = subjectName(city, event, kosher, locale);
  const cityName = he ? city.he : city.en;
  const region = he ? city.region : city.enRegion;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand,
    description: content.intro,
    areaServed: { "@type": "City", name: cityName },
    priceRange: priceBand(priceFrom, priceTo, locale),
    address: {
      "@type": "PostalAddress",
      addressRegion: region,
      addressCountry: "IL",
    },
    url: abs(selfPath),
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: he ? (kosher ? "שף פרטי כשר" : "שף פרטי") : kosher ? "Kosher private chef" : "Private chef",
    areaServed: { "@type": "City", name: cityName },
    provider: { "@type": "LocalBusiness", name: brand },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ILS",
      lowPrice: priceFrom,
      highPrice: priceTo,
    },
    description: content.description,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: he ? "דף הבית" : "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: he ? "שף פרטי" : "Private Chef", item: abs("/find-a-chef") },
      { "@type": "ListItem", position: 3, name, item: abs(selfPath) },
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
  // schema for seed/fake reviews is a manual-action risk — the gate lives in
  // shared/seo/reviews.ts.
  if (content.rating) {
    const aggregateRatingLd = {
      "@type": "AggregateRating",
      ratingValue: content.rating.ratingValue,
      reviewCount: content.rating.reviewCount,
      bestRating: content.rating.bestRating,
    };
    const reviewLd = content.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: he ? r.author : r.authorEn },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: he ? r.text : r.textEn,
    }));
    (localBusiness as Record<string, unknown>).aggregateRating = aggregateRatingLd;
    if (reviewLd.length) (localBusiness as Record<string, unknown>).review = reviewLd;
    (service as Record<string, unknown>).aggregateRating = aggregateRatingLd;
  }

  return [localBusiness, service, breadcrumb, faqPage];
}
