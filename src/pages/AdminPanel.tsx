import { useState, useEffect } from "react";
import Seo from "../components/Seo.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput } from "../components/Field.tsx";
import LeadsSection from "./admin/LeadsSection.tsx";
import ApplicantsSection from "./admin/ApplicantsSection.tsx";
import "./Admin.css";

type Tab = "leads" | "applicants";

const tokenKey = "admin_token";

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState<Tab>("leads");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(tokenKey);
    if (saved) {
      setToken(saved);
      setConnected(true);
    }
  }, []);

  function connect() {
    if (!token.trim()) return;
    if (typeof window !== "undefined") localStorage.setItem(tokenKey, token);
    setConnected(true);
  }

  function logout() {
    if (typeof window !== "undefined") localStorage.removeItem(tokenKey);
    setToken("");
    setConnected(false);
  }

  return (
    <div className="adminshell">
      <Seo title="ezfind — ניהול" noindex />

      <header className="adminshell__bar">
        <div className="adminshell__bar-inner container">
          <span className="adminshell__brand">
            ez<span className="adminshell__brand-accent">find</span> · ניהול
          </span>
          {connected && (
            <button type="button" className="adminshell__logout" onClick={logout}>
              התנתקות
            </button>
          )}
        </div>
      </header>

      <main id="main" className="container section">
        {!connected ? (
          <div className="card adminshell__login">
            <h1>כניסת מנהל</h1>
            <p className="admin__note">הזינו את אסימון הגישה כדי להמשיך.</p>
            <Field label="אסימון מנהל" htmlFor="admin_token">
              <TextInput
                id="admin_token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
                placeholder="ADMIN_TOKEN"
              />
            </Field>
            <Button type="button" onClick={connect}>
              כניסה
            </Button>
          </div>
        ) : (
          <>
            <nav className="adminshell__tabs" aria-label="ניווט ניהול">
              <button
                type="button"
                className={`adminshell__tab ${tab === "leads" ? "is-active" : ""}`}
                onClick={() => setTab("leads")}
              >
                לידים
              </button>
              <button
                type="button"
                className={`adminshell__tab ${tab === "applicants" ? "is-active" : ""}`}
                onClick={() => setTab("applicants")}
              >
                מצטרפים
              </button>
            </nav>

            {tab === "leads" ? (
              <LeadsSection token={token} onUnauthorized={logout} />
            ) : (
              <ApplicantsSection token={token} onUnauthorized={logout} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
