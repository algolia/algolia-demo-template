"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { User } from "@/lib/types/user";
import { users } from "@/lib/demo-config/users";

interface UserContextType {
  currentUser: User | null;
  setUser: (user: User | null) => void;
  selectUserById: (userId: string) => void;
  personalizationFilters: (string | string[])[] | undefined;
  segments: string[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const setUser = useCallback((user: User | null) => {
    setCurrentUser(user);
  }, []);

  const selectUserById = useCallback((userId: string) => {
    const user = users.find((u) => u.id === userId);
    setCurrentUser(user || null);
  }, []);

  /**
   * Compute personalization filters from user preferences
   *
   * Transforms user preferences object into an array of filter strings
   * in the format: "facetName:value<score=N>"
   *
   * This format is used by:
   * - ForYouFilter component to display personalized filter suggestions
   * - Algolia Composition API for search result boosting
   * - AI agents for personalized recommendations
   *
   * Example output:
   * [
   *   "categories.lvl0:Nutrición deportiva<score=20>",
   *   "brand:Sport Series<score=17>",
   *   "categories.lvl1:Proteínas<score=18>"
   * ]
   */
  const personalizationFilters = useMemo(() => {
    if (!currentUser?.preferences) {
      return undefined;
    }

    // Group filters by facet into nested arrays so scores accumulate across groups.
    // optionalFilters: [["a:x<score=10>"], ["b:y<score=8>", "b:z<score=5>"]]
    //   → values within an inner array are OR'd (max score wins)
    //   → scores across separate arrays ADD UP
    // This achieves the same effect as sumOrFiltersScores: true
    const groups: (string | string[])[] = [];

    Object.entries(currentUser.preferences).forEach(([facetName, values]) => {
      if (values && typeof values === 'object') {
        const group = Object.entries(values).map(
          ([value, score]) => `${facetName}:${value}<score=${score}>`
        );
        if (group.length > 0) {
          groups.push(group);
        }
      }
    });

    return groups.length > 0 ? groups : undefined;
  }, [currentUser]);

  const segments = useMemo(() => {
    return currentUser?.segments ?? [];
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      setUser,
      selectUserById,
      personalizationFilters,
      segments,
    }),
    [currentUser, setUser, selectUserById, personalizationFilters, segments]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  
  return context;
}

