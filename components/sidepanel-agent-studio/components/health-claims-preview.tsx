"use client";

import { memo } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { HealthClaimItem } from "./health-claim-item";
import type { HealthClaim } from "@/lib/types/health-claim";

interface HealthClaimsPreviewProps {
  claims: HealthClaim[];
  maxDisplay?: number;
}

export const HealthClaimsPreview = memo(function HealthClaimsPreview({
  claims,
  maxDisplay = 3,
}: HealthClaimsPreviewProps) {
  const displayedClaims = claims.slice(0, maxDisplay);
  const remainingCount = claims.length - maxDisplay;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <ShieldCheckIcon size={18} />
        <h4 className="text-sm font-semibold">EU Authorized Health Claims</h4>
      </div>
      <div className="space-y-2">
        {displayedClaims.map((claim) => (
          <HealthClaimItem key={claim.objectID} claim={claim} />
        ))}
      </div>
      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          +{remainingCount} more claim{remainingCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
});
