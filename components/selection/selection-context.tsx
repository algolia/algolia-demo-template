"use client";

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";

const MAX_SELECTED_PRODUCTS = 5;

export interface SelectedProduct {
  objectID: string;
  name: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  // Content fields
  title?: string;
  url?: string;
}

interface SelectionContextType {
  selectedProducts: SelectedProduct[];
  isSelected: (objectID: string) => boolean;
  toggleSelection: (product: SelectedProduct) => void;
  clearSelection: () => void;
  selectionCount: number;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const isSelected = useCallback(
    (objectID: string) => selectedProducts.some((p) => p.objectID === objectID),
    [selectedProducts]
  );

  const toggleSelection = useCallback((product: SelectedProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.objectID === product.objectID);
      if (exists) {
        return prev.filter((p) => p.objectID !== product.objectID);
      }
      if (prev.length >= MAX_SELECTED_PRODUCTS) {
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedProducts,
      isSelected,
      toggleSelection,
      clearSelection,
      selectionCount: selectedProducts.length,
    }),
    [selectedProducts, isSelected, toggleSelection, clearSelection]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
