import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import LeadRequestForm from "../components/landing/LeadRequestForm.tsx";
import { IconForm, IconChef, IconCheck } from "../components/art.tsx";
import { serviceBySlug, servicePath } from "@shared/services/registry.ts";

// This IS the chef service mini-site, so its logo shows "ezfind" over the
// service name and links back to the mini-site home.
const CHEF = serviceBySlug("chefs")!;

// The chef mini-site landing (served at ezfind.app/chefs) — same template/
// branding as the umbrella page, but for CLIENTS looking to hire a private chef.
// The form creates a lead (the same pipeline that distributes requests to chefs).
// The shared site footer carries the city SEO links and the umbrella link.
const config: LandingConfig = {
  seoTitle: "ezfind — מצאו שף פרטי לאירוע שלכם",
  seoDescription:
    "מחפשים שף פרטי לאירוע? ezfind מחברת אתכם לשפים פרטיים מובילים באזור שלכם. ספרו לנו על האירוע ונמצא לכם שף — בלי עלות, בלי התחייבות.",
  canonicalPath: "/chefs",
  brandSuffix: CHEF.name.he,
  homeHref: servicePath(CHEF),
  heroEyebrow: "שף פרטי לכל אירוע",
  heroTitle: (
    <>
      מחפשים שף לאירוע? אנחנו מוצאים לכם ב<span className="accent">EZ</span>
    </>
  ),
  heroSub: "חיבור מהיר, פשוט וחינמי למאגר של שפים פרטיים מכל הארץ.",
  // Placeholder image — generation prompt in docs/IMAGE_PROMPTS.md.
  heroImage: {
    src: "/images/landing-chefs-hero.png",
    alt: "שף פרטי מגיש מנה מעוצבת לאורחים בארוחה ביתית",
  },
  intro:
    "יש לכם אירוע פרטי בבית? יום הולדת? ארוחה משפחתית?\n" +
    "אנחנו כאן כדי לעשות לכם חיים קלים.\n" +
    "פשוט משאירים פרטים על האירוע שלכם, ואנחנו נחבר אתכם במהירות לשפים פרטיים שמתאימים בדיוק למה שאתם מחפשים — והכל בחינם!",
  heroCta: "מצאו לי שף",
  steps: [
    {
      title: "ממלאים פרטים",
      body: "משאירים פרטים על האירוע שלכם — פחות מדקה.",
      icon: <IconForm />,
    },
    {
      title: "מוצאים לכם שפים",
      body: "מחברים אתכם לשפים פרטיים שמעוניינים באירוע שלכם.",
      icon: <IconChef />,
    },
    {
      title: "עד התאמה מדויקת",
      body: "לא סגרתם? נמשיך לחפש לכם עד שנמצא את השף המתאים.",
      icon: <IconCheck />,
    },
  ],
  formLead: "נשאר לכם רק למלא פרטים ולסגור אירוע מושלם ללא מאמץ.",
};

export default function EzfindChefs() {
  return (
    <LandingPage config={config}>
      <LeadRequestForm source="ezfind-chefs-landing" />
    </LandingPage>
  );
}
