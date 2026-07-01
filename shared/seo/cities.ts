// Cities used to generate programmatic SEO/GEO pages. Keep the M1 list modest
// to bound build time; expand with data later. `slug` is the URL segment.
//
// Every city carries genuinely differentiated data in BOTH languages — a local
// blurb, the cuisine types that actually sell there, and a per-guest price band.
// Hebrew fields drive the Hebrew page (/שף-פרטי/…); the `en*` fields drive the
// English page (/private-chef/…). The two are separate, indexable, hreflang-
// linked pages — not one auto-translated template.
export interface City {
  slug: string; // English URL segment, e.g. tel-aviv
  heSlug: string; // Hebrew URL segment, e.g. תל-אביב
  he: string; // Hebrew display name
  en: string; // English display name
  region: string; // Hebrew region name
  enRegion: string; // English region name
  cuisines: string[]; // cuisine styles that sell locally (Hebrew)
  enCuisines: string[]; // cuisine styles (English)
  blurb: string; // 1–2 sentences of real local context (Hebrew)
  enBlurb: string; // same, English
  priceFrom: number; // typical per-guest price band, ILS
  priceTo: number;
}

export const CITIES: City[] = [
  {
    slug: "tel-aviv",
    heSlug: "תל-אביב",
    he: "תל אביב",
    en: "Tel Aviv",
    region: "מרכז",
    enRegion: "Central Israel",
    cuisines: ["ים-תיכונית", "אסייתית", "טבעונית", "תפריט טעימות של שף"],
    enCuisines: ["Mediterranean", "Asian", "vegan", "a chef's tasting menu"],
    blurb:
      "תל אביב היא בירת הקולינריה של ישראל — קהל שמחפש תפריטים נועזים, אוכל רחוב מוקפד וחוויות טעימה מעבר לארוחה רגילה.",
    enBlurb:
      "Tel Aviv is Israel's culinary capital — a crowd that wants bold menus, refined street food and tasting experiences beyond an ordinary meal.",
    priceFrom: 180,
    priceTo: 450,
  },
  {
    slug: "jerusalem",
    heSlug: "ירושלים",
    he: "ירושלים",
    en: "Jerusalem",
    region: "ירושלים",
    enRegion: "the Jerusalem area",
    cuisines: ["ירושלמית", "מזרחית", "כשרה", "מנות שבת וחג"],
    enCuisines: ["Jerusalem-style", "Middle Eastern", "kosher", "Shabbat & holiday dishes"],
    blurb:
      "בירושלים הביקוש מוטה לאירוחי שבת וחג ולתפריטים כשרים למהדרין, לצד מטבח מזרחי-ירושלמי אותנטי.",
    enBlurb:
      "In Jerusalem demand leans toward Shabbat and holiday hosting and strictly kosher menus, alongside authentic Middle Eastern cooking.",
    priceFrom: 160,
    priceTo: 400,
  },
  {
    slug: "haifa",
    heSlug: "חיפה",
    he: "חיפה",
    en: "Haifa",
    region: "צפון",
    enRegion: "Northern Israel",
    cuisines: ["ערבית-גלילית", "דגים ופירות ים", "ים-תיכונית", "על האש"],
    enCuisines: ["Galilee-Arab", "fish & seafood", "Mediterranean", "grill"],
    blurb:
      "בחיפה ובקריות בולט אירוח משפחתי גדול, לצד מטבח ערבי-גלילי ודגים טריים מהצפון.",
    enBlurb:
      "In Haifa and the Krayot large family hosting stands out, alongside Galilee-Arab cuisine and fresh northern fish.",
    priceFrom: 140,
    priceTo: 350,
  },
  {
    slug: "rishon-lezion",
    heSlug: "ראשון-לציון",
    he: "ראשון לציון",
    en: "Rishon LeZion",
    region: "מרכז",
    enRegion: "Central Israel",
    cuisines: ["ביתית משודרגת", "בשרים על האש", "איטלקית"],
    enCuisines: ["elevated home cooking", "grilled meats", "Italian"],
    blurb:
      "בראשון לציון מובילים אירועי משפחה גדולים בחצר ובגינה, עם דגש על בשרים ותפריט נדיב.",
    enBlurb:
      "In Rishon LeZion large family events in the yard and garden lead, with an emphasis on meats and a generous menu.",
    priceFrom: 150,
    priceTo: 380,
  },
  {
    slug: "petah-tikva",
    heSlug: "פתח-תקווה",
    he: "פתח תקווה",
    en: "Petah Tikva",
    region: "מרכז",
    enRegion: "Central Israel",
    cuisines: ["ביתית", "מזרחית", "כשרה"],
    enCuisines: ["home cooking", "Middle Eastern", "kosher"],
    blurb:
      "בפתח תקווה הביקוש הוא לאירוח משפחתי חם ולתפריטים כשרים לשבתות ולחגים.",
    enBlurb:
      "In Petah Tikva the demand is for warm family hosting and kosher menus for Shabbat and holidays.",
    priceFrom: 150,
    priceTo: 360,
  },
  {
    slug: "netanya",
    heSlug: "נתניה",
    he: "נתניה",
    en: "Netanya",
    region: "שרון",
    enRegion: "the Sharon region",
    cuisines: ["צרפתית", "ים-תיכונית", "דגים", "מאפים וקינוחים"],
    enCuisines: ["French", "Mediterranean", "fish", "pastries & desserts"],
    blurb:
      "בנתניה קהילה גדולה דוברת צרפתית שמחפשת מטבח צרפתי אותנטי — פטיסרי, בישרנות ותפריט אלגנטי.",
    enBlurb:
      "Netanya has a large French-speaking community looking for authentic French cuisine — patisserie, butchery and an elegant menu.",
    priceFrom: 160,
    priceTo: 400,
  },
  {
    slug: "beer-sheva",
    heSlug: "באר-שבע",
    he: "באר שבע",
    en: "Be'er Sheva",
    region: "דרום",
    enRegion: "Southern Israel",
    cuisines: ["מזרחית", "בשרים על האש", "ביתית"],
    enCuisines: ["Middle Eastern", "grilled meats", "home cooking"],
    blurb:
      "בבאר שבע ובדרום בולט אירוח משפחתי גדול ותפריטי בשרים נדיבים במחירים נוחים.",
    enBlurb:
      "In Be'er Sheva and the south, large family hosting and generous meat menus stand out at comfortable prices.",
    priceFrom: 130,
    priceTo: 320,
  },
  {
    slug: "herzliya",
    heSlug: "הרצליה",
    he: "הרצליה",
    en: "Herzliya",
    region: "שרון",
    enRegion: "the Sharon region",
    cuisines: ["פיין-דיינינג", "תפריט טעימות של שף", "אסייתית", "גורמה"],
    enCuisines: ["fine dining", "a chef's tasting menu", "Asian", "gourmet"],
    blurb:
      "בהרצליה פיתוח מובילים אירוחי יוקרה בבתים פרטיים — תפריטי שף גבוהים, מנות מוקפדות והגשה מלאה.",
    enBlurb:
      "In Herzliya Pituach, luxury hosting in private homes leads — high-end chef menus, refined dishes and full service.",
    priceFrom: 200,
    priceTo: 500,
  },
  {
    slug: "ramat-gan",
    heSlug: "רמת-גן",
    he: "רמת גן",
    en: "Ramat Gan",
    region: "מרכז",
    enRegion: "Central Israel",
    cuisines: ["איטלקית", "בשרים", "ים-תיכונית"],
    enCuisines: ["Italian", "meats", "Mediterranean"],
    blurb:
      "ברמת גן ובגבעתיים הביקוש הוא לאירוח עירוני מוקפד — מטבח איטלקי, בשרים ותפריטי שף לדירות ולגגות.",
    enBlurb:
      "In Ramat Gan and Givatayim the demand is for refined urban hosting — Italian cuisine, meats and chef menus for apartments and rooftops.",
    priceFrom: 170,
    priceTo: 420,
  },
  {
    slug: "raanana",
    heSlug: "רעננה",
    he: "רעננה",
    en: "Ra'anana",
    region: "שרון",
    enRegion: "the Sharon region",
    cuisines: ["אמריקאית", "ביתית משודרגת", "אנגלו-סקסית"],
    enCuisines: ["American", "elevated home cooking", "Anglo"],
    blurb:
      "ברעננה קהילת עולים גדולה שמחפשת אירוח בסגנון אמריקאי ובריטי לצד תפריטי חג ומשפחה.",
    enBlurb:
      "Ra'anana has a large immigrant community looking for American and British-style hosting alongside holiday and family menus.",
    priceFrom: 170,
    priceTo: 420,
  },
  {
    slug: "kfar-saba",
    heSlug: "כפר-סבא",
    he: "כפר סבא",
    en: "Kfar Saba",
    region: "שרון",
    enRegion: "the Sharon region",
    cuisines: ["ביתית משודרגת", "מטבח בריא", "ים-תיכונית"],
    enCuisines: ["elevated home cooking", "healthy cuisine", "Mediterranean"],
    blurb:
      "בכפר סבא מובילים אירוחי משפחה בגינה ותפריטים בריאים וטריים, לצד ערבי שף אינטימיים.",
    enBlurb:
      "In Kfar Saba, family hosting in the garden and fresh, healthy menus lead, alongside intimate chef evenings.",
    priceFrom: 160,
    priceTo: 400,
  },
  {
    slug: "ashdod",
    heSlug: "אשדוד",
    he: "אשדוד",
    en: "Ashdod",
    region: "דרום",
    enRegion: "Southern Israel",
    cuisines: ["מרוקאית", "דגים", "מזרחית", "כשרה"],
    enCuisines: ["Moroccan", "fish", "Middle Eastern", "kosher"],
    blurb:
      "באשדוד בולט מטבח מרוקאי ומזרחי עשיר, דגים טריים ותפריטים כשרים לאירוחי משפחה גדולים.",
    enBlurb:
      "In Ashdod, rich Moroccan and Middle Eastern cuisine stands out, with fresh fish and kosher menus for large family gatherings.",
    priceFrom: 140,
    priceTo: 350,
  },
  {
    slug: "modiin",
    heSlug: "מודיעין",
    he: "מודיעין",
    en: "Modi'in",
    region: "מרכז",
    enRegion: "Central Israel",
    cuisines: ["ביתית", "כשרה", "אירוח משפחתי"],
    enCuisines: ["home cooking", "kosher", "family hosting"],
    blurb:
      "במודיעין הביקוש הוא לאירוח משפחתי חם ולתפריטים כשרים לשבתות, חגים וימי הולדת.",
    enBlurb:
      "In Modi'in the demand is for warm family hosting and kosher menus for Shabbat, holidays and birthdays.",
    priceFrom: 150,
    priceTo: 370,
  },
  {
    slug: "eilat",
    heSlug: "אילת",
    he: "אילת",
    en: "Eilat",
    region: "דרום",
    enRegion: "Southern Israel",
    cuisines: ["דגים ופירות ים", "ים-תיכונית", "אירוח נופש בווילה"],
    enCuisines: ["fish & seafood", "Mediterranean", "villa vacation hosting"],
    blurb:
      "באילת בולט אירוח לחופשות ולקבוצות בווילות ובצימרים — תפריטי דגים, ים-תיכוני ואירוח בריכה.",
    enBlurb:
      "In Eilat, hosting for vacations and groups in villas and cabins stands out — fish, Mediterranean and poolside dining.",
    priceFrom: 160,
    priceTo: 420,
  },
  {
    slug: "caesarea",
    heSlug: "קיסריה",
    he: "קיסריה",
    en: "Caesarea",
    region: "שרון",
    enRegion: "the Sharon region",
    cuisines: ["פיין-דיינינג", "גורמה", "יין ואוכל", "תפריט טעימות של שף"],
    enCuisines: ["fine dining", "gourmet", "wine & food", "a chef's tasting menu"],
    blurb:
      "בקיסריה מובילים אירוחי יוקרה בבתים פרטיים עם דגש על חוויית שף מלאה, יינות תואמים והגשה מוקפדת.",
    enBlurb:
      "In Caesarea, luxury hosting in private homes leads with an emphasis on a full chef experience, matching wines and refined service.",
    priceFrom: 220,
    priceTo: 550,
  },
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
