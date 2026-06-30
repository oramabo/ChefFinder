import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/Button.tsx";
import { Select } from "../../components/Field.tsx";
import {
  listJoinApplications,
  setJoinApplicationStatus,
  type JoinApplication,
} from "../../lib/api.ts";
import { JOIN_CATEGORIES, JOIN_STATUS, type JoinStatus } from "@shared/constants.ts";
import { formatDate } from "../../lib/format.ts";

const categoryHe = (slug: string) =>
  JOIN_CATEGORIES.find((c) => c.slug === slug)?.he ?? slug;

const STATUS_HE: Record<JoinStatus, string> = {
  [JOIN_STATUS.new]: "חדש",
  [JOIN_STATUS.contacted]: "יצרנו קשר",
  [JOIN_STATUS.approved]: "אושר",
  [JOIN_STATUS.rejected]: "נדחה",
};

interface Props {
  token: string;
  onUnauthorized: () => void;
}

export default function ApplicantsSection({ token, onUnauthorized }: Props) {
  const [apps, setApps] = useState<JoinApplication[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (t: string) => {
      setLoading(true);
      setError("");
      try {
        const { status, body } = await listJoinApplications(t);
        if (status === 401) {
          setError("אסימון שגוי או חסר.");
          setApps(null);
          onUnauthorized();
          return;
        }
        if (!body.ok || !body.applications) {
          setError(body.error || "שגיאה בטעינת המצטרפים.");
          return;
        }
        setApps(body.applications);
      } catch {
        setError("שגיאת רשת.");
      } finally {
        setLoading(false);
      }
    },
    [onUnauthorized],
  );

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  const changeStatus = useCallback(
    async (id: string, status: JoinStatus) => {
      setBusyId(id);
      // Optimistic update; revert on failure.
      const prev = apps;
      setApps((cur) => cur?.map((a) => (a.id === id ? { ...a, status } : a)) ?? cur);
      try {
        const { status: code, body } = await setJoinApplicationStatus(id, status, token);
        if (code === 401) {
          onUnauthorized();
          throw new Error("unauthorized");
        }
        if (!body.ok) throw new Error(body.error || "update failed");
      } catch {
        setApps(prev ?? null);
        setError("עדכון הסטטוס נכשל.");
      } finally {
        setBusyId(null);
      }
    },
    [apps, token, onUnauthorized],
  );

  return (
    <div className="admin">
      <div className="admin__head">
        <h1>מצטרפים לרשת</h1>
        <Button type="button" variant="ghost" onClick={() => load(token)} disabled={loading}>
          {loading ? "טוען…" : "רענון"}
        </Button>
      </div>
      <p className="admin__note">בעלי מקצוע שמילאו את טופס ההצטרפות ב-ezfind.app.</p>

      {error && <p className="admin__error">{error}</p>}

      {apps && (
        <>
          <p className="admin__count">{apps.length} מצטרפים</p>
          {apps.length === 0 ? (
            <p>אין בקשות הצטרפות עדיין.</p>
          ) : (
            <div className="admin__tablewrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>נוצר</th>
                    <th>שם</th>
                    <th>עסק</th>
                    <th>תחום</th>
                    <th>עיר</th>
                    <th>טלפון</th>
                    <th>אימייל</th>
                    <th>הודעה</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td>{formatDate(a.created_at)}</td>
                      <td>{a.full_name}</td>
                      <td>{a.business_name ?? "—"}</td>
                      <td>{categoryHe(a.category)}</td>
                      <td>{a.city}</td>
                      <td dir="ltr">
                        <a href={`tel:${a.phone}`}>{a.phone}</a>
                      </td>
                      <td dir="ltr">
                        {a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : "—"}
                      </td>
                      <td className="admin__source">{a.message ?? "—"}</td>
                      <td>
                        <Select
                          aria-label="סטטוס"
                          value={a.status}
                          disabled={busyId === a.id}
                          onChange={(e) => changeStatus(a.id, e.target.value as JoinStatus)}
                        >
                          {Object.values(JOIN_STATUS).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_HE[s]}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
