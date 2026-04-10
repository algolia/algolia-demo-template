/**
 * Sponsored banner — injected between rows of organic search results.
 *
 * Shows a full-width band with 2-3 product cards and a contextual CTA.
 * Used for "Cross-Category Upsell" retail media placements.
 *
 * DEMO NOTE: In production, this placement would track:
 * - Banner impressions and viewability
 * - Click-through rate per product
 * - Add-to-cart attribution (did the user add a banner product?)
 * - Incremental AOV lift from cross-sell placements
 */
"use client";

import { Product } from "@/lib/types/product";
import { CompactProductCard } from "@/components/ProductCard";

interface SponsoredBannerProps {
  label: string;
  products: Product[];
}

export function SponsoredBanner({ label, products }: SponsoredBannerProps) {
  if (products.length === 0) return null;

  return (
    <div className="my-6 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-4">
      {/* Header */}
      <div className="mb-3">
        <span className="text-sm font-medium text-amber-800">{label}</span>
        <div className="mt-0.5">
          <span className="text-[10px] font-medium text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
            Sponsored
          </span>
        </div>
      </div>

      {/* Product strip */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {products.map((product) => (
          <div key={product.objectID} className="shrink-0">
            <CompactProductCard
              product={product}
              showCartControls={true}
              showBadges={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
