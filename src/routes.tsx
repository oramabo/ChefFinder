import type { RouteRecord } from "vite-react-ssg";
import Layout from "./components/Layout.tsx";
import Home from "./pages/Home.tsx";
import FindAChef from "./pages/FindAChef.tsx";
import LeadReceived from "./pages/LeadReceived.tsx";
import LeadUnlock from "./pages/LeadUnlock.tsx";
import Chefs from "./pages/Chefs.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import Faq from "./pages/Faq.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import NotFound from "./pages/NotFound.tsx";
import Admin from "./pages/Admin.tsx";
import EzfindJoin from "./pages/EzfindJoin.tsx";
import ProgrammaticPage from "./pages/programmatic/ProgrammaticPage.tsx";
import { allSeoPages } from "@shared/seo/pages.ts";

// Every programmatic SEO page is emitted as a concrete child route so
// vite-react-ssg prerenders each to static HTML at build time.
const seoRoutes: RouteRecord[] = allSeoPages().map((p) => ({
  path: p.path.replace(/^\//, ""),
  Component: ProgrammaticPage,
}));

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, Component: Home },
      { path: "find-a-chef", Component: FindAChef },
      { path: "lead-received", Component: LeadReceived },
      { path: "chefs", Component: Chefs },
      { path: "how-it-works", Component: HowItWorks },
      { path: "faq", Component: Faq },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },
      // Client-only: not prerendered (no static paths), served via SPA fallback.
      { path: "lead/:token", Component: LeadUnlock, getStaticPaths: () => [] },
      // Prerenders only the (data-less) token prompt; data is fetched client-side
      // and gated server-side. noindex + robots-disallowed.
      { path: "admin", Component: Admin },
      ...seoRoutes,
      { path: "*", Component: NotFound },
    ],
  },
  // The ezfind umbrella "join the network" landing — a top-level route with its
  // own chrome (no chef Header/Footer), intended for the ezfind.app apex.
  { path: "join", Component: EzfindJoin },
];
