// Cities used to generate programmatic SEO/GEO pages. Keep the M1 list modest
// to bound build time; expand with data later. `slug` is the URL segment.
export interface City {
  slug: string;
  he: string; // Hebrew display name
  region: string; // Hebrew region name
}

export const CITIES: City[] = [
  { slug: "tel-aviv", he: "תל אביב", region: "מרכז" },
  { slug: "jerusalem", he: "ירושלים", region: "ירושלים" },
  { slug: "haifa", he: "חיפה", region: "צפון" },
  { slug: "rishon-lezion", he: "ראשון לציון", region: "מרכז" },
  { slug: "petah-tikva", he: "פתח תקווה", region: "מרכז" },
  { slug: "netanya", he: "נתניה", region: "שרון" },
  { slug: "beer-sheva", he: "באר שבע", region: "דרום" },
  { slug: "herzliya", he: "הרצליה", region: "שרון" },
  { slug: "ramat-gan", he: "רמת גן", region: "מרכז" },
  { slug: "raanana", he: "רעננה", region: "שרון" },
  { slug: "kfar-saba", he: "כפר סבא", region: "שרון" },
  { slug: "ashdod", he: "אשדוד", region: "דרום" },
  { slug: "modiin", he: "מודיעין", region: "מרכז" },
  { slug: "eilat", he: "אילת", region: "דרום" },
  { slug: "caesarea", he: "קיסריה", region: "שרון" },
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
