/**
 * Retail Media hit classification
 *
 * DEMO APPROACH: We encode placement type in the injectedItemKey string using a
 * "{placement}:{label}" convention. This works because injectedItemKey is an
 * arbitrary string set at composition configuration time.
 *
 * PRODUCTION APPROACH: In a real retail media platform, placement metadata would
 * typically come from a separate ad-serving API (e.g., Criteo, CitrusAd, or a
 * custom ad server). The Algolia composition would handle product retrieval, but
 * the ad server would control targeting, bidding, frequency capping, and billing.
 * The frontend would merge results from both sources.
 */

export type PlacementType = "carousel" | "inline" | "banner";

export interface RetailMediaPlacement {
  type: PlacementType;
  label: string;
}

export interface ClassifiedHits<T> {
  /** Top carousel group (only first match kept) */
  carousel: { label: string; hits: T[] } | null;
  /** Mid-results banner groups */
  banners: Array<{ label: string; hits: T[] }>;
  /** Set of objectIDs that are inline-sponsored (for quick lookup) */
  inlineIds: Set<string>;
  /** Map of objectID → display label for inline-sponsored products */
  inlinePlacements: Map<string, string>;
  /** Organic + inline hits in original order (carousel/banner products removed) */
  gridHits: T[];
}

const VALID_PLACEMENTS = new Set<PlacementType>(["carousel", "inline", "banner"]);

/**
 * Parse an injectedItemKey into placement type and label.
 * Format: "{placement}:{label}" e.g. "carousel:Royal Canin"
 * Returns null for legacy keys without the convention.
 */
export function parseInjectedItemKey(key: string): RetailMediaPlacement | null {
  const colonIndex = key.indexOf(":");
  if (colonIndex === -1) return null;

  const type = key.substring(0, colonIndex) as PlacementType;
  const label = key.substring(colonIndex + 1);

  if (!VALID_PLACEMENTS.has(type) || !label) return null;
  return { type, label };
}

/**
 * Extract the injectedItemKey from a hit's _rankingInfo.
 */
function getInjectedKey(
  hit: { objectID?: string; _rankingInfo?: Record<string, unknown> },
  compositionID: string
): string | null {
  const composed = (hit._rankingInfo as Record<string, unknown>)?.composed as
    | Record<string, { injectedItemKey?: string }>
    | undefined;
  return composed?.[compositionID]?.injectedItemKey || null;
}

/**
 * Classify hits from useInfiniteHits() into placement buckets.
 *
 * - carousel/banner products are extracted from the grid (deduplication)
 * - inline products stay in gridHits at their composed position
 * - Only the first carousel group is kept (one carousel per page)
 * - ObjectID-based dedup catches any double-returns from the composition
 */
export function classifyHits<
  T extends { objectID?: string; _rankingInfo?: Record<string, unknown> },
>(hits: T[], compositionID: string): ClassifiedHits<T> {
  const result: ClassifiedHits<T> = {
    carousel: null,
    banners: [],
    inlineIds: new Set(),
    inlinePlacements: new Map(),
    gridHits: [],
  };

  const seenObjectIDs = new Set<string>();
  const bannerMap = new Map<string, T[]>();

  for (const hit of hits) {
    const id = hit.objectID;
    if (!id || seenObjectIDs.has(id)) continue;
    seenObjectIDs.add(id);

    const key = getInjectedKey(hit, compositionID);
    if (!key) {
      result.gridHits.push(hit);
      continue;
    }

    const placement = parseInjectedItemKey(key);
    if (!placement) {
      // Legacy key without our convention — keep in grid (existing amber badge handles it)
      result.gridHits.push(hit);
      continue;
    }

    switch (placement.type) {
      case "carousel":
        if (!result.carousel) {
          result.carousel = { label: placement.label, hits: [hit] };
        } else if (result.carousel.label === placement.label) {
          result.carousel.hits.push(hit);
        }
        // Carousel products excluded from grid
        break;

      case "banner": {
        const existing = bannerMap.get(placement.label);
        if (existing) {
          existing.push(hit);
        } else {
          bannerMap.set(placement.label, [hit]);
        }
        // Banner products excluded from grid
        break;
      }

      case "inline":
        result.inlineIds.add(id);
        result.inlinePlacements.set(id, placement.label);
        result.gridHits.push(hit); // Inline stays in grid at composed position
        break;
    }
  }

  // Convert banner map to array
  for (const [label, bannerHits] of bannerMap) {
    result.banners.push({ label, hits: bannerHits });
  }

  return result;
}
