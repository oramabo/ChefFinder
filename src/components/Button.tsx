import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import "./Button.css";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

function classes(variant: Variant, size: Size, full?: boolean, extra = "") {
  return [
    "btn",
    `btn--${variant}`,
    size === "lg" ? "btn--lg" : "",
    full ? "btn--full" : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={classes(variant, size, full, className)} {...rest} />;
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  full,
  children,
}: BaseProps & { to: string; children: React.ReactNode }) {
  return (
    <Link className={classes(variant, size, full)} to={to}>
      {children}
    </Link>
  );
}
