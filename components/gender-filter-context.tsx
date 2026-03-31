"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type GenderOption = "Men" | "Women" | "Kids" | null;

const GenderFilterContext = createContext<{
  selectedGender: GenderOption;
  setSelectedGender: (g: GenderOption) => void;
  genderFilter: string | undefined;
}>({
  selectedGender: null,
  setSelectedGender: () => {},
  genderFilter: undefined,
});

export function GenderFilterProvider({ children }: { children: ReactNode }) {
  const [selectedGender, setSelectedGender] = useState<GenderOption>(null);

  const genderFilter = selectedGender
    ? `gender:"${selectedGender}" OR gender:"Unisex"`
    : undefined;

  return (
    <GenderFilterContext.Provider
      value={{ selectedGender, setSelectedGender, genderFilter }}
    >
      {children}
    </GenderFilterContext.Provider>
  );
}

export function useGenderFilter() {
  return useContext(GenderFilterContext);
}
