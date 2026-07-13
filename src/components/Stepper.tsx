import "./Stepper.css";

interface StepperProps {
  steps: string[];
  current: number; // zero-based
}

// Slim segmented progress: a status line ("שלב 3 מתוך 7 · מיקום") over a row of
// flat segments — done segments violet, the current one saffron. The <ol> keeps
// the named sequence for screen readers (per-step labels are visually hidden);
// role="list" restores list semantics that `list-style: none` strips in Safari.
export default function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="stepper">
      <p className="stepper__status">
        שלב {current + 1} מתוך {steps.length} · <b>{steps[current]}</b>
      </p>
      <ol className="stepper__track" role="list" aria-label="שלבי הטופס">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`stepper__seg ${i === current ? "is-current" : ""} ${
              i < current ? "is-done" : ""
            }`}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="visually-hidden">
              {label}
              {i < current ? " (הושלם)" : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
