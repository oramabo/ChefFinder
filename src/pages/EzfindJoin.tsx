import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import JoinForm from "../components/landing/JoinForm.tsx";
import { SERVICES, servicePath } from "@shared/services/registry.ts";

// The umbrella ezfind.app landing (served at the apex "/") — for professionals of
// any trade who want to join the network and receive leads. Its footer links to
// every service mini-site (registry-driven), so new verticals are discoverable
// and get internal links from the platform's highest-authority page.

// Organization + WebSite schema on the homepage: names the ezfind entity for
// Google's knowledge graph and for AI answer engines (helps GEO — being cited).
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ezfind",
  url: "https://ezfind.app",
  description:
    "ezfind מחברת לקוחות עם בעלי מקצוע מובילים בישראל — החל משפים פרטיים לאירועים.",
  areaServed: { "@type": "Country", name: "Israel" },
  knowsLanguage: ["he", "en"],
};
const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ezfind",
  url: "https://ezfind.app",
  inLanguage: "he",
};

const config: LandingConfig = {
  seoTitle: "ezfind — הצטרפו לרשת בעלי המקצוע",
  seoDescription:
    "ezfind מחברת לקוחות עם בעלי מקצוע מובילים. הצטרפו כדי לקבל פניות אמיתיות מלקוחות באזור שלכם — הרשמה חינם, בלי התחייבות.",
  canonicalPath: "/",
  jsonLd: [ORGANIZATION_LD, WEBSITE_LD],
  links: SERVICES.map((s) => ({ href: servicePath(s), label: s.name.he })),
  heroEyebrow: "לבעלי מקצוע",
  heroTitle: (
    <>
      לקוחות חדשים מחכים לכם — <span className="accent">בלי לרדוף אחריהם</span>
    </>
  ),
  heroSub:
    "ezfind מחברת בין לקוחות שמחפשים שירות לבין בעלי המקצוע הטובים באזור. הצטרפו לרשת וקבלו פניות אמיתיות ישירות אליכם — הרשמה חינם, בלי התחייבות.",
  heroCta: "אני רוצה להצטרף",
  steps: [
    { title: "ממלאים פרטים", body: "משאירים פרטים ותחום עיסוק. לוקח פחות מדקה." },
    { title: "מקבלים פניות", body: "אנחנו שולחים אליכם לקוחות רלוונטיים מהאזור שלכם." },
    { title: "סוגרים עבודות", body: "יוצרים קשר ישיר עם הלקוח וסוגרים — אתם בשליטה." },
  ],
  faq: [
    {
      q: "איך זה עובד לבעלי מקצוע?",
      a: "נרשמים לרשת בחינם ומזינים את תחום העיסוק והאזור. כשמגיעה פנייה רלוונטית מלקוח באזור שלכם, אנחנו שולחים לכם אותה — ואתם יוצרים קשר ישיר עם הלקוח וסוגרים.",
    },
    {
      q: "ההצטרפות בחינם?",
      a: "כן. ההרשמה לרשת חינמית לחלוטין ובלי התחייבות. משלמים רק עבור לידים רלוונטיים שבחרתם לפתוח — בלי מנוי חודשי.",
    },
    {
      q: "כמה עולה ליד?",
      a: "משלמים עמלה נמוכה וקבועה רק על לידים שבחרתם לקבל את פרטיהם. אין תשלום על לידים שלא בחרתם ואין מנוי.",
    },
    {
      q: "אילו בעלי מקצוע יכולים להצטרף?",
      a: "הרשת פתוחה לבעלי מקצוע מתחומי שירות שונים. כרגע התחום הפעיל הוא שפים פרטיים, ותחומים נוספים ייפתחו בהמשך — השאירו פרטים ותחום עיסוק ונעדכן אתכם.",
    },
    {
      q: "אני מתחייב למשהו?",
      a: "לא. אין מנוי, אין התחייבות ואפשר להפסיק בכל עת. אתם בשליטה מלאה על אילו לידים לקבל.",
    },
    {
      q: "איך מקבלים את הפניות?",
      a: "הפניות מגיעות אליכם ישירות עם פרטי הלקוח והאירוע, כך שתוכלו ליצור קשר מיד ולסגור.",
    },
  ],
  footerText: "© 2026 ezfind · מחברים לקוחות עם בעלי מקצוע",
};

export default function EzfindJoin() {
  return (
    <LandingPage config={config}>
      <JoinForm source="ezfind-landing" />
    </LandingPage>
  );
}
