import { Link } from "react-router-dom";
import { LinkButton } from "./Button.tsx";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand" aria-label="ChefLeads — דף הבית">
          <span className="header__mark">▲</span>
          <span>ChefLeads</span>
        </Link>
        <nav className="header__nav" aria-label="ניווט ראשי">
          <Link to="/how-it-works">איך זה עובד</Link>
          <Link to="/chefs">לשפים</Link>
          <Link to="/faq">שאלות נפוצות</Link>
        </nav>
        <LinkButton to="/find-a-chef" variant="primary">
          מצאו שף
        </LinkButton>
      </div>
    </header>
  );
}
