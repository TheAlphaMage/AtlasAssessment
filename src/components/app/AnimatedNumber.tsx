"use client";

/** A number that glides to its new value. Screen readers get the final value straight away. */
import { useCountUp } from "@/hooks/useCountUp";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
}

export function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const shown = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
