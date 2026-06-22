import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent.ts";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <div className="footer__brand">Sofré</div>
          <p>שף פרטי לאירוע שלכם — מהיר, מקצועי, אמין.</p>
        </div>
        <nav className="footer__links" aria-label="ניווט תחתון">
          <Link to="/how-it-works">איך זה עובד</Link>
          <Link to="/chefs">לשפים</Link>
          <Link to="/chefs/join">הצטרפות שפים</Link>
          <Link to="/faq">שאלות נפוצות</Link>
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאים</Link>
          <button type="button" className="footer__linkbtn" onClick={reopenConsent}>
            הגדרות עוגיות
          </button>
        </nav>
      </div>
      <div className="container footer__copy">
        © {new Date().getFullYear()} Sofré. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
