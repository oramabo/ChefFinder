import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";

// The ezfind שפים landing — identical template/branding to the umbrella page,
// scoped to chefs. Served at the chefs.ezfind.app root. Submissions flow into
// the same join intake (category "chef") and appear in the admin applicants.
const config: LandingConfig = {
  // Same "ezfind" wordmark as the main page (no suffix).
  seoTitle: "ezfind שפים — קבלו לקוחות חדשים למטבח שלכם",
  seoDescription:
    "ezfind שפים מחברת שפים פרטיים עם לקוחות שמחפשים שף לאירוע. הצטרפו וקבלו פניות אמיתיות מהאזור שלכם — הרשמה חינם, בלי התחייבות.",
  canonicalPath: "/",
  heroEyebrow: "לשפים פרטיים",
  heroTitle: (
    <>
      לקוחות חדשים למטבח שלכם — <span className="accent">בלי לרדוף אחריהם</span>
    </>
  ),
  heroSub:
    "ezfind שפים מחברת בין שפים פרטיים לבין לקוחות שמחפשים שף לאירוע באזור. הצטרפו וקבלו פניות אמיתיות ישירות אליכם — הרשמה חינם, בלי התחייבות.",
  heroCta: "אני רוצה להצטרף",
  steps: [
    { title: "ממלאים פרטים", body: "משאירים פרטים על המטבח והאזור שלכם. פחות מדקה." },
    { title: "מקבלים פניות", body: "אנחנו שולחים אליכם לקוחות שמחפשים שף באזור שלכם." },
    { title: "סוגרים אירועים", body: "יוצרים קשר ישיר עם הלקוח וסוגרים — אתם בשליטה." },
  ],
  formEyebrow: "הצטרפות שפים",
  formTitle: "בואו נתחיל",
  formSub: "מלאו את הפרטים ונחזור אליכם. השדות המסומנים הם חובה.",
  showCategory: false,
  fixedCategory: "chef",
  source: "ezfind-chefs-landing",
  footerText: "© 2026 ezfind שפים · מחברים שפים עם לקוחות",
};

export default function EzfindChefs() {
  return <LandingPage config={config} />;
}
