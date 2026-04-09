"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import {
  Shop,
  ShopGeoloc,
  ShopWithDistance,
  SHOP_BOOST_SCORE,
} from "@/lib/types/shop";
import {
  fetchShops,
  fetchShopsByDistance,
  fetchNearbyShops,
} from "@/lib/algolia-locations";

const STORAGE_KEY_SHOP = "arcaplanet_selected_shop";
const STORAGE_KEY_LOCATION = "arcaplanet_user_location";
const STORAGE_KEY_PICKUP_DATE = "arcaplanet_pickup_date";
const STORAGE_KEY_RADIUS = "arcaplanet_search_radius";
const STORAGE_KEY_STORE_MODE = "arcaplanet_store_mode";
const DEFAULT_RADIUS_KM = 10;

type StoreMode = "radius" | "store-first";

interface ClickCollectContextType {
  // User location
  userLocation: ShopGeoloc | null;
  setUserLocation: (loc: ShopGeoloc | null) => void;
  locationSource: "browser" | "address" | null;
  setLocationSource: (source: "browser" | "address" | null) => void;

  // Search radius
  searchRadiusKm: number;
  setSearchRadiusKm: (radius: number) => void;

  // Pickup date
  selectedPickupDate: Date | null;
  setSelectedPickupDate: (date: Date | null) => void;

  // Shop selection
  currentShop: Shop | null;
  setShop: (shop: Shop | null) => void;

  // All shops (without distance, for map display)
  allShops: Shop[];

  // Computed from Algolia geo-search
  nearbyShops: ShopWithDistance[];
  allShopsByDistance: ShopWithDistance[];

  // Multi-shop boost filters for Algolia
  shopBoostFilters: string[];
  // Single shop boost filter (for backwards compatibility)
  shopBoostFilter: string | undefined;

  // Loading states
  isLoadingShops: boolean;

  // Store-first mode
  storeMode: StoreMode;
  setStoreMode: (mode: StoreMode) => void;
  storeFirstFilter: string | null;

  // Actions
  clearSelection: () => void;
  fetchShopsByLocation: (loc: ShopGeoloc, radiusKm?: number) => Promise<void>;
  fetchAllShops: () => Promise<void>;
}

const ClickCollectContext = createContext<ClickCollectContextType | undefined>(
  undefined
);

export function ClickCollectProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<ShopGeoloc | null>(
    null
  );
  const [locationSource, setLocationSource] = useState<
    "browser" | "address" | null
  >(null);
  const [searchRadiusKm, setSearchRadiusKmState] = useState<number>(DEFAULT_RADIUS_KM);
  const [selectedPickupDate, setSelectedPickupDateState] = useState<Date | null>(
    null
  );
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [nearbyShops, setNearbyShops] = useState<ShopWithDistance[]>([]);
  const [allShopsByDistance, setAllShopsByDistance] = useState<
    ShopWithDistance[]
  >([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storeMode, setStoreModeState] = useState<StoreMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY_STORE_MODE) as StoreMode) || "radius";
    }
    return "radius";
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedLocation = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (storedLocation) {
        const loc = JSON.parse(storedLocation);
        if (loc.lat && loc.lng) {
          setUserLocationState(loc);
        }
      }

      const storedShop = localStorage.getItem(STORAGE_KEY_SHOP);
      if (storedShop) {
        const shop = JSON.parse(storedShop);
        if (shop.id) {
          setCurrentShopState(shop);
        }
      }

      const storedDate = localStorage.getItem(STORAGE_KEY_PICKUP_DATE);
      if (storedDate) {
        const date = new Date(storedDate);
        if (!isNaN(date.getTime())) {
          setSelectedPickupDateState(date);
        }
      }

      const storedRadius = localStorage.getItem(STORAGE_KEY_RADIUS);
      if (storedRadius) {
        const radius = parseInt(storedRadius, 10);
        if (!isNaN(radius) && radius > 0) {
          setSearchRadiusKmState(radius);
        }
      }

      const storedStoreMode = localStorage.getItem(STORAGE_KEY_STORE_MODE);
      if (storedStoreMode === "radius" || storedStoreMode === "store-first") {
        setStoreModeState(storedStoreMode);
      }
    } catch (error) {
      console.error("Error hydrating click-collect state:", error);
    }
    setIsHydrated(true);
  }, []);

  // Fetch shops when location or radius changes
  useEffect(() => {
    if (userLocation && isHydrated) {
      fetchShopsByLocationInternal(userLocation, searchRadiusKm);
    }
  }, [userLocation, searchRadiusKm, isHydrated]);

  const fetchShopsByLocationInternal = async (loc: ShopGeoloc, radiusKm: number) => {
    setIsLoadingShops(true);
    try {
      const [nearby, all] = await Promise.all([
        fetchNearbyShops(loc, radiusKm),
        fetchShopsByDistance(loc),
      ]);
      setNearbyShops(nearby);
      setAllShopsByDistance(all);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const setUserLocation = useCallback((loc: ShopGeoloc | null) => {
    setUserLocationState(loc);
    if (loc) {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(loc));
    } else {
      localStorage.removeItem(STORAGE_KEY_LOCATION);
    }
  }, []);

  const setSelectedPickupDate = useCallback((date: Date | null) => {
    setSelectedPickupDateState(date);
    if (date) {
      localStorage.setItem(STORAGE_KEY_PICKUP_DATE, date.toISOString());
    } else {
      localStorage.removeItem(STORAGE_KEY_PICKUP_DATE);
    }
  }, []);

  const setShop = useCallback((shop: Shop | null) => {
    setCurrentShopState(shop);
    if (shop) {
      localStorage.setItem(STORAGE_KEY_SHOP, JSON.stringify(shop));
    } else {
      localStorage.removeItem(STORAGE_KEY_SHOP);
    }
  }, []);

  const setSearchRadiusKm = useCallback((radius: number) => {
    setSearchRadiusKmState(radius);
    localStorage.setItem(STORAGE_KEY_RADIUS, radius.toString());
  }, []);

  const setStoreMode = useCallback((mode: StoreMode) => {
    setStoreModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_STORE_MODE, mode);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setUserLocationState(null);
    setLocationSource(null);
    setSelectedPickupDateState(null);
    setCurrentShopState(null);
    setNearbyShops([]);
    setAllShopsByDistance([]);
    setStoreModeState("radius");
    localStorage.removeItem(STORAGE_KEY_LOCATION);
    localStorage.removeItem(STORAGE_KEY_SHOP);
    localStorage.removeItem(STORAGE_KEY_PICKUP_DATE);
    localStorage.removeItem(STORAGE_KEY_STORE_MODE);
  }, []);

  const fetchShopsByLocation = useCallback(async (loc: ShopGeoloc, radiusKm?: number) => {
    await fetchShopsByLocationInternal(loc, radiusKm ?? searchRadiusKm);
  }, [searchRadiusKm]);

  const fetchAllShopsInternal = useCallback(async () => {
    if (allShops.length > 0) return; // Already loaded
    setIsLoadingShops(true);
    try {
      const shops = await fetchShops();
      setAllShops(shops);
    } catch (error) {
      console.error("Error fetching all shops:", error);
    } finally {
      setIsLoadingShops(false);
    }
  }, [allShops.length]);

  // Compute multi-shop boost filters
  // Boost products available at nearby shops (weighted by distance)
  const shopBoostFilters = useMemo(() => {
    if (nearbyShops.length > 0) {
      return nearbyShops.map((shop, index) => {
        // Decay score by distance ranking: 25, 22, 19, 16, 13, 10, 7, 5, 5, 5...
        const score = Math.max(5, SHOP_BOOST_SCORE - index * 3);
        return `availableInStores.objectID:${shop.id}<score=${score}>`;
      });
    }

    return [];
  }, [nearbyShops]);

  // Single shop boost filter for backwards compatibility
  const shopBoostFilter = useMemo(() => {
    if (!currentShop) return undefined;
    return `availableInStores.objectID:${currentShop.id}<score=${SHOP_BOOST_SCORE}>`;
  }, [currentShop]);

  // Hard filter for store-first mode: show ONLY products available at the selected store
  const storeFirstFilter = useMemo(() => {
    if (storeMode === "store-first" && currentShop) {
      return `availableInStores.objectID:${currentShop.id}`;
    }
    return null;
  }, [storeMode, currentShop]);

  const value = useMemo(
    () => ({
      userLocation,
      setUserLocation,
      locationSource,
      setLocationSource,
      searchRadiusKm,
      setSearchRadiusKm,
      selectedPickupDate,
      setSelectedPickupDate,
      currentShop,
      setShop,
      allShops,
      nearbyShops,
      allShopsByDistance,
      shopBoostFilters,
      shopBoostFilter,
      storeMode,
      setStoreMode,
      storeFirstFilter,
      isLoadingShops,
      clearSelection,
      fetchShopsByLocation,
      fetchAllShops: fetchAllShopsInternal,
    }),
    [
      userLocation,
      setUserLocation,
      locationSource,
      searchRadiusKm,
      setSearchRadiusKm,
      selectedPickupDate,
      setSelectedPickupDate,
      currentShop,
      setShop,
      allShops,
      nearbyShops,
      allShopsByDistance,
      shopBoostFilters,
      shopBoostFilter,
      storeMode,
      setStoreMode,
      storeFirstFilter,
      isLoadingShops,
      clearSelection,
      fetchShopsByLocation,
      fetchAllShopsInternal,
    ]
  );

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <ClickCollectContext.Provider
        value={{
          userLocation: null,
          setUserLocation: () => {},
          locationSource: null,
          setLocationSource: () => {},
          searchRadiusKm: DEFAULT_RADIUS_KM,
          setSearchRadiusKm: () => {},
          selectedPickupDate: null,
          setSelectedPickupDate: () => {},
          currentShop: null,
          setShop: () => {},
          allShops: [],
          nearbyShops: [],
          allShopsByDistance: [],
          shopBoostFilters: [],
          shopBoostFilter: undefined,
          storeMode: "radius" as StoreMode,
          setStoreMode: () => {},
          storeFirstFilter: null,
          isLoadingShops: false,
          clearSelection: () => {},
          fetchShopsByLocation: async () => {},
          fetchAllShops: async () => {},
        }}
      >
        {children}
      </ClickCollectContext.Provider>
    );
  }

  return (
    <ClickCollectContext.Provider value={value}>
      {children}
    </ClickCollectContext.Provider>
  );
}

export function useClickCollect() {
  const context = useContext(ClickCollectContext);

  if (context === undefined) {
    throw new Error(
      "useClickCollect must be used within a ClickCollectProvider"
    );
  }

  return context;
}
