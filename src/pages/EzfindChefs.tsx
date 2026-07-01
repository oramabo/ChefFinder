import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import LeadRequestForm from "../components/landing/LeadRequestForm.tsx";
import { seoPagesByKind } from "@shared/seo/pages.ts";

// The chef mini-site landing (served at ezfind.app/chefs) — same template/
// branding as the umbrella page, but for CLIENTS looking to hire a private chef.
// The form creates a lead (the same pipeline that distributes requests to chefs).
// Footer links point to find-a-chef, the top city programmatic pages (spreading
// authority to the money pages) and back to the umbrella.
const topCityLinks = seoPagesByKind("city")
  .filter((p) => p.serviceSlug === "chefs")
  .slice(0, 6)
  .map((p) => ({ href: encodeURI(p.hePath), label: p.h1 }));

const config: LandingConfig = {
  seoTitle: "ezfind — מצאו שף פרטי לאירוע שלכם",
  seoDescription:
    "מחפשים שף פרטי לאירוע? ezfind מחברת אתכם לשפים פרטיים מובילים באזור שלכם. ספרו לנו על האירוע ונמצא לכם שף — בלי עלות, בלי התחייבות.",
  canonicalPath: "/chefs",
  links: [
    { href: "/find-a-chef", label: "מצאו שף" },
    ...topCityLinks,
    { href: "/", label: "בעלי מקצוע — הצטרפו לרשת" },
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
