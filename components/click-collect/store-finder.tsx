"use client";

import { useState, useMemo } from "react";
import { useClickCollect } from "./click-collect-context";
import { AddressSearch } from "./address-search";
import { LocationMap } from "./location-map";
import { ShopCard, SERVICE_CONFIG } from "./shop-card";
import { MapPin, Navigation, LocateFixed, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shop, StoreService } from "@/lib/types/shop";
import { useRouter } from "next/navigation";

// Demo position: central Milan (near Duomo)
const DEMO_LOCATION = { lat: 45.4642, lng: 9.19 };

export function StoreFinder() {
  const {
    userLocation,
    setUserLocation,
    setLocationSource,
    allShopsByDistance,
    currentShop,
    setShop,
    fetchShopsByLocation,
    isLoadingShops,
    setStoreMode,
    searchRadiusKm,
  } = useClickCollect();
  const router = useRouter();
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<StoreService | null>(null);

  const shopsToShow = useMemo(() => {
    if (!userLocation) return [];
    if (!serviceFilter) return allShopsByDistance;
    return allShopsByDistance.filter((shop) => shop.services?.includes(serviceFilter));
  }, [userLocation, allShopsByDistance, serviceFilter]);

  const handleAddressSelect = async (location: { lat: number; lng: number }, _address: string) => {
    setUserLocation(location);
    setLocationSource("address");
    await fetchShopsByLocation(location);
    setSearchPerformed(true);
  };

  const handleMapLocationSelect = async (location: { lat: number; lng: number }) => {
    setUserLocation(location);
    setLocationSource("browser");
    await fetchShopsByLocation(location);
    setSearchPerformed(true);
  };

  const handleBrowserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setLocationSource("browser");
        await fetchShopsByLocation(loc);
        setSearchPerformed(true);
      },
      (error) => console.error("Geolocation error:", error)
    );
  };

  const handleDemoLocation = async () => {
    setUserLocation(DEMO_LOCATION);
    setLocationSource("address");
    await fetchShopsByLocation(DEMO_LOCATION);
    setSearchPerformed(true);
  };

  const handleSelectStore = (shop: Shop) => {
    setShop(shop);
  };

  const handleShopAndBrowse = (shop: Shop) => {
    setShop(shop);
    setStoreMode("store-first");
    router.push("/");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Trova Negozio</h1>
        <p className="text-muted-foreground">
          Cerca il negozio Arcaplanet più vicino a te
        </p>
      </div>

      {/* Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <AddressSearch onLocationSelect={handleAddressSelect} />
        </div>
        <Button variant="outline" onClick={handleBrowserLocation} className="shrink-0">
          <Navigation className="h-4 w-4 mr-2" />
          Usa la mia posizione
        </Button>
        <Button variant="secondary" onClick={handleDemoLocation} className="shrink-0">
          <LocateFixed className="h-4 w-4 mr-2" />
          Posizione demo (Milano)
        </Button>
      </div>

      {/* Service filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setServiceFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !serviceFilter
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Tutti
        </button>
        {(Object.entries(SERVICE_CONFIG) as [StoreService, (typeof SERVICE_CONFIG)[StoreService]][]).map(
          ([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setServiceFilter(serviceFilter === key ? null : key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                serviceFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          )
        )}
        {serviceFilter && shopsToShow.length > 0 && (
          <span className="inline-flex items-center px-2 py-1.5 text-xs text-muted-foreground">
            {shopsToShow.length} {shopsToShow.length === 1 ? "negozio" : "negozi"}
          </span>
        )}
      </div>

      {/* Map + List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="h-[500px] rounded-lg overflow-hidden border">
          <LocationMap
            shops={shopsToShow}
            userLocation={userLocation}
            selectedShop={currentShop}
            onLocationSelect={handleMapLocationSelect}
            onShopSelect={handleSelectStore}
            radiusKm={searchRadiusKm}
            className="h-full w-full"
          />
        </div>

        {/* Store list */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {isLoadingShops && (
            <div className="text-center py-8 text-muted-foreground">Caricamento negozi...</div>
          )}

          {searchPerformed && !isLoadingShops && shopsToShow.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {serviceFilter
                ? `Nessun negozio con ${SERVICE_CONFIG[serviceFilter].label.toLowerCase()} trovato nelle vicinanze`
                : "Nessun negozio trovato"}
            </div>
          )}

          {!searchPerformed && !isLoadingShops && shopsToShow.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Cerca un indirizzo o usa la tua posizione per trovare i negozi vicini</p>
            </div>
          )}

          {shopsToShow.map((shop, index) => (
            <ShopCard
              key={`${shop.id}-${index}`}
              shop={shop}
              isSelected={currentShop?.id === shop.id}
              onClick={() => handleSelectStore(shop)}
              action={
                <Button
                  size="sm"
                  variant={currentShop?.id === shop.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShopAndBrowse(shop);
                  }}
                >
                  <Store className="h-4 w-4 mr-1" />
                  Sfoglia
                </Button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
