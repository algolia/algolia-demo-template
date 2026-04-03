"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { translations } from "@/lib/demo-config/translations";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      language: "it",
      setLanguage: () => {},
      t: (key: string) => translations["it"]?.[key] ?? key,
    }),
    []
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
