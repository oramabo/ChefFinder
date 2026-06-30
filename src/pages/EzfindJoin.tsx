import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import JoinForm from "../components/landing/JoinForm.tsx";

// The umbrella ezfind.app landing — for professionals of any trade who want to
// join the network and receive leads.
const config: LandingConfig = {
  seoTitle: "ezfind — הצטרפו לרשת בעלי המקצוע בישראל",
  seoDescription:
    "ezfind מחברת לקוחות עם בעלי מקצוע מובילים בישראל. הצטרפו כדי לקבל פניות אמיתיות מלקוחות באזור שלכם — הרשמה חינם, בלי התחייבות.",
  canonicalUrl: "https://ezfind.app/",
  geo: { region: "IL", placename: "ישראל", position: "31.5,34.75" },
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ezfind",
      url: "https://ezfind.app",
      logo: "https://ezfind.app/favicon.svg",
      description: "ezfind מחברת לקוחות עם בעלי מקצוע מובילים בישראל.",
      areaServed: { "@type": "Country", name: "Israel" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ezfind",
      url: "https://ezfind.app",
      inLanguage: "he",
    },
  ],
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
  footerText: "© 2026 ezfind · מחברים לקוחות עם בעלי מקצוע",
};

export default function EzfindJoin() {
  return (
    <LandingPage config={config}>
      <JoinForm source="ezfind-landing" />
    </LandingPage>
  );
}
