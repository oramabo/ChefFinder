import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";
import "./Home.css";

const STEPS = [
  { title: "ממלאים טופס קצר", body: "פרטי האירוע: תאריך, מיקום, מספר אורחים ותקציב." },
  { title: "שפים פונים אליכם", body: "עד 3 שפים מקצועיים יחזרו אליכם עם הצעה מותאמת." },
  { title: "בוחרים ונהנים", body: "משווים הצעות, בוחרים שף — וחווים ארוחה בלתי נשכחת." },
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
        title="שף פרטי לאירוע | הזמנת שף פרטי עד הבית — ChefLeads"
        description="מחפשים שף פרטי לאירוע? מלאו טופס קצר ועד 3 שפים מקצועיים יחזרו אליכם עם הצעה מותאמת. חוויה קולינרית פרימיום עד הבית."
        jsonLd={faqJsonLd}
      />

      <section className="hero">
        <div className="container hero__inner">
          <p className="hero__eyebrow accent">חוויה קולינרית עד הבית</p>
          <h1>
            שף פרטי לאירוע <span className="accent">הבא שלכם</span>
          </h1>
          <p className="hero__sub lead-text">
            מלאו טופס קצר ועד שלושה שפים מקצועיים יחזרו אליכם עם הצעה מותאמת
            לאירוע — ארוחה זוגית, חגיגה משפחתית או אירוע עסקי.
          </p>
          <div className="hero__cta">
            <LinkButton to="/find-a-chef" variant="primary">
              מצאו שף עכשיו
            </LinkButton>
            <LinkButton to="/how-it-works" variant="ghost">
              איך זה עובד
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2>איך זה עובד</h2>
        <div className="grid grid-3 home__steps">
          {STEPS.map((s, i) => (
            <div className="card" key={s.title}>
              <div className="home__step-num accent">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="card home__trust">
          <h2>למה ChefLeads</h2>
          <ul className="home__list">
            <li>שפים מקצועיים בלבד — לא מתווכים.</li>
            <li>פנייה מהירה: עד 3 הצעות, בלי הצפה.</li>
            <li>שירות בכל הארץ, בהתאמה אישית לאירוע.</li>
          </ul>
          <LinkButton to="/find-a-chef" variant="primary">
            התחילו עכשיו
          </LinkButton>
        </div>
      </section>
    </>
  );
}
