import type { CSSProperties } from "react";

/** Lets a component pass numbers to its CSS file as custom properties: style={cssVariables({ "--width": 40 })}. */
export function cssVariables(variables: Record<`--${string}`, string | number>): CSSProperties {
  return variables as CSSProperties;
}
