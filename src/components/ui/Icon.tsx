/**
 * Small inline SVG icon set. Used instead of text symbols so icons look the same on every system.
 * Every icon is a single stroked path drawn on a 24 x 24 grid.
 */

const ICON_PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  cross: "M6 6l12 12M18 6L6 18",
  alert: "M12 4l9 16H3L12 4z M12 10v4 M12 17v.01",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5 M12 7.5v.01",
  half: "M12 3a9 9 0 1 0 0 18V3z M12 3a9 9 0 0 1 0 18",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-up": "M12 19V5M6 11l6-6 6 6",
  "arrow-down": "M12 5v14M6 13l6 6 6-6",
  "chevron-down": "M6 9l6 6 6-6",
  reload: "M20 12a8 8 0 1 1-2.6-5.9 M20 4v5h-5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  trace: "M5 7h5a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4h1 M16 14l3 3-3 3",
  lock: "M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v9H5z",
  send: "M4 12l16-8-6 16-3-7-7-1z",
  print: "M7 9V4h10v5 M7 17H5v-7h14v7h-2 M7 14h10v6H7z",
  leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15 M5 19c3-4 6-7 10-9",
} as const;

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
