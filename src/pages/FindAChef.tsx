import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.tsx";
import Stepper from "../components/Stepper.tsx";
import Turnstile from "../components/Turnstile.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput, OptionGroup } from "../components/Field.tsx";
import { EVENT_TYPES, BUDGET_BANDS, CUISINES } from "@shared/constants.ts";
import { createLead } from "../lib/api.ts";
import { track } from "../lib/analytics.ts";
import "./FindAChef.css";

const STEP_LABELS = ["אירוע", "תאריך", "מיקום", "אורחים", "תקציב", "מטבח", "פרטים"];

interface FormState {
  event_type: string;
  event_date: string;
  city: string;
  guests: string;
  budget: string;
  cuisine: string;
  kosher: boolean;
  client_name: string;
  client_phone: string;
  client_email: string;
}

const EMPTY: FormState = {
  event_type: "",
  event_date: "",
  city: "",
  guests: "",
  budget: "",
  cuisine: "",
  kosher: false,
  client_name: "",
  client_phone: "",
  client_email: "",
};

export default function FindAChef() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  // Refs mirror state so the unmount cleanup sees current values (not stale ones).
  const stepRef = useRef(step);
  stepRef.current = step;
  const startedRef = useRef(false);
  const submittedRef = useRef(false);

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (!started) {
      setStarted(true);
      startedRef.current = true;
      track("form_start");
    }
  }, [started]);

  // Fire form_abandoned if the user leaves after starting but before submitting.
  useEffect(() => {
    return () => {
      if (startedRef.current && !submittedRef.current) {
        track("form_abandoned", { last_step: STEP_LABELS[stepRef.current] });
      }
    };
  }, []);

  function stepValid(): boolean {
    switch (step) {
      case 0:
        return !!form.event_type;
      case 1:
        return /^\d{4}-\d{2}-\d{2}$/.test(form.event_date);
      case 2:
        return form.city.trim().length > 0;
      case 3:
        return Number(form.guests) >= 1;
      case 4:
        return !!form.budget;
      case 5:
        return true; // cuisine/kosher optional
      case 6:
        return (
          form.client_name.trim().length > 0 &&
          /^[+]?[0-9\s-]{9,20}$/.test(form.client_phone)
        );
      default:
        return false;
    }
  }

  function next() {
    if (!stepValid()) return;
    track("form_step_completed", { step });
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (!stepValid() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await createLead({
        event_type: form.event_type,
        event_date: form.event_date,
        city: form.city.trim(),
        guests: Number(form.guests),
        budget: Number(form.budget),
        cuisine: form.cuisine || undefined,
        kosher: form.kosher,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim(),
        client_email: form.client_email.trim() || undefined,
        turnstile_token: token,
        source: typeof window !== "undefined" ? window.location.search.slice(1) : undefined,
      });
      if (!res.ok) {
        setError(res.error || "אירעה שגיאה. נסו שוב.");
        setSubmitting(false);
        return;
      }
      submittedRef.current = true;
      track("lead_submitted");
      navigate("/lead-received");
    } catch {
      setError("אירעה שגיאת רשת. נסו שוב.");
      setSubmitting(false);
    }
  }

  const isLast = step === STEP_LABELS.length - 1;

  return (
    <div className="section container findachef">
      <Seo
        title="מצאו שף פרטי לאירוע | טופס הזמנה — השף שלי"
        description="מלאו טופס קצר וקבלו עד 3 הצעות משפים פרטיים מקצועיים לאירוע שלכם."
        noindex
      />
      <p className="eyebrow">בקשת שף</p>
      <h1>בואו נמצא לכם שף</h1>
      <p className="findachef__sub">כמה פרטים קצרים — ועד שלושה שפים יחזרו אליכם עם הצעה.</p>

      <div className="card findachef__card">
        <Stepper steps={STEP_LABELS} current={step} />

        {step === 0 && (
          <Field label="סוג האירוע">
            <OptionGroup
              name="סוג האירוע"
              value={form.event_type}
              onChange={(v) => set("event_type", v)}
              options={EVENT_TYPES.map((e) => ({ value: e.slug, label: e.he }))}
            />
          </Field>
        )}

        {step === 1 && (
          <Field label="תאריך האירוע" htmlFor="event_date">
            <TextInput
              id="event_date"
              type="date"
              value={form.event_date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set("event_date", e.target.value)}
            />
          </Field>
        )}

        {step === 2 && (
          <Field label="עיר / יישוב" htmlFor="city">
            <TextInput
              id="city"
              type="text"
              placeholder="לדוגמה: תל אביב"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
        )}

        {step === 3 && (
          <Field label="מספר אורחים" htmlFor="guests">
            <TextInput
              id="guests"
              type="number"
              min={1}
              max={2000}
              inputMode="numeric"
              value={form.guests}
              onChange={(e) => set("guests", e.target.value)}
            />
          </Field>
        )}

        {step === 4 && (
          <Field label="תקציב משוער">
            <OptionGroup
              name="תקציב"
              value={form.budget}
              onChange={(v) => set("budget", v)}
              options={BUDGET_BANDS.map((b) => ({ value: String(b.value), label: b.he }))}
            />
          </Field>
        )}

        {step === 5 && (
          <>
            <Field label="סגנון מטבח (לא חובה)">
              <OptionGroup
                name="מטבח"
                value={form.cuisine}
                onChange={(v) => set("cuisine", v)}
                options={CUISINES.map((c) => ({ value: c.slug, label: c.he }))}
              />
            </Field>
            <label className="findachef__check">
              <input
                type="checkbox"
                checked={form.kosher}
                onChange={(e) => set("kosher", e.target.checked)}
              />
              <span>נדרש מטבח כשר</span>
            </label>
          </>
        )}

        {step === 6 && (
          <>
            <Field label="שם מלא" htmlFor="client_name">
              <TextInput
                id="client_name"
                type="text"
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
              />
            </Field>
            <Field label="טלפון" htmlFor="client_phone">
              <TextInput
                id="client_phone"
                type="tel"
                inputMode="tel"
                placeholder="050-1234567"
                value={form.client_phone}
                onChange={(e) => set("client_phone", e.target.value)}
              />
            </Field>
            <Field label="אימייל (לא חובה)" htmlFor="client_email">
              <TextInput
                id="client_email"
                type="email"
                value={form.client_email}
                onChange={(e) => set("client_email", e.target.value)}
              />
            </Field>
            <Turnstile onToken={setToken} />
            <p className="findachef__consent">
              בשליחת הטופס אני מאשר/ת שפרטיי יועברו לשפים מקצועיים לצורך יצירת קשר,
              בהתאם ל<a href="/privacy">מדיניות הפרטיות</a>.
            </p>
          </>
        )}

        {error && <p className="findachef__error">{error}</p>}

        <div className="findachef__nav">
          {step > 0 && (
            <Button variant="ghost" type="button" onClick={back} disabled={submitting}>
              חזרה
            </Button>
          )}
          {!isLast ? (
            <Button type="button" onClick={next} disabled={!stepValid()}>
              המשך
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={!stepValid() || submitting}>
              {submitting ? "שולח..." : "שליחה וקבלת הצעות"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
