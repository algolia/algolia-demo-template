"use client";

import { memo } from "react";
import { CheckCircle2Icon } from "lucide-react";
import type { HealthClaim } from "@/lib/types/health-claim";

interface HealthClaimItemProps {
  claim: HealthClaim;
}

export const HealthClaimItem = memo(function HealthClaimItem({
  claim,
}: HealthClaimItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
      <CheckCircle2Icon
        size={18}
        className="text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-green-800 dark:text-green-400 uppercase tracking-wide">
          {claim.nutrientOrFood}
        </p>
        <p className="text-sm text-foreground mt-1 leading-relaxed">
          {claim.claim}
        </p>
      </div>
    </div>
  );
});
