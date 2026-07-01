// Cities used to generate programmatic SEO/GEO pages. Keep the M1 list modest
// to bound build time; expand with data later. `slug` is the URL segment.
//
// Every city carries genuinely differentiated data — a local blurb, the cuisine
// types that actually sell there, and a per-guest price band. This is what keeps
// the programmatic pages from reading as one template with the name swapped
// (thin content Google buries); the page body and FAQ are built from these.
export interface City {
  slug: string;
  he: string; // Hebrew display name
  region: string; // Hebrew region name
  cuisines: string[]; // cuisine styles that sell locally (Hebrew)
  blurb: string; // 1–2 sentences of real local context
  priceFrom: number; // typical per-guest price band, ILS
  priceTo: number;
}

export const CITIES: City[] = [
  {
    slug: "tel-aviv",
    he: "תל אביב",
    region: "מרכז",
    cuisines: ["ים-תיכונית", "אסייתית", "טבעונית", "תפריט טעימות של שף"],
    blurb:
      "תל אביב היא בירת הקולינריה של ישראל — קהל שמחפש תפריטים נועזים, אוכל רחוב מוקפד וחוויות טעימה מעבר לארוחה רגילה.",
    priceFrom: 180,
    priceTo: 450,
  },
  {
    slug: "jerusalem",
    he: "ירושלים",
    region: "ירושלים",
    cuisines: ["ירושלמית", "מזרחית", "כשרה", "מנות שבת וחג"],
    blurb:
      "בירושלים הביקוש מוטה לאירוחי שבת וחג ולתפריטים כשרים למהדרין, לצד מטבח מזרחי-ירושלמי אותנטי.",
    priceFrom: 160,
    priceTo: 400,
  },
  {
    slug: "haifa",
    he: "חיפה",
    region: "צפון",
    cuisines: ["ערבית-גלילית", "דגים ופירות ים", "ים-תיכונית", "על האש"],
    blurb:
      "בחיפה ובקריות בולט אירוח משפחתי גדול, לצד מטבח ערבי-גלילי ודגים טריים מהצפון.",
    priceFrom: 140,
    priceTo: 350,
  },
  {
    slug: "rishon-lezion",
    he: "ראשון לציון",
    region: "מרכז",
    cuisines: ["ביתית משודרגת", "בשרים על האש", "איטלקית"],
    blurb:
      "בראשון לציון מובילים אירועי משפחה גדולים בחצר ובגינה, עם דגש על בשרים ותפריט נדיב.",
    priceFrom: 150,
    priceTo: 380,
  },
  {
    slug: "petah-tikva",
    he: "פתח תקווה",
    region: "מרכז",
    cuisines: ["ביתית", "מזרחית", "כשרה"],
    blurb:
      "בפתח תקווה הביקוש הוא לאירוח משפחתי חם ולתפריטים כשרים לשבתות ולחגים.",
    priceFrom: 150,
    priceTo: 360,
  },
  {
    slug: "netanya",
    he: "נתניה",
    region: "שרון",
    cuisines: ["צרפתית", "ים-תיכונית", "דגים", "מאפים וקינוחים"],
    blurb:
      "בנתניה קהילה גדולה דוברת צרפתית שמחפשת מטבח צרפתי אותנטי — פטיסרי, בישרנות ותפריט אלגנטי.",
    priceFrom: 160,
    priceTo: 400,
  },
  {
    slug: "beer-sheva",
    he: "באר שבע",
    region: "דרום",
    cuisines: ["מזרחית", "בשרים על האש", "ביתית"],
    blurb:
      "בבאר שבע ובדרום בולט אירוח משפחתי גדול ותפריטי בשרים נדיבים במחירים נוחים.",
    priceFrom: 130,
    priceTo: 320,
  },
  {
    slug: "herzliya",
    he: "הרצליה",
    region: "שרון",
    cuisines: ["פיין-דיינינג", "תפריט טעימות של שף", "אסייתית", "גורמה"],
    blurb:
      "בהרצליה פיתוח מובילים אירוחי יוקרה בבתים פרטיים — תפריטי שף גבוהים, מנות מוקפדות והגשה מלאה.",
    priceFrom: 200,
    priceTo: 500,
  },
  {
    slug: "ramat-gan",
    he: "רמת גן",
    region: "מרכז",
    cuisines: ["איטלקית", "בשרים", "ים-תיכונית"],
    blurb:
      "ברמת גן ובגבעתיים הביקוש הוא לאירוח עירוני מוקפד — מטבח איטלקי, בשרים ותפריטי שף לדירות ולגגות.",
    priceFrom: 170,
    priceTo: 420,
  },
  {
    slug: "raanana",
    he: "רעננה",
    region: "שרון",
    cuisines: ["אמריקאית", "ביתית משודרגת", "אנגלו-סקסית"],
    blurb:
      "ברעננה קהילת עולים גדולה שמחפשת אירוח בסגנון אמריקאי ובריטי לצד תפריטי חג ומשפחה.",
    priceFrom: 170,
    priceTo: 420,
  },
  {
    slug: "kfar-saba",
    he: "כפר סבא",
    region: "שרון",
    cuisines: ["ביתית משודרגת", "מטבח בריא", "ים-תיכונית"],
    blurb:
      "בכפר סבא מובילים אירוחי משפחה בגינה ותפריטים בריאים וטריים, לצד ערבי שף אינטימיים.",
    priceFrom: 160,
    priceTo: 400,
  },
  {
    slug: "ashdod",
    he: "אשדוד",
    region: "דרום",
    cuisines: ["מרוקאית", "דגים", "מזרחית", "כשרה"],
    blurb:
      "באשדוד בולט מטבח מרוקאי ומזרחי עשיר, דגים טריים ותפריטים כשרים לאירוחי משפחה גדולים.",
    priceFrom: 140,
    priceTo: 350,
  },
  {
    slug: "modiin",
    he: "מודיעין",
    region: "מרכז",
    cuisines: ["ביתית", "כשרה", "אירוח משפחתי"],
    blurb:
      "במודיעין הביקוש הוא לאירוח משפחתי חם ולתפריטים כשרים לשבתות, חגים וימי הולדת.",
    priceFrom: 150,
    priceTo: 370,
  },
  {
    slug: "eilat",
    he: "אילת",
    region: "דרום",
    cuisines: ["דגים ופירות ים", "ים-תיכונית", "אירוח נופש בווילה"],
    blurb:
      "באילת בולט אירוח לחופשות ולקבוצות בווילות ובצימרים — תפריטי דגים, ים-תיכוני ואירוח בריכה.",
    priceFrom: 160,
    priceTo: 420,
  },
  {
    slug: "caesarea",
    he: "קיסריה",
    region: "שרון",
    cuisines: ["פיין-דיינינג", "גורמה", "יין ואוכל", "תפריט טעימות של שף"],
    blurb:
      "בקיסריה מובילים אירוחי יוקרה בבתים פרטיים עם דגש על חוויית שף מלאה, יינות תואמים והגשה מוקפדת.",
    priceFrom: 220,
    priceTo: 550,
  },
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
