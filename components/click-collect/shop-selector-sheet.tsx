"use client";

import { MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CITY_COORDINATES } from "@/lib/algolia/shops";
import { useClickCollect } from "./click-collect-context";
import { ShopCard } from "./shop-card";
import type { ShopWithDistance } from "@/lib/types/shop";

const cities = Object.keys(CITY_COORDINATES).sort();

export function ShopSelectorSheet() {
  const {
    isShopSelectorOpen,
    closeShopSelector,
    selectedCity,
    selectCity,
    nearbyShops,
    currentShop,
    selectShop,
  } = useClickCollect();

  const handleSelectShop = (shop: ShopWithDistance) => {
    selectShop(shop);
    closeShopSelector();
  };

  return (
    <Sheet open={isShopSelectorOpen} onOpenChange={(open) => !open && closeShopSelector()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Selecciona tu tienda
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 border-b">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Tu ciudad
          </label>
          <Select value={selectedCity || ""} onValueChange={selectCity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una ciudad" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {!selectedCity && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Selecciona una ciudad para ver las tiendas cercanas
              </p>
            )}

            {selectedCity && nearbyShops.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron tiendas
              </p>
            )}

            {nearbyShops.map((shop) => (
              <ShopCard
                key={shop.objectID}
                shop={shop}
                isSelected={currentShop?.objectID === shop.objectID}
                onSelect={handleSelectShop}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
