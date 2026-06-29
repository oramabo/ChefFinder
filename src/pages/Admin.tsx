import { useState, useEffect, useCallback } from "react";
import Seo from "../components/Seo.tsx";
import Badge from "../components/Badge.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput } from "../components/Field.tsx";
import {
  listRecentLeads,
  resendNotify,
  confirmPurchase,
  listPending,
  type AdminLead,
  type NotifyChannel,
  type PendingPurchase,
} from "../lib/api.ts";
import type { PendingCreditOrder } from "@shared/types.ts";
import AdminChefs from "./AdminChefs.tsx";
import { EVENT_TYPES } from "@shared/constants.ts";
import { formatDate, formatCurrency } from "../lib/format.ts";
import "./Admin.css";

const eventHe = (slug: string | null) =>
  EVENT_TYPES.find((e) => e.slug === slug)?.he ?? slug ?? "—";

const tokenKey = "admin_token";

function leadLink(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/lead/${token}`;
}

export default function Admin() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Per-lead transient action feedback (re-send / copy), keyed by lead_token.
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  // Manual Bit: pending payments awaiting approval.
  const [pending, setPending] = useState<PendingPurchase[] | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingCreditOrder[]>([]);
  const [pendingMsg, setPendingMsg] = useState("");
  const [approveBusy, setApproveBusy] = useState<string | null>(null);

  const setMsg = (leadToken: string, text: string) =>
    setRowMsg((m) => ({ ...m, [leadToken]: text }));

  const resend = useCallback(
    async (leadToken: string, channel: NotifyChannel) => {
      const label = channel === "whatsapp" ? "וואטסאפ" : "טלגרם";
      setBusyKey(`${leadToken}:${channel}`);
      setMsg(leadToken, `שולח ל${label}…`);
      try {
        const { status, body } = await resendNotify(leadToken, channel, token);
        if (status === 401) return setMsg(leadToken, "אסימון שגוי או חסר.");
        if (!body.ok) return setMsg(leadToken, body.error || "שליחה נכשלה.");
        setMsg(leadToken, body.notify?.[channel] === "sent" ? `${label}: נשלח ✓` : `${label}: נכשל ✗`);
      } catch {
        setMsg(leadToken, "שגיאת רשת.");
      } finally {
        setBusyKey(null);
      }
    },
    [token],
  );

  const copyLink = useCallback(async (leadToken: string) => {
    const link = leadLink(leadToken);
    try {
      await navigator.clipboard.writeText(link);
      setMsg(leadToken, "הקישור הועתק ✓");
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — surface the link.
      setMsg(leadToken, link);
    }
  }, []);

  const loadPending = useCallback(async (t: string) => {
    try {
      const { status, body } = await listPending(t);
      if (status === 401) return setPendingMsg("אסימון שגוי או חסר.");
      if (!body.ok) return setPendingMsg(body.error || "שגיאה בטעינת התשלומים.");
      setPending(body.pending ?? []);
      setPendingOrders(body.pending_credit_orders ?? []);
      setPendingMsg("");
    } catch {
      setPendingMsg("שגיאת רשת.");
    }
  }, []);

  const approveOrder = useCallback(
    async (o: PendingCreditOrder) => {
      setApproveBusy(o.id);
      setPendingMsg("");
      try {
        const { status, body } = await confirmPurchase(o.id, token);
        if (status === 401) return setPendingMsg("אסימון שגוי או חסר.");
        if (!body.ok) return setPendingMsg(body.error || "האישור נכשל.");
        setPendingOrders((cur) => cur.filter((x) => x.id !== o.id));
        setPendingMsg(`אושרה חבילה של ${o.credits} קרדיטים ל-${o.chef_phone} ✓`);
      } catch {
        setPendingMsg("שגיאת רשת.");
      } finally {
        setApproveBusy(null);
      }
    },
    [token],
  );

  const approve = useCallback(
    async (p: PendingPurchase) => {
      setApproveBusy(p.id);
      setPendingMsg("");
      try {
        const { status, body } = await confirmPurchase(p.id, token);
        if (status === 401) return setPendingMsg("אסימון שגוי או חסר.");
        if (!body.ok) return setPendingMsg(body.error || "האישור נכשל.");
        setPending((cur) => (cur ?? []).filter((x) => x.id !== p.id));
        setPendingMsg(`אושר תשלום של ${p.chef_phone} — הפרטים נחשפו לשף ✓`);
      } catch {
        setPendingMsg("שגיאת רשת.");
      } finally {
        setApproveBusy(null);
      }
    },
    [token],
  );

  const load = useCallback(
    async (t: string) => {
      setLoading(true);
      setError("");
      try {
        const { status, body } = await listRecentLeads(t);
        if (status === 401) {
          setError("אסימון שגוי או חסר.");
          setLeads(null);
          return;
        }
        if (!body.ok || !body.leads) {
          setError(body.error || "שגיאה בטעינת הלידים.");
          return;
        }
        setLeads(body.leads);
        if (typeof window !== "undefined") localStorage.setItem(tokenKey, t);
        void loadPending(t);
      } catch {
        setError("שגיאת רשת.");
      } finally {
        setLoading(false);
      }
    },
    [loadPending],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(tokenKey);
    if (saved) {
      setToken(saved);
      void load(saved);
    }
  }, [load]);

  return (
    <div className="section container admin">
      <Seo title="ניהול — לידים אחרונים" noindex />
      <h1>לידים אחרונים</h1>
      <p className="admin__note">תצוגת מנהל לקריאה בלבד. דורש אסימון גישה.</p>

      <div className="admin__bar">
        <Field label="אסימון מנהל" htmlFor="admin_token">
          <TextInput
            id="admin_token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
          />
        </Field>
        <Button type="button" onClick={() => load(token)} disabled={loading}>
          {loading ? "טוען…" : "טעינה"}
        </Button>
      </div>

      {error && <p className="admin__error">{error}</p>}

      {pending && (
        <div className="admin__bit">
          <h2>תשלומי ביט ממתינים לאישור</h2>
          <p className="admin__note">
            קיבלתם תשלום בביט? אשרו את השף לפי מספר הטלפון — והפרטים ייחשפו לו
            אוטומטית.
          </p>
          {pendingMsg && <p className="admin__bitmsg">{pendingMsg}</p>}
          {pending.length === 0 ? (
            <p>אין תשלומים ממתינים.</p>
          ) : (
            <div className="admin__tablewrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>זמן</th>
                    <th>אירוע</th>
                    <th>עיר</th>
                    <th>טלפון השף</th>
                    <th>סכום</th>
                    <th>פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.created_at)}</td>
                      <td>{eventHe(p.event_type)}</td>
                      <td>{p.city ?? "—"}</td>
                      <td dir="ltr">
                        <a href={`tel:${p.chef_phone}`}>{p.chef_phone}</a>
                      </td>
                      <td>{formatCurrency(p.amount)}</td>
                      <td>
                        <Button
                          type="button"
                          className="admin__btn"
                          disabled={approveBusy === p.id}
                          onClick={() => approve(p)}
                        >
                          {approveBusy === p.id ? "מאשר…" : "אישור תשלום"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pendingOrders.length > 0 && (
        <div className="admin__bit">
          <h2>חבילות קרדיטים בביט — ממתינות לאישור</h2>
          <p className="admin__note">
            קיבלתם תשלום בביט עבור בנק לידים? אשרו והקרדיטים יתווספו לשף אוטומטית.
          </p>
          <div className="admin__tablewrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>זמן</th>
                  <th>טלפון השף</th>
                  <th>שם</th>
                  <th>קרדיטים</th>
                  <th>סכום</th>
                  <th>פעולה</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{formatDate(o.created_at)}</td>
                    <td dir="ltr">{o.chef_phone}</td>
                    <td>{o.chef_name ?? "—"}</td>
                    <td>{o.credits}</td>
                    <td>{formatCurrency(o.amount)}</td>
                    <td>
                      <Button
                        type="button"
                        className="admin__btn"
                        disabled={approveBusy === o.id}
                        onClick={() => approveOrder(o)}
                      >
                        {approveBusy === o.id ? "מאשר…" : "אישור תשלום"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {leads && (
        <>
          <p className="admin__count">{leads.length} לידים</p>
          <div className="admin__tablewrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>נוצר</th>
                  <th>אירוע</th>
                  <th>תאריך</th>
                  <th>עיר</th>
                  <th>אורחים</th>
                  <th>תקציב</th>
                  <th>סטטוס</th>
                  <th>נמכר</th>
                  <th>לקוח</th>
                  <th>טלפון</th>
                  <th>מקור</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.lead_token}>
                    <td>{formatDate(l.created_at)}</td>
                    <td>{l.event_type ?? "—"}</td>
                    <td>{l.event_date ? formatDate(l.event_date) : "—"}</td>
                    <td>{l.city ?? "—"}</td>
                    <td>{l.guests ?? "—"}</td>
                    <td>{l.budget != null ? formatCurrency(l.budget) : "—"}</td>
                    <td>
                      {l.status === "sold_out" ? (
                        <Badge tone="danger">נמכר</Badge>
                      ) : (
                        <Badge tone="success">פעיל</Badge>
                      )}
                    </td>
                    <td>
                      {l.buyers_count}/{l.buyers_cap}
                    </td>
                    <td>{l.client_name}</td>
                    <td dir="ltr">
                      <a href={`tel:${l.client_phone}`}>{l.client_phone}</a>
                    </td>
                    <td className="admin__source">{l.source ?? "—"}</td>
                    <td className="admin__actions">
                      <div className="admin__actionrow">
                        <Button
                          type="button"
                          variant="ghost"
                          className="admin__btn"
                          onClick={() => copyLink(l.lead_token)}
                        >
                          העתק קישור
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="admin__btn"
                          disabled={busyKey === `${l.lead_token}:whatsapp`}
                          onClick={() => resend(l.lead_token, "whatsapp")}
                        >
                          שלח לוואטסאפ
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="admin__btn"
                          disabled={busyKey === `${l.lead_token}:telegram`}
                          onClick={() => resend(l.lead_token, "telegram")}
                        >
                          שלח לטלגרם
                        </Button>
                      </div>
                      {rowMsg[l.lead_token] && (
                        <span className="admin__rowmsg" dir="auto">
                          {rowMsg[l.lead_token]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {leads && <AdminChefs token={token} />}
    </div>
  );
}
