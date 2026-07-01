// Event types used to generate programmatic /private-chef/[event]-[city] pages.
//
// `menu` and `blurb` make each event page about the occasion — not the same
// city copy with a different <h1>. They drive the page body and the FAQ so the
// content is genuinely distinct per event × city.
export interface SeoEvent {
  slug: string;
  he: string; // Hebrew display name (noun phrase)
  heFor: string; // Hebrew phrasing used after "שף פרטי ל..."
  blurb: string; // why hire a chef for this occasion
  menu: string[]; // menu ideas typical for this occasion (Hebrew)
}

export const SEO_EVENTS: SeoEvent[] = [
  {
    slug: "birthday",
    he: "יום הולדת",
    heFor: "יום הולדת",
    blurb:
      "יום הולדת עם שף פרטי הופך את החגיגה לחוויה — בלי לבשל, להגיש או לפנות. השף מגיע עם הכל, מבשל מול האורחים ומשאיר מטבח נקי.",
    menu: ["עמדות אוכל חיות", "מנות פינגר-פוד לשיתוף", "עיקריות חגיגיות", "קינוח יום הולדת מיוחד"],
  },
  {
    slug: "anniversary",
    he: "יום נישואין",
    heFor: "יום נישואין",
    blurb:
      "יום נישואין הוא הזדמנות לערב מפנק בבית — תפריט טעימות זוגי, יין תואם וקינוח מיוחד, בלי לצאת ובלי הזמנות למסעדה.",
    menu: ["תפריט טעימות זוגי", "מנה ראשונה קלה", "עיקרית של שף", "קינוח חגיגי", "התאמת יין"],
  },
  {
    slug: "romantic-dinner",
    he: "ארוחה זוגית",
    heFor: "ארוחה זוגית",
    blurb:
      "ארוחה זוגית פרטית בבית — תפריט טעימות רומנטי, שמוגש ומפונה על ידי השף. אתם רק נהנים; המטבח נשאר נקי.",
    menu: ["אמיוז בוש לפתיחה", "מנה ראשונה", "עיקרית", "קינוח לשניים", "התאמת יין"],
  },
  {
    slug: "business-event",
    he: "אירוע עסקי",
    heFor: "אירוע עסקי",
    blurb:
      "אירוע עסקי עם שף פרטי מרשים לקוחות ומפנק את הצוות בלי לצאת מהמשרד או מהווילה — כיבוד מוקפד, עמדות שף והגשה מקצועית.",
    menu: ["כיבוד עסקי מוקפד", "עמדות שף חיות", "ארוחת צוות מושקעת", "מגשי טעימות"],
  },
  {
    slug: "family-gathering",
    he: "ארוחה משפחתית",
    heFor: "ארוחה משפחתית",
    blurb:
      "ארוחה משפחתית עם שף מאפשרת לארח גדול בלי שאף אחד ייתקע במטבח — מנות למרכז השולחן, אירוח שבת או חג וקינוחים לכולם.",
    menu: ["מנות למרכז השולחן", "אירוח שבת או חג", "תוספות ותבשילים", "מגוון קינוחים"],
  },
];

export function eventBySlug(slug: string): SeoEvent | undefined {
  return SEO_EVENTS.find((e) => e.slug === slug);
}
