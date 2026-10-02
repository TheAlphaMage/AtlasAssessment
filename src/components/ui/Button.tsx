/** The one button style used across the app: primary (filled), secondary (outlined) or ghost (text only). */
import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";
import styles from "./Button.module.css";
import { Icon, type IconName } from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
}

export function Button({ variant = "secondary", icon, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={classNames(styles.button, styles[variant], className)} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
