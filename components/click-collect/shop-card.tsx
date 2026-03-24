"use client";

import { MapPin, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/algolia/shops";
import type { ShopWithDistance } from "@/lib/types/shop";

interface ShopCardProps {
  shop: ShopWithDistance;
  isSelected: boolean;
  onSelect: (shop: ShopWithDistance) => void;
}

export function ShopCard({ shop, isSelected, onSelect }: ShopCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{shop.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {shop.address}, {shop.postalCode} {shop.city}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
            <Clock className="size-3 shrink-0" />
            <span>{shop.hours}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {formatDistance(shop.distance)}
          </span>
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(shop)}
            className="text-xs h-7"
          >
            {isSelected ? (
              <>
                <Check className="size-3 mr-1" />
                Seleccionada
              </>
            ) : (
              "Seleccionar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
