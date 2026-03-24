"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Shop, ShopWithDistance } from "@/lib/types/shop";
import type { Product } from "@/lib/types/product";
import {
  fetchAllShops,
  sortShopsByDistance,
  CITY_COORDINATES,
} from "@/lib/algolia/shops";

interface ClickCollectContextType {
  // Shop state
  currentShop: Shop | null;
  allShops: Shop[];
  nearbyShops: ShopWithDistance[];
  selectedCity: string | null;
  isShopSelectorOpen: boolean;

  // Actions
  selectShop: (shop: Shop) => void;
  clearShop: () => void;
  selectCity: (city: string) => void;
  openShopSelector: () => void;
  closeShopSelector: () => void;

  // Computed
  shopBoostFilters: string[];
  getProductAvailability: (
    product: Product
  ) => { inStock: boolean; qty: number } | null;
}

const ClickCollectContext = createContext<ClickCollectContextType | null>(null);

const LS_SHOP_KEY = "consum_selected_shop";
const LS_CITY_KEY = "consum_selected_city";

export function ClickCollectProvider({ children }: { children: ReactNode }) {
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isShopSelectorOpen, setIsShopSelectorOpen] = useState(false);

  // Load shops from Algolia on mount
  useEffect(() => {
    fetchAllShops().then(setAllShops).catch(console.error);
  }, []);

  // Rehydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_SHOP_KEY);
      if (saved) setCurrentShop(JSON.parse(saved));
      const savedCity = localStorage.getItem(LS_CITY_KEY);
      if (savedCity) setSelectedCity(savedCity);
    } catch {
      // ignore
    }
  }, []);

  // Compute nearby shops sorted by distance
  const nearbyShops = useMemo(() => {
    if (!selectedCity || allShops.length === 0) return [];
    const coords = CITY_COORDINATES[selectedCity];
    if (!coords) return [];
    return sortShopsByDistance(allShops, coords);
  }, [selectedCity, allShops]);

  const selectShop = useCallback((shop: Shop) => {
    setCurrentShop(shop);
    try {
      localStorage.setItem(LS_SHOP_KEY, JSON.stringify(shop));
    } catch {
      // ignore
    }
  }, []);

  const clearShop = useCallback(() => {
    setCurrentShop(null);
    try {
      localStorage.removeItem(LS_SHOP_KEY);
    } catch {
      // ignore
    }
  }, []);

  const selectCity = useCallback((city: string) => {
    setSelectedCity(city);
    try {
      localStorage.setItem(LS_CITY_KEY, city);
    } catch {
      // ignore
    }
  }, []);

  const openShopSelector = useCallback(
    () => setIsShopSelectorOpen(true),
    []
  );
  const closeShopSelector = useCallback(
    () => setIsShopSelectorOpen(false),
    []
  );

  // Boost filter for Algolia optionalFilters
  const shopBoostFilters = useMemo(() => {
    if (!currentShop) return [];
    return [`shopAvailability.shopId:${currentShop.objectID}<score=10>`];
  }, [currentShop]);

  // Check product availability at selected shop
  const getProductAvailability = useCallback(
    (product: Product) => {
      if (!currentShop || !product.shopAvailability) return null;
      const entry = product.shopAvailability.find(
        (a) => a.shopId === currentShop.objectID
      );
      if (!entry) return null;
      return { inStock: entry.inStock, qty: entry.qty };
    },
    [currentShop]
  );

  const value = useMemo(
    () => ({
      currentShop,
      allShops,
      nearbyShops,
      selectedCity,
      isShopSelectorOpen,
      selectShop,
      clearShop,
      selectCity,
      openShopSelector,
      closeShopSelector,
      shopBoostFilters,
      getProductAvailability,
    }),
    [
      currentShop,
      allShops,
      nearbyShops,
      selectedCity,
      isShopSelectorOpen,
      selectShop,
      clearShop,
      selectCity,
      openShopSelector,
      closeShopSelector,
      shopBoostFilters,
      getProductAvailability,
    ]
  );

  return (
    <ClickCollectContext.Provider value={value}>
      {children}
    </ClickCollectContext.Provider>
  );
}

export function useClickCollect() {
  const ctx = useContext(ClickCollectContext);
  if (!ctx) {
    throw new Error("useClickCollect must be used within ClickCollectProvider");
  }
  return ctx;
}
