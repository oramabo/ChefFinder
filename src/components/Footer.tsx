import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <div className="footer__brand">ChefLeads</div>
          <p>שף פרטי לאירוע שלכם — מהיר, מקצועי, אמין.</p>
        </div>
        <nav className="footer__links" aria-label="ניווט תחתון">
          <Link to="/how-it-works">איך זה עובד</Link>
          <Link to="/chefs">לשפים</Link>
          <Link to="/chefs/join">הצטרפות שפים</Link>
          <Link to="/faq">שאלות נפוצות</Link>
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאים</Link>
        </nav>
      </div>
      <div className="container footer__copy">
        © {new Date().getFullYear()} ChefLeads. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
