"use client";

import { useState } from "react";
import { useClickCollect } from "./click-collect-context";
import { AddressSearch } from "./address-search";
import { LocationMap } from "./location-map";
import { MapPin, Navigation, Zap, Store, LocateFixed } from "lucide-react";

// Demo position: central Milan (near Duomo) — used when browser geolocation is unavailable
const DEMO_LOCATION = { lat: 45.4642, lng: 9.19 };
import { Button } from "@/components/ui/button";
import { Shop } from "@/lib/types/shop";
import { formatDistance } from "@/lib/click-collect-utils";
import { useRouter } from "next/navigation";

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

  const shopsToShow = userLocation ? allShopsByDistance : [];

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
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
            <div className="text-center py-8 text-muted-foreground">Nessun negozio trovato</div>
          )}

          {!searchPerformed && !isLoadingShops && shopsToShow.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Cerca un indirizzo o usa la tua posizione per trovare i negozi vicini</p>
            </div>
          )}

          {shopsToShow.map((shop, index) => (
            <div
              key={`${shop.id}-${index}`}
              className={`p-4 border rounded-lg transition-colors cursor-pointer hover:border-primary/50 ${
                currentShop?.id === shop.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => handleSelectStore(shop)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium">{shop.name}</h3>
                  {shop.address && (
                    <p className="text-sm text-muted-foreground mt-1">{shop.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {shop.city}{shop.region ? `, ${shop.region}` : ""}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {formatDistance(shop.distance)}
                    </span>
                    {shop.hasExpressPickup && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Zap className="h-3 w-3" />
                        Ritiro express 1h
                      </span>
                    )}
                  </div>
                </div>

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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
