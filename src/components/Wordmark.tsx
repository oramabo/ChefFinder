import "./Wordmark.css";

// The ezfind brand wordmark: "ez" + accented "find", plus an optional Hebrew
// suffix (e.g. "שפים" → "ezfind שפים"). This is the one brand mark used on every
// page — landing bars, the site header and the footer — so branding stays
// consistent everywhere.
export default function Wordmark({
  suffix,
  className,
}: {
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={`ez__wordmark ${className ?? ""}`}>
      ez<span className="ez__wordmark-accent">find</span>
      {suffix ? <span className="ez__wordmark-suffix"> {suffix}</span> : null}
    </span>
  );
}
