import type { RouteRecord } from "vite-react-ssg";
import Layout from "./components/Layout.tsx";
import FindAChef from "./pages/FindAChef.tsx";
import LeadReceived from "./pages/LeadReceived.tsx";
import LeadUnlock from "./pages/LeadUnlock.tsx";
import Chefs from "./pages/Chefs.tsx";
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
// vite-react-ssg prerenders each to static HTML at build time.
const seoRoutes: RouteRecord[] = allSeoPages().map((p) => ({
  path: p.path.replace(/^\//, ""),
  Component: ProgrammaticPage,
}));

// The chef host (chefs.ezfind.app) and *.workers.dev. The front page ("/") is
// the ezfind שפים landing — a simple standalone page mirroring the umbrella
// ezfind.app landing. The marketplace's functional pages (find-a-chef, lead
// unlock, info pages, programmatic SEO) keep the chef Header/Footer and remain
// reachable beneath it. All are prerendered at build time.
const chefRoutes: RouteRecord[] = [
  // Front page: the ezfind שפים landing, standalone (its own chrome). Prerendered
  // to dist/index.html and served at the chefs.ezfind.app root.
  { path: "/", Component: EzfindChefs },
  // Marketplace pages — a pathless layout route so they nest under the chef
  // Header/Footer without owning "/".
  {
    element: <Layout />,
    children: [
      { path: "find-a-chef", Component: FindAChef },
      { path: "lead-received", Component: LeadReceived },
      { path: "chefs", Component: Chefs },
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
  // The ezfind umbrella "join the network" landing — its own chrome. Prerendered
  // to dist/join.html; the Worker serves it at the ezfind.app apex.
  { path: "join", Component: EzfindJoin },
  // The operator admin panel — its own chrome, token-gated, noindex. Prerendered
  // to dist/admin.html; the Worker serves it at the admin.ezfind.app apex.
  { path: "admin", Component: AdminPanel },
];

// On the umbrella custom-domain hosts, the site IS a single standalone page,
// rendered at the root so it hydrates cleanly against the prerendered HTML the
// Worker serves there (join.html / admin.html). Prerendering runs without a
// window, so the build always uses chefRoutes and emits every chef page plus
// join.html and admin.html as before. Keep hosts in sync with `worker/index.ts`.
const host = typeof window !== "undefined" ? window.location.hostname : "";
const EZFIND_APEX_HOSTS = new Set(["ezfind.app", "www.ezfind.app"]);
const ADMIN_HOSTS = new Set(["admin.ezfind.app"]);

const single = (Component: RouteRecord["Component"]): RouteRecord[] => [
  { path: "/", Component },
  { path: "*", Component },
];

export const routes: RouteRecord[] = EZFIND_APEX_HOSTS.has(host)
  ? single(EzfindJoin)
  : ADMIN_HOSTS.has(host)
    ? single(AdminPanel)
    : chefRoutes;
