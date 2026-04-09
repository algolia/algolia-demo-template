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
  CircleDot,
  Check,
  LocateFixed,
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
import { Shop, ShopGeoloc } from "@/lib/types/shop";
import { getQuickDateOptions } from "@/lib/click-collect-utils";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "map";
type SelectionMode = "range" | "shop";

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export function ClickCollectSelector() {
  const [open, setOpen] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("range");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

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

  const handleSelectionModeChange = useCallback(
    (mode: SelectionMode) => {
      setSelectionMode(mode);
      if (mode === "range") {
        setShop(null);
      }
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
          {/* Selection Mode Toggle */}
          <section className="space-y-4">
            <h3 className="font-medium">Come vuoi ritirare?</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: By Range */}
              <button
                type="button"
                onClick={() => handleSelectionModeChange("range")}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectionMode === "range"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    selectionMode === "range" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <CircleDot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Per distanza</p>
                    <p className="text-xs text-muted-foreground">
                      Tutti i negozi entro un raggio
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Specific Shop */}
              <button
                type="button"
                onClick={() => handleSelectionModeChange("shop")}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectionMode === "shop"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    selectionMode === "shop" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Negozio specifico</p>
                    <p className="text-xs text-muted-foreground">
                      Scegli un punto vendita
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <div className="border-t" />

          {/* Section: Location / Range Selection */}
          {selectionMode === "range" ? (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">La tua posizione</h3>
                  <p className="text-sm text-muted-foreground">
                    Imposta la posizione e il raggio di ricerca
                  </p>
                </div>
              </div>

              {/* Location input */}
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

                  {/* Results summary */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">{nearbyShops.length}</span> negozi trovati entro{" "}
                      <span className="font-medium">{searchRadiusKm} km</span>
                    </p>
                    {nearbyShops.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        I prodotti disponibili in questi negozi saranno evidenziati
                      </p>
                    )}
                  </div>

                  {/* Map preview */}
                  <div className="h-[250px] rounded-lg overflow-hidden">
                    <LocationMap
                      userLocation={userLocation}
                      shops={nearbyShops}
                      selectedShop={null}
                      radiusKm={searchRadiusKm}
                      onLocationSelect={async (loc) => {
                        setUserLocation(loc);
                        setLocationSource("address");
                        setSelectedAddress("Posizione sulla mappa");
                        await fetchShopsByLocation(loc);
                      }}
                      onShopSelect={() => {}}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Scegli il negozio</h3>
                  <p className="text-sm text-muted-foreground">
                    Seleziona il punto vendita per il ritiro
                  </p>
                </div>
              </div>

              {/* Location input for shop search */}
              {!userLocation ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Prima imposta la tua posizione per vedere i negozi vicini
                  </p>
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
                  {/* Current shop selection summary */}
                  {currentShop && (
                    <div className="p-3 bg-primary/5 border-2 border-primary rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{currentShop.name}</p>
                          <p className="text-xs text-muted-foreground">{currentShop.city}</p>
                        </div>
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  )}

                  {/* Store-first mode toggle */}
                  {currentShop && (
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
                  )}

                  {/* Map and shop list grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                    {/* Map */}
                    <div className="h-[300px] rounded-lg overflow-hidden">
                      <LocationMap
                        userLocation={userLocation}
                        shops={nearbyShops}
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
                        {nearbyShops.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nessun negozio trovato
                          </p>
                        ) : (
                          nearbyShops.map((shop, index) => {
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
          )}

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

            {/* Alternative Options */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Oppure scegli un altro giorno:</p>
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
