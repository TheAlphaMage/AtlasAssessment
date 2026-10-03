/** Animates a number towards a new value, unless the visitor prefers reduced motion. */
import { useEffect, useRef, useState } from "react";

const TWEEN_MS = 700;

/** True when the visitor asked their system to reduce motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns a number that glides from its previous value to `target` (from 0 on first render).
 * Used so figures move smoothly after a re-plan instead of jumping.
 */
export function useCountUp(target: number): number {
  const [current, setCurrent] = useState(0);
  const startValue = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCurrent(target);
      startValue.current = target;
      return;
    }

    const from = startValue.current;
    const startTime = performance.now();
    let frameId = 0;

    function step(now: number) {
      const progress = Math.min(1, (now - startTime) / TWEEN_MS);
      const eased = 1 - Math.pow(1 - progress, 3); // fast start, gentle finish
      setCurrent(from + (target - from) * eased);
      if (progress < 1) frameId = requestAnimationFrame(step);
    }

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      startValue.current = target;
    };
  }, [target]);

  return current;
}
