import { useState, useEffect, useCallback } from "react";
import Seo from "../components/Seo.tsx";
import Badge from "../components/Badge.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput } from "../components/Field.tsx";
import { listRecentLeads, type AdminLead } from "../lib/api.ts";
import { formatDate, formatCurrency } from "../lib/format.ts";
import "./Admin.css";

const tokenKey = "admin_token";

export default function Admin() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (t: string) => {
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
    } catch {
      setError("שגיאת רשת.");
    } finally {
      setLoading(false);
    }
  }, []);

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
