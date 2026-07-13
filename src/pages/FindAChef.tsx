import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.tsx";
import Stepper from "../components/Stepper.tsx";
import Turnstile from "../components/Turnstile.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput, OptionGroup } from "../components/Field.tsx";
import {
  EVENT_TYPES,
  BUDGET_BANDS,
  CUISINES,
  OTP_MIN_RESEND_SECONDS,
  OTP_TTL_MINUTES,
} from "@shared/constants.ts";
import { CITIES } from "@shared/seo/cities.ts";
import { createLead, sendOtp } from "../lib/api.ts";
import { track } from "../lib/analytics.ts";
import "./FindAChef.css";

// Each step carries a short stepper label and the conversational question that
// leads the card — the wizard reads like a concierge conversation, not a form.
const STEPS = [
  { label: "אירוע", question: "איזה אירוע מתכננים?" },
  { label: "תאריך", question: "מתי האירוע?" },
  { label: "מיקום", question: "איפה מארחים?" },
  { label: "אורחים", question: "כמה אורחים יהיו?" },
  { label: "תקציב", question: "מה התקציב המשוער?" },
  { label: "מטבח", question: "איזה מטבח מדבר אליכם?" },
  { label: "פרטים", question: "כמעט סיימנו — איך נחזור אליכם?" },
] as const;
const STEP_LABELS = STEPS.map((s) => s.label);

const PHONE_RE = /^[+]?[0-9\s-]{9,20}$/;
const GUEST_PRESETS = ["10", "20", "30", "50", "100"];
// Survives a reload or a switch to WhatsApp (OTP) that evicts the mobile tab.
const DRAFT_KEY = "findachef_draft";

interface FormState {
  event_type: string;
  event_date: string;
  flexible_date: boolean;
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
  flexible_date: false,
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
  // Remount key for the Turnstile widget: tokens are single-use, so after a
  // call that consumed one (e.g. sending an OTP) we bump this to get a fresh one.
  const [captchaKey, setCaptchaKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Non-error notices (e.g. "code sent") — separate slot so success messages
  // aren't announced and styled as errors.
  const [status, setStatus] = useState("");
  const [started, setStarted] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  // Phone verification (active only when the server runs with OTP_ENABLED).
  const [otpStage, setOtpStage] = useState<"none" | "sent">("none");
  const [otpCode, setOtpCode] = useState("");
  const [resendIn, setResendIn] = useState(0);

  // Refs mirror state so the unmount cleanup sees current values (not stale ones).
  const stepRef = useRef(step);
  stepRef.current = step;
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);
  const advanceTimer = useRef<number>();

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (!started) {
      setStarted(true);
      startedRef.current = true;
      track("form_start");
    }
  }, [started]);

  // Single-choice steps advance on tap: answer met with the next question. The
  // short delay lets the selected chip render; the step guard skips the advance
  // if the user already navigated away (e.g. tapped back).
  function chooseAndAdvance<K extends keyof FormState>(k: K, v: FormState[K]) {
    set(k, v);
    window.clearTimeout(advanceTimer.current);
    const from = stepRef.current;
    advanceTimer.current = window.setTimeout(() => {
      if (stepRef.current !== from) return;
      track("form_step_completed", { step: from });
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 250);
  }

  // Fire form_abandoned if the user leaves after starting but before submitting.
  useEffect(() => {
    return () => {
      window.clearTimeout(advanceTimer.current);
      if (startedRef.current && !submittedRef.current) {
        track("form_abandoned", { last_step: STEP_LABELS[stepRef.current] });
      }
    };
  }, []);

  // Restore a draft after mount — not during render: the page is prerendered,
  // so reading sessionStorage before hydration would mismatch the server HTML.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { form?: Partial<FormState>; step?: number };
      if (!draft.form) return;
      setForm({ ...EMPTY, ...draft.form });
      setStep(Math.min(Math.max(draft.step ?? 0, 0), STEPS.length - 1));
      // A restored draft is already a started form; don't re-fire form_start.
      setStarted(true);
      startedRef.current = true;
    } catch {
      // Corrupt draft — start clean.
    }
  }, []);

  useEffect(() => {
    if (!startedRef.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
    } catch {
      // Storage unavailable (private mode quota) — the wizard still works.
    }
  }, [form, step]);

  // On step change, move focus into the new step: its first input when it has
  // one (announces the field, summons the keyboard), else the question heading.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const input = panelRef.current?.querySelector<HTMLElement>(
      "input:not([type='checkbox'])",
    );
    (input ?? questionRef.current)?.focus();
  }, [step]);

  // The OTP field appears mid-step — put the cursor in it.
  useEffect(() => {
    if (otpStage === "sent") document.getElementById("otp_code")?.focus();
  }, [otpStage]);

  // Resend countdown (server enforces OTP_MIN_RESEND_SECONDS; mirror it client-side).
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  function stepValid(): boolean {
    switch (step) {
      case 0:
        return !!form.event_type;
      case 1:
        return form.flexible_date || /^\d{4}-\d{2}-\d{2}$/.test(form.event_date);
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
          form.client_name.trim().length > 0 && PHONE_RE.test(form.client_phone)
        );
      default:
        return false;
    }
  }

  function next() {
    if (!stepValid()) return;
    track("form_step_completed", { step });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Ask the server to WhatsApp a code to the client. Consumes the current
  // Turnstile token, so a fresh widget is mounted (and the stale token cleared)
  // right after.
  async function requestOtp() {
    const res = await sendOtp(form.client_phone.trim(), token);
    setToken("");
    setCaptchaKey((k) => k + 1);
    if (res.ok || res.reason === "too_soon") {
      setOtpStage("sent");
      setResendIn(OTP_MIN_RESEND_SECONDS);
      setError("");
      setStatus(
        res.ok
          ? `שלחנו קוד לוואטסאפ — הוא תקף ל-${OTP_TTL_MINUTES} דקות.`
          : "קוד כבר נשלח — בדקו את הוואטסאפ.",
      );
      track("otp_sent");
      return true;
    }
    setStatus("");
    setError(
      res.reason === "send_failed"
        ? "שליחת הקוד נכשלה. ודאו שהמספר פעיל בוואטסאפ ונסו שוב."
        : res.error || "אירעה שגיאה. נסו שוב.",
    );
    return false;
  }

  async function submit() {
    if (!stepValid() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await createLead({
        event_type: form.event_type,
        event_date: form.flexible_date ? undefined : form.event_date,
        city: form.city.trim(),
        guests: Number(form.guests),
        budget: Number(form.budget),
        cuisine: form.cuisine || undefined,
        kosher: form.kosher,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim(),
        client_email: form.client_email.trim() || undefined,
        turnstile_token: token,
        otp_code: otpCode.trim(),
        source: typeof window !== "undefined" ? window.location.search.slice(1) : undefined,
      });
      if (!res.ok) {
        // Server-side phone verification flow (OTP_ENABLED).
        if (res.reason === "otp_required") {
          await requestOtp();
        } else if (res.reason === "otp_invalid") {
          setError("הקוד שגוי — נסו שוב.");
        } else if (res.reason === "otp_expired" || res.reason === "otp_too_many") {
          setOtpCode("");
          setError("הקוד כבר לא בתוקף — שלחנו קוד חדש.");
          await requestOtp();
        } else {
          setError(res.error || "אירעה שגיאה. נסו שוב.");
        }
        setSubmitting(false);
        return;
      }
      submittedRef.current = true;
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Best-effort cleanup.
      }
      track("lead_submitted");
      navigate("/lead-received");
    } catch {
      setError("אירעה שגיאת רשת. נסו שוב.");
      setSubmitting(false);
    }
  }

  const isLast = step === STEP_LABELS.length - 1;
  const phoneInvalid =
    phoneTouched && form.client_phone.trim() !== "" && !PHONE_RE.test(form.client_phone);

  // The final step opens with the request "composed like a menu" — each item
  // jumps back to its step for a quick edit.
  const eventHe = EVENT_TYPES.find((e) => e.slug === form.event_type)?.he;
  const budgetHe = BUDGET_BANDS.find((b) => String(b.value) === form.budget)?.he;
  const cuisineHe = CUISINES.find((c) => c.slug === form.cuisine)?.he;
  const recap = [
    { step: 0, text: eventHe },
    {
      step: 1,
      text: form.flexible_date
        ? "תאריך גמיש"
        : form.event_date.split("-").reverse().join("."),
    },
    { step: 2, text: form.city.trim() },
    { step: 3, text: form.guests ? `${form.guests} אורחים` : "" },
    { step: 4, text: budgetHe },
    { step: 5, text: [cuisineHe, form.kosher ? "כשר" : ""].filter(Boolean).join(" · ") },
  ].filter((r): r is { step: number; text: string } => !!r.text);

  return (
    <div className="findachef">
      <div className="section container findachef__inner">
        <Seo
          title="מצאו שף פרטי לאירוע | טופס הזמנה — ezfind"
          description="מלאו טופס קצר וקבלו עד 3 הצעות משפים פרטיים מקצועיים לאירוע שלכם."
          noindex
        />
        <p className="eyebrow">בקשת שף</p>
        <h1>בואו נמצא לכם שף</h1>
        <p className="findachef__sub">
          כמה פרטים קצרים — ועד שלושה שפים יחזרו אליכם עם הצעה. חינם וללא התחייבות.
        </p>

        <div
          className="card findachef__card"
          onKeyDown={(e) => {
            // Enter advances the wizard (mobile keyboards show "הבא"); ignore it
            // on interactive elements so Back/chips/checkbox keep their own
            // activation, and on the last step let it submit.
            if (e.key !== "Enter") return;
            if ((e.target as HTMLElement).closest("button, a, input[type='checkbox']")) return;
            if (!stepValid()) return;
            e.preventDefault();
            if (!isLast) next();
            else if (!submitting) submit();
          }}
        >
          <Stepper steps={STEP_LABELS} current={step} />
          <h2 className="findachef__question" tabIndex={-1} ref={questionRef}>
            <span className="visually-hidden">
              שלב {step + 1} מתוך {STEPS.length}:{" "}
            </span>
            {STEPS[step].question}
          </h2>

          <div key={step} className="findachef__panel" ref={panelRef}>
            {step === 0 && (
              <Field label="סוג האירוע" labelHidden>
                <OptionGroup
                  name="סוג האירוע"
                  value={form.event_type}
                  onChange={(v) => chooseAndAdvance("event_type", v)}
                  options={EVENT_TYPES.map((e) => ({ value: e.slug, label: e.he }))}
                />
              </Field>
            )}

            {step === 1 && (
              <>
                <Field label="תאריך האירוע" htmlFor="event_date" labelHidden>
                  <TextInput
                    id="event_date"
                    type="date"
                    enterKeyHint="next"
                    value={form.event_date}
                    min={new Date().toISOString().slice(0, 10)}
                    disabled={form.flexible_date}
                    onChange={(e) => set("event_date", e.target.value)}
                  />
                </Field>
                <label className="findachef__check">
                  <input
                    type="checkbox"
                    checked={form.flexible_date}
                    onChange={(e) => {
                      set("flexible_date", e.target.checked);
                      if (e.target.checked) set("event_date", "");
                    }}
                  />
                  <span>עדיין אין תאריך מדויק</span>
                </label>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="עיר / יישוב" htmlFor="city" labelHidden>
                  <TextInput
                    id="city"
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    enterKeyHint="next"
                    list="city-options"
                    placeholder="לדוגמה: תל אביב"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <datalist id="city-options">
                  {CITIES.map((c) => (
                    <option key={c.slug} value={c.he} />
                  ))}
                </datalist>
              </>
            )}

            {step === 3 && (
              <>
                <div className="findachef__quick">
                  <OptionGroup
                    name="בחירה מהירה של מספר אורחים"
                    value={form.guests}
                    onChange={(v) => chooseAndAdvance("guests", v)}
                    options={GUEST_PRESETS.map((n) => ({ value: n, label: n }))}
                  />
                </div>
                <Field label="מספר אורחים מדויק" htmlFor="guests" labelHidden>
                  <TextInput
                    id="guests"
                    type="number"
                    name="guests"
                    min={1}
                    max={2000}
                    inputMode="numeric"
                    enterKeyHint="next"
                    placeholder="או הקלידו מספר מדויק"
                    value={form.guests}
                    onChange={(e) => set("guests", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === 4 && (
              <Field label="תקציב משוער" labelHidden>
                <OptionGroup
                  name="תקציב"
                  value={form.budget}
                  onChange={(v) => chooseAndAdvance("budget", v)}
                  options={BUDGET_BANDS.map((b) => ({ value: String(b.value), label: b.he }))}
                />
              </Field>
            )}

            {step === 5 && (
              <>
                <p className="findachef__hint">לא חובה — אפשר פשוט להמשיך.</p>
                <Field label="סגנון מטבח" labelHidden>
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
                {recap.length > 0 && (
                  <div className="findachef__recap" aria-label="סיכום הבקשה">
                    {recap.map((r) => (
                      <button
                        key={r.step}
                        type="button"
                        className="findachef__recap-item"
                        aria-label={`שינוי: ${r.text}`}
                        onClick={() => setStep(r.step)}
                      >
                        {r.text}
                      </button>
                    ))}
                  </div>
                )}
                <Field label="שם מלא" htmlFor="client_name">
                  <TextInput
                    id="client_name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={form.client_name}
                    onChange={(e) => set("client_name", e.target.value)}
                  />
                </Field>
                <Field
                  label="טלפון"
                  htmlFor="client_phone"
                  error={phoneInvalid ? "מספר לא תקין — לדוגמה 050-1234567" : undefined}
                >
                  <TextInput
                    id="client_phone"
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="050-1234567"
                    value={form.client_phone}
                    onChange={(e) => set("client_phone", e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                  />
                </Field>
                <p className="findachef__hint">
                  המספר משמש רק כדי שהשפים יחזרו אליכם — בלי ספאם.
                </p>
                <Field label="אימייל (לא חובה)" htmlFor="client_email">
                  <TextInput
                    id="client_email"
                    type="email"
                    name="email"
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="send"
                    value={form.client_email}
                    onChange={(e) => set("client_email", e.target.value)}
                  />
                </Field>
                {otpStage === "sent" && (
                  <>
                    <Field
                      label={`קוד אימות (נשלח בוואטסאפ, תקף ל-${OTP_TTL_MINUTES} דקות)`}
                      htmlFor="otp_code"
                    >
                      <TextInput
                        id="otp_code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        enterKeyHint="send"
                        placeholder="6 ספרות"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={requestOtp}
                      disabled={resendIn > 0 || !token}
                    >
                      {resendIn > 0
                        ? `שליחה חוזרת בעוד ${resendIn} שניות`
                        : "לא קיבלתם קוד? שליחה חוזרת"}
                    </Button>
                  </>
                )}
                <Turnstile key={captchaKey} onToken={setToken} />
                <p className="findachef__consent">
                  בשליחת הטופס אני מאשר/ת שפרטיי יועברו לשפים מקצועיים לצורך יצירת קשר,
                  בהתאם ל
                  <a href="/privacy" target="_blank" rel="noopener">
                    מדיניות הפרטיות
                    <span className="visually-hidden"> (נפתח בכרטיסייה חדשה)</span>
                  </a>
                  .
                </p>
              </>
            )}
          </div>

          <p className="findachef__error" role="alert">
            {error}
          </p>
          <p className="findachef__status" role="status">
            {status}
          </p>

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
              <Button
                type="button"
                onClick={submit}
                disabled={
                  !stepValid() ||
                  submitting ||
                  !token ||
                  (otpStage === "sent" && otpCode.trim().length < 4)
                }
              >
                {submitting
                  ? "שולח..."
                  : otpStage === "sent"
                    ? "אימות ושליחה"
                    : "שליחה וקבלת הצעות"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
