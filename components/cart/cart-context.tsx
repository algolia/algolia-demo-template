"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number; // Current selling price (fullSellingPrice)
  originalPrice?: number; // Original price before discount (listPrice)
  quantity: number;
  image?: string;
  brand?: string;
  category?: string;
  storeId?: string;
  storeName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, "quantity"> & {
      quantity?: number;
    }
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  primaryCartStore: { storeId: string; storeName: string } | null;
  cartStoreBoosts: string[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (
      newItem: Omit<CartItem, "quantity"> & {
        quantity?: number;
      }
    ) => {
      setItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === newItem.id);

        if (existingItem) {
          return prevItems.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
              : item
          );
        }

        return [
          ...prevItems,
          {
            ...newItem,
            quantity: newItem.quantity || 1,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const cartStoreBoosts = useMemo(() => {
    const storeCounts = new Map<string, number>();
    for (const item of items) {
      if (item.storeId) {
        storeCounts.set(item.storeId, (storeCounts.get(item.storeId) || 0) + item.quantity);
      }
    }
    return Array.from(storeCounts.entries()).map(([storeId, count]) => {
      const score = Math.min(50, 10 + count * 5); // 15 for 1 item, 20 for 2, ..., capped at 50 — always above radius boost (10)
      return `availableInStores.objectID:${storeId}<score=${score}>`;
    });
  }, [items]);

  const primaryCartStore = useMemo(() => {
    const storeCounts = new Map<string, { count: number; name: string }>();
    for (const item of items) {
      if (item.storeId && item.storeName) {
        const existing = storeCounts.get(item.storeId);
        if (existing) {
          existing.count += item.quantity;
        } else {
          storeCounts.set(item.storeId, { count: item.quantity, name: item.storeName });
        }
      }
    }
    if (storeCounts.size === 0) return null;

    let maxStore = { id: "", name: "", count: 0 };
    for (const [id, { count, name }] of storeCounts) {
      if (count > maxStore.count) maxStore = { id, name, count };
    }
    return { storeId: maxStore.id, storeName: maxStore.name };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
      primaryCartStore,
      cartStoreBoosts,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
      primaryCartStore,
      cartStoreBoosts,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
