import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import "./Button.css";

type Variant = "primary" | "ghost";

interface BaseProps {
  variant?: Variant;
  full?: boolean;
}

export function Button({
  variant = "primary",
  full,
  className = "",
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`btn btn--${variant} ${full ? "btn--full" : ""} ${className}`}
      {...rest}
    />
  );
}

export function LinkButton({
  to,
  variant = "primary",
  full,
  children,
}: BaseProps & { to: string; children: React.ReactNode }) {
  return (
    <Link className={`btn btn--${variant} ${full ? "btn--full" : ""}`} to={to}>
      {children}
    </Link>
  );
}
