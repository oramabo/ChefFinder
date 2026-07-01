import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";

export default function NotFound() {
  return (
    <div className="section container">
      <Seo title="הדף לא נמצא — ezfind" noindex />
      <h1>404 — הדף לא נמצא</h1>
      <p style={{ marginBlock: "var(--space-4)" }}>ייתכן שהקישור שגוי או שהדף הוסר.</p>
      <LinkButton to="/" variant="primary">
        חזרה לדף הבית
      </LinkButton>
    </div>
  );
}
