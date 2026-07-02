import "./Wordmark.css";

// The ezfind brand wordmark: "ez" + accented "find". On a service mini-site an
// optional suffix (the service name, e.g. "שף פרטי") is stacked on a second line
// beneath it — "ezfind" over the service name. Without a suffix it's just the
// single-line ezfind wordmark (used on the umbrella and generic chrome).
export default function Wordmark({
  suffix,
  className,
}: {
  suffix?: string;
  className?: string;
}) {
  const stacked = suffix ? "ez__wordmark--stacked" : "";
  return (
    <span className={`ez__wordmark ${stacked} ${className ?? ""}`}>
      <span className="ez__wordmark-main">
        ez<span className="ez__wordmark-accent">find</span>
      </span>
      {suffix ? <span className="ez__wordmark-suffix">{suffix}</span> : null}
    </span>
  );
}
