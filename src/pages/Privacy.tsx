import Seo from "../components/Seo.tsx";

export default function Privacy() {
  return (
    <div className="section container" style={{ maxInlineSize: 760 }}>
      <Seo title="מדיניות פרטיות — ChefLeads" />
      <h1>מדיניות פרטיות</h1>
      <p style={{ marginBlock: "var(--space-4)" }}>
        אנו אוספים את הפרטים שאתם ממלאים בטופס (שם, טלפון, אימייל ופרטי האירוע)
        לצורך חיבורכם לשפים פרטיים מתאימים.
      </p>
      <h2>שיתוף פרטים עם שפים</h2>
      <p style={{ marginBlock: "var(--space-4)" }}>
        פרטי האירוע (ללא פרטי קשר) משותפים עם שפים. פרטי הקשר שלכם נחשפים אך ורק
        לשפים ששילמו עבור הליד, לצורך יצירת קשר ישיר.
      </p>
      <h2>יצירת קשר</h2>
      <p style={{ marginBlock: "var(--space-4)" }}>
        לכל בקשה בנוגע למידע שלכם ניתן לפנות אלינו דרך הפרטים באתר.
      </p>
    </div>
  );
}
