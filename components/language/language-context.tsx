"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { t as translate } from "@/lib/demo-config/translations";

interface LanguageContextType {
  language: "en";
  t: (key: string) => string;
}

const defaultValue: LanguageContextType = {
  language: "en",
  t: translate,
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      language: "en" as const,
      t: translate,
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
  return useContext(LanguageContext);
}
