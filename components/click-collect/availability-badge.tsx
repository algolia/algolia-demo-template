"use client";

import { MapPin, Clock, Truck } from "lucide-react";
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
}

export function AvailabilityBadge({
  product,
  currentShop,
  nearbyShops,
  onShopSelect,
}: AvailabilityBadgeProps) {
  const availability = product.availableInStores || [];

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
              <span>{hasExpress ? "Pronto in 1 ora" : "Disponibile oggi"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Disponibile presso {currentShop?.name}</p>
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
              Disponibile presso {closest.name}
              {nearbyWithStock.length > 1 &&
                ` e altri ${nearbyWithStock.length - 1} negozi`}
            </p>
            {onShopSelect && (
              <p className="text-muted-foreground mt-1">
                Clicca per selezionare questo negozio
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
            <p>Il negozio piu vicino con disponibilita</p>
            {onShopSelect && (
              <p className="text-muted-foreground mt-1">
                Clicca per selezionare questo negozio
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
              <span>Spedizione in {restockDays} giorni</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Non disponibile in negozio. Verra spedito a {currentShop.name} in
              circa {restockDays} giorni lavorativi.
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
                Disponibile in {shopsWithStock}{" "}
                {shopsWithStock === 1 ? "negozio" : "negozi"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {closestStoresWithStock.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium text-xs mb-1">Negozi piu vicini:</p>
                {closestStoresWithStock.map((shop, i) => (
                  <p key={`${shop.id}-${i}`} className="text-xs">
                    {shop.name} — {formatDistance(shop.distance)}
                  </p>
                ))}
                {shopsWithStock > 5 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    e altri {shopsWithStock - 5} negozi
                  </p>
                )}
              </div>
            ) : (
              <p>Disponibile in {shopsWithStock} {shopsWithStock === 1 ? "negozio" : "negozi"}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No availability data
  return null;
}
