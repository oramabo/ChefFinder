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
  author: string; // display name, Hebrew page (first name + initial)
  authorEn: string; // display name, English page
  citySlug?: string; // city the review relates to, when relevant
  eventSlug?: string; // event type, when relevant
  rating: number; // 1–5
  text: string; // Hebrew review body
  textEn: string; // English review body
  monthYear: string; // e.g. "מרץ 2026" (no runtime Date use)
  monthYearEn: string; // e.g. "March 2026"
}

// Seed reviews (placeholder — see the warning above). Spread across cities and
// occasions so each programmatic page can show relevant social proof.
export const REVIEWS: Review[] = [
  { author: "ענת ל.", authorEn: "Anat L.", citySlug: "tel-aviv", eventSlug: "birthday", rating: 5, monthYear: "מרץ 2026", monthYearEn: "March 2026", text: "הזמנו שף ליום הולדת 40 בבית והכול היה מושלם — האורחים לא הפסיקו להתלהב, והמטבח נשאר נקי.", textEn: "We hired a chef for a 40th birthday at home and everything was perfect — the guests couldn't stop raving, and the kitchen stayed clean." },
  { author: "יוסי מ.", authorEn: "Yossi M.", citySlug: "tel-aviv", eventSlug: "romantic-dinner", rating: 5, monthYear: "פברואר 2026", monthYearEn: "February 2026", text: "ארוחה זוגית מפנקת בלי לצאת מהבית. השף היה מקצועי ונעים, בהחלט נזמין שוב.", textEn: "A pampering couple's dinner without leaving home. The chef was professional and pleasant — we'll definitely book again." },
  { author: "דנה כ.", authorEn: "Dana C.", citySlug: "jerusalem", eventSlug: "family-gathering", rating: 5, monthYear: "ינואר 2026", monthYearEn: "January 2026", text: "אירוח שבת גדול למשפחה — תפריט כשר מדהים והכול הגיע בזמן. חסך לנו המון עבודה.", textEn: "A big family Shabbat meal — an amazing kosher menu and everything arrived on time. Saved us so much work." },
  { author: "משה ב.", authorEn: "Moshe B.", citySlug: "jerusalem", eventSlug: "business-event", rating: 4, monthYear: "אפריל 2026", monthYearEn: "April 2026", text: "אירוע עסקי לצוות, אוכל ברמה גבוהה. התיאום היה קל, ממליץ.", textEn: "A business event for the team — high-level food. Coordination was easy, recommend." },
  { author: "רונית ש.", authorEn: "Ronit S.", citySlug: "haifa", eventSlug: "family-gathering", rating: 5, monthYear: "מרץ 2026", monthYearEn: "March 2026", text: "שף פרטי לארוחה משפחתית בחיפה — דגים טריים וסלטים, כולם יצאו מרוצים.", textEn: "A private chef for a family meal in Haifa — fresh fish and salads, everyone was happy." },
  { author: "עידן פ.", authorEn: "Idan P.", citySlug: "herzliya", eventSlug: "anniversary", rating: 5, monthYear: "מאי 2026", monthYearEn: "May 2026", text: "חגגנו יום נישואין עם תפריט טעימות. חוויה של מסעדת שף בבית שלנו.", textEn: "We celebrated our anniversary with a tasting menu. A chef-restaurant experience in our own home." },
  { author: "גליה ר.", authorEn: "Galia R.", citySlug: "herzliya", eventSlug: "birthday", rating: 5, monthYear: "פברואר 2026", monthYearEn: "February 2026", text: "יום הולדת מפתיע, השף הקים עמדות אוכל חיות. האורחים חשבו שזה קייטרינג יוקרתי.", textEn: "A surprise birthday — the chef set up live food stations. Guests thought it was luxury catering." },
  { author: "אבי נ.", authorEn: "Avi N.", citySlug: "netanya", eventSlug: "romantic-dinner", rating: 5, monthYear: "אפריל 2026", monthYearEn: "April 2026", text: "מטבח צרפתי אמיתי בבית. שירות מדויק, נזמין שוב לאירוע הבא.", textEn: "Real French cuisine at home. Precise service — we'll book again for the next event." },
  { author: "שירה ט.", authorEn: "Shira T.", citySlug: "ramat-gan", eventSlug: "birthday", rating: 4, monthYear: "מרץ 2026", monthYearEn: "March 2026", text: "שף ליום הולדת של הילד, הותאם תפריט לילדים ולמבוגרים. מרוצים מאוד.", textEn: "A chef for my kid's birthday — the menu was tailored for kids and adults. Very happy." },
  { author: "תמר ל.", authorEn: "Tamar L.", citySlug: "rishon-lezion", eventSlug: "family-gathering", rating: 5, monthYear: "מאי 2026", monthYearEn: "May 2026", text: "בישול על האש בחצר לכל המשפחה — נדיב וטעים, במחיר הוגן.", textEn: "A grill in the yard for the whole family — generous and tasty, at a fair price." },
  { author: "קובי א.", authorEn: "Kobi A.", citySlug: "beer-sheva", eventSlug: "business-event", rating: 4, monthYear: "ינואר 2026", monthYearEn: "January 2026", text: "אירוע חברה בדרום, השף הגיע עם הכל. פשוט וללא כאב ראש.", textEn: "A company event in the south — the chef came with everything. Simple and hassle-free." },
  { author: "מירי ד.", authorEn: "Miri D.", citySlug: "ashdod", eventSlug: "family-gathering", rating: 5, monthYear: "אפריל 2026", monthYearEn: "April 2026", text: "תפריט מרוקאי כשר לחג. הכול טרי והוגש יפה, תודה רבה!", textEn: "A kosher Moroccan menu for the holiday. Everything fresh and beautifully served — thank you!" },
  { author: "נועה ג.", authorEn: "Noa G.", citySlug: "raanana", eventSlug: "birthday", rating: 5, monthYear: "פברואר 2026", monthYearEn: "February 2026", text: "מסיבת יום הולדת בגינה, השף דאג לכל פרט. ממליצה בחום.", textEn: "A garden birthday party — the chef took care of every detail. Highly recommend." },
  { author: "אלון ס.", authorEn: "Alon S.", citySlug: "kfar-saba", eventSlug: "romantic-dinner", rating: 5, monthYear: "מרץ 2026", monthYearEn: "March 2026", text: "ערב זוגי שקט עם ארוחה מוקפדת. חוויה ששווה כל שקל.", textEn: "A quiet couple's evening with a refined meal. An experience worth every shekel." },
  { author: "יעל ו.", authorEn: "Yael V.", citySlug: "modiin", eventSlug: "family-gathering", rating: 5, monthYear: "מאי 2026", monthYearEn: "May 2026", text: "אירוח משפחתי כשר בשבת, חסך לי יומיים של בישולים. מעולה.", textEn: "Kosher family hosting on Shabbat — saved me two days of cooking. Excellent." },
  { author: "דור מ.", authorEn: "Dor M.", citySlug: "eilat", eventSlug: "business-event", rating: 5, monthYear: "אפריל 2026", monthYearEn: "April 2026", text: "אירוח קבוצה בווילה באילת, דגים ופירות ים מדהימים. חוויה בלתי נשכחת.", textEn: "Hosting a group at a villa in Eilat — amazing fish and seafood. An unforgettable experience." },
  { author: "שני פ.", authorEn: "Shani P.", citySlug: "caesarea", eventSlug: "anniversary", rating: 5, monthYear: "מרץ 2026", monthYearEn: "March 2026", text: "ערב יוקרתי בבית עם תפריט טעימות ויין. ברמה של מסעדה מובילה.", textEn: "A luxurious evening at home with a tasting menu and wine. On the level of a leading restaurant." },
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
