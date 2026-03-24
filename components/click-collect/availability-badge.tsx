"use client";

import type { Product } from "@/lib/types/product";
import { useClickCollect } from "./click-collect-context";

interface AvailabilityBadgeProps {
  product: Product;
}

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 8,
  right: 8,
  zIndex: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  fontSize: 9,
  fontWeight: 500,
  paddingLeft: 6,
  paddingRight: 6,
  paddingTop: 2,
  paddingBottom: 2,
  borderRadius: 9999,
  color: "#fff",
};

const dotStyle: React.CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 9999,
  backgroundColor: "#fff",
};

export function AvailabilityBadge({ product }: AvailabilityBadgeProps) {
  const { currentShop, getProductAvailability } = useClickCollect();

  if (!currentShop) return null;

  const availability = getProductAvailability(product);

  if (!availability || !availability.inStock) {
    return (
      <span style={{ ...badgeStyle, backgroundColor: "rgba(220, 38, 38, 0.85)" }}>
        <span style={dotStyle} />
        No disponible
      </span>
    );
  }

  if (availability.qty < 5) {
    return (
      <span style={{ ...badgeStyle, backgroundColor: "rgba(234, 88, 12, 0.85)" }}>
        <span style={dotStyle} />
        Stock limitado
      </span>
    );
  }

  return (
    <span style={{ ...badgeStyle, backgroundColor: "rgba(4, 120, 87, 0.85)" }}>
      <span style={dotStyle} />
      En tienda
    </span>
  );
}
