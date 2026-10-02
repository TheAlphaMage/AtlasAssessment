/**
 * Shows a number that counts up from zero when it first appears.
 * Screen readers get the final value straight away; reduced-motion users see no animation.
 */
import { useCountUp } from "@/hooks/useCountUp";

interface CountUpProps {
  value: number;
  /** Turns the animated number into text, e.g. (n) => `${n} t`. */
  format: (value: number) => string;
}

export function CountUp({ value, format }: CountUpProps) {
  const animated = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{format(animated)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
