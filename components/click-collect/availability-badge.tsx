"use client";

import { MapPin, Clock, Truck, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types/product";
import { Shop, ShopWithDistance } from "@/lib/types/shop";
import {
  formatDistance,
  getEstimatedRestockDays,
} from "@/lib/click-collect-utils";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AvailabilityBadgeProps {
  product: Product;
  currentShop: Shop | null;
  nearbyShops: ShopWithDistance[];
  onShopSelect?: (shop: Shop) => void;
  primaryCartStoreId?: string | null;
  primaryCartStoreName?: string | null;
}

export function AvailabilityBadge({
  product,
  currentShop,
  nearbyShops,
  onShopSelect,
  primaryCartStoreId,
  primaryCartStoreName,
}: AvailabilityBadgeProps) {
  const availability = product.availableInStores || [];

  // Check if product is available at the cart's primary store
  const atCartStore = primaryCartStoreId
    ? availability.some((a) => a.objectID === primaryCartStoreId && a.inStock)
    : false;

  // Case 0: Product is at the store where user is building their basket
  if (atCartStore && primaryCartStoreName) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">
              <ShoppingBag className="h-3 w-3" />
              <span>Available at your store</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>In stock at {primaryCartStoreName} — same pickup as your other items</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Check availability at current shop
  const currentShopAvailability = currentShop
    ? availability.find((a) => a.objectID === currentShop.id)
    : null;

  // Find nearby shops with stock
  const nearbyWithStock = nearbyShops.filter((shop) =>
    availability.some((a) => a.objectID === shop.id && a.inStock)
  );

  // Find the closest shop with stock (anywhere)
  const closestWithStock = nearbyShops.find((shop) =>
    availability.some((a) => a.objectID === shop.id && a.inStock)
  );

  // Case 1: In stock at selected shop
  if (currentShopAvailability?.inStock) {
    const shop = nearbyShops.find((s) => s.id === currentShop?.id);
    const hasExpress = shop ? shop.hasExpressPickup : false;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{hasExpress ? "Ready in 1 hour" : "Available today"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available at {currentShop?.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Case 2: Not at selected shop, but available at nearby shops
  if (nearbyWithStock.length > 0 && currentShop) {
    const closest = nearbyWithStock[0];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShopSelect?.(closest);
              }}
              className={cn(
                "inline-flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full",
                onShopSelect
                  ? "text-blue-600 hover:bg-blue-100 cursor-pointer"
                  : "text-blue-600"
              )}
            >
              <MapPin className="h-3 w-3" />
              <span>
                {closest.name} - {formatDistance(closest.distance)}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Available at {closest.name}
              {nearbyWithStock.length > 1 &&
                ` and ${nearbyWithStock.length - 1} other stores`}
            </p>
            {onShopSelect && (
              <p className="text-muted-foreground mt-1">
                Click to select this store
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Case 3: Not available nearby, but available somewhere
  if (closestWithStock && currentShop) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShopSelect?.(closestWithStock);
              }}
              className={cn(
                "inline-flex items-center gap-1 text-xs bg-amber-50 px-2 py-1 rounded-full",
                onShopSelect
                  ? "text-amber-600 hover:bg-amber-100 cursor-pointer"
                  : "text-amber-600"
              )}
            >
              <MapPin className="h-3 w-3" />
              <span>
                {closestWithStock.name} - {formatDistance(closestWithStock.distance)}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nearest store with availability</p>
            {onShopSelect && (
              <p className="text-muted-foreground mt-1">
                Click to select this store
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Case 4: Out of stock everywhere - show shipping estimate
  if (currentShop) {
    const restockDays = getEstimatedRestockDays();

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Truck className="h-3 w-3" />
              <span>Ships in {restockDays} days</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Not available in store. Will be shipped to {currentShop.name} in
              approximately {restockDays} business days.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Case 5: No shop selected - show number of shops with stock + top 5 closest on hover
  const shopsWithStock = availability.filter((a) => a.inStock).length;
  if (shopsWithStock > 0) {
    // Find top 5 closest shops that have this product in stock
    const closestStoresWithStock = nearbyShops
      .filter((shop) => availability.some((a) => a.objectID === shop.id && a.inStock))
      .slice(0, 5);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <MapPin className="h-3 w-3" />
              <span>
                Available in {shopsWithStock}{" "}
                {shopsWithStock === 1 ? "store" : "stores"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {closestStoresWithStock.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium text-xs mb-1">Nearest stores:</p>
                {closestStoresWithStock.map((shop, i) => (
                  <p key={`${shop.id}-${i}`} className="text-xs">
                    {shop.name} — {formatDistance(shop.distance)}
                  </p>
                ))}
                {shopsWithStock > 5 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    and {shopsWithStock - 5} other stores
                  </p>
                )}
              </div>
            ) : (
              <p>Available in {shopsWithStock} {shopsWithStock === 1 ? "store" : "stores"}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No availability data
  return null;
}
