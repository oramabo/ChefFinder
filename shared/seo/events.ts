// Event types used to generate programmatic /private-chef/[event]-[city] pages.
export interface SeoEvent {
  slug: string;
  he: string; // Hebrew display name (noun phrase)
  heFor: string; // Hebrew phrasing used after "שף פרטי ל..."
}

export const SEO_EVENTS: SeoEvent[] = [
  { slug: "birthday", he: "יום הולדת", heFor: "יום הולדת" },
  { slug: "anniversary", he: "יום נישואין", heFor: "יום נישואין" },
  { slug: "romantic-dinner", he: "ארוחה זוגית", heFor: "ארוחה זוגית" },
  { slug: "business-event", he: "אירוע עסקי", heFor: "אירוע עסקי" },
  { slug: "family-gathering", he: "ארוחה משפחתית", heFor: "ארוחה משפחתית" },
];

export function eventBySlug(slug: string): SeoEvent | undefined {
  return SEO_EVENTS.find((e) => e.slug === slug);
}
