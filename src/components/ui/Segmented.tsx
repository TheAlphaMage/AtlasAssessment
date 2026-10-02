/**
 * A row of mutually exclusive options (like a tab strip or radio group).
 * Built on native radio inputs, so arrow keys and screen readers work with no extra code.
 */
import { classNames } from "./classNames";
import styles from "./Segmented.module.css";

interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedProps<Value extends string> {
  /** Group name read by screen readers, also used to tie the radios together. */
  label: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}

export function Segmented<Value extends string>({ label, options, value, onChange, className }: SegmentedProps<Value>) {
  return (
    <fieldset className={classNames(styles.group, className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            className="sr-only"
            type="radio"
            name={label}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.face}>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
