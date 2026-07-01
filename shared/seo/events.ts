// Event types used to generate programmatic /private-chef/[event]-[city] pages.
//
// `menu`/`blurb` (Hebrew) drive the Hebrew page; `enMenu`/`enBlurb` (English)
// drive the English page. Each event page is about the occasion — not the same
// city copy with a different <h1>.
export interface SeoEvent {
  slug: string;
  heSlug: string; // Hebrew URL segment, e.g. יום-הולדת
  he: string; // Hebrew display name (noun phrase)
  heFor: string; // Hebrew phrasing used after "שף פרטי ל..."
  en: string; // English display name (noun phrase)
  enFor: string; // English phrasing used after "Private Chef for ..."
  blurb: string; // why hire a chef for this occasion (Hebrew)
  enBlurb: string; // same, English
  menu: string[]; // menu ideas for this occasion (Hebrew)
  enMenu: string[]; // same, English
}

export const SEO_EVENTS: SeoEvent[] = [
  {
    slug: "birthday",
    heSlug: "יום-הולדת",
    he: "יום הולדת",
    heFor: "יום הולדת",
    en: "Birthday",
    enFor: "a Birthday",
    blurb:
      "יום הולדת עם שף פרטי הופך את החגיגה לחוויה — בלי לבשל, להגיש או לפנות. השף מגיע עם הכל, מבשל מול האורחים ומשאיר מטבח נקי.",
    enBlurb:
      "A birthday with a private chef turns the celebration into an experience — no cooking, serving or cleanup. The chef arrives with everything, cooks in front of your guests and leaves a clean kitchen.",
    menu: ["עמדות אוכל חיות", "מנות פינגר-פוד לשיתוף", "עיקריות חגיגיות", "קינוח יום הולדת מיוחד"],
    enMenu: ["live food stations", "finger-food to share", "festive mains", "a special birthday dessert"],
  },
  {
    slug: "anniversary",
    heSlug: "יום-נישואין",
    he: "יום נישואין",
    heFor: "יום נישואין",
    en: "Anniversary",
    enFor: "an Anniversary",
    blurb:
      "יום נישואין הוא הזדמנות לערב מפנק בבית — תפריט טעימות זוגי, יין תואם וקינוח מיוחד, בלי לצאת ובלי הזמנות למסעדה.",
    enBlurb:
      "An anniversary is a chance for a pampering evening at home — a couple's tasting menu, matched wine and a special dessert, without going out and without restaurant reservations.",
    menu: ["תפריט טעימות זוגי", "מנה ראשונה קלה", "עיקרית של שף", "קינוח חגיגי", "התאמת יין"],
    enMenu: ["a couple's tasting menu", "a light starter", "a chef's main", "a festive dessert", "wine pairing"],
  },
  {
    slug: "romantic-dinner",
    heSlug: "ארוחה-זוגית",
    he: "ארוחה זוגית",
    heFor: "ארוחה זוגית",
    en: "Romantic Dinner",
    enFor: "a Romantic Dinner",
    blurb:
      "ארוחה זוגית פרטית בבית — תפריט טעימות רומנטי, שמוגש ומפונה על ידי השף. אתם רק נהנים; המטבח נשאר נקי.",
    enBlurb:
      "A private romantic dinner at home — a romantic tasting menu, served and cleared by the chef. You just enjoy; the kitchen stays clean.",
    menu: ["אמיוז בוש לפתיחה", "מנה ראשונה", "עיקרית", "קינוח לשניים", "התאמת יין"],
    enMenu: ["an amuse-bouche to open", "a starter", "a main", "a dessert for two", "wine pairing"],
  },
  {
    slug: "business-event",
    heSlug: "אירוע-עסקי",
    he: "אירוע עסקי",
    heFor: "אירוע עסקי",
    en: "Business Event",
    enFor: "a Business Event",
    blurb:
      "אירוע עסקי עם שף פרטי מרשים לקוחות ומפנק את הצוות בלי לצאת מהמשרד או מהווילה — כיבוד מוקפד, עמדות שף והגשה מקצועית.",
    enBlurb:
      "A business event with a private chef impresses clients and treats the team without leaving the office or villa — refined catering, chef stations and professional service.",
    menu: ["כיבוד עסקי מוקפד", "עמדות שף חיות", "ארוחת צוות מושקעת", "מגשי טעימות"],
    enMenu: ["refined business catering", "live chef stations", "an elevated team meal", "tasting platters"],
  },
  {
    slug: "family-gathering",
    heSlug: "ארוחה-משפחתית",
    he: "ארוחה משפחתית",
    heFor: "ארוחה משפחתית",
    en: "Family Gathering",
    enFor: "a Family Gathering",
    blurb:
      "ארוחה משפחתית עם שף מאפשרת לארח גדול בלי שאף אחד ייתקע במטבח — מנות למרכז השולחן, אירוח שבת או חג וקינוחים לכולם.",
    enBlurb:
      "A family gathering with a chef lets you host big without anyone stuck in the kitchen — dishes for the center of the table, Shabbat or holiday hosting and desserts for everyone.",
    menu: ["מנות למרכז השולחן", "אירוח שבת או חג", "תוספות ותבשילים", "מגוון קינוחים"],
    enMenu: ["dishes for the center of the table", "Shabbat or holiday hosting", "sides and stews", "a variety of desserts"],
  },
];

export function eventBySlug(slug: string): SeoEvent | undefined {
  return SEO_EVENTS.find((e) => e.slug === slug);
}
