import { algoliasearch } from "algoliasearch";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import type { Shop, ShopWithDistance } from "@/lib/types/shop";

const client = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);

export async function fetchAllShops(): Promise<Shop[]> {
  const { hits } = await client.searchSingleIndex<Shop>({
    indexName: ALGOLIA_CONFIG.LOCATIONS_INDEX,
    searchParams: {
      query: "",
      hitsPerPage: 1000,
    },
  });
  return hits;
}

/**
 * Haversine distance between two points in km.
 */
export function computeDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function sortShopsByDistance(
  shops: Shop[],
  location: { lat: number; lng: number }
): ShopWithDistance[] {
  return shops
    .map((shop) => ({
      ...shop,
      distance: computeDistance(location, shop._geoloc),
    }))
    .sort((a, b) => a.distance - b.distance);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Predefined city center coordinates for the simplified city selector
 * (no Mapbox/geocoding dependency needed).
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Valencia: { lat: 39.4699, lng: -0.3763 },
  Paterna: { lat: 39.5028, lng: -0.4406 },
  Torrent: { lat: 39.4365, lng: -0.4654 },
  Gandía: { lat: 38.968, lng: -0.1812 },
  Alicante: { lat: 38.3452, lng: -0.491 },
  Elche: { lat: 38.2669, lng: -0.6983 },
  Benidorm: { lat: 38.541, lng: -0.1225 },
  Alcoy: { lat: 38.6985, lng: -0.4737 },
  "Castellón de la Plana": { lat: 39.9864, lng: -0.0513 },
  Burriana: { lat: 39.8893, lng: -0.0849 },
  Vinaròs: { lat: 40.4706, lng: 0.4753 },
  Murcia: { lat: 37.9922, lng: -1.1307 },
  Cartagena: { lat: 37.6, lng: -0.9863 },
  Lorca: { lat: 37.6714, lng: -1.7012 },
  Albacete: { lat: 38.9942, lng: -1.8564 },
  Cuenca: { lat: 40.0704, lng: -2.1374 },
};
