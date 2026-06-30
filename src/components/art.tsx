import type { SVGProps } from "react";

// Hand-drawn line icons + the hero illustration. Thin, consistent stroke, warm
// palette — a small bespoke set so the marks feel of-a-piece with the brand
// rather than a generic icon font.
type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconForm(props: IconProps) {
  return (
    <svg {...stroke} aria-hidden="true" {...props}>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9.5 3.5h5a1 1 0 0 1 1 1V6H8.5V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9 11h6M9 14.5h4" />
    </svg>
  );
}

export function IconChef(props: IconProps) {
  return (
    <svg {...stroke} aria-hidden="true" {...props}>
      <path d="M8 13.4a3.2 3.2 0 0 1-1-6.2A3.3 3.3 0 0 1 12 4.9a3.3 3.3 0 0 1 5 2.3 3.2 3.2 0 0 1-1 6.2Z" />
      <path d="M8 13.4V18a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 16 18v-4.6" />
      <path d="M8.4 16.6h7.2" />
    </svg>
  );
}

export function IconCloche(props: IconProps) {
  return (
    <svg {...stroke} aria-hidden="true" {...props}>
      <path d="M3.5 18.5h17" />
      <path d="M5 18.5a7 7 0 0 1 14 0" />
      <path d="M12 7.6V5.6" />
      <circle cx="12" cy="5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSprig(props: IconProps) {
  return (
    <svg {...stroke} aria-hidden="true" {...props}>
      <path d="M12 20V6" />
      <path d="M12 9.5c1.7-.4 3-1.5 3.6-3.3M12 9.5c-1.7-.4-3-1.5-3.6-3.3" />
      <path d="M12 13.5c1.5-.4 2.7-1.4 3.2-3M12 13.5c-1.5-.4-2.7-1.4-3.2-3" />
    </svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <svg {...stroke} aria-hidden="true" {...props}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9.3L5.3 19v-3.5H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg {...stroke} aria-hidden="true" {...props}>
      <path d="M20.5 3.5 10 14" />
      <path d="M20.5 3.5 14 20.5l-3.8-6.7L3.5 10Z" />
    </svg>
  );
}

// Hero illustration: a plated place setting, drawn by hand. The single
// "served bite" — an olive sprig with pomegranate berries — sits at the centre.
export function HeroPlate(props: IconProps) {
  return (
    <svg
      viewBox="0 0 360 360"
      fill="none"
      role="img"
      aria-label="צלחת ערוכה עם זוג סכו״ם וזר עשבי תיבול"
      {...props}
    >
      {/* plate */}
      <circle cx="180" cy="186" r="120" fill="#fcfaf3" stroke="#2a211b" strokeWidth="2.4" />
      <circle cx="180" cy="186" r="96" stroke="#2a211b" strokeWidth="1.3" opacity="0.55" />

      {/* fork (start side) */}
      <g stroke="#2a211b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 92v24M40 92v24M50 92v24" />
        <path d="M30 116h20" />
        <path d="M40 116v160" />
      </g>

      {/* knife (end side) */}
      <g stroke="#2a211b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M322 92v184" />
        <path d="M322 98c-10 7-10 26 0 34" />
      </g>

      {/* served bite: olive sprig, pomegranate berries, a saffron seed */}
      <g strokeLinecap="round">
        <path d="M180 224V168" stroke="#6d3f9c" strokeWidth="2.6" />
        <path d="M180 188c8-2 14-8 17-16M180 202c-8-2-14-8-17-16" stroke="#6d3f9c" strokeWidth="2.6" />
        <circle cx="164" cy="172" r="6.5" fill="#9b2d8a" />
        <circle cx="196" cy="172" r="6.5" fill="#9b2d8a" />
        <circle cx="180" cy="154" r="6.5" fill="#9b2d8a" />
        <circle cx="180" cy="214" r="3.6" fill="#d99a2b" />
      </g>
    </svg>
  );
}

// A thin editorial divider with a small sprig at its centre.
export function Divider({ className }: { className?: string }) {
  return (
    <div className={`rule ${className ?? ""}`} aria-hidden="true">
      <span className="rule__line" />
      <IconSprig className="rule__mark" width={18} height={18} />
      <span className="rule__line" />
    </div>
  );
}
