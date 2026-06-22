import Seo from "../components/Seo.tsx";

const FAQS = [
  {
    q: "כמה עולה שף פרטי לאירוע?",
    a: "המחיר תלוי במספר האורחים, סוג התפריט והמיקום. לרוב המחיר נע בין ₪150 ל-₪400 לאורח. לאחר מילוי הטופס תקבלו הצעות מדויקות מהשפים.",
  },
  {
    q: "כמה שפים יחזרו אליי?",
    a: "עד 3 שפים מקצועיים יצרו איתכם קשר ישירות עם הצעה מותאמת לאירוע.",
  },
  {
    q: "האם יש שפים כשרים?",
    a: "כן. בטופס ניתן לסמן דרישה למטבח כשר ונתאים לכם שפים בהתאם.",
  },
  {
    q: "תוך כמה זמן אקבל מענה?",
    a: "השפים מקבלים את פרטי האירוע באופן מיידי, ולרוב חוזרים אליכם תוך זמן קצר.",
  },
  {
    q: "האם השירות כרוך בתשלום עבורי?",
    a: "לא. מילוי הטופס וקבלת ההצעות מהשפים הם ללא עלות עבור הלקוח.",
  },
];

export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <div className="section container">
      <Seo
        title="שאלות נפוצות | שף פרטי לאירוע — השף שלי"
        description="כל מה שצריך לדעת על הזמנת שף פרטי לאירוע: מחירים, זמני מענה, כשרות ועוד."
        jsonLd={jsonLd}
      />
      <h1>שאלות נפוצות</h1>
      <div style={{ marginBlockStart: "var(--space-6)", maxInlineSize: 760 }}>
        {FAQS.map((f) => (
          <details className="card" key={f.q} style={{ marginBlockEnd: "var(--space-3)" }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{f.q}</summary>
            <p style={{ marginBlockStart: "var(--space-3)" }}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
