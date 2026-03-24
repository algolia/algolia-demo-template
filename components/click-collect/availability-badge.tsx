"use client";

import type { Product } from "@/lib/types/product";
import { useClickCollect } from "./click-collect-context";

interface AvailabilityBadgeProps {
  product: Product;
  className?: string;
}

export function AvailabilityBadge({
  product,
  className = "",
}: AvailabilityBadgeProps) {
  const { currentShop, getProductAvailability } = useClickCollect();

  if (!currentShop) return null;

  const availability = getProductAvailability(product);

  if (!availability || !availability.inStock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-red-600 text-white border-2 border-red-700 shadow-md ${className}`}
      >
        <span className="size-1.5 rounded-full bg-white" />
        No disponible en tienda
      </span>
    );
  }

  if (availability.qty < 5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-orange-600 text-white border-2 border-orange-700 shadow-md ${className}`}
      >
        <span className="size-1.5 rounded-full bg-white" />
        Stock limitado
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-700 text-white border-2 border-emerald-800 shadow-md ${className}`}
    >
      <span className="size-1.5 rounded-full bg-white" />
      Disponible en tienda
    </span>
  );
}
