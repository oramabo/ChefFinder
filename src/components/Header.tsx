import { Link, useLocation } from "react-router-dom";
import { LinkButton } from "./Button.tsx";
import Wordmark from "./Wordmark.tsx";
import { serviceBySlug, servicePath } from "@shared/services/registry.ts";
import "./Header.css";

// The site header is the chef mini-site chrome (only vertical for now), so the
// logo is the two-line "ezfind / שף פרטי" mark and links to the mini-site home.
const CHEF = serviceBySlug("chefs")!;

export default function Header() {
  // On the wizard itself the CTA would link to the current page and compete
  // with the form's own buttons — hide it there.
  const onWizard = useLocation().pathname === "/find-a-chef";
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
        {!onWizard && (
          <LinkButton to="/find-a-chef" variant="primary">
            מצאו שף
          </LinkButton>
        )}
      </div>
    </header>
  );
}
