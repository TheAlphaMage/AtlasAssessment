/** A small rounded label. The tone sets the colour: brand, ok, risk, local (amber) or neutral. */
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { classNames } from "./classNames";
import styles from "./Pill.module.css";

interface PillProps {
  tone?: "neutral" | "brand" | "ok" | "risk" | "local";
  icon?: IconName;
  className?: string;
  children: ReactNode;
}

export function Pill({ tone = "neutral", icon, className, children }: PillProps) {
  return (
    <span className={classNames(styles.pill, styles[tone], className)}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}
