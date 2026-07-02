import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent.ts";
import Wordmark from "./Wordmark.tsx";
import { serviceBySlug, servicePath } from "@shared/services/registry.ts";
import "./Footer.css";

// Chef mini-site chrome (only vertical for now): two-line logo linking home.
const CHEF = serviceBySlug("chefs")!;

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brandcol">
          <Link to={servicePath(CHEF)} className="footer__brand" aria-label="דף הבית">
            <Wordmark suffix={CHEF.name.he} />
          </Link>
        </div>
        <nav className="footer__links" aria-label="ניווט תחתון">
          <Link to="/how-it-works">איך זה עובד</Link>
          <Link to="/join">לשפים</Link>
          <Link to="/faq">שאלות נפוצות</Link>
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאים</Link>
          <button type="button" className="footer__linkbtn" onClick={reopenConsent}>
            הגדרות עוגיות
          </button>
        </nav>
      </div>
      <div className="container footer__copy">
        © {new Date().getFullYear()} ezfind. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
