import { useState, useEffect, useCallback } from "react";
import Badge from "../components/Badge.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput } from "../components/Field.tsx";
import {
  adminListChefs,
  adminCreateChef,
  adminAdjustCredits,
  adminSetChefPassword,
  adminSetChefStatus,
} from "../lib/chefApi.ts";
import type { ChefPublic } from "@shared/types.ts";
import { formatDate } from "../lib/format.ts";

// Operator management of chef accounts + credit balances. Rendered inside the
// admin page once a valid token is loaded; reuses the same admin token.
export default function AdminChefs({ token }: { token: string }) {
  const [chefs, setChefs] = useState<ChefPublic[]>([]);
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<Record<string, string>>({});

  // Create-account form.
  const [nPhone, setNPhone] = useState("");
  const [nName, setNName] = useState("");
  const [nEmail, setNEmail] = useState("");
  const [nCredits, setNCredits] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  const load = useCallback(
    async (q = "") => {
      const { status, body } = await adminListChefs(token, q);
      if (status === 401) return setMsg("אסימון שגוי או חסר.");
      if (!body.ok) return setMsg(body.error || "שגיאה בטעינת החשבונות.");
      setChefs(body.chefs ?? []);
      setMsg("");
    },
    [token],
  );

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  async function create() {
    if (busy) return;
    setBusy("create");
    setCreateMsg("");
    try {
      const { body } = await adminCreateChef(token, {
        phone: nPhone.trim(),
        name: nName.trim() || undefined,
        email: nEmail.trim() || undefined,
        credits: nCredits ? Number(nCredits) : undefined,
      });
      if (!body.ok) {
        setCreateMsg(body.reason === "phone_taken" ? "הטלפון כבר רשום." : "יצירת החשבון נכשלה.");
        return;
      }
      setCreateMsg(
        body.temp_password
          ? `נוצר חשבון. סיסמה זמנית: ${body.temp_password} (העבירו לשף)`
          : "נוצר חשבון ✓",
      );
      setNPhone("");
      setNName("");
      setNEmail("");
      setNCredits("");
      void load(query);
    } catch {
      setCreateMsg("שגיאת רשת.");
    } finally {
      setBusy(null);
    }
  }

  async function adjust(c: ChefPublic) {
    const raw = deltas[c.id];
    const delta = Number(raw);
    if (!raw || !Number.isFinite(delta) || delta === 0) return;
    setBusy(`adj_${c.id}`);
    try {
      const { body } = await adminAdjustCredits(token, c.id, delta);
      if (!body.ok) {
        setMsg(body.reason === "insufficient_balance" ? "אין מספיק יתרה לזיכוי." : "העדכון נכשל.");
        return;
      }
      setDeltas((d) => ({ ...d, [c.id]: "" }));
      setChefs((cur) =>
        cur.map((x) => (x.id === c.id ? { ...x, credits: body.balance_after ?? x.credits } : x)),
      );
      setMsg(`עודכן ${c.phone}: יתרה ${body.balance_after}`);
    } catch {
      setMsg("שגיאת רשת.");
    } finally {
      setBusy(null);
    }
  }

  async function resetPassword(c: ChefPublic) {
    const pw = window.prompt(`סיסמה חדשה ל-${c.phone} (6 תווים לפחות):`);
    if (!pw) return;
    setBusy(`pw_${c.id}`);
    try {
      const { body } = await adminSetChefPassword(token, c.id, pw);
      setMsg(body.ok ? `הסיסמה אופסה ל-${c.phone} ✓` : "איפוס הסיסמה נכשל.");
    } catch {
      setMsg("שגיאת רשת.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleStatus(c: ChefPublic) {
    const next = c.status === "active" ? "disabled" : "active";
    setBusy(`st_${c.id}`);
    try {
      const { body } = await adminSetChefStatus(token, c.id, next);
      if (!body.ok) {
        setMsg("עדכון הסטטוס נכשל.");
        return;
      }
      setChefs((cur) => cur.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    } catch {
      setMsg("שגיאת רשת.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin__bit">
      <h2>חשבונות שפים (בנק לידים)</h2>
      <p className="admin__note">צרו חשבונות, עדכנו יתרת קרדיטים, אפסו סיסמאות והפעילו/השביתו שפים.</p>

      <div className="admin__chefcreate">
        <Field label="טלפון" htmlFor="nc_phone">
          <TextInput id="nc_phone" type="tel" value={nPhone} onChange={(e) => setNPhone(e.target.value)} placeholder="050-1234567" />
        </Field>
        <Field label="שם" htmlFor="nc_name">
          <TextInput id="nc_name" type="text" value={nName} onChange={(e) => setNName(e.target.value)} />
        </Field>
        <Field label="אימייל" htmlFor="nc_email">
          <TextInput id="nc_email" type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} />
        </Field>
        <Field label="קרדיטים" htmlFor="nc_credits">
          <TextInput id="nc_credits" type="number" inputMode="numeric" value={nCredits} onChange={(e) => setNCredits(e.target.value)} />
        </Field>
        <Button type="button" onClick={create} disabled={busy === "create"}>
          {busy === "create" ? "יוצר…" : "צור חשבון"}
        </Button>
      </div>
      {createMsg && <p className="admin__bitmsg" dir="auto">{createMsg}</p>}

      <div className="admin__bar" style={{ marginBlockStart: "var(--space-5)" }}>
        <Field label="חיפוש שף" htmlFor="chef_query">
          <TextInput
            id="chef_query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="טלפון / שם / אימייל"
          />
        </Field>
        <Button type="button" variant="ghost" onClick={() => load(query)}>
          חיפוש
        </Button>
      </div>

      {msg && <p className="admin__bitmsg" dir="auto">{msg}</p>}

      {chefs.length === 0 ? (
        <p>אין חשבונות להצגה.</p>
      ) : (
        <div className="admin__tablewrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>נוצר</th>
                <th>טלפון</th>
                <th>שם</th>
                <th>קרדיטים</th>
                <th>סטטוס</th>
                <th>עדכון יתרה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {chefs.map((c) => (
                <tr key={c.id}>
                  <td>{formatDate(c.created_at)}</td>
                  <td dir="ltr">{c.phone}</td>
                  <td>{c.name ?? "—"}</td>
                  <td>{c.credits}</td>
                  <td>
                    {c.status === "active" ? (
                      <Badge tone="success">פעיל</Badge>
                    ) : (
                      <Badge tone="danger">מושבת</Badge>
                    )}
                  </td>
                  <td>
                    <div className="admin__adjust">
                      <input
                        className="field__input admin__adjustinput"
                        type="number"
                        placeholder="±"
                        value={deltas[c.id] ?? ""}
                        onChange={(e) => setDeltas((d) => ({ ...d, [c.id]: e.target.value }))}
                      />
                      <Button
                        type="button"
                        className="admin__btn"
                        disabled={busy === `adj_${c.id}`}
                        onClick={() => adjust(c)}
                      >
                        עדכן
                      </Button>
                    </div>
                  </td>
                  <td className="admin__actions">
                    <div className="admin__actionrow">
                      <Button
                        type="button"
                        variant="ghost"
                        className="admin__btn"
                        disabled={busy === `pw_${c.id}`}
                        onClick={() => resetPassword(c)}
                      >
                        איפוס סיסמה
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="admin__btn"
                        disabled={busy === `st_${c.id}`}
                        onClick={() => toggleStatus(c)}
                      >
                        {c.status === "active" ? "השבתה" : "הפעלה"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
