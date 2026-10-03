/** Shown when the server fails or cannot be reached. No figures are shown, because they could be out of date. */
import { RefreshCw, ServerCrash } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ServerErrorViewProps {
  message: string;
  during: "load" | "plan";
  onRetry: () => void;
}

export function ServerErrorView({ message, during, onRetry }: ServerErrorViewProps) {
  return (
    <Card role="alert">
      <EmptyState
        icon={ServerCrash}
        title={during === "load" ? "The workbook could not be loaded" : "The plan could not be computed"}
        description={`${message} No figures are shown because they could be out of date.`}
        action={
          <Button onClick={onRetry}>
            <RefreshCw /> Retry
          </Button>
        }
      />
    </Card>
  );
}
