/**
 * Sponsored product carousel — displayed above organic search results.
 *
 * Shows a horizontal scrollable strip of products with a brand label.
 * Used for "Brand Sponsorship" retail media placements.
 *
 * DEMO NOTE: This carousel has no impression tracking or click attribution.
 * A production implementation would fire analytics events for:
 * - Impression (carousel entered viewport)
 * - Click (product clicked from sponsored carousel)
 * - Viewability (50%+ of carousel visible for 1+ second)
 * These events would feed back into the ad platform for billing and optimization.
 */
"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/lib/types/product";
import { CompactProductCard } from "@/components/ProductCard";

interface SponsoredCarouselProps {
  label: string;
  products: Product[];
}

export function SponsoredCarousel({ label, products }: SponsoredCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 180; // slightly wider than card (160px + gap)
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-4 relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-800">
            Sponsorizzato da {label}
          </span>
        </div>
        <span className="text-[10px] font-medium text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
          Ad
        </span>
      </div>

      {/* Scrollable product strip */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1"
        >
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

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
