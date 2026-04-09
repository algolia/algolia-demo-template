import { ShopGeoloc, StoreAvailability, ShopWithDistance, Shop, EXPRESS_PICKUP_RADIUS_KM } from "./types/shop";

// Minimal interface for cart items (avoid circular dependency with cart-context)
interface CartItemWithAvailability {
  id: string;
  availableInStores?: StoreAvailability[];
}

/**
 * Calculate distance between two points using the Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: ShopGeoloc,
  point2: ShopGeoloc
): number {
  const R = 6371; // Earth's radius in km

  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 * @returns Formatted string like "250 m" or "5.2 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Check if a shop qualifies for express pickup (within 10km)
 */
export function hasExpressPickup(distanceKm: number): boolean {
  return distanceKm <= EXPRESS_PICKUP_RADIUS_KM;
}

/**
 * Get pickup time label based on stock status and distance
 * @param inStock Whether the product is in stock at this shop
 * @param distanceKm Distance to the shop in km
 * @returns Italian language label for pickup time
 */
export function getPickupTimeLabel(
  inStock: boolean,
  distanceKm: number
): string {
  if (!inStock) {
    return "Spedizione al negozio";
  }

  if (distanceKm <= EXPRESS_PICKUP_RADIUS_KM) {
    return "Pronto in 1 ora";
  }

  return "Disponibile oggi";
}

/**
 * Get estimated restock days based on typical shipping times
 * For out-of-stock items that need to be shipped to the store
 */
export function getEstimatedRestockDays(): number {
  return 3; // Default 3 days for restock shipping
}

/**
 * Format a date for display in Italian
 */
export function formatPickupDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) {
    return "Oggi";
  }
  if (isSameDay(date, tomorrow)) {
    return "Domani";
  }

  return date.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

/**
 * Get quick date options for pickup date selection
 */
export function getQuickDateOptions(): Array<{ label: string; date: Date }> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    { label: "Oggi", date: today },
    { label: "Domani", date: tomorrow },
    { label: "Tra 1 settimana", date: nextWeek },
  ];
}

/**
 * Find a nearby shop that has all cart items + a new item in stock
 * Returns the closest shop that satisfies this condition, or null if none found
 *
 * @param cartItems - Current items in the cart with their availableInStores
 * @param newItemAvailability - availableInStores array for the new item being added
 * @param nearbyShops - List of nearby shops sorted by distance
 * @param excludeShopId - Optional shop ID to exclude from search (e.g., current cart shop)
 */
export function findShopWithAllItems(
  cartItems: CartItemWithAvailability[],
  newItemAvailability: StoreAvailability[] | undefined,
  nearbyShops: ShopWithDistance[],
  excludeShopId?: string
): ShopWithDistance | null {
  if (!newItemAvailability || newItemAvailability.length === 0) {
    return null;
  }

  // Get all product IDs we need to check (cart items + new item is implicit in newItemAvailability)
  const cartItemsWithAvailability = cartItems.filter(
    (item) => item.availableInStores && item.availableInStores.length > 0
  );

  // If no cart items have availability data, just find first shop with new item in stock
  if (cartItemsWithAvailability.length === 0) {
    return nearbyShops.find((shop) => {
      if (excludeShopId && shop.id === excludeShopId) return false;
      return newItemAvailability.some((a) => a.objectID === shop.id && a.inStock);
    }) || null;
  }

  // Find a shop that has ALL items in stock
  for (const shop of nearbyShops) {
    // Skip excluded shop
    if (excludeShopId && shop.id === excludeShopId) continue;

    // Check if new item is in stock at this shop
    const newItemInStock = newItemAvailability.some(
      (a) => a.objectID === shop.id && a.inStock
    );
    if (!newItemInStock) continue;

    // Check if ALL cart items are in stock at this shop
    const allCartItemsInStock = cartItemsWithAvailability.every((item) =>
      item.availableInStores!.some((a) => a.objectID === shop.id && a.inStock)
    );

    if (allCartItemsInStock) {
      return shop;
    }
  }

  return null;
}

export type StoreResolution =
  | { type: "resolved"; storeId: string; storeName: string }
  | { type: "different-store"; storeId: string; storeName: string; cartStoreName: string }
  | { type: "none" };

/**
 * Resolve which store a product should be associated with for cart purposes.
 *
 * Priority:
 * 1. If cart already has items from a store ("primary cart store"), prefer that store
 *    → avoids splitting pickup across multiple stores
 * 2. If not available at the cart's primary store, return "different-store" result
 *    so the UI can warn the user before adding
 * 3. If cart is empty: use currentShop if in stock, otherwise closest nearby shop
 * 4. null if no store has stock
 */
export function resolveStoreForProduct(
  availableInStores: StoreAvailability[] | undefined,
  currentShop: Shop | null,
  nearbyShops: ShopWithDistance[],
  primaryCartStoreId?: string | null,
  primaryCartStoreName?: string | null,
): StoreResolution {
  if (!availableInStores?.length) return { type: "none" };

  // If cart has a primary store, try to keep items together
  if (primaryCartStoreId && primaryCartStoreName) {
    const atCartStore = availableInStores.find(
      (a) => a.objectID === primaryCartStoreId && a.inStock
    );
    if (atCartStore) {
      return { type: "resolved", storeId: primaryCartStoreId, storeName: primaryCartStoreName };
    }

    // Not available at cart's primary store — find the best alternative
    const alternative = findBestStore(availableInStores, currentShop, nearbyShops);
    if (alternative) {
      return {
        type: "different-store",
        storeId: alternative.storeId,
        storeName: alternative.storeName,
        cartStoreName: primaryCartStoreName,
      };
    }
    return { type: "none" };
  }

  // Cart is empty — standard resolution
  const best = findBestStore(availableInStores, currentShop, nearbyShops);
  return best ? { type: "resolved", ...best } : { type: "none" };
}

function findBestStore(
  availableInStores: StoreAvailability[],
  currentShop: Shop | null,
  nearbyShops: ShopWithDistance[],
): { storeId: string; storeName: string } | null {
  // Check current selected shop first
  if (currentShop) {
    const atCurrentShop = availableInStores.find(
      (a) => a.objectID === currentShop.id && a.inStock
    );
    if (atCurrentShop) {
      return { storeId: currentShop.id, storeName: currentShop.name };
    }
  }

  // Find closest nearby shop with stock
  for (const shop of nearbyShops) {
    const hasStock = availableInStores.find(
      (a) => a.objectID === shop.id && a.inStock
    );
    if (hasStock) {
      return { storeId: shop.id, storeName: shop.name };
    }
  }

  return null;
}
