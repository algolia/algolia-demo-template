"use client";

import { MapPin, Zap, Clock, Phone, Scissors, Stethoscope, Heart, Car, Check } from "lucide-react";
import { ShopWithDistance, StoreService } from "@/lib/types/shop";
import { formatDistance } from "@/lib/click-collect-utils";
import { cn } from "@/lib/utils";

const SERVICE_CONFIG: Record<StoreService, { label: string; icon: typeof Scissors; color: string }> = {
  toelettatura: { label: "Grooming", icon: Scissors, color: "text-purple-600 bg-purple-50" },
  veterinario: { label: "Veterinary", icon: Stethoscope, color: "text-blue-600 bg-blue-50" },
  adozioni: { label: "Adoptions", icon: Heart, color: "text-rose-600 bg-rose-50" },
  parking: { label: "Parking", icon: Car, color: "text-gray-600 bg-gray-100" },
};

export { SERVICE_CONFIG };

interface ShopCardProps {
  shop: ShopWithDistance;
  isSelected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  action?: React.ReactNode;
}

export function ShopCard({ shop, isSelected = false, compact = false, onClick, action }: ShopCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg transition-colors cursor-pointer hover:border-primary/50",
        compact ? "p-2.5" : "p-4",
        isSelected ? "border-primary bg-primary/5" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "truncate",
            compact ? "text-sm" : "font-medium",
            isSelected && "font-medium"
          )}>
            {shop.name}
          </p>

          {!compact && shop.address && (
            <p className="text-sm text-muted-foreground mt-1">{shop.address}</p>
          )}
          <p className={cn("text-muted-foreground truncate", compact ? "text-xs" : "text-sm")}>
            {shop.city}{shop.region ? `, ${shop.region}` : ""}
          </p>

          {/* Distance + express */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {formatDistance(shop.distance)}
            </span>
            {shop.hasExpressPickup && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <Zap className="h-3 w-3" />
                {compact ? "Express" : "Express pickup 1h"}
              </span>
            )}
          </div>

          {/* Hours + phone (always shown) */}
          {(shop.openingHours || shop.phone) && (
            <div className={cn("flex flex-wrap items-center gap-3", compact ? "mt-1" : "mt-2")}>
              {shop.openingHours && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {shop.openingHours}
                </span>
              )}
              {!compact && shop.phone && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {shop.phone}
                </span>
              )}
            </div>
          )}

          {/* Services */}
          {shop.services && shop.services.length > 0 && (
            <div className={cn("flex flex-wrap gap-1", compact ? "mt-1 gap-0.5" : "mt-2 gap-1.5")}>
              {shop.services.map((service) => {
                const config = SERVICE_CONFIG[service];
                if (!config) return null;
                const Icon = config.icon;
                return compact ? (
                  <span key={service} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Icon className="h-2.5 w-2.5" />
                    {config.label}
                  </span>
                ) : (
                  <span
                    key={service}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${config.color}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {config.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side: action or check */}
        <div className="shrink-0 flex items-center gap-2">
          {action}
          {!action && isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
      </div>
    </div>
  );
}
