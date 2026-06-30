import { useState, type FormEvent, type ReactNode } from "react";
import Seo from "./Seo.tsx";
import { Field, TextInput, Select } from "./Field.tsx";
import { submitJoin } from "../lib/api.ts";
import { JOIN_CATEGORIES } from "@shared/constants.ts";
import "./LandingPage.css";

type Status = "idle" | "sending" | "done" | "error";

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingConfig {
  // Wordmark: "ezfind" plus an optional Hebrew suffix, e.g. "שפים" → "ezfind שפים".
  brandSuffix?: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  heroEyebrow: string;
  heroTitle: ReactNode;
  heroSub: string;
  heroCta: string;
  steps: [LandingStep, LandingStep, LandingStep];
  formEyebrow: string;
  formTitle: string;
  formSub: string;
  // When false the category select is hidden and `fixedCategory` is submitted.
  showCategory: boolean;
  fixedCategory?: string;
  // Tagged on the submission so the admin can tell which landing it came from.
  source: string;
  footerText: string;
}

interface FormState {
  full_name: string;
  business_name: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  message: string;
}

function Wordmark({ suffix, className }: { suffix?: string; className?: string }) {
  return (
    <span className={`ez__wordmark ${className ?? ""}`}>
      ez<span className="ez__wordmark-accent">find</span>
      {suffix ? <span className="ez__wordmark-suffix"> {suffix}</span> : null}
    </span>
  );
}

// Shared single-page landing template (umbrella ezfind.app and ezfind שפים).
// Identical layout/branding; only the copy and the submission `source`/category
// differ, supplied via `config`.
export default function LandingPage({ config }: { config: LandingConfig }) {
  const EMPTY: FormState = {
    full_name: "",
    business_name: "",
    category: config.showCategory ? "" : config.fixedCategory ?? "",
    city: "",
    phone: "",
    email: "",
    message: "",
  };

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
      const res = await submitJoin({
        ...form,
        category: config.showCategory ? form.category : config.fixedCategory ?? form.category,
        source: config.source,
      });
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
        title={config.seoTitle}
        description={config.seoDescription}
        canonicalPath={config.canonicalPath}
      />

      <header className="ez__bar">
        <div className="ez__bar-inner container">
          <Wordmark suffix={config.brandSuffix} />
          <a className="btn btn--primary ez__bar-cta" href="#join">
            הצטרפו עכשיו
          </a>
        </div>
      </header>

      <main id="main">
        <section className="ez__hero">
          <div className="container ez__hero-inner">
            <p className="eyebrow">{config.heroEyebrow}</p>
            <h1 className="ez__title">{config.heroTitle}</h1>
            <p className="ez__sub lead-text">{config.heroSub}</p>
            <a className="btn btn--primary ez__hero-cta" href="#join">
              {config.heroCta}
            </a>
          </div>
        </section>

        <section className="container section">
          <div className="grid grid-3">
            {config.steps.map((s, i) => (
              <div className="card" key={i}>
                <span className="ez__step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

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
                <p className="eyebrow">{config.formEyebrow}</p>
                <h2 className="ez__form-title">{config.formTitle}</h2>
                <p className="ez__form-sub">{config.formSub}</p>

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

                    {config.showCategory && (
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
                    )}

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
          <Wordmark suffix={config.brandSuffix} className="ez__wordmark--sm" />
          <p className="ez__footer-copy">{config.footerText}</p>
        </div>
      </footer>
    </div>
  );
}
