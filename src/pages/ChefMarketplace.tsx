import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../components/Seo.tsx";
import { Button } from "../components/Button.tsx";
import { Field, TextInput, OptionGroup } from "../components/Field.tsx";
import { chefMarketplace, chefOpenLead } from "../lib/chefApi.ts";
import { getChefToken, clearChefToken } from "../lib/chefSession.ts";
import { EVENT_TYPES, CUISINES } from "@shared/constants.ts";
import type { PublicLead, LeadContact } from "@shared/types.ts";
import { formatCurrency, formatDate } from "../lib/format.ts";
import "./Chef.css";

const eventHe = (slug: string | null) => EVENT_TYPES.find((e) => e.slug === slug)?.he ?? slug ?? "אירוע";
const cuisineHe = (slug: string | null) => CUISINES.find((c) => c.slug === slug)?.he ?? slug ?? "";

function openMessage(reason?: string): string {
  switch (reason) {
    case "insufficient_credits":
      return "אין מספיק קרדיטים — קנו עוד באזור החשבון.";
    case "already_purchased":
      return "כבר פתחתם את הליד הזה.";
    case "sold_out":
      return "הליד נמכר.";
    case "inactive":
      return "החשבון אינו פעיל.";
    case "not_found":
      return "הליד לא נמצא.";
    default:
      return "אירעה שגיאה. נסו שוב.";
  }
}

export default function ChefMarketplace() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<PublicLead[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState<Record<string, LeadContact>>({});
  const [working, setWorking] = useState("");
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});
  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");

  const load = useCallback(
    async (filters: { city?: string; cuisine?: string } = {}) => {
      const res = await chefMarketplace(filters);
      if (res.status === 401) {
        clearChefToken();
        navigate("/chef/login");
        return;
      }
      if (res.status === 403) {
        setRowMsg({ _page: "החשבון אינו פעיל. פנו אלינו." });
        setLoading(false);
        return;
      }
      setLeads(res.body.leads ?? []);
      if (typeof res.body.credits === "number") setCredits(res.body.credits);
      setLoading(false);
    },
    [navigate],
  );

  useEffect(() => {
    if (!getChefToken()) {
      navigate("/chef/login");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function open(token: string) {
    if (working) return;
    setWorking(token);
    setRowMsg((m) => ({ ...m, [token]: "" }));
    try {
      const res = await chefOpenLead(token);
      if (res.body.ok && res.body.contact) {
        setOpened((o) => ({ ...o, [token]: res.body.contact as LeadContact }));
        if (typeof res.body.credits === "number") setCredits(res.body.credits);
        return;
      }
      setRowMsg((m) => ({ ...m, [token]: openMessage(res.body.reason) }));
    } catch {
      setRowMsg((m) => ({ ...m, [token]: "אירעה שגיאת רשת. נסו שוב." }));
    } finally {
      setWorking("");
    }
  }

  return (
    <div className="section container chefmarket">
      <Seo title="אזור השפים — לידים | השף שלי" noindex />

      <div className="chefmarket__head">
        <div>
          <p className="eyebrow">אזור השפים</p>
          <h1>לידים פתוחים</h1>
        </div>
        <div className="chefmarket__balance">
          <span className="chefmarket__balance-num">{credits}</span>
          <span>קרדיטים</span>
          <Link className="link" to="/chef">
            לחשבון שלי
          </Link>
        </div>
      </div>

      <div className="chefmarket__filters">
        <Field label="עיר" htmlFor="mk_city">
          <TextInput
            id="mk_city"
            type="text"
            placeholder="כל הערים"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
        <div className="chefmarket__cuisine">
          <span className="field__label">מטבח</span>
          <OptionGroup
            name="מטבח"
            value={cuisine}
            onChange={(v) => setCuisine(v === cuisine ? "" : v)}
            options={CUISINES.map((c) => ({ value: c.slug, label: c.he }))}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => load({ city: city.trim() || undefined, cuisine: cuisine || undefined })}
        >
          סינון
        </Button>
      </div>

      {rowMsg._page && <p className="chefmarket__pagemsg">{rowMsg._page}</p>}

      {loading ? (
        <p>טוען…</p>
      ) : leads.length === 0 ? (
        <p className="chefdash__empty">אין כרגע לידים פתוחים שמתאימים לסינון.</p>
      ) : (
        <ul className="chefmarket__grid">
          {leads.map((l) => {
            const contact = opened[l.lead_token];
            return (
              <li className="card card--raised chefmarket__card" key={l.lead_token}>
                <div className="chefmarket__card-head">
                  <h3>{eventHe(l.event_type)}</h3>
                  {l.kosher && <span className="badge badge--gold">כשר</span>}
                </div>
                <dl className="chefmarket__facts">
                  {l.city && (
                    <div>
                      <dt>עיר</dt>
                      <dd>{l.city}</dd>
                    </div>
                  )}
                  {l.event_date && (
                    <div>
                      <dt>תאריך</dt>
                      <dd>{formatDate(l.event_date)}</dd>
                    </div>
                  )}
                  {l.guests != null && (
                    <div>
                      <dt>אורחים</dt>
                      <dd>{l.guests}</dd>
                    </div>
                  )}
                  {l.budget != null && (
                    <div>
                      <dt>תקציב</dt>
                      <dd>{formatCurrency(l.budget)}</dd>
                    </div>
                  )}
                  {l.cuisine && (
                    <div>
                      <dt>מטבח</dt>
                      <dd>{cuisineHe(l.cuisine)}</dd>
                    </div>
                  )}
                </dl>

                {contact ? (
                  <div className="chefmarket__reveal">
                    <span className="badge badge--success">נפתח</span>
                    <strong>{contact.client_name}</strong>
                    <a className="accent" href={`tel:${contact.client_phone}`} dir="ltr">
                      {contact.client_phone}
                    </a>
                    {contact.client_email && (
                      <a href={`mailto:${contact.client_email}`}>{contact.client_email}</a>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => open(l.lead_token)}
                      disabled={working === l.lead_token}
                      full
                    >
                      {working === l.lead_token ? "פותח…" : "פתחו עם קרדיט אחד"}
                    </Button>
                    {rowMsg[l.lead_token] && (
                      <p className="chefmarket__rowmsg">{rowMsg[l.lead_token]}</p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
