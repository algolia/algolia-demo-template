import { ShopGeoloc } from "./types/shop";

export interface GeocodingResult {
  id: string;
  placeName: string;
  location: ShopGeoloc;
  address?: string;
  city?: string;
}

const MAPBOX_BASE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

/**
 * Geocode an address query using Mapbox Geocoding API
 * @param query The address or place name to search
 * @returns Array of matching locations
 */
export async function geocodeAddress(
  query: string
): Promise<GeocodingResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    console.error("Mapbox token not configured");
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${MAPBOX_BASE_URL}/${encodedQuery}.json?access_token=${token}&country=it&types=address,place,locality&limit=5&language=it`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    return data.features.map(
      (feature: {
        id: string;
        place_name: string;
        center: [number, number];
        text: string;
        context?: Array<{ id: string; text: string }>;
      }) => ({
        id: feature.id,
        placeName: feature.place_name,
        location: {
          lat: feature.center[1],
          lng: feature.center[0],
        },
        address: feature.text,
        city: feature.context?.find((c) => c.id.startsWith("place."))?.text,
      })
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

/**
 * Reverse geocode a location to get address information
 * @param location The coordinates to reverse geocode
 * @returns The address information or null
 */
export async function reverseGeocode(
  location: ShopGeoloc
): Promise<GeocodingResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    console.error("Mapbox token not configured");
    return null;
  }

  try {
    const url = `${MAPBOX_BASE_URL}/${location.lng},${location.lat}.json?access_token=${token}&types=address,place&limit=1&language=it`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    return {
      id: feature.id,
      placeName: feature.place_name,
      location,
      address: feature.text,
      city: feature.context?.find(
        (c: { id: string; text: string }) => c.id.startsWith("place.")
      )?.text,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
