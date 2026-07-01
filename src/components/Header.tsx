import { Link } from "react-router-dom";
import { LinkButton } from "./Button.tsx";
import Wordmark from "./Wordmark.tsx";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand" aria-label="ezfind — דף הבית">
          <Wordmark />
        </Link>
        <nav className="header__nav" aria-label="ניווט ראשי">
          <Link to="/how-it-works">איך זה עובד</Link>
          <Link to="/for-chefs">לשפים</Link>
          <Link to="/faq">שאלות נפוצות</Link>
        </nav>
        <LinkButton to="/find-a-chef" variant="primary">
          מצאו שף
        </LinkButton>
      </div>
    </header>
  );
}
