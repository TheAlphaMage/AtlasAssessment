/** Reminds everyone that this tool only prepares the committee's decision. Required by the brief. */
import { Icon } from "@/components/ui/Icon";
import styles from "./DecisionSupportNote.module.css";

export function DecisionSupportNote() {
  return (
    <p className={styles.note} role="note">
      <Icon name="info" size={15} />
      <span>
        <strong>Decision support only.</strong> Nothing here is executed, confirmed or sent to farms, clients or other systems.
        The Production and Commercial committee approves the plan.
      </span>
    </p>
  );
}
