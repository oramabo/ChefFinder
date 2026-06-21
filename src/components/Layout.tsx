import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import { initAnalytics } from "../lib/analytics.ts";

export default function Layout() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
