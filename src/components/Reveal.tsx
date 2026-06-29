import { createElement, useEffect, useRef } from "react";
import type { ReactNode } from "react";

// Scroll-reveal wrapper. Children fade + rise into view the first time they
// enter the viewport. SSG-safe: the prerendered HTML has no `is-visible` class
// and the document has no `data-reveal-ready`, so the CSS hide rule never
// applies without JS — content is always visible. Once hydrated, the first
// <Reveal> marks the document ready (activating the hide rule) and an
// IntersectionObserver reveals each element as it scrolls in. Reduced-motion
// and no-IO environments simply show everything immediately.
let readyMarked = false;

type RevealProps = {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  /** Stagger delay in ms, applied as a transition-delay. */
  delay?: number;
};

export default function Reveal({ children, as = "div", className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!readyMarked) {
      readyMarked = true;
      document.documentElement.setAttribute("data-reveal-ready", "");
    }

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      className: className ? `reveal ${className}` : "reveal",
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  );
}
