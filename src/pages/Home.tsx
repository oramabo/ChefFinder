import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";
import { DEFAULT_CAP } from "@shared/constants.ts";
import "./Home.css";

const STEPS = [
  { title: "ממלאים טופס קצר", body: "פרטי האירוע: תאריך, מיקום, מספר אורחים ותקציב." },
  { title: "שפים פונים אליכם", body: "עד שלושה שפים מקצועיים חוזרים אליכם עם הצעה מותאמת." },
  { title: "בוחרים ומארחים", body: "משווים הצעות, בוחרים שף, ומגישים ארוחה בלתי נשכחת." },
];

const REASONS = [
  "שפים מקצועיים בלבד — אתם מדברים ישירות איתם, לא עם מתווך.",
  `פנייה ממוקדת: עד ${DEFAULT_CAP} הצעות לכל בקשה, בלי הצפה.`,
  "שירות בכל הארץ, בהתאמה אישית לאופי האירוע ולתקציב.",
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "כמה עולה שף פרטי לאירוע?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "המחיר תלוי במספר האורחים, התפריט והמיקום. לרוב נע בין ₪150 ל-₪400 לאורח.",
      },
    },
    {
      "@type": "Question",
      name: "כמה שפים יחזרו אליי?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "עד 3 שפים מקצועיים יצרו איתכם קשר ישירות עם הצעה.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <Seo
        title="שף פרטי לאירוע | הזמנת שף פרטי עד הבית — Sofré"
        description="מחפשים שף פרטי לאירוע? מלאו טופס קצר ועד 3 שפים מקצועיים יחזרו אליכם עם הצעה מותאמת. חוויה קולינרית פרימיום עד הבית."
        jsonLd={faqJsonLd}
        canonicalPath="/"
      />

      <section className="hero">
        <span className="hero__glow" aria-hidden="true" />
        <span className="hero__plate" aria-hidden="true" />
        <div className="container hero__inner">
          <p className="eyebrow hero__eyebrow">שף פרטי · עד הבית</p>
          <h1 className="hero__title">
            השף הפרטי שמגיע <span className="accent">לשולחן שלכם</span>
          </h1>
          <p className="hero__sub lead-text">
            מלאו טופס קצר ועד שלושה שפים מקצועיים יחזרו אליכם עם הצעה מותאמת —
            לארוחה זוגית, לחגיגה משפחתית או לאירוע עסקי.
          </p>
          <div className="hero__cta">
            <LinkButton to="/find-a-chef" variant="primary">
              מצאו שף עכשיו
            </LinkButton>
            <LinkButton to="/how-it-works" variant="ghost">
              איך זה עובד
            </LinkButton>
          </div>
          <p className="hero__trust">
            עד שלושה שפים לכל פנייה · שירות בכל הארץ · בלי דמי תיווך
          </p>
        </div>
      </section>

      <section className="section container">
        <p className="eyebrow">התהליך</p>
        <h2 className="home__h2">מהבקשה ועד הסועדים — בשלושה צעדים</h2>
        <ol className="home__steps">
          {STEPS.map((s, i) => (
            <li className="home__step" key={s.title}>
              <span className="home__step-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section container">
        <div className="card home__trust">
          <div>
            <p className="eyebrow">למה Sofré</p>
            <h2 className="home__h2">שולחן אחד, תשומת לב מלאה</h2>
            <ul className="home__list">
              {REASONS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <LinkButton to="/find-a-chef" variant="primary">
            התחילו עכשיו
          </LinkButton>
        </div>
      </section>
    </>
  );
}
