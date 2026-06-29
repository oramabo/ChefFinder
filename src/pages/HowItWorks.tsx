import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";
import Reveal from "../components/Reveal.tsx";
import "./HowItWorks.css";

const STEPS = [
  {
    title: "ממלאים טופס",
    body: "כמה פרטים על האירוע: תאריך, מיקום, מספר אורחים, תקציב וסגנון מטבח.",
  },
  {
    title: "שפים פונים אליכם",
    body: "עד 3 שפים מקצועיים מקבלים את פרטי האירוע וחוזרים אליכם עם הצעה אישית.",
  },
  {
    title: "בוחרים ונהנים",
    body: "משווים הצעות, סוגרים עם השף שמתאים לכם, ונהנים מארוחה בלתי נשכחת.",
  },
];

export default function HowItWorks() {
  return (
    <div className="section container howitworks">
      <Seo
        title="איך זה עובד | הזמנת שף פרטי — השף שלי"
        description="כך מזמינים שף פרטי לאירוע ב-3 שלבים פשוטים: ממלאים טופס, מקבלים הצעות, בוחרים שף."
      />
      <Reveal>
        <p className="eyebrow">התהליך</p>
        <h1>איך זה עובד</h1>
        <p className="lead-text howitworks__sub">
          שלושה צעדים פשוטים בין הרעיון לארוחה — בלי דמי תיווך ובלי כאב ראש.
        </p>
      </Reveal>
      <ol className="howitworks__steps">
        {STEPS.map((s, i) => (
          <Reveal as="li" className="card card--raised card--hover howitworks__step" key={s.title} delay={i * 90}>
            <span className="howitworks__num">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </Reveal>
        ))}
      </ol>
      <div className="howitworks__cta">
        <LinkButton to="/find-a-chef" variant="primary" size="lg">
          מצאו שף עכשיו
        </LinkButton>
      </div>
    </div>
  );
}
