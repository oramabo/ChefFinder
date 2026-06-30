import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import LeadRequestForm from "../components/landing/LeadRequestForm.tsx";

// The chefs.ezfind.app landing — same template/branding as the umbrella page,
// but for CLIENTS looking to hire a private chef. The form creates a lead (the
// same pipeline that distributes requests to chefs).
const config: LandingConfig = {
  seoTitle: "ezfind — מצאו שף פרטי לאירוע שלכם",
  seoDescription:
    "מחפשים שף פרטי לאירוע? ezfind מחברת אתכם לשפים פרטיים מובילים באזור שלכם. ספרו לנו על האירוע ונמצא לכם שף — בלי עלות, בלי התחייבות.",
  canonicalPath: "/",
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
