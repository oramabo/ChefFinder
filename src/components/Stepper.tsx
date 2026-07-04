import { IconCheck } from "./art.tsx";
import "./Stepper.css";

interface StepperProps {
  steps: string[];
  current: number; // zero-based
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="stepper" aria-label="שלבי הטופס">
      {steps.map((label, i) => (
        <li
          key={label}
          className={`stepper__step ${i === current ? "is-current" : ""} ${
            i < current ? "is-done" : ""
          }`}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="stepper__dot">
            {i < current ? <IconCheck width={12} height={12} strokeWidth={2.4} /> : i + 1}
          </span>
          <span className="stepper__label">{label}</span>
        </li>
      ))}
    </ol>
  );
}
