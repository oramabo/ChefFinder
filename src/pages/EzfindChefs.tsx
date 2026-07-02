import LandingPage, { type LandingConfig } from "../components/LandingPage.tsx";
import LeadRequestForm from "../components/landing/LeadRequestForm.tsx";
import Footer from "../components/Footer.tsx";
import { serviceBySlug, servicePath } from "@shared/services/registry.ts";

// The chef service mini-site landing (served at ezfind.app/chefs), for CLIENTS
// looking to hire a private chef. Its logo shows "ezfind" over the service name
// and links to the mini-site home, and it uses the shared site <Footer> so the
// whole mini-site (landing + inner pages) has the exact same footer.
const CHEF = serviceBySlug("chefs")!;

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
  faq: [
    {
      q: "כמה עולה שף פרטי לאירוע?",
      a: "המחיר תלוי במספר האורחים, בתפריט ובאזור, ולרוב נע בין ₪150 ל-₪450 לאורח. משאירים פרטים ומקבלים הצעות מדויקות משפים באזור שלכם — בחינם ובלי התחייבות.",
    },
    {
      q: "איך זה עובד?",
      a: "ממלאים טופס קצר על האירוע (סוג האירוע, מספר אורחים ותאריך), ועד 3 שפים פרטיים מתאימים מהאזור חוזרים אליכם עם הצעה. אתם משווים ובוחרים את מי שהכי מתאים לכם.",
    },
    {
      q: "השירות באמת בחינם?",
      a: "כן. השארת הפרטים וקבלת ההצעות היא בחינם לחלוטין ובלי התחייבות. משלמים רק לשף שבחרתם, לפי מה שסגרתם איתו ישירות.",
    },
    {
      q: "לאילו אירועים אפשר להזמין שף פרטי?",
      a: "ימי הולדת, ארוחות זוגיות ורומנטיות, אירועים עסקיים, אירוחי משפחה וחגים ועוד. אפשר גם תפריט כשר בהשגחה.",
    },
    {
      q: "באילו אזורים פועל השירות?",
      a: "שפים פרטיים בכל הארץ — תל אביב, ירושלים, חיפה, הרצליה, נתניה, באר שבע ועוד. ציינו את האזור בטופס ונחבר אתכם לשפים מקומיים.",
    },
    {
      q: "תוך כמה זמן אקבל הצעות?",
      a: "לרוב תוך זמן קצר. אם לא נסגר לכם שף מתאים, נמשיך לחפש עד שתימצא התאמה מדויקת.",
    },
  ],
  footerText: "© 2026 ezfind · מוצאים לכם את השף הפרטי המושלם",
  footer: <Footer />,
};

export default function EzfindChefs() {
  return (
    <LandingPage config={config}>
      <LeadRequestForm source="ezfind-chefs-landing" />
    </LandingPage>
  );
}
