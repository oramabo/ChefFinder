import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import LeadRequestForm from "../components/landing/LeadRequestForm.tsx";

// The chefs.ezfind.app landing — same template/branding as the umbrella page,
// but for CLIENTS looking to hire a private chef. The form creates a lead (the
// same pipeline that distributes requests to chefs).
const config: LandingConfig = {
  brandSuffix: "שפים",
  seoTitle: "מצאו שף פרטי לאירוע שלכם בישראל | ezfind שפים",
  seoDescription:
    "מחפשים שף פרטי לאירוע? ezfind מחברת אתכם לשפים פרטיים מובילים באזור שלכם בישראל. ספרו לנו על האירוע ונמצא לכם שף — בלי עלות, בלי התחייבות.",
  canonicalUrl: "https://chefs.ezfind.app/",
  geo: { region: "IL", placename: "ישראל", position: "31.5,34.75" },
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "שף פרטי לאירועים",
    name: "מציאת שף פרטי לאירוע",
    description:
      "שירות התאמת שפים פרטיים לאירועים פרטיים, ארוחות וחגיגות בכל רחבי ישראל.",
    inLanguage: "he",
    provider: {
      "@type": "Organization",
      "@id": "https://ezfind.app/#organization",
      name: "ezfind",
      url: "https://ezfind.app",
      logo: "https://ezfind.app/favicon.svg",
    },
    areaServed: { "@type": "Country", name: "Israel" },
    audience: {
      "@type": "Audience",
      audienceType: "אנשים שמחפשים שף פרטי לאירוע",
    },
  },
  faq: [
    {
      q: "איך מוצאים שף פרטי דרך ezfind?",
      a: "ממלאים טופס קצר עם פרטי האירוע — סוג האירוע, מספר אורחים, תאריך ועיר — ואנחנו מחברים אתכם לשפים פרטיים מתאימים מהאזור שלכם.",
    },
    {
      q: "באילו אזורים השירות זמין?",
      a: "השירות זמין בכל רחבי ישראל — מתל אביב והמרכז ועד הצפון והדרום.",
    },
    {
      q: "האם יש עלות על מציאת שף?",
      a: "לא. מילוי הבקשה והחיבור לשפים הם ללא עלות וללא התחייבות.",
    },
  ],
  heroEyebrow: "מחפשים שף פרטי?",
  heroTitle: (
    <>
      השף הפרטי המושלם לאירוע שלכם — <span className="accent">במרחק טופס אחד</span>
    </>
  ),
  heroSub:
    "ספרו לנו על האירוע ונחבר אתכם לשפים פרטיים מובילים מהאזור שלכם. בלי עלות, בלי התחייבות — אתם בוחרים את השף שהכי מתאים לכם.",
  heroCta: "מצאו לי שף",
  steps: [
    { title: "מספרים על האירוע", body: "סוג האירוע, מספר אורחים ותאריך. פחות מדקה." },
    { title: "מקבלים שפים מתאימים", body: "אנחנו מחברים אתכם לשפים פרטיים מהאזור שלכם." },
    { title: "בוחרים ונהנים", body: "משווים, בוחרים את השף המתאים — ונהנים מארוחה מושלמת." },
  ],
  footerText: "© 2026 ezfind · מוצאים לכם את השף הפרטי המושלם",
};

export default function EzfindChefs() {
  return (
    <LandingPage config={config}>
      <LeadRequestForm source="ezfind-chefs-landing" />
    </LandingPage>
  );
}
