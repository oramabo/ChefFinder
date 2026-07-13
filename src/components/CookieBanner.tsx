import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button.tsx";
import { getConsent, setConsent, CONSENT_EVENT } from "../lib/consent.ts";
import { initAnalytics, track } from "../lib/analytics.ts";
import "./CookieBanner.css";

// Cookie consent banner. Shows only until the visitor makes a choice (stored in
// localStorage). "Accept" enables analytics (PostHog) for this and future
// visits; "Decline" keeps it off. Rendered nothing on the server / for returning
// visitors, so there is no flash and no hydration mismatch.
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The banner renders on every page shell (Layout and LandingPage), so it is
    // a reliable place to (re)apply analytics on mount for a returning visitor
    // who already granted. Self-gated on consent + idempotent.
    initAnalytics();
    if (getConsent() === null) setVisible(true);
    const reopen = () => setVisible(true);
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setConsent("granted");
    initAnalytics();
    track("consent_granted");
    setVisible(false);
  };
  const decline = () => {
    setConsent("denied");
    setVisible(false);
  };

  return (
    <div className="cookie" role="dialog" aria-label="הודעת עוגיות">
      <p className="cookie__text">
        אנו משתמשים בעוגיות חיוניות לתפעול האתר ולאבטחה, ובעוגיות אנליטיקה לשיפור
        השירות. תוכלו לאשר או לדחות עוגיות שאינן חיוניות. למידע נוסף ראו{" "}
        <Link to="/privacy">מדיניות הפרטיות</Link>.
      </p>
      <div className="cookie__actions">
        <Button type="button" variant="ghost" onClick={decline}>
          דחייה
        </Button>
        <Button type="button" onClick={accept}>
          אישור
        </Button>
      </div>
    </div>
  );
}
