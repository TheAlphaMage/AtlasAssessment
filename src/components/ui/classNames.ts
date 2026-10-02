/** Joins CSS class names and skips empty values: classNames("a", isOn && "b") -> "a b" or "a". */
export function classNames(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
