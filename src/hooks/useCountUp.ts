/** Animates a number from 0 to its final value, unless the visitor prefers reduced motion. */
import { useEffect, useState } from "react";

const COUNT_UP_MS = 900;

/** True when the visitor asked their system to reduce motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns a number that moves from 0 to `target` over a short time.
 * It jumps straight to the target when motion is reduced.
 */
export function useCountUp(target: number): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCurrent(target);
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    function step(now: number) {
      const progress = Math.min(1, (now - startTime) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - progress, 3); // fast start, gentle finish
      setCurrent(target * eased);
      if (progress < 1) frameId = requestAnimationFrame(step);
    }

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return current;
}
