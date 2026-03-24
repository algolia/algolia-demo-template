"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClickCollect } from "./click-collect-context";

export function ShopIndicator() {
  const { currentShop, openShopSelector } = useClickCollect();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openShopSelector}
      className="gap-1.5 text-xs h-8 px-2 hover:bg-muted"
    >
      <MapPin className="size-3.5" />
      <span className="hidden sm:inline truncate max-w-[140px]">
        {currentShop ? currentShop.name : "Selecciona tienda"}
      </span>
    </Button>
  );
}
