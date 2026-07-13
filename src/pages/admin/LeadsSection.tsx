import { useState, useEffect, useCallback } from "react";
import Badge from "../../components/Badge.tsx";
import { Button } from "../../components/Button.tsx";
import {
  listRecentLeads,
  resendNotify,
  confirmPurchase,
  listPending,
  type AdminLead,
  type PendingPurchase,
} from "../../lib/api.ts";
import { EVENT_TYPES } from "@shared/constants.ts";
import { formatDate, formatCurrency } from "../../lib/format.ts";

const eventHe = (slug: string | null) =>
  EVENT_TYPES.find((e) => e.slug === slug)?.he ?? slug ?? "—";

function leadLink(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/lead/${token}`;
}

interface Props {
  token: string;
  onUnauthorized: () => void;
}

export default function LeadsSection({ token, onUnauthorized }: Props) {
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPurchase[] | null>(null);
  const [pendingMsg, setPendingMsg] = useState("");
  const [approveBusy, setApproveBusy] = useState<string | null>(null);
  const [recoveryUrl, setRecoveryUrl] = useState("");

  const setMsg = (leadToken: string, text: string) =>
    setRowMsg((m) => ({ ...m, [leadToken]: text }));

  const resend = useCallback(
    async (leadToken: string) => {
      setBusyKey(leadToken);
      setMsg(leadToken, "שולח לטלגרם…");
      try {
        const { status, body } = await resendNotify(leadToken, token);
        if (status === 401) return setMsg(leadToken, "אסימון שגוי או חסר.");
        if (!body.ok) return setMsg(leadToken, body.error || "שליחה נכשלה.");
        setMsg(leadToken, body.notify?.telegram === "sent" ? "טלגרם: נשלח" : "טלגרם: נכשל");
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
      setMsg(leadToken, "הקישור הועתק");
    } catch {
      setMsg(leadToken, link);
    }
  }, []);

  const loadPending = useCallback(async (t: string) => {
    try {
      const { status, body } = await listPending(t);
      if (status === 401) return setPendingMsg("אסימון שגוי או חסר.");
      if (!body.ok) return setPendingMsg(body.error || "שגיאה בטעינת התשלומים.");
      setPending(body.pending ?? []);
      setPendingMsg("");
    } catch {
      setPendingMsg("שגיאת רשת.");
    }
  }, []);

  const approve = useCallback(
    async (p: PendingPurchase) => {
      setApproveBusy(p.id);
      setPendingMsg("");
      setRecoveryUrl("");
      try {
        const { status, body } = await confirmPurchase(p.id, token);
        if (status === 401) return setPendingMsg("אסימון שגוי או חסר.");
        if (!body.ok) {
          // Payment landed after the reservation expired and the lead has since
          // sold to capacity — the chef must be refunded.
          if (body.reason === "conflict_sold_out") {
            return setPendingMsg(
              `שימו לב: הליד כבר נמכר עד התקרה — יש להחזיר לשף ${p.chef_phone} את הכסף (₪${p.amount}).`,
            );
          }
          return setPendingMsg(body.error || "האישור נכשל.");
        }
        setPending((cur) => (cur ?? []).filter((x) => x.id !== p.id));
        setPendingMsg(`אושר תשלום של ${p.chef_phone} — הפרטים נחשפו לשף.`);
        if (body.recovery_url) setRecoveryUrl(body.recovery_url);
      } catch {
        setPendingMsg("שגיאת רשת.");
      } finally {
        setApproveBusy(null);
      }
    },
    [token],
  );

  const copyRecovery = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recoveryUrl);
      setPendingMsg("קישור השחזור הועתק — שלחו אותו לשף ששילם.");
    } catch {
      // Leave the link on screen for manual copying.
    }
  }, [recoveryUrl]);

  const load = useCallback(
    async (t: string) => {
      setLoading(true);
      setError("");
      try {
        const { status, body } = await listRecentLeads(t);
        if (status === 401) {
          setError("אסימון שגוי או חסר.");
          setLeads(null);
          onUnauthorized();
          return;
        }
        if (!body.ok || !body.leads) {
          setError(body.error || "שגיאה בטעינת הלידים.");
          return;
        }
        setLeads(body.leads);
        void loadPending(t);
      } catch {
        setError("שגיאת רשת.");
      } finally {
        setLoading(false);
      }
    },
    [loadPending, onUnauthorized],
  );

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  return (
    <div className="admin">
      <div className="admin__head">
        <h1>לידים אחרונים</h1>
        <Button type="button" variant="ghost" onClick={() => load(token)} disabled={loading}>
          {loading ? "טוען…" : "רענון"}
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
          {recoveryUrl && (
            <p className="admin__bitmsg">
              קישור גישה לשף (שלחו לו בביט/וואטסאפ — עובד מכל מכשיר):{" "}
              <code dir="ltr">{recoveryUrl}</code>{" "}
              <Button type="button" variant="ghost" className="admin__btn" onClick={copyRecovery}>
                העתק
              </Button>
            </p>
          )}
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
                          disabled={busyKey === l.lead_token}
                          onClick={() => resend(l.lead_token)}
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
    </div>
  );
}
