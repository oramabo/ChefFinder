import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent.ts";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brandcol">
          <img
            className="footer__logo"
            src="/images/logo.png"
            width={170}
            height={170}
            alt="השף שלי — מחברים בין טעם לאנשים"
            loading="lazy"
          />
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
        © {new Date().getFullYear()} השף שלי. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
