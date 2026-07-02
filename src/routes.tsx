import type { RouteRecord } from "vite-react-ssg";
import Layout from "./components/Layout.tsx";
import FindAChef from "./pages/FindAChef.tsx";
import LeadReceived from "./pages/LeadReceived.tsx";
import LeadUnlock from "./pages/LeadUnlock.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import Faq from "./pages/Faq.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import EzfindJoin from "./pages/EzfindJoin.tsx";
import EzfindChefs from "./pages/EzfindChefs.tsx";
import ProgrammaticPage from "./pages/programmatic/ProgrammaticPage.tsx";
import { allSeoPages } from "@shared/seo/pages.ts";

// Every programmatic SEO page is emitted as a concrete child route so
// vite-react-ssg prerenders each to static HTML at build time. Each page gets
// both its English path and its Hebrew (canonical) path. The Hebrew path is
// registered decoded (raw Hebrew) — React Router decodes the location before
// matching, so a decoded route path matches on both prerender and hydration;
// an encoded one would fall through to the 404 route. Both routes render
// ProgrammaticPage and the English page canonicalises to the Hebrew URL.
const seoRoutes: RouteRecord[] = allSeoPages().flatMap((p) => [
  { path: p.path.replace(/^\//, ""), Component: ProgrammaticPage },
  { path: p.hePath.replace(/^\//, ""), Component: ProgrammaticPage },
]);

// The platform routes (apex ezfind.app + *.workers.dev). Multi-vertical layout:
//   /        → provider registration / umbrella (EzfindJoin), prerendered to
//              index.html — the apex is the registration front door.
//   /chefs   → the chef mini-site landing (client "find a chef", lead capture),
//              its own chrome, prerendered to chefs.html. chefs.ezfind.app
//              301-redirects here.
// The marketplace's functional pages (find-a-chef, lead unlock, info pages, and
// the programmatic SEO pages at /private-chef & /שף-פרטי) keep the chef
// Header/Footer beneath it. All prerendered at build time.
const chefRoutes: RouteRecord[] = [
  // Apex front door: provider registration / umbrella, standalone chrome.
  // Prerendered to dist/index.html and served at the ezfind.app root.
  { path: "/", Component: EzfindJoin },
  // The chef mini-site landing (client-facing lead capture), standalone chrome.
  // Prerendered to dist/chefs.html; chefs.ezfind.app redirects here.
  { path: "chefs", Component: EzfindChefs },
  // Marketplace pages — a pathless layout route so they nest under the chef
  // Header/Footer without owning "/".
  {
    element: <Layout />,
    children: [
      { path: "find-a-chef", Component: FindAChef },
      { path: "lead-received", Component: LeadReceived },
      { path: "how-it-works", Component: HowItWorks },
      { path: "faq", Component: Faq },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },
      // Client-only: not prerendered (no static paths), served via SPA fallback.
      { path: "lead/:token", Component: LeadUnlock, getStaticPaths: () => [] },
      ...seoRoutes,
      { path: "*", Component: NotFound },
    ],
  },
  // Provider registration also reachable at /join (alias of the apex front door).
  // Prerendered to dist/join.html.
  { path: "join", Component: EzfindJoin },
  // The operator admin panel — its own chrome, token-gated, noindex. Prerendered
  // to dist/admin.html; the Worker serves it at the admin.ezfind.app apex.
  { path: "admin", Component: AdminPanel },
];

// The apex (ezfind.app) serves these routes: "/" is provider registration, and
// the chef mini-site + all marketplace/SEO pages live beneath it. Only the admin
// host stays a single standalone page, hydrating against the prerendered
// admin.html the Worker serves there. Prerendering runs without a window, so the
// build always uses chefRoutes and emits index.html (registration), chefs.html
// (chef mini-site), join.html and admin.html. Keep hosts in sync with
// `worker/index.ts`.
const host = typeof window !== "undefined" ? window.location.hostname : "";
const ADMIN_HOSTS = new Set(["admin.ezfind.app"]);

const single = (Component: RouteRecord["Component"]): RouteRecord[] => [
  { path: "/", Component },
  { path: "*", Component },
];

export const routes: RouteRecord[] = ADMIN_HOSTS.has(host)
  ? single(AdminPanel)
  : chefRoutes;
