"use client";

import { MapPin, Clock, Check } from "lucide-react";
import { Shop, ShopWithDistance } from "@/lib/types/shop";
import { formatDistance, getPickupTimeLabel } from "@/lib/click-collect-utils";
import { cn } from "@/lib/utils";

interface ShopListProps {
  shops: ShopWithDistance[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
  title?: string;
  emptyMessage?: string;
}

export function ShopList({
  shops,
  selectedShop,
  onSelectShop,
  title,
  emptyMessage = "No stores available",
}: ShopListProps) {
  if (shops.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {title}
        </h3>
      )}
      <div className="space-y-2">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            isSelected={selectedShop?.id === shop.id}
            onSelect={() => onSelectShop(shop)}
          />
        ))}
      </div>
    </div>
  );
}

interface ShopCardProps {
  shop: ShopWithDistance;
  isSelected: boolean;
  onSelect: () => void;
}

function ShopCard({ shop, isSelected, onSelect }: ShopCardProps) {
  const pickupLabel = getPickupTimeLabel(true, shop.distance);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{shop.name}</span>
            {isSelected && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          {shop.address && (
            <div className="text-sm text-muted-foreground mt-0.5 truncate">
              {shop.address}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {shop.city}
            {shop.region && `, ${shop.region}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            <span>{formatDistance(shop.distance)}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-xs mt-1",
              shop.hasExpressPickup ? "text-green-600" : "text-blue-600"
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{pickupLabel}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

interface ShopCardSimpleProps {
  shop: Shop;
  distance?: number;
  isSelected: boolean;
  onSelect: () => void;
  showPickupInfo?: boolean;
}

export function ShopCardSimple({
  shop,
  distance,
  isSelected,
  onSelect,
  showPickupInfo = false,
}: ShopCardSimpleProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{shop.name}</span>
            {isSelected && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {shop.city}
          </div>
        </div>
        {distance !== undefined && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{formatDistance(distance)}</span>
            </div>
            {showPickupInfo && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs mt-1",
                  distance <= 10 ? "text-green-600" : "text-blue-600"
                )}
              >
                <Clock className="h-3 w-3" />
                <span>{getPickupTimeLabel(true, distance)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
