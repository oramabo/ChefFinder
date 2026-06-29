import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo.tsx";
import { Button, LinkButton } from "../components/Button.tsx";
import { chefMe, chefLedger, chefPurchases, chefCheckout } from "../lib/chefApi.ts";
import type { ManualBit } from "../lib/api.ts";
import { mockComplete } from "../lib/api.ts";
import { getChefToken, clearChefToken } from "../lib/chefSession.ts";
import { CREDIT_PACKAGES, CREDIT_REASON } from "@shared/constants.ts";
import type { ChefPublic, CreditLedgerEntry, ChefLeadPurchase } from "@shared/types.ts";
import { formatCurrency, formatDate } from "../lib/format.ts";
import "./Chef.css";

const REASON_HE: Record<string, string> = {
  [CREDIT_REASON.package]: "רכישת חבילה",
  [CREDIT_REASON.admin_adjust]: "עדכון מנהל",
  [CREDIT_REASON.lead_unlock]: "פתיחת ליד",
  [CREDIT_REASON.refund]: "זיכוי",
};

export default function ChefDashboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [chef, setChef] = useState<ChefPublic | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [purchases, setPurchases] = useState<ChefLeadPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState("");
  const [bit, setBit] = useState<ManualBit | null>(null);
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    const [me, led, pur] = await Promise.all([chefMe(), chefLedger(), chefPurchases()]);
    if (me.status === 401) {
      clearChefToken();
      navigate("/chef/login");
      return;
    }
    if (me.body.chef) setChef(me.body.chef);
    if (led.body.ledger) setLedger(led.body.ledger);
    if (pur.body.purchases) setPurchases(pur.body.purchases);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (!getChefToken()) {
      navigate("/chef/login");
      return;
    }
    (async () => {
      // Returning from the (mock) credit checkout: finalize then clean the URL.
      const order = params.get("order");
      const mockPay = params.get("mock_pay");
      if (order && mockPay) {
        await mockComplete(order);
        setMessage("התשלום התקבל — הקרדיטים נוספו לחשבון ✓");
        const next = new URLSearchParams(params);
        next.delete("order");
        next.delete("mock_pay");
        next.delete("ref");
        setParams(next, { replace: true });
      }
      await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy(pkgId: string) {
    if (buying) return;
    setBuying(pkgId);
    setMessage("");
    setBit(null);
    try {
      const res = await chefCheckout(pkgId);
      if (res.body.ok && res.body.payment_url) {
        window.location.href = res.body.payment_url;
        return;
      }
      if (res.body.ok && res.body.manual_bit) {
        setBit(res.body.manual_bit);
        return;
      }
      setMessage("פתיחת התשלום נכשלה. נסו שוב.");
    } catch {
      setMessage("אירעה שגיאת רשת. נסו שוב.");
    } finally {
      setBuying("");
    }
  }

  function logout() {
    clearChefToken();
    navigate("/chef/login");
  }

  if (loading) {
    return (
      <div className="section container">
        <p>טוען…</p>
      </div>
    );
  }

  return (
    <div className="section container chefdash">
      <Seo title="אזור השפים — החשבון שלי | השף שלי" noindex />

      <div className="chefdash__head">
        <div>
          <p className="eyebrow">אזור השפים</p>
          <h1>שלום{chef?.name ? `, ${chef.name}` : ""}</h1>
        </div>
        <Button variant="ghost" type="button" onClick={logout}>
          התנתקות
        </Button>
      </div>

      {message && <p className="chefdash__flash">{message}</p>}

      <div className="chefdash__balance card card--raised">
        <div>
          <span className="chefdash__balance-label">היתרה שלכם</span>
          <span className="chefdash__balance-num">{chef?.credits ?? 0}</span>
          <span className="chefdash__balance-unit">קרדיטים · ליד = קרדיט אחד</span>
        </div>
        <LinkButton to="/chef/leads" variant="primary" size="lg">
          לעיון בלידים
        </LinkButton>
      </div>

      <section className="chefdash__section">
        <h2>קניית בנק לידים</h2>
        <p className="chefdash__sub">בחרו חבילה — כל קרדיט שווה פתיחת ליד אחד.</p>
        <div className="chefdash__packages">
          {CREDIT_PACKAGES.map((p) => (
            <div className="card card--raised card--hover chefdash__pkg" key={p.id}>
              <span className="chefdash__pkg-credits">{p.credits}</span>
              <span className="chefdash__pkg-unit">לידים</span>
              <span className="chefdash__pkg-price">{formatCurrency(p.price)}</span>
              <span className="chefdash__pkg-each">
                {formatCurrency(Math.round(p.price / p.credits))} לליד
              </span>
              <Button type="button" onClick={() => buy(p.id)} disabled={buying === p.id} full>
                {buying === p.id ? "רגע…" : "קנייה"}
              </Button>
            </div>
          ))}
        </div>

        {bit && (
          <div className="chefdash__bit card">
            <h3>תשלום בביט</h3>
            <p>
              שלחו <strong>{formatCurrency(bit.amount)}</strong> בביט אל המספר:
            </p>
            <p className="chefdash__bitphone" dir="ltr">
              {bit.phone}
            </p>
            {bit.link && (
              <a className="btn btn--primary" href={bit.link} target="_blank" rel="noopener noreferrer">
                פתחו את ביט
              </a>
            )}
            <p className="chefdash__bitref">
              אסמכתא: <code>{bit.reference}</code> — ציינו אותה בהערת התשלום. הקרדיטים
              יתווספו לאחר אישור המנהל.
            </p>
          </div>
        )}
      </section>

      <section className="chefdash__section">
        <h2>הלידים שפתחתי</h2>
        {purchases.length === 0 ? (
          <p className="chefdash__empty">עדיין לא פתחתם לידים. התחילו מ«לעיון בלידים».</p>
        ) : (
          <ul className="chefdash__leads">
            {purchases.map((p) => (
              <li className="card chefdash__lead" key={p.purchase_id}>
                <div className="chefdash__lead-main">
                  <strong>{p.contact.client_name}</strong>
                  <a className="accent" href={`tel:${p.contact.client_phone}`} dir="ltr">
                    {p.contact.client_phone}
                  </a>
                  {p.contact.client_email && (
                    <a className="chefdash__lead-email" href={`mailto:${p.contact.client_email}`}>
                      {p.contact.client_email}
                    </a>
                  )}
                </div>
                <div className="chefdash__lead-meta">
                  {p.city && <span>{p.city}</span>}
                  {p.event_date && <span>{formatDate(p.event_date)}</span>}
                  <span>{formatDate(p.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="chefdash__section">
        <h2>היסטוריית קרדיטים</h2>
        {ledger.length === 0 ? (
          <p className="chefdash__empty">אין עדיין תנועות.</p>
        ) : (
          <ul className="chefdash__ledger">
            {ledger.map((e) => (
              <li key={e.id} className="chefdash__ledger-row">
                <span className="chefdash__ledger-reason">{REASON_HE[e.reason] ?? e.reason}</span>
                <span className={`chefdash__ledger-delta ${e.delta < 0 ? "is-neg" : "is-pos"}`}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
                <span className="chefdash__ledger-bal">יתרה: {e.balance_after}</span>
                <span className="chefdash__ledger-date">{formatDate(e.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="chefdash__foot">
        <Link className="link" to="/chef/leads">
          מעבר לעיון בלידים ←
        </Link>
      </p>
    </div>
  );
}
