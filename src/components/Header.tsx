import { Link } from "react-router-dom";
import { LinkButton } from "./Button.tsx";
import Wordmark from "./Wordmark.tsx";
import { serviceBySlug, servicePath } from "@shared/services/registry.ts";
import "./Header.css";

// The site header is the chef mini-site chrome (only vertical for now), so the
// logo is the two-line "ezfind / שף פרטי" mark and links to the mini-site home.
const CHEF = serviceBySlug("chefs")!;

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link
          to={servicePath(CHEF)}
          className="header__brand"
          aria-label={`ezfind ${CHEF.name.he} — דף הבית`}
        >
          <Wordmark suffix={CHEF.name.he} />
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
