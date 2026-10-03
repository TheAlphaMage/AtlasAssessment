"use client";

/** One stacked bar of today's crop: exported tonnes by segment, plus what falls to the local market. */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LOCAL_STRIPES } from "@/components/app/localStripes";
import { SEGMENT_BG } from "@/components/app/SegmentDot";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface Piece {
  key: string;
  label: string;
  tonnes: number;
  className: string;
}

export function CropSplitCard({ result }: { result: PlanResult }) {
  const { kpis } = result;
  const pieces: Piece[] = [
    ...result.segments.map((segment) => ({
      key: segment.segment,
      label: `Export ${segment.segment}`,
      tonnes: segment.exportedT,
      className: SEGMENT_BG[segment.segment],
    })),
    { key: "local", label: "Local market", tonnes: kpis.localT, className: LOCAL_STRIPES },
  ].filter((piece) => piece.tonnes > 0);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Where the crop went</CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/flow">
              Crop flow <ChevronRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          {pieces.map((piece) => (
            <div key={piece.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", piece.className)} style={{ flexGrow: piece.tonnes }} />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
          {pieces.map((piece) => (
            <li key={piece.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={cn("size-2 rounded-full", piece.className)} aria-hidden="true" />
                {piece.label}
              </span>
              <span className={cn("font-medium tabular-nums", piece.key === "local" && "text-warning")}>{fmtT(piece.tonnes)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
