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

export const RETAIL_MEDIA_RULES: RetailMediaRule[] = [
  {
    name: "royal_canin_dog_food",
    description:
      "Royal Canin sponsors dog food searches — carousel at top of results",
    placement: "carousel",
    label: "Royal Canin",
    // Note: only one injection per query fires. Keep triggers non-overlapping
    // with other rules to avoid conflicts.
    trigger: { queryContains: ["cibo cane", "cibo secco cane", "cibo cucciolo"] },
    source: {
      filters:
        'brand:"ROYAL CANIN" AND hierarchical_categories.lvl0:"Cane"',
      hitsPerPage: 4,
    },
  },
  {
    name: "monge_conquest",
    description:
      "Monge conquest targeting Royal Canin searches — inline sponsored cards",
    placement: "inline",
    label: "Monge",
    trigger: { queryContains: ["royal canin"] },
    source: {
      filters: 'brand:"MONGE"',
      hitsPerPage: 2,
    },
  },
  {
    name: "almo_nature_cat_wet_food",
    description:
      "Almo Nature sponsors wet cat food category — inline sponsored cards",
    placement: "inline",
    label: "Almo Nature",
    trigger: {
      filterMatch: 'hierarchical_categories.lvl1:"Gatto > Cibo Umido"',
    },
    source: {
      filters: 'brand:"ALMO NATURE"',
      hitsPerPage: 2,
    },
  },
  {
    name: "cross_sell_snacks",
    description:
      "Cross-sell snacks when searching dog food — banner between result rows",
    placement: "banner",
    label: "Completa l'acquisto",
    // Use non-overlapping triggers (carousel owns "cibo cane")
    trigger: { queryContains: ["crocchette", "crocchette cane"] },
    source: {
      filters: 'hierarchical_categories.lvl1:"Cane > Snack"',
      hitsPerPage: 3,
    },
  },

  // --- Category-based rules (fire when browsing a category) ---

  {
    name: "advantix_antiparassitari",
    description:
      "Advantix sponsors antiparasitic searches — carousel at top",
    placement: "carousel",
    label: "Advantix",
    trigger: { queryContains: ["antiparassitari", "pulci", "zecche"] },
    source: {
      filters: 'brand:"ADVANTIX"',
      hitsPerPage: 4,
    },
  },
  {
    name: "purina_cat_snacks",
    description:
      "Purina sponsors cat snack searches — inline sponsored cards",
    placement: "inline",
    label: "Purina",
    trigger: { queryContains: ["snack gatto", "premio gatto"] },
    source: {
      filters:
        'brand:"PURINA" AND hierarchical_categories.lvl0:"Gatto"',
      hitsPerPage: 2,
    },
  },
  {
    name: "royal_canin_dog_category",
    description:
      "Royal Canin sponsors the Cane category page — carousel at top",
    placement: "carousel",
    label: "Royal Canin",
    trigger: {
      filterMatch: 'hierarchical_categories.lvl0:"Cane"',
    },
    source: {
      filters:
        'brand:"ROYAL CANIN" AND hierarchical_categories.lvl0:"Cane"',
      hitsPerPage: 4,
    },
  },
  {
    name: "purina_cat_category",
    description:
      "Purina sponsors the Gatto category page — carousel at top",
    placement: "carousel",
    label: "Purina Pro Plan",
    trigger: {
      filterMatch: 'hierarchical_categories.lvl0:"Gatto"',
    },
    source: {
      filters:
        'brand:"PURINA PRO PLAN" AND hierarchical_categories.lvl0:"Gatto"',
      hitsPerPage: 4,
    },
  },
  {
    name: "vitakraft_small_animals",
    description:
      "Vitakraft sponsors Piccoli Animali category — inline sponsored cards",
    placement: "inline",
    label: "Vitakraft",
    trigger: {
      filterMatch: 'hierarchical_categories.lvl0:"Piccoli Animali"',
    },
    source: {
      filters: 'brand:"VITAKRAFT"',
      hitsPerPage: 2,
    },
  },
  // =========================================================================
  // Segment-Based Rules (triggered by DY segments via ruleContexts)
  // =========================================================================
  {
    name: "segment_puppy_starter_kit",
    description:
      "Puppy starter kit for puppy_owner segment — carousel at top",
    placement: "carousel",
    label: "Consigliato per cuccioli",
    trigger: {
      context: "puppy_owner",
    },
    source: {
      filters:
        'età.value:"PUPPY" AND hierarchical_categories.lvl0:"Cane"',
      hitsPerPage: 4,
    },
  },
  {
    name: "segment_large_breed",
    description:
      "Large breed products for cane_grande segment — inline sponsored cards",
    placement: "inline",
    label: "Per taglie grandi",
    trigger: {
      context: "cane_grande",
    },
    source: {
      filters:
        'taglia.value:"GRANDE" AND hierarchical_categories.lvl0:"Cane"',
      hitsPerPage: 3,
    },
  },
];
