import { useEffect, useRef } from "react";

interface TurnstileProps {
  onToken: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

// Renders the Cloudflare Turnstile widget. When no site key is configured
// (local/CI), it bypasses with a dummy token so the form stays submittable; the
// server-side mock verifier accepts it. Production sets the key and fails closed.
export default function Turnstile({ onToken }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey) {
      onToken("dev-bypass");
      return;
    }
    const scriptId = "cf-turnstile-script";
    let widgetId: string | undefined;

    function render() {
      if (ref.current && window.turnstile) {
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          // The default widget is a fixed 300px — wider than a phone-width
          // card. Compact fits anywhere; flexible fills the container.
          size: window.matchMedia("(max-width: 430px)").matches
            ? "compact"
            : "flexible",
          callback: (token: string) => onToken(token),
        });
      }
    }

    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      render();
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="turnstile" />;
}
