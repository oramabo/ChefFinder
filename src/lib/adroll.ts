import { getConsent } from "./consent.ts";

// AdRoll retargeting pixel. Gated exactly like PostHog (see analytics.ts): it is
// a no-op without env ids (local/CI) and only runs after the visitor grants
// cookie consent — it's a marketing pixel, so it must not fire under "denied".
// Idempotent + self-guarding, so it's safe to call on every mount and on accept.
let initialized = false;

export function initAdRoll(): void {
  if (initialized || typeof window === "undefined") return;
  if (getConsent() !== "granted") return;
  // IDs are public (they ship in client JS), so default to the ezfind pixel.
  // This keeps the pixel working even where VITE_ADROLL_* isn't set at build
  // time (e.g. the Cloudflare CI build); an env var still overrides when present.
  const advId =
    (import.meta.env.VITE_ADROLL_ADV_ID as string | undefined) || "SYD2UYQJPBF47NS2FBZFRT";
  const pixelId =
    (import.meta.env.VITE_ADROLL_PIXEL_ID as string | undefined) || "NOON7SZLKVBIXJLXKAGZYS";
  if (!advId || !pixelId) return;

  // AdRoll's official install snippet, adapted to run from a module: set the
  // ids, stub the command queue, then async-load roundtrip.js which drains it.
  // The global names (adroll_pix_id, adroll_tag_source, the method list) match
  // AdRoll's current snippet verbatim — roundtrip.js reads them by exact name.
  const w = window as unknown as Record<string, any>;
  w.adroll_adv_id = advId;
  w.adroll_pix_id = pixelId;
  w.adroll_version = "2.0";
  w.adroll_tag_source = w.adroll_tag_source || "manual";
  w.__adroll_loaded = true;

  const adroll = (w.adroll = w.adroll || []);
  adroll.f = ["setProperties", "identify", "track", "identify_email", "get_cookie"];
  for (let i = 0; i < adroll.f.length; i++) {
    const name = adroll.f[i];
    adroll[name] =
      adroll[name] ||
      (function (n: string) {
        return function () {
          adroll.push([n, arguments]);
        };
      })(name);
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://s.adroll.com/j/${advId}/roundtrip.js`;
  const first = document.getElementsByTagName("script")[0];
  if (first && first.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);

  adroll.track("pageView");
  initialized = true;
}
