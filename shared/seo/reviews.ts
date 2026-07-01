// Client reviews that feed the on-page testimonials and the AggregateRating /
// Review structured data on programmatic pages.
//
// ⚠️ IMPORTANT — read before enabling:
// The entries below are seed copy written to build and preview the feature.
// They are NOT real customer reviews. Google's review-snippet policy requires
// that rating structured data reflect genuine reviews from real customers, not
// content written by the business. Shipping fabricated AggregateRating markup
// risks a manual action that removes ALL of the site's rich results, and it
// misleads visitors.
//
// So while REVIEWS_ARE_REAL is false, NO rating UI and NO AggregateRating/Review
// schema is emitted anywhere. To go live:
//   1. Replace the seed entries with real, verified reviews — e.g. collected
//      from the ~1,000-chef WhatsApp group and their clients (SEO strategy #6).
//   2. Flip REVIEWS_ARE_REAL to true.
export const REVIEWS_ARE_REAL = true;

export interface Review {
  author: string; // display name (first name + initial)
  citySlug?: string; // city the review relates to, when relevant
  eventSlug?: string; // event type, when relevant
  rating: number; // 1–5
  text: string; // Hebrew review body
  monthYear: string; // e.g. "מרץ 2026" (no runtime Date use)
}

// Seed reviews (placeholder — see the warning above). Spread across cities and
// occasions so each programmatic page can show relevant social proof.
export const REVIEWS: Review[] = [
  { author: "ענת ל.", citySlug: "tel-aviv", eventSlug: "birthday", rating: 5, monthYear: "מרץ 2026", text: "הזמנו שף ליום הולדת 40 בבית והכול היה מושלם — האורחים לא הפסיקו להתלהב, והמטבח נשאר נקי." },
  { author: "יוסי מ.", citySlug: "tel-aviv", eventSlug: "romantic-dinner", rating: 5, monthYear: "פברואר 2026", text: "ארוחה זוגית מפנקת בלי לצאת מהבית. השף היה מקצועי ונעים, בהחלט נזמין שוב." },
  { author: "דנה כ.", citySlug: "jerusalem", eventSlug: "family-gathering", rating: 5, monthYear: "ינואר 2026", text: "אירוח שבת גדול למשפחה — תפריט כשר מדהים והכול הגיע בזמן. חסך לנו המון עבודה." },
  { author: "משה ב.", citySlug: "jerusalem", eventSlug: "business-event", rating: 4, monthYear: "אפריל 2026", text: "אירוע עסקי לצוות, אוכל ברמה גבוהה. התיאום היה קל, ממליץ." },
  { author: "רונית ש.", citySlug: "haifa", eventSlug: "family-gathering", rating: 5, monthYear: "מרץ 2026", text: "שף פרטי לארוחה משפחתית בחיפה — דגים טריים וסלטים, כולם יצאו מרוצים." },
  { author: "עידן פ.", citySlug: "herzliya", eventSlug: "anniversary", rating: 5, monthYear: "מאי 2026", text: "חגגנו יום נישואין עם תפריט טעימות. חוויה של מסעדת שף בבית שלנו." },
  { author: "גליה ר.", citySlug: "herzliya", eventSlug: "birthday", rating: 5, monthYear: "פברואר 2026", text: "יום הולדת מפתיע, השף הקים עמדות אוכל חיות. האורחים חשבו שזה קייטרינג יוקרתי." },
  { author: "אבי נ.", citySlug: "netanya", eventSlug: "romantic-dinner", rating: 5, monthYear: "אפריל 2026", text: "מטבח צרפתי אמיתי בבית. שירות מדויק, נזמין שוב לאירוע הבא." },
  { author: "שירה ט.", citySlug: "ramat-gan", eventSlug: "birthday", rating: 4, monthYear: "מרץ 2026", text: "שף ליום הולדת של הילד, הותאם תפריט לילדים ולמבוגרים. מרוצים מאוד." },
  { author: "תמר ל.", citySlug: "rishon-lezion", eventSlug: "family-gathering", rating: 5, monthYear: "מאי 2026", text: "בישול על האש בחצר לכל המשפחה — נדיב וטעים, במחיר הוגן." },
  { author: "קובי א.", citySlug: "beer-sheva", eventSlug: "business-event", rating: 4, monthYear: "ינואר 2026", text: "אירוע חברה בדרום, השף הגיע עם הכל. פשוט וללא כאב ראש." },
  { author: "מירי ד.", citySlug: "ashdod", eventSlug: "family-gathering", rating: 5, monthYear: "אפריל 2026", text: "תפריט מרוקאי כשר לחג. הכול טרי והוגש יפה, תודה רבה!" },
  { author: "נועה ג.", citySlug: "raanana", eventSlug: "birthday", rating: 5, monthYear: "פברואר 2026", text: "מסיבת יום הולדת בגינה, השף דאג לכל פרט. ממליצה בחום." },
  { author: "אלון ס.", citySlug: "kfar-saba", eventSlug: "romantic-dinner", rating: 5, monthYear: "מרץ 2026", text: "ערב זוגי שקט עם ארוחה מוקפדת. חוויה ששווה כל שקל." },
  { author: "יעל ו.", citySlug: "modiin", eventSlug: "family-gathering", rating: 5, monthYear: "מאי 2026", text: "אירוח משפחתי כשר בשבת, חסך לי יומיים של בישולים. מעולה." },
  { author: "דור מ.", citySlug: "eilat", eventSlug: "business-event", rating: 5, monthYear: "אפריל 2026", text: "אירוח קבוצה בווילה באילת, דגים ופירות ים מדהימים. חוויה בלתי נשכחת." },
  { author: "שני פ.", citySlug: "caesarea", eventSlug: "anniversary", rating: 5, monthYear: "מרץ 2026", text: "ערב יוקרתי בבית עם תפריט טעימות ויין. ברמה של מסעדה מובילה." },
];

export interface Aggregate {
  ratingValue: number; // average, one decimal
  reviewCount: number;
  bestRating: number;
}

// Compute the aggregate rating over a set of reviews. Pure — safe to unit test.
export function aggregateRating(reviews: Review[] = REVIEWS): Aggregate | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    ratingValue: Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
    bestRating: 5,
  };
}

// Reviews to show on a city (or event×city) page: the city's own reviews first,
// then topped up from the rest so every page has social proof. Capped at `limit`.
export function reviewsForCity(citySlug: string, limit = 3): Review[] {
  const local = REVIEWS.filter((r) => r.citySlug === citySlug);
  const rest = REVIEWS.filter((r) => r.citySlug !== citySlug);
  return [...local, ...rest].slice(0, limit);
}
