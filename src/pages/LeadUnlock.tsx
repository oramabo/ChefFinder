import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo.tsx";
import Badge from "../components/Badge.tsx";
import SlotsLeft from "../components/SlotsLeft.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput } from "../components/Field.tsx";
import { EVENT_TYPES, CUISINES } from "@shared/constants.ts";
import type { PublicLead, LeadContact } from "@shared/types.ts";
import { getLead, reserveLead, getContact, mockComplete, type ManualBit } from "../lib/api.ts";
import { formatDate, formatCurrency } from "../lib/format.ts";
import { track, identify } from "../lib/analytics.ts";
import { sha256Hex } from "../lib/hash.ts";
import "./LeadUnlock.css";

const eventHe = (slug: string | null) =>
  EVENT_TYPES.find((e) => e.slug === slug)?.he ?? slug ?? "אירוע";
const cuisineHe = (slug: string | null) =>
  CUISINES.find((c) => c.slug === slug)?.he ?? slug ?? "";

const phoneKey = (token: string) => `chef_phone:${token}`;
const revealKey = (token: string) => `reveal:${token}`;

export default function LeadUnlock() {
  const { token = "" } = useParams();
  const [params] = useSearchParams();
  const [lead, setLead] = useState<PublicLead | null>(null);
  const [contact, setContact] = useState<LeadContact | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [bit, setBit] = useState<ManualBit | null>(null);

  const refreshLead = useCallback(async () => {
    const res = await getLead(token);
    if (!res.ok || !res.lead) {
      setNotFound(true);
      return null;
    }
    setLead(res.lead);
    return res.lead;
  }, [token]);

  const tryReveal = useCallback(
    async (revealToken: string) => {
      if (!revealToken) return false;
      const res = await getContact(token, revealToken);
      if (res.ok && res.contact) {
        setContact(res.contact);
        track("phone_revealed");
        return true;
      }
      return false;
    },
    [token],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      track("lead_page_viewed", { token });
      const storedPhone =
        typeof window !== "undefined" ? localStorage.getItem(phoneKey(token)) : null;
      if (storedPhone) setPhone(storedPhone);
      const storedReveal =
        typeof window !== "undefined" ? localStorage.getItem(revealKey(token)) : null;

      // Returning from the (mock) payment page: finish + reveal.
      const mockPay = params.get("mock_pay");
      const ref = params.get("ref");
      if (mockPay && ref) {
        const purchaseId = ref.replace(/^mock_/, "");
        await mockComplete(purchaseId);
        track("payment_completed");
      }

      await refreshLead();
      if (storedReveal) await tryReveal(storedReveal);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, params, refreshLead, tryReveal]);

  // While awaiting a manual Bit confirmation, poll for the unlock.
  useEffect(() => {
    if (!bit || contact) return;
    const id = setInterval(async () => {
      const storedReveal =
        typeof window !== "undefined" ? localStorage.getItem(revealKey(token)) ?? "" : "";
      const ok = await tryReveal(storedReveal);
      if (ok) clearInterval(id);
    }, 5000);
    return () => clearInterval(id);
  }, [bit, contact, token, tryReveal]);

  async function pay() {
    if (working) return;
    const trimmed = phone.trim();
    if (!/^[+]?[0-9\s-]{9,20}$/.test(trimmed)) {
      setMessage("נא להזין מספר טלפון תקין");
      return;
    }
    setWorking(true);
    setMessage("");
    track("pay_clicked", { token });
    try {
      // Identify the chef by hashed phone (no raw PII leaves the browser).
      identify(`chef_${await sha256Hex(trimmed)}`);
      localStorage.setItem(phoneKey(token), trimmed);
      const res = await reserveLead(token, trimmed);
      if (res.ok && res.manual_bit) {
        // Manual Bit: no redirect — show instructions and poll until the
        // operator confirms the payment.
        if (res.reveal_token) localStorage.setItem(revealKey(token), res.reveal_token);
        track("reserve_won");
        track("payment_started");
        setBit(res.manual_bit);
        return;
      }
      if (res.ok && res.payment_url) {
        // Persist the reveal token BEFORE leaving for payment; it's how we
        // unlock the contact on return.
        if (res.reveal_token) localStorage.setItem(revealKey(token), res.reveal_token);
        track("reserve_won");
        track("payment_started");
        window.location.href = res.payment_url;
        return;
      }
      track("reserve_sold_out", { reason: res.reason });
      if (res.reason === "already_purchased") {
        await refreshLead();
        const storedReveal = localStorage.getItem(revealKey(token)) ?? "";
        const ok = await tryReveal(storedReveal);
        if (!ok) setMessage("כבר רכשת ליד זה. אם הקישור נפתח במכשיר אחר, פנו אלינו.");
      } else if (res.reason === "sold_out") {
        setMessage("הליד נמכר. כל המקומות נתפסו.");
        await refreshLead();
      } else if (res.reason === "payments_unavailable") {
        setMessage("רכישת לידים תיפתח בקרוב. תודה על הסבלנות!");
      } else if (res.reason === "not_found") {
        setNotFound(true);
      } else {
        setMessage(res.error || "אירעה שגיאה. נסו שוב.");
      }
    } catch {
      setMessage("אירעה שגיאת רשת. נסו שוב.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="section container">
        <p>טוען…</p>
      </div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="section container">
        <Seo title="הליד לא נמצא — ezfind" noindex />
        <div className="card">
          <h1>הליד לא נמצא</h1>
          <p>ייתכן שהקישור שגוי או שפג תוקפו.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section container leadunlock">
      <Seo title={`ליד: שף ל${eventHe(lead.event_type)} ${lead.city ?? ""}`} noindex />

      <div className="card leadunlock__card">
        <div className="leadunlock__head">
          <h1>שף פרטי ל{eventHe(lead.event_type)}</h1>
          <SlotsLeft slots={lead.slots_left} />
        </div>

        <dl className="leadunlock__details">
          {lead.city && (
            <div>
              <dt>עיר</dt>
              <dd>{lead.city}</dd>
            </div>
          )}
          {lead.event_date && (
            <div>
              <dt>תאריך</dt>
              <dd>{formatDate(lead.event_date)}</dd>
            </div>
          )}
          {lead.guests != null && (
            <div>
              <dt>אורחים</dt>
              <dd>{lead.guests}</dd>
            </div>
          )}
          {lead.budget != null && (
            <div>
              <dt>תקציב</dt>
              <dd>{formatCurrency(lead.budget)}</dd>
            </div>
          )}
          {lead.cuisine && (
            <div>
              <dt>מטבח</dt>
              <dd>{cuisineHe(lead.cuisine)}</dd>
            </div>
          )}
          <div>
            <dt>כשרות</dt>
            <dd>{lead.kosher ? "כשר" : "ללא דרישה"}</dd>
          </div>
        </dl>

        {contact ? (
          <div className="leadunlock__reveal">
            <Badge tone="success">נרכש — פרטי הלקוח</Badge>
            <p className="leadunlock__client">{contact.client_name}</p>
            <a className="leadunlock__phone accent" href={`tel:${contact.client_phone}`}>
              {contact.client_phone}
            </a>
            {contact.client_email && (
              <a className="leadunlock__email" href={`mailto:${contact.client_email}`}>
                {contact.client_email}
              </a>
            )}
          </div>
        ) : bit ? (
          <div className="leadunlock__bit">
            <Badge tone="accent">ממתין לתשלום בביט</Badge>
            <p className="leadunlock__price">
              לתשלום: <strong className="accent">{formatCurrency(bit.amount)}</strong>
            </p>
            <p>שלחו תשלום בביט אל המספר:</p>
            <p className="leadunlock__bitphone" dir="ltr">
              {bit.phone}
            </p>
            {bit.link && (
              <a className="btn btn--primary" href={bit.link} target="_blank" rel="noopener noreferrer">
                פתחו את ביט
              </a>
            )}
            <p className="leadunlock__bitref">
              אסמכתא לתשלום: <code>{bit.reference}</code>
              <br />
              ציינו אותה בהערת התשלום כדי שנזהה אותו במהירות.
            </p>
            <p>
              לאחר אישור התשלום, פרטי הלקוח ייחשפו כאן אוטומטית — אפשר להשאיר את הדף
              פתוח.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const r =
                  typeof window !== "undefined" ? localStorage.getItem(revealKey(token)) ?? "" : "";
                void tryReveal(r);
              }}
            >
              בדקו אם אושר
            </Button>
          </div>
        ) : lead.status === "sold_out" || lead.slots_left <= 0 ? (
          <div className="leadunlock__soldout">
            <Badge tone="danger">נמכר</Badge>
            <p>הליד נמכר למספר המרבי של שפים. עקבו אחרי לידים חדשים בקבוצה.</p>
          </div>
        ) : (
          <div className="leadunlock__buy">
            <p className="leadunlock__price">
              פתיחת פרטי הלקוח: <strong className="accent">{formatCurrency(lead.price)}</strong>
            </p>
            <Field label="מספר הטלפון שלך (לזיהוי הרכישה)" htmlFor="chef_phone">
              <TextInput
                id="chef_phone"
                type="tel"
                inputMode="tel"
                placeholder="050-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Button type="button" onClick={pay} disabled={working} full>
              {working ? "מעבד…" : `תשלום ${formatCurrency(lead.price)} וקבלת הטלפון`}
            </Button>
            {message && <p className="leadunlock__message">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
