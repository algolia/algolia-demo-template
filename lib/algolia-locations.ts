import { algoliasearch } from "algoliasearch";
import {
  Shop,
  ShopGeoloc,
  ShopWithDistance,
  NEARBY_RADIUS_KM,
} from "@/lib/types/shop";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { calculateDistance, hasExpressPickup } from "./click-collect-utils";

const client = algoliasearch(
  ALGOLIA_CONFIG.APP_ID,
  ALGOLIA_CONFIG.SEARCH_API_KEY
);

/**
 * Fetch all shop locations from Algolia
 */
export async function fetchShops(): Promise<Shop[]> {
  try {
    const result = await client.searchSingleIndex<Shop>({
      indexName: ALGOLIA_CONFIG.LOCATIONS_INDEX,
      searchParams: {
        query: "",
        hitsPerPage: 1000,
      },
    });

    return result.hits.map((hit) => ({
      id: hit.id || hit.objectID,
      name: hit.name,
      city: hit.city,
      address: hit.address,
      region: hit.region,
      _geoloc: hit._geoloc,
      phone: hit.phone,
      openingHours: hit.openingHours,
      services: hit.services,
    }));
  } catch (error) {
    console.error("Failed to fetch shops from Algolia:", error);
    return [];
  }
}

/**
 * Fetch shops sorted by distance from user location using Algolia's geo search
 * Returns ShopWithDistance with calculated distance and express pickup eligibility
 */
export async function fetchShopsByDistance(
  userLocation: ShopGeoloc
): Promise<ShopWithDistance[]> {
  try {
    const result = await client.searchSingleIndex<Shop>({
      indexName: ALGOLIA_CONFIG.LOCATIONS_INDEX,
      searchParams: {
        query: "",
        hitsPerPage: 1000,
        aroundLatLng: `${userLocation.lat},${userLocation.lng}`,
        aroundRadius: "all",
      },
    });

    return result.hits.map((hit) => {
      const distance = calculateDistance(userLocation, hit._geoloc);
      return {
        id: hit.id || hit.objectID,
        name: hit.name,
        city: hit.city,
        address: hit.address,
        region: hit.region,
        _geoloc: hit._geoloc,
        phone: hit.phone,
        openingHours: hit.openingHours,
        services: hit.services,
        distance,
        hasExpressPickup: hasExpressPickup(distance),
      };
    });
  } catch (error) {
    console.error("Failed to fetch shops by distance from Algolia:", error);
    return [];
  }
}

/**
 * Fetch nearby shops within the specified radius
 * @param userLocation User's coordinates
 * @param radiusKm Maximum distance in km (defaults to NEARBY_RADIUS_KM)
 * @returns Shops within radius, sorted by distance
 */
export async function fetchNearbyShops(
  userLocation: ShopGeoloc,
  radiusKm: number = NEARBY_RADIUS_KM
): Promise<ShopWithDistance[]> {
  try {
    const result = await client.searchSingleIndex<Shop>({
      indexName: ALGOLIA_CONFIG.LOCATIONS_INDEX,
      searchParams: {
        query: "",
        hitsPerPage: 100,
        aroundLatLng: `${userLocation.lat},${userLocation.lng}`,
        aroundRadius: radiusKm * 1000, // Convert to meters
      },
    });

    return result.hits.map((hit) => {
      const distance = calculateDistance(userLocation, hit._geoloc);
      return {
        id: hit.id || hit.objectID,
        name: hit.name,
        city: hit.city,
        address: hit.address,
        region: hit.region,
        _geoloc: hit._geoloc,
        phone: hit.phone,
        openingHours: hit.openingHours,
        services: hit.services,
        distance,
        hasExpressPickup: hasExpressPickup(distance),
      };
    });
  } catch (error) {
    console.error("Failed to fetch nearby shops from Algolia:", error);
    return [];
  }
}
