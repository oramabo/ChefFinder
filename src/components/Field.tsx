import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import "./Field.css";

interface FieldWrapProps {
  label: string;
  htmlFor?: string;
  // Visually hide the label (e.g. when a heading above already asks the
  // question) while keeping it for screen readers.
  labelHidden?: boolean;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, labelHidden, error, children }: FieldWrapProps) {
  const labelClass = `field__label${labelHidden ? " visually-hidden" : ""}`;
  // A group of controls (chips) must not sit inside a <label>: clicking the
  // label text would forward the click to the first control. Groups get a
  // fieldset with a legend instead; single inputs keep the label wrapper.
  if (!htmlFor) {
    return (
      <fieldset className="field field--group">
        <legend className={labelClass}>{label}</legend>
        {children}
        {error && <span className="field__error">{error}</span>}
      </fieldset>
    );
  }
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className={labelClass}>{label}</span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field__input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="field__input" {...props} />;
}

interface OptionGroupProps {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

// Single-choice chips as plain toggle buttons (aria-pressed) — honest
// semantics without ARIA-radio keyboard expectations (roving tabindex/arrow
// keys), and safe to pair with tap-to-advance since only explicit activation
// fires onChange.
export function OptionGroup({ name, value, options, onChange }: OptionGroupProps) {
  return (
    <div className="optiongroup" role="group" aria-label={name}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          aria-pressed={value === o.value}
          className={`optiongroup__item ${value === o.value ? "is-selected" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
