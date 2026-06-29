import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.tsx";
import Turnstile from "../components/Turnstile.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput } from "../components/Field.tsx";
import { chefLogin, chefRegister } from "../lib/chefApi.ts";
import { setChefToken } from "../lib/chefSession.ts";
import "./Chef.css";

type Mode = "login" | "register";

function messageFor(reason?: string): string {
  switch (reason) {
    case "invalid":
      return "טלפון או סיסמה שגויים.";
    case "disabled":
      return "החשבון מושבת. פנו אלינו.";
    case "phone_taken":
      return "מספר הטלפון כבר רשום — התחברו במקום.";
    case "turnstile_failed":
      return "אימות אנטי-ספאם נכשל. רעננו ונסו שוב.";
    case "payments_unavailable":
      return "השירות אינו זמין כרגע. נסו שוב מאוחר יותר.";
    default:
      return "אירעה שגיאה. נסו שוב.";
  }
}

export default function ChefAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res =
        mode === "login"
          ? await chefLogin({ phone: phone.trim(), password })
          : await chefRegister({
              phone: phone.trim(),
              name: name.trim(),
              email: email.trim() || undefined,
              password,
              turnstile_token: token,
            });
      if (res.body.ok && res.body.token) {
        setChefToken(res.body.token);
        navigate("/chef");
        return;
      }
      setError(messageFor(res.body.reason));
    } catch {
      setError("אירעה שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section container chefauth">
      <Seo title="אזור השפים — כניסה | השף שלי" noindex />
      <div className="card card--raised chefauth__card">
        <p className="eyebrow">אזור השפים</p>
        <h1 className="chefauth__title">{mode === "login" ? "כניסה לחשבון" : "פתיחת חשבון שף"}</h1>
        <p className="chefauth__sub">
          {mode === "login"
            ? "התחברו כדי לקנות בנק לידים, לעיין בלידים ולפתוח אותם בקרדיט."
            : "פתחו חשבון, קנו בנק לידים, ופתחו לידים בקליק — בלי לשלם על כל ליד בנפרד."}
        </p>

        <div className="chefauth__tabs" role="tablist" aria-label="כניסה או הרשמה">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`chefauth__tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
          >
            כניסה
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`chefauth__tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => setMode("register")}
          >
            הרשמה
          </button>
        </div>

        <Field label="טלפון" htmlFor="chef_phone">
          <TextInput
            id="chef_phone"
            type="tel"
            inputMode="tel"
            placeholder="050-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        {mode === "register" && (
          <>
            <Field label="שם מלא" htmlFor="chef_name">
              <TextInput id="chef_name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="אימייל (לא חובה)" htmlFor="chef_email">
              <TextInput id="chef_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </>
        )}

        <Field label="סיסמה" htmlFor="chef_password">
          <TextInput
            id="chef_password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {mode === "register" && <Turnstile onToken={setToken} />}

        {error && <p className="chefauth__error">{error}</p>}

        <Button type="button" onClick={submit} disabled={busy} full>
          {busy ? "רגע…" : mode === "login" ? "כניסה" : "פתיחת חשבון"}
        </Button>
      </div>
    </div>
  );
}
