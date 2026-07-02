import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent.ts";
import Wordmark from "./Wordmark.tsx";
import { serviceBySlug, servicePath } from "@shared/services/registry.ts";
import { seoPagesByKind } from "@shared/seo/pages.ts";
import { cityBySlug } from "@shared/seo/cities.ts";
import "./Footer.css";

// Chef mini-site chrome (only vertical for now): two-line logo linking home.
const CHEF = serviceBySlug("chefs")!;

// Top city pages, surfaced in the footer so every page internally links to the
// programmatic "money" pages (spreads crawl + authority) — an SEO win that's now
// consistent across the whole mini-site (this footer is used everywhere).
const POPULAR_CITIES = seoPagesByKind("city")
  .filter((p) => p.serviceSlug === CHEF.slug)
  .slice(0, 8)
  .map((p) => ({ href: encodeURI(p.hePath), name: cityBySlug(p.citySlug)?.he ?? p.h1 }));

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
      <nav className="container footer__cities" aria-label="שף פרטי בערים">
        <span className="footer__cities-label">שף פרטי ב:</span>
        {POPULAR_CITIES.map((c) => (
          <a key={c.href} href={c.href}>
            {c.name}
          </a>
        ))}
      </nav>
      <div className="container footer__copy">
        © {new Date().getFullYear()} ezfind. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
