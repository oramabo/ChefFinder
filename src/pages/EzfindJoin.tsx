import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import JoinForm from "../components/landing/JoinForm.tsx";
import { IconForm, IconSend, IconCheck } from "../components/art.tsx";

// The umbrella ezfind.app landing (served at the apex "/") — for professionals of
// any trade who want to join the network and receive leads. The shared site
// footer links to every service mini-site (registry-driven), so new verticals
// are discoverable from the platform's highest-authority page.
const config: LandingConfig = {
  seoTitle: "ezfind — הצטרפו לרשת בעלי המקצוע",
  seoDescription:
    "ezfind מחברת לקוחות עם בעלי מקצוע מובילים. הצטרפו כדי לקבל פניות אמיתיות מלקוחות באזור שלכם — הרשמה חינם, בלי התחייבות.",
  canonicalPath: "/",
  heroEyebrow: "לבעלי מקצוע",
  heroTitle: (
    <>
      לקוחות חדשים מחכים לכם — <span className="accent">בלי לרדוף אחריהם</span>
    </>
  ),
  heroSub:
    "ezfind מחברת בין לקוחות שמחפשים שירות לבין בעלי המקצוע הטובים באזור. הצטרפו לרשת וקבלו פניות אמיתיות ישירות אליכם — הרשמה חינם, בלי התחייבות.",
  heroCta: "אני רוצה להצטרף",
  // Placeholder image — generation prompt in docs/IMAGE_PROMPTS.md.
  heroImage: {
    src: "/images/landing-join-hero.png",
    alt: "בעלי מקצוע מרוצים בעבודה — שף, צלמת ומפיק אירועים",
  },
  steps: [
    {
      title: "ממלאים פרטים",
      body: "משאירים פרטים ותחום עיסוק. לוקח פחות מדקה.",
      icon: <IconForm />,
    },
    {
      title: "מקבלים פניות",
      body: "אנחנו שולחים אליכם לקוחות רלוונטיים מהאזור שלכם.",
      icon: <IconSend />,
    },
    {
      title: "סוגרים עבודות",
      body: "יוצרים קשר ישיר עם הלקוח וסוגרים — אתם בשליטה.",
      icon: <IconCheck />,
    },
  ],
};

export default function EzfindJoin() {
  return (
    <LandingPage config={config}>
      <JoinForm source="ezfind-landing" />
    </LandingPage>
  );
}
