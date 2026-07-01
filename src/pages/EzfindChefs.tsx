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
  heroEyebrow: "שף פרטי לכל אירוע",
  heroTitle: (
    <>
      מחפשים שף לאירוע? אנחנו מוצאים לכם ב<span className="accent">EZ</span>
    </>
  ),
  heroSub: "חיבור מהיר, פשוט וחינמי למאגר של שפים פרטיים מכל הארץ.",
  intro:
    "יש לכם אירוע פרטי בבית? יום הולדת? ארוחה משפחתית?\n" +
    "אנחנו כאן כדי לעשות לכם חיים קלים 😎\n" +
    "פשוט משאירים פרטים על האירוע שלכם, ואנחנו נחבר אתכם במהירות לשפים פרטיים שמתאימים בדיוק למה שאתם מחפשים — והכל בחינם!",
  heroCta: "מצאו לי שף",
  steps: [
    { title: "ממלאים פרטים", body: "משאירים פרטים על האירוע שלכם — פחות מדקה." },
    { title: "מוצאים לכם שפים", body: "מחברים אתכם לשפים פרטיים שמעוניינים באירוע שלכם." },
    { title: "עד התאמה מדויקת", body: "לא סגרתם? נמשיך לחפש לכם עד שנמצא את השף המתאים." },
  ],
  formLead: "נשאר לכם רק למלא פרטים ולסגור אירוע מושלם ללא מאמץ.",
  footerText: "© 2026 ezfind · מוצאים לכם את השף הפרטי המושלם",
};

export default function EzfindChefs() {
  return (
    <LandingPage config={config}>
      <LeadRequestForm source="ezfind-chefs-landing" />
    </LandingPage>
  );
}
