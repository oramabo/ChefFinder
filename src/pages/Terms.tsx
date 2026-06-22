import Seo from "../components/Seo.tsx";

export default function Terms() {
  return (
    <div className="section container" style={{ maxInlineSize: 760 }}>
      <Seo title="תנאי שימוש — ChefLeads" />
      <h1>תנאי שימוש</h1>
      <p style={{ marginBlock: "var(--space-4)" }}>
        השירות מחבר בין לקוחות המחפשים שף פרטי לבין שפים מקצועיים. ChefLeads אינה
        צד להתקשרות שבין הלקוח לשף ואינה גובה עמלה מההזמנה.
      </p>
      <h2>לשפים</h2>
      <p style={{ marginBlock: "var(--space-4)" }}>
        רכישת ליד מקנה גישה לפרטי הקשר של הלקוח. כל ליד נמכר למספר מוגבל של שפים.
        התשלום הוא עבור הגישה לליד ואינו מותנה בסגירת עסקה.
      </p>
      <h2>אחריות</h2>
      <p style={{ marginBlock: "var(--space-4)" }}>
        השירות ניתן כפי שהוא. איננו אחראים לטיב ההתקשרות בין הצדדים.
      </p>
    </div>
  );
}
