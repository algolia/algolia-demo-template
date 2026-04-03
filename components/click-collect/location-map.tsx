"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navigation, Check } from "lucide-react";
import { Shop, ShopGeoloc, ShopWithDistance } from "@/lib/types/shop";
import { formatDistance } from "@/lib/click-collect-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components (they require window)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

interface LocationMapProps {
  userLocation: ShopGeoloc | null;
  shops: ShopWithDistance[];
  selectedShop: Shop | null;
  onLocationSelect: (location: ShopGeoloc) => void;
  onShopSelect: (shop: Shop) => void;
  radiusKm?: number;
  className?: string;
}

// Italy center coordinates
const ITALY_CENTER: [number, number] = [41.9028, 12.4964];
const DEFAULT_ZOOM = 6;
const LOCATION_ZOOM = 11;

// Component to handle map click events
function MapClickHandler({
  onLocationSelect,
  setTempMarker,
}: {
  onLocationSelect: (loc: ShopGeoloc) => void;
  setTempMarker: (loc: ShopGeoloc | null) => void;
}) {
  const { useMapEvents } = require("react-leaflet");

  useMapEvents({
    click: (e: { latlng: { lat: number; lng: number } }) => {
      const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
      setTempMarker(newLocation);
    },
  });

  return null;
}

// Component to fly to location when it changes
function FlyToLocation({ location }: { location: ShopGeoloc | null }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], LOCATION_ZOOM, {
        duration: 1.5,
      });
    }
  }, [location, map]);

  return null;
}

export function LocationMap({
  userLocation,
  shops,
  selectedShop,
  onLocationSelect,
  onShopSelect,
  radiusKm = 10,
  className,
}: LocationMapProps) {
  const [tempMarker, setTempMarker] = useState<ShopGeoloc | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [icons, setIcons] = useState<{
    userIcon: L.DivIcon | null;
    shopIcon: L.DivIcon | null;
    selectedShopIcon: L.DivIcon | null;
    tempIcon: L.DivIcon | null;
  }>({ userIcon: null, shopIcon: null, selectedShopIcon: null, tempIcon: null });

  // Only render on client side
  useEffect(() => {
    setIsClient(true);

    // Create custom icons
    import("leaflet").then((L) => {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `<div style="
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const shopIcon = L.divIcon({
        className: "shop-marker",
        html: `<div style="
          width: 28px;
          height: 28px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const selectedShopIcon = L.divIcon({
        className: "selected-shop-marker",
        html: `<div style="
          width: 36px;
          height: 36px;
          background: #8b5cf6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const tempIcon = L.divIcon({
        className: "temp-marker",
        html: `<div style="
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      setIcons({ userIcon, shopIcon, selectedShopIcon, tempIcon });
    });
  }, []);

  const handleConfirmLocation = useCallback(() => {
    if (tempMarker) {
      onLocationSelect(tempMarker);
      setTempMarker(null);
    }
  }, [tempMarker, onLocationSelect]);

  if (!isClient) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg", className)}>
        <p className="text-muted-foreground text-sm">Caricamento mappa...</p>
      </div>
    );
  }

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : ITALY_CENTER;
  const zoom = userLocation ? LOCATION_ZOOM : DEFAULT_ZOOM;

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onLocationSelect={onLocationSelect}
          setTempMarker={setTempMarker}
        />

        <FlyToLocation location={userLocation} />

        {/* User location marker with radius */}
        {userLocation && icons.userIcon && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={icons.userIcon}
            />
          </>
        )}

        {/* Temporary marker */}
        {tempMarker && icons.tempIcon && (
          <Marker
            position={[tempMarker.lat, tempMarker.lng]}
            icon={icons.tempIcon}
          />
        )}

        {/* Shop markers */}
        {shops.map((shop) => {
          const isSelected = selectedShop?.id === shop.id;
          const icon = isSelected ? icons.selectedShopIcon : icons.shopIcon;

          if (!icon) return null;

          return (
            <Marker
              key={shop.id}
              position={[shop._geoloc.lat, shop._geoloc.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onShopSelect(shop),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -20]}
                opacity={1}
                className="shop-tooltip"
              >
                <div className="p-2 min-w-[180px]">
                  <h3 className="font-semibold text-sm">{shop.name}</h3>
                  <p className="text-xs text-gray-600">{shop.city}</p>
                  {shop.address && (
                    <p className="text-xs text-gray-500 mt-1">{shop.address}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      {formatDistance(shop.distance)}
                    </span>
                    {isSelected ? (
                      <span className="text-xs text-primary font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Selezionato
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Clicca per selezionare
                      </span>
                    )}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Confirm location button */}
      {tempMarker && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <Button onClick={handleConfirmLocation} className="shadow-lg">
            <Navigation className="h-4 w-4 mr-2" />
            Conferma questa posizione
          </Button>
        </div>
      )}

      {/* Instructions overlay */}
      {!userLocation && !tempMarker && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-muted-foreground">
            Clicca sulla mappa per selezionare la tua posizione
          </p>
        </div>
      )}
    </div>
  );
}
