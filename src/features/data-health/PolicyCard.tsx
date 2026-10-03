/** The deterministic planning policy, in the exact order the engine applies it. */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const POLICY_STEPS = [
  "Available supply is each farm's actual A/B/C/D tonnes. Planned tonnes are for comparison only.",
  "Client orders are processed by export price per tonne, highest first. Equal prices go by client ID.",
  "EXACT accepts only the requested segment. MINIMUM accepts it or any better one (A > B > C > D).",
  "Compatible supply is used closest quality first (smallest upgrade), then by farm ID.",
  "Allocation moves in 5 t steps until the order, the compatible supply or the station capacity is used up.",
  "Every tonne not exported goes local at the local-market ratio × its segment reference price.",
];

export function PolicyCard() {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Planning policy</CardTitle>
        <CardDescription>Same workbook, same plan. No AI is involved.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {POLICY_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">{index + 1}</span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
