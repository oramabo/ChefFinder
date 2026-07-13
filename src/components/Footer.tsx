import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent.ts";
import Wordmark from "./Wordmark.tsx";
import { SERVICES, servicePath } from "@shared/services/registry.ts";
import { seoPagesByKind } from "@shared/seo/pages.ts";
import "./Footer.css";

// The one site footer — identical on every page (marketplace layout and the
// landing pages both render it), so the chrome never shifts while navigating.
// It carries the platform brand, the core links, every service mini-site
// (registry-driven, so new verticals get internal links from all pages), and a
// quiet row of the top city SEO pages spreading authority to the money pages.
const cityLinks = seoPagesByKind("city")
  .filter((p) => p.serviceSlug === "chefs")
  .slice(0, 6)
  .map((p) => ({ href: encodeURI(p.hePath), label: p.h1 }));

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brandcol">
          <Link to="/" className="footer__brand" aria-label="ezfind — דף הבית">
            <Wordmark />
          </Link>
        </div>
        <nav className="footer__links" aria-label="ניווט תחתון">
          {SERVICES.map((s) => (
            <Link key={s.slug} to={servicePath(s)}>
              {s.name.he}
            </Link>
          ))}
          <Link to="/find-a-chef">מצאו שף</Link>
          <Link to="/how-it-works">איך זה עובד</Link>
          <Link to="/faq">שאלות נפוצות</Link>
          <Link to="/">בעלי מקצוע — הצטרפו</Link>
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאים</Link>
          <button type="button" className="footer__linkbtn" onClick={reopenConsent}>
            הגדרות עוגיות
          </button>
        </nav>
        <nav className="footer__cities" aria-label="שף פרטי לפי עיר">
          {cityLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="container footer__copy">
        © {new Date().getFullYear()} ezfind · כל הזכויות שמורות
      </div>
    </footer>
  );
}
