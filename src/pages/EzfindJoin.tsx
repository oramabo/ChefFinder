import { useState, type FormEvent } from "react";
import Seo from "../components/Seo.tsx";
import { Field, TextInput, Select } from "../components/Field.tsx";
import { submitJoin } from "../lib/api.ts";
import { JOIN_CATEGORIES } from "@shared/constants.ts";
import "./EzfindJoin.css";

type Status = "idle" | "sending" | "done" | "error";

interface FormState {
  full_name: string;
  business_name: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  message: string;
}

const EMPTY: FormState = {
  full_name: "",
  business_name: "",
  category: "",
  city: "",
  phone: "",
  email: "",
  message: "",
};

export default function EzfindJoin() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await submitJoin({ ...form, source: "ezfind-landing" });
      if (res.ok) {
        setStatus("done");
        setForm(EMPTY);
      } else {
        setStatus("error");
        setErrorMsg(res.error ?? "אירעה תקלה. נסו שוב בעוד רגע.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("לא הצלחנו לשלוח כרגע. בדקו את החיבור ונסו שוב.");
    }
  }

  return (
    <div className="ez">
      <Seo
        title="ezfind — הצטרפו לרשת בעלי המקצוע"
        description="ezfind מחברת לקוחות עם בעלי מקצוע מובילים. הצטרפו כדי לקבל פניות אמיתיות מלקוחות באזור שלכם — הרשמה חינם, בלי התחייבות."
        canonicalPath="/join"
      />

      <header className="ez__bar">
        <div className="ez__bar-inner container">
          <span className="ez__wordmark">
            ez<span className="ez__wordmark-accent">find</span>
          </span>
          <a className="btn btn--primary ez__bar-cta" href="#join">
            הצטרפו עכשיו
          </a>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="ez__hero">
          <div className="container ez__hero-inner">
            <p className="eyebrow">לבעלי מקצוע</p>
            <h1 className="ez__title">
              לקוחות חדשים מחכים לכם — <span className="accent">בלי לרדוף אחריהם</span>
            </h1>
            <p className="ez__sub lead-text">
              ezfind מחברת בין לקוחות שמחפשים שירות לבין בעלי המקצוע הטובים באזור.
              הצטרפו לרשת וקבלו פניות אמיתיות ישירות אליכם — הרשמה חינם, בלי
              התחייבות.
            </p>
            <a className="btn btn--primary ez__hero-cta" href="#join">
              אני רוצה להצטרף
            </a>
          </div>
        </section>

        {/* How it works */}
        <section className="container section">
          <div className="grid grid-3">
            <div className="card">
              <span className="ez__step-num">1</span>
              <h3>ממלאים פרטים</h3>
              <p>משאירים פרטים ותחום עיסוק. לוקח פחות מדקה.</p>
            </div>
            <div className="card">
              <span className="ez__step-num">2</span>
              <h3>מקבלים פניות</h3>
              <p>אנחנו שולחים אליכם לקוחות רלוונטיים מהאזור שלכם.</p>
            </div>
            <div className="card">
              <span className="ez__step-num">3</span>
              <h3>סוגרים עבודות</h3>
              <p>יוצרים קשר ישיר עם הלקוח וסוגרים — אתם בשליטה.</p>
            </div>
          </div>
        </section>

        {/* Join form */}
        <section id="join" className="container section">
          <div className="card ez__form-card">
            {status === "done" ? (
              <div className="ez__success">
                <span className="ez__success-mark" aria-hidden="true">
                  ✓
                </span>
                <h2>קיבלנו! תודה שהצטרפתם.</h2>
                <p>
                  הפרטים שלכם נשלחו לצוות שלנו. ניצור איתכם קשר בקרוב עם הצעדים
                  הבאים.
                </p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setStatus("idle")}
                >
                  שליחת בקשה נוספת
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow">הצטרפות</p>
                <h2 className="ez__form-title">בואו נתחיל</h2>
                <p className="ez__form-sub">
                  מלאו את הפרטים ונחזור אליכם. השדות המסומנים הם חובה.
                </p>

                <form onSubmit={onSubmit} noValidate>
                  <div className="ez__grid">
                    <Field label="שם מלא *" htmlFor="full_name">
                      <TextInput
                        id="full_name"
                        name="full_name"
                        autoComplete="name"
                        required
                        value={form.full_name}
                        onChange={(e) => set("full_name")(e.target.value)}
                      />
                    </Field>

                    <Field label="שם העסק" htmlFor="business_name">
                      <TextInput
                        id="business_name"
                        name="business_name"
                        value={form.business_name}
                        onChange={(e) => set("business_name")(e.target.value)}
                      />
                    </Field>

                    <Field label="תחום עיסוק *" htmlFor="category">
                      <Select
                        id="category"
                        name="category"
                        required
                        value={form.category}
                        onChange={(e) => set("category")(e.target.value)}
                      >
                        <option value="" disabled>
                          בחרו תחום…
                        </option>
                        {JOIN_CATEGORIES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.he}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="עיר / אזור *" htmlFor="city">
                      <TextInput
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        required
                        value={form.city}
                        onChange={(e) => set("city")(e.target.value)}
                      />
                    </Field>

                    <Field label="טלפון *" htmlFor="phone">
                      <TextInput
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={form.phone}
                        onChange={(e) => set("phone")(e.target.value)}
                      />
                    </Field>

                    <Field label="אימייל" htmlFor="email">
                      <TextInput
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => set("email")(e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="משהו שכדאי שנדע? (אופציונלי)" htmlFor="message">
                    <textarea
                      id="message"
                      name="message"
                      className="field__input ez__textarea"
                      rows={3}
                      value={form.message}
                      onChange={(e) => set("message")(e.target.value)}
                    />
                  </Field>

                  {status === "error" && (
                    <p className="ez__error" role="alert">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn btn--primary btn--full ez__submit"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? "שולח…" : "שליחת הבקשה"}
                  </button>

                  <p className="ez__consent">
                    בשליחת הטופס אתם מאשרים שניצור איתכם קשר בנוגע לשירות. אין עלות
                    הרשמה.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="ez__footer">
        <div className="container">
          <span className="ez__wordmark ez__wordmark--sm">
            ez<span className="ez__wordmark-accent">find</span>
          </span>
          <p className="ez__footer-copy">
            © {2026} ezfind · מחברים לקוחות עם בעלי מקצוע
          </p>
        </div>
      </footer>
    </div>
  );
}
