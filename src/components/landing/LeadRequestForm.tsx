import { useState, type FormEvent } from "react";
import { Field, TextInput, Select } from "../Field.tsx";
import Turnstile from "../Turnstile.tsx";
import { IconCheck } from "../art.tsx";
import { createLead, sendOtp } from "../../lib/api.ts";
import { EVENT_TYPES, BUDGET_BANDS } from "@shared/constants.ts";
import { track } from "../../lib/analytics.ts";

type Status = "idle" | "sending" | "done" | "error";

interface FormState {
  event_type: string;
  city: string;
  event_date: string;
  guests: string;
  budget: string;
  client_name: string;
  client_phone: string;
  client_email: string;
}

const EMPTY: FormState = {
  event_type: "",
  city: "",
  event_date: "",
  guests: "",
  budget: "",
  client_name: "",
  client_phone: "",
  client_email: "",
};

// The chefs.ezfind.app form — a client looking to hire a private chef describes
// their event. This creates a lead (the same pipeline that distributes to chefs).
export default function LeadRequestForm({ source = "ezfind-chefs-landing" }: { source?: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captcha, setCaptcha] = useState("");
  // Remount key — Turnstile tokens are single-use; bump after a consuming call.
  const [captchaKey, setCaptchaKey] = useState(0);
  // Phone verification (active only when the server runs with OTP_ENABLED).
  const [otpStage, setOtpStage] = useState<"none" | "sent">("none");
  const [otpCode, setOtpCode] = useState("");

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function requestOtp(): Promise<void> {
    const res = await sendOtp(form.client_phone, captcha);
    setCaptchaKey((k) => k + 1);
    if (res.ok) {
      track("otp_requested");
    }
    if (res.ok || res.reason === "too_soon") {
      setOtpStage("sent");
      setStatus("idle");
      setErrorMsg("");
      return;
    }
    setStatus("error");
    setErrorMsg(
      res.reason === "send_failed"
        ? "שליחת קוד האימות נכשלה. ודאו שהמספר פעיל בוואטסאפ ונסו שוב."
        : res.error ?? "אירעה תקלה. נסו שוב בעוד רגע.",
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await createLead({
        event_type: form.event_type || undefined,
        city: form.city,
        event_date: form.event_date || undefined,
        guests: form.guests ? Number(form.guests) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        kosher: false,
        client_name: form.client_name,
        client_phone: form.client_phone,
        client_email: form.client_email || "",
        turnstile_token: captcha,
        otp_code: otpCode.trim(),
        source,
      });
      if (res.ok) {
        track("chef_request_submitted", { source, event_type: form.event_type, city: form.city });
        setStatus("done");
        setForm(EMPTY);
        setOtpStage("none");
        setOtpCode("");
      } else if (res.reason === "otp_required") {
        await requestOtp();
      } else if (res.reason === "otp_invalid") {
        setStatus("error");
        setErrorMsg("הקוד שגוי — נסו שוב.");
      } else if (res.reason === "otp_expired" || res.reason === "otp_too_many") {
        setOtpCode("");
        await requestOtp();
        setStatus("error");
        setErrorMsg("הקוד כבר לא בתוקף — שלחנו קוד חדש לוואטסאפ.");
      } else {
        track("chef_request_error");
        setStatus("error");
        setErrorMsg(res.error ?? "אירעה תקלה. נסו שוב בעוד רגע.");
      }
    } catch {
      track("chef_request_error");
      setStatus("error");
      setErrorMsg("לא הצלחנו לשלוח כרגע. בדקו את החיבור ונסו שוב.");
    }
  }

  if (status === "done") {
    return (
      <div className="ez__success">
        <span className="ez__success-mark" aria-hidden="true">
          <IconCheck />
        </span>
        <h2>קיבלנו! מחפשים לכם שף.</h2>
        <p>
          נעבור על הפרטים ונחבר אתכם לשפים פרטיים מתאימים מהאזור שלכם. נהיה בקשר
          בהקדם.
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus("idle")}>
          שליחת בקשה נוספת
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">בקשת שף</p>
      <h2 className="ez__form-title">ספרו לנו על האירוע</h2>
      <p className="ez__form-sub">
        מלאו את הפרטים ונחזור אליכם עם שפים מתאימים. השדות המסומנים הם חובה.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div className="ez__grid">
          <Field label="סוג האירוע" htmlFor="event_type">
            <Select
              id="event_type"
              name="event_type"
              value={form.event_type}
              onChange={(e) => set("event_type")(e.target.value)}
            >
              <option value="">בחרו סוג אירוע…</option>
              {EVENT_TYPES.map((ev) => (
                <option key={ev.slug} value={ev.slug}>
                  {ev.he}
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

          <Field label="תאריך האירוע" htmlFor="event_date">
            <TextInput
              id="event_date"
              name="event_date"
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date")(e.target.value)}
            />
          </Field>

          <Field label="מספר אורחים" htmlFor="guests">
            <TextInput
              id="guests"
              name="guests"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.guests}
              onChange={(e) => set("guests")(e.target.value)}
            />
          </Field>

          <Field label="תקציב משוער" htmlFor="budget">
            <Select
              id="budget"
              name="budget"
              value={form.budget}
              onChange={(e) => set("budget")(e.target.value)}
            >
              <option value="">בחרו תקציב…</option>
              {BUDGET_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.he}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="שם מלא *" htmlFor="client_name">
            <TextInput
              id="client_name"
              name="client_name"
              autoComplete="name"
              required
              value={form.client_name}
              onChange={(e) => set("client_name")(e.target.value)}
            />
          </Field>

          <Field label="טלפון *" htmlFor="client_phone">
            <TextInput
              id="client_phone"
              name="client_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={form.client_phone}
              onChange={(e) => set("client_phone")(e.target.value)}
            />
          </Field>

          <Field label="אימייל" htmlFor="client_email">
            <TextInput
              id="client_email"
              name="client_email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.client_email}
              onChange={(e) => set("client_email")(e.target.value)}
            />
          </Field>
        </div>

        {otpStage === "sent" && (
          <Field label="קוד אימות (נשלח אליכם בוואטסאפ)" htmlFor="otp_code">
            <TextInput
              id="otp_code"
              name="otp_code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 ספרות"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
          </Field>
        )}

        {status === "error" && (
          <p className="ez__error" role="alert">
            {errorMsg}
          </p>
        )}

        <Turnstile key={captchaKey} onToken={setCaptcha} />

        <button
          type="submit"
          className="btn btn--primary btn--full ez__submit"
          disabled={status === "sending" || (otpStage === "sent" && otpCode.trim().length < 4)}
        >
          {status === "sending" ? "שולח…" : otpStage === "sent" ? "אימות ושליחה" : "מצאו לי שף"}
        </button>

        <p className="ez__consent">
          בשליחת הטופס אתם מאשרים שניצור איתכם קשר בנוגע לבקשה. השירות ללא עלות
          וללא התחייבות.
        </p>
      </form>
    </>
  );
}
