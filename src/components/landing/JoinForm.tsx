import { useState, type FormEvent } from "react";
import { Field, TextInput, Select } from "../Field.tsx";
import Turnstile from "../Turnstile.tsx";
import { submitJoin } from "../../lib/api.ts";
import { JOIN_CATEGORIES } from "@shared/constants.ts";

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

// The umbrella ezfind.app form — a professional applies to join the network.
export default function JoinForm({ source = "ezfind-landing" }: { source?: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captcha, setCaptcha] = useState("");

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await submitJoin({ ...form, turnstile_token: captcha, source });
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

  if (status === "done") {
    return (
      <div className="ez__success">
        <span className="ez__success-mark" aria-hidden="true">
          ✓
        </span>
        <h2>קיבלנו! תודה שהצטרפתם.</h2>
        <p>הפרטים שלכם נשלחו לצוות שלנו. ניצור איתכם קשר בקרוב עם הצעדים הבאים.</p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus("idle")}>
          שליחת בקשה נוספת
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">הצטרפות</p>
      <h2 className="ez__form-title">בואו נתחיל</h2>
      <p className="ez__form-sub">מלאו את הפרטים ונחזור אליכם. השדות המסומנים הם חובה.</p>

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

        <Turnstile onToken={setCaptcha} />

        <button
          type="submit"
          className="btn btn--primary btn--full ez__submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? "שולח…" : "שליחת הבקשה"}
        </button>

        <p className="ez__consent">
          בשליחת הטופס אתם מאשרים שניצור איתכם קשר בנוגע לשירות. אין עלות הרשמה.
        </p>
      </form>
    </>
  );
}
