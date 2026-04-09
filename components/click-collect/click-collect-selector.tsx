"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Truck,
  MapPin,
  Calendar,
  Loader2,
  Navigation,
  X,
  Zap,
  Store,
  Check,
  LocateFixed,
  Scissors,
  Stethoscope,
  Heart,
  Car,
} from "lucide-react";

// Demo position: central Milan (near Duomo)
const DEMO_LOCATION: ShopGeoloc = { lat: 45.4642, lng: 9.19 };
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useClickCollect } from "./click-collect-context";
import { AddressSearch } from "./address-search";
import { LocationMap } from "./location-map";
import { Shop, ShopGeoloc, StoreService } from "@/lib/types/shop";
import { getQuickDateOptions } from "@/lib/click-collect-utils";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "map";

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

const SERVICE_FILTERS: { key: StoreService; label: string; icon: typeof Scissors }[] = [
  { key: "toelettatura", label: "Toelettatura", icon: Scissors },
  { key: "veterinario", label: "Veterinario", icon: Stethoscope },
  { key: "adozioni", label: "Adozioni", icon: Heart },
  { key: "parking", label: "Parking", icon: Car },
];

export function ClickCollectSelector() {
  const [open, setOpen] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<StoreService | null>(null);

  const {
    userLocation,
    setUserLocation,
    setLocationSource,
    searchRadiusKm,
    setSearchRadiusKm,
    selectedPickupDate,
    setSelectedPickupDate,
    currentShop,
    setShop,
    allShops,
    allShopsByDistance,
    nearbyShops,
    storeMode,
    setStoreMode,
    clearSelection,
    fetchShopsByLocation,
    fetchAllShops,
  } = useClickCollect();

  // Load all shops when switching to map view
  useEffect(() => {
    if (viewMode === "map" && allShops.length === 0) {
      fetchAllShops();
    }
  }, [viewMode, allShops.length, fetchAllShops]);

  // Convert allShops to ShopWithDistance format for the map (with distance 0 when no user location)
  const shopsForMap = useMemo(() => {
    if (allShopsByDistance.length > 0) {
      return allShopsByDistance;
    }
    // When no user location, show all shops without distance
    return allShops.map((shop) => ({
      ...shop,
      distance: 0,
      hasExpressPickup: false,
    }));
  }, [allShops, allShopsByDistance]);

  // Filter nearby shops by selected service
  const filteredNearbyShops = useMemo(() => {
    if (!serviceFilter) return nearbyShops;
    return nearbyShops.filter((shop) => shop.services?.includes(serviceFilter));
  }, [nearbyShops, serviceFilter]);

  const handleRequestBrowserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError("Il tuo browser non supporta la geolocalizzazione");
      return;
    }

    setIsRequestingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: ShopGeoloc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocationSource("browser");
        setSelectedAddress("La tua posizione attuale");
        await fetchShopsByLocation(loc);
        setIsRequestingLocation(false);
      },
      (error) => {
        setIsRequestingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Permesso di geolocalizzazione negato. Inserisci un indirizzo."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Posizione non disponibile. Inserisci un indirizzo."
            );
            break;
          case error.TIMEOUT:
            setLocationError("Timeout nella richiesta. Riprova.");
            break;
          default:
            setLocationError("Errore nella geolocalizzazione.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [setUserLocation, setLocationSource, fetchShopsByLocation]);

  const handleAddressSelect = useCallback(
    async (location: ShopGeoloc, address: string) => {
      setUserLocation(location);
      setLocationSource("address");
      setSelectedAddress(address);
      await fetchShopsByLocation(location);
    },
    [setUserLocation, setLocationSource, fetchShopsByLocation]
  );

  const handleDemoLocation = useCallback(async () => {
    setUserLocation(DEMO_LOCATION);
    setLocationSource("address");
    setSelectedAddress("Milano Centro (Demo)");
    await fetchShopsByLocation(DEMO_LOCATION);
  }, [setUserLocation, setLocationSource, fetchShopsByLocation]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedPickupDate(date);
    },
    [setSelectedPickupDate]
  );

  const handleClear = useCallback(() => {
    clearSelection();
    setSelectedAddress(null);
  }, [clearSelection]);

  const handleShopSelect = useCallback(
    (shop: Shop) => {
      setShop(shop);
    },
    [setShop]
  );

  // Display text for the trigger button
  const triggerDisplay = userLocation ? (
    <span className="hidden sm:inline ml-2 text-sm truncate max-w-[150px]">
      {selectedPickupDate
        ? selectedPickupDate.toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          })
        : "Seleziona data"}
    </span>
  ) : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            userLocation && "sm:w-auto sm:px-3"
          )}
        >
          <Truck className="size-5" />
          {triggerDisplay}
          {userLocation && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full sm:hidden" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto p-0" showCloseButton={false}>
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1 text-lg">Ritiro in Negozio</SheetTitle>
            {(userLocation || selectedPickupDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground"
              >
                Annulla
              </Button>
            )}
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Chiudi</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Section 1: Set Location */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">La tua posizione</h3>
                <p className="text-sm text-muted-foreground">
                  Imposta la posizione per trovare i negozi vicini
                </p>
              </div>
            </div>

            {!userLocation ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleRequestBrowserLocation}
                  disabled={isRequestingLocation}
                >
                  {isRequestingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  Usa la mia posizione
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-start gap-2"
                  onClick={handleDemoLocation}
                >
                  <LocateFixed className="h-4 w-4" />
                  Posizione demo (Milano)
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">oppure</span>
                  </div>
                </div>

                <AddressSearch
                  onLocationSelect={handleAddressSelect}
                  placeholder="Inserisci il tuo indirizzo..."
                />

                {locationError && (
                  <p className="text-sm text-destructive">{locationError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Location confirmation */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        {selectedAddress || "La tua posizione"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUserLocation(null);
                        setSelectedAddress(null);
                      }}
                      className="h-7 text-xs text-green-700 hover:bg-green-100"
                    >
                      Cambia
                    </Button>
                  </div>
                </div>

                {/* Radius selector */}
                <div>
                  <p className="text-sm font-medium mb-2">Raggio di ricerca</p>
                  <div className="flex items-center gap-2">
                    {RADIUS_OPTIONS.map((r) => (
                      <Button
                        key={r}
                        variant={searchRadiusKm === r ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setSearchRadiusKm(r)}
                      >
                        {r} km
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selected shop summary + store-first toggle */}
                {currentShop && (
                  <>
                    <div className="p-3 bg-primary/5 border-2 border-primary rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{currentShop.name}</p>
                          <p className="text-xs text-muted-foreground">{currentShop.city}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShop(null)}
                            className="h-7 text-xs"
                          >
                            Rimuovi
                          </Button>
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Solo prodotti disponibili qui</p>
                        <p className="text-xs text-muted-foreground">
                          Mostra solo prodotti in stock presso {currentShop.name}
                        </p>
                      </div>
                      <Switch
                        checked={storeMode === "store-first"}
                        onCheckedChange={(checked) =>
                          setStoreMode(checked ? "store-first" : "radius")
                        }
                      />
                    </div>
                  </>
                )}

                {/* Results summary */}
                {!currentShop && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">{filteredNearbyShops.length}</span> negozi trovati entro{" "}
                      <span className="font-medium">{searchRadiusKm} km</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seleziona un negozio per filtrare il catalogo, oppure naviga per distanza
                    </p>
                  </div>
                )}

                {/* Service filter pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setServiceFilter(null)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      !serviceFilter
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    Tutti
                  </button>
                  {SERVICE_FILTERS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setServiceFilter(serviceFilter === key ? null : key)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                        serviceFilter === key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Map + shop list */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                  {/* Map */}
                  <div className="h-[300px] rounded-lg overflow-hidden">
                    <LocationMap
                      userLocation={userLocation}
                      shops={filteredNearbyShops}
                      selectedShop={currentShop}
                      radiusKm={searchRadiusKm}
                      onLocationSelect={async (loc) => {
                        setUserLocation(loc);
                        setLocationSource("address");
                        setSelectedAddress("Posizione sulla mappa");
                        await fetchShopsByLocation(loc);
                      }}
                      onShopSelect={(shop) => handleShopSelect(shop)}
                      className="h-full w-full"
                    />
                  </div>

                  {/* Shop list */}
                  <div className="h-[300px] flex flex-col">
                    <p className="text-sm font-medium mb-2">
                      {currentShop ? "Cambia negozio:" : "Seleziona un negozio:"}
                    </p>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {filteredNearbyShops.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {serviceFilter ? "Nessun negozio con questo servizio" : "Nessun negozio trovato"}
                        </p>
                      ) : (
                        filteredNearbyShops.map((shop, index) => {
                          const isSelected = currentShop?.id === shop.id;
                          return (
                            <button
                              key={`${shop.id}-${index}`}
                              type="button"
                              onClick={() => handleShopSelect(shop)}
                              className={cn(
                                "w-full p-2.5 rounded-lg border text-left transition-all",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className={cn("text-sm truncate", isSelected && "font-medium")}>
                                    {shop.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {shop.city}
                                  </p>
                                  {shop.services && shop.services.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {shop.services.map((s) => {
                                        const f = SERVICE_FILTERS.find((sf) => sf.key === s);
                                        if (!f) return null;
                                        const SIcon = f.icon;
                                        return (
                                          <span key={s} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                            <SIcon className="h-2.5 w-2.5" />
                                            {f.label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <div>
                                    <p className="text-xs font-medium">
                                      {shop.distance < 1
                                        ? `${Math.round(shop.distance * 1000)} m`
                                        : `${shop.distance.toFixed(1)} km`}
                                    </p>
                                    {shop.hasExpressPickup && (
                                      <p className="text-xs text-green-600">Express</p>
                                    )}
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="border-t" />

          {/* Section: Date */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">Quando vuoi ritirare?</h3>
                <p className="text-sm text-muted-foreground">
                  Scegli quando ritirare il tuo ordine
                </p>
              </div>
            </div>

            {/* Express Option - Primary Focus */}
            <Button
              variant={
                selectedPickupDate &&
                selectedPickupDate.toDateString() === new Date().toDateString()
                  ? "default"
                  : "outline"
              }
              onClick={() => handleDateSelect(new Date())}
              className={cn(
                "w-full h-auto py-4 flex items-center justify-between",
                selectedPickupDate &&
                  selectedPickupDate.toDateString() === new Date().toDateString()
                  ? "ring-2 ring-primary ring-offset-2"
                  : "border-2"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="text-base font-semibold">Express</span>
                  <p className="text-sm text-muted-foreground font-normal">
                    Pronto in 1 ora
                  </p>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                Consigliato
              </span>
            </Button>

            {/* Alternative Options — collapsible */}
            <details className="group">
              <summary className="text-sm text-muted-foreground cursor-pointer select-none list-none flex items-center gap-1.5 hover:text-foreground transition-colors">
                <span className="text-xs transition-transform group-open:rotate-90">▶</span>
                Oppure scegli un altro giorno
              </summary>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {getQuickDateOptions()
                    .filter((option) => option.label !== "Oggi")
                    .map((option) => (
                      <Button
                        key={option.label}
                        variant={
                          selectedPickupDate &&
                          option.date.toDateString() ===
                            selectedPickupDate.toDateString()
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleDateSelect(option.date)}
                        className="flex-col h-auto py-3"
                      >
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.date.toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </Button>
                    ))}
                </div>

                <div className="pt-2">
                  <label className="text-sm text-muted-foreground">
                    Altra data
                  </label>
                  <input
                    type="date"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    min={new Date().toISOString().split("T")[0]}
                    value={
                      selectedPickupDate
                        ? selectedPickupDate.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDateSelect(new Date(e.target.value));
                      }
                    }}
                  />
                </div>
              </div>
            </details>
          </section>

          {/* Confirm Button */}
          {userLocation && selectedPickupDate && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                size="lg"
                onClick={() => setOpen(false)}
              >
                Conferma selezione
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
