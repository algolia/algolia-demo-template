"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { User, users } from "@/lib/types/user";

interface UserContextType {
  currentUser: User | null;
  setUser: (user: User | null) => void;
  selectUserById: (userId: string) => void;
  personalizationFilters: string[] | undefined;
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

    const filters: string[] = [];

    // Iterate over all preference keys dynamically
    Object.entries(currentUser.preferences).forEach(([facetName, values]) => {
      if (values && typeof values === 'object') {
        // Each facet contains key-value pairs of preferences with scores
        Object.entries(values).forEach(([value, score]) => {
          // Format: "facetName:value<score=N>"
          filters.push(`${facetName}:${value}<score=${score}>`);
        });
      }
    });

    return filters.length > 0 ? filters : undefined;
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      setUser,
      selectUserById,
      personalizationFilters,
    }),
    [currentUser, setUser, selectUserById, personalizationFilters]
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

