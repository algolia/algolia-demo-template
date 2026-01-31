export interface HealthClaim {
  objectID: string;
  claimType: string;
  nutrientOrFood: string;
  claim: string;
  conditionsOfUse: string;
  healthRelationship: string;
  efsaOpinionReference: string;
  commissionRegulation: string;
  status: string;
  entryId: string;
  isAuthorized: boolean;
}

export function isHealthClaim(hit: unknown): hit is HealthClaim {
  if (!hit || typeof hit !== "object") return false;
  const h = hit as Record<string, unknown>;
  return (
    typeof h.claim === "string" &&
    typeof h.nutrientOrFood === "string" &&
    typeof h.conditionsOfUse === "string"
  );
}
