/**
 * Retail Media debug overlay for demo presentations.
 *
 * Floating toggle button (bottom-right) that expands to show:
 * - Which retail media rules fired for the current search
 * - Color-coded placement types
 * - Sponsored vs organic product counts
 *
 * Visible when ?retail_media=true URL param is set.
 */
"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ClassifiedHits } from "@/lib/retail-media";

interface RetailMediaOverlayProps {
  classified: ClassifiedHits<unknown>;
}

export function RetailMediaOverlay({ classified }: RetailMediaOverlayProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  // Only show when retail_media URL param is set
  if (!searchParams.get("retail_media")) return null;

  const sponsoredCount =
    (classified.carousel?.hits.length ?? 0) +
    classified.banners.reduce((sum, b) => sum + b.hits.length, 0) +
    classified.inlineIds.size;

  const organicCount = classified.gridHits.length - classified.inlineIds.size;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        aria-label="Show retail media info"
      >
        <Megaphone className="h-5 w-5" />
        {sponsoredCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-4 h-4 flex items-center justify-center font-bold">
            {sponsoredCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          <span className="text-sm font-semibold">Retail Media</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="hover:bg-blue-700 rounded p-0.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 text-xs border-b">
        <span>
          <span className="font-semibold text-blue-600">{sponsoredCount}</span>{" "}
          sponsored
        </span>
        <span>
          <span className="font-semibold">{organicCount}</span> organic
        </span>
      </div>

      {/* Rules */}
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {classified.carousel && (
          <RuleCard
            type="carousel"
            label={classified.carousel.label}
            count={classified.carousel.hits.length}
            color="blue"
          />
        )}

        {classified.inlineIds.size > 0 && (
          <RuleCard
            type="inline"
            label={[...new Set(classified.inlinePlacements.values())].join(", ")}
            count={classified.inlineIds.size}
            color="green"
          />
        )}

        {classified.banners.map((banner, i) => (
          <RuleCard
            key={i}
            type="banner"
            label={banner.label}
            count={banner.hits.length}
            color="amber"
          />
        ))}

        {sponsoredCount === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No retail media rules matched this query
          </p>
        )}
      </div>
    </div>
  );
}

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
    text: "text-green-700",
    badge: "bg-green-100 text-green-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-600",
  },
};

function RuleCard({
  type,
  label,
  count,
  color,
}: {
  type: string;
  label: string;
  count: number;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-2.5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />
          <span className={`text-xs font-medium ${c.text}`}>{label}</span>
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.badge}`}>
          {type}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 ml-4">
        {count} product{count !== 1 ? "s" : ""} injected
      </p>
    </div>
  );
}
