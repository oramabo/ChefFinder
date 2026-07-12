import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes.tsx";
import { initAnalytics } from "./lib/analytics.ts";
import { initAdRoll } from "./lib/adroll.ts";
// Self-hosted fonts (no external requests): Varela Round — a friendly rounded
// face (Latin + Hebrew) used across the whole site. It ships a single weight;
// bolder text is synthesized by the browser.
import "@fontsource/varela-round/latin-400.css";
import "@fontsource/varela-round/hebrew-400.css";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/global.css";

export const createRoot = ViteReactSSG({ routes }, () => {
  // Apply consent-gated trackers once per client page load, independent of which
  // route/shell rendered it (EzfindJoin, EzfindChefs and Layout each mount
  // differently, so a per-component effect always leaves a gap). Both are
  // self-gated on consent + env and idempotent; they no-op during prerender.
  if (typeof window !== "undefined") {
    initAnalytics();
    initAdRoll();
  }
});
