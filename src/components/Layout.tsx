import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import CookieBanner from "./CookieBanner.tsx";
import { initAnalytics } from "../lib/analytics.ts";
import { initAdRoll } from "../lib/adroll.ts";

export default function Layout() {
  useEffect(() => {
    // Self-gated: only initialize if the visitor previously granted consent.
    initAnalytics();
    initAdRoll();
  }, []);

  return (
    <>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
