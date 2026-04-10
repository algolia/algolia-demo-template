/**
 * Retail Media rule definitions for the demo
 *
 * Each rule defines:
 * - What triggers the injection (query match or filter)
 * - What products to inject (Algolia filters + hit count)
 * - How to display them (placement type + label)
 *
 * The `placement` + `label` are combined into the injectedItemKey as
 * "{placement}:{label}" — the frontend parses this to choose the visualization.
 *
 * REAL-WORLD USE CASES:
 * These rules model common retail media scenarios that brands pay retailers for:
 *
 * 1. Brand Sponsorship — A brand (e.g. Royal Canin) pays to appear at the top
 *    of category searches. Typically sold as "search takeover" packages with
 *    CPM pricing. Revenue: €5-15 CPM depending on category traffic.
 *
 * 2. Conquest Campaigns — Brand X pays to appear when users search for Brand Y.
 *    High CPC pricing (€0.30-1.00) because of high conversion intent.
 *    Example: Monge targeting Royal Canin searchers with lower-priced alternatives.
 *
 * 3. Category Sponsorship — A brand sponsors an entire product category.
 *    Their products appear first whenever users browse that category.
 *    Sold as monthly/quarterly packages. Revenue: flat fee €500-5000/month.
 *
 * 4. Cross-Category Upsell — Retailer-driven (not brand-funded). Inject
 *    complementary products to increase basket size. Example: suggest snacks
 *    when someone is buying dog food. Increases AOV by 15-25%.
 *
 * DEMO SHORTCUT: Rules are hardcoded here. In production, retail media campaigns
 * would be managed through a campaign management UI (like Criteo Retail Media or
 * CitrusAd), with rules created/updated via API based on advertiser bookings,
 * budget pacing, and targeting criteria.
 */

import { PlacementType } from "../retail-media";

export interface RetailMediaRule {
  /** Unique identifier for this rule (used as composition injection key) */
  name: string;
  /** Human-readable description */
  description: string;
  /** How to display injected products */
  placement: PlacementType;
  /** Display label (brand name, CTA, etc.) */
  label: string;
  /** What triggers this rule (demo: not all may be supported by Composition API) */
  trigger: {
    queryContains?: string[];
    filterMatch?: string;
    /** Fires when ruleContexts includes this value (segment-based targeting) */
    context?: string;
  };
  /** What products to inject */
  source: {
    filters: string;
    hitsPerPage: number;
  };
}

export const RETAIL_MEDIA_RULES: RetailMediaRule[] = [];
