"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import { InstantSearch, useConfigure, useInstantSearch } from "react-instantsearch";
import { CartProvider } from "@/components/cart/cart-context";
import { NavBar } from "@/components/navbar/navbar";
import { SidepanelProvider } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { SelectionProvider } from "@/components/selection/selection-context";
import { UserProvider, useUser } from "@/components/user/user-context";
import { ClickCollectProvider, useClickCollect } from "@/components/click-collect/click-collect-context";
import { ShopSelectorSheet } from "@/components/click-collect/shop-selector-sheet";
import { compositionClient } from "@algolia/composition";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

const searchClient = compositionClient(
  ALGOLIA_CONFIG.APP_ID,
  ALGOLIA_CONFIG.SEARCH_API_KEY
);

/**
 * PersonalizedConfigure component
 * Applies user preference-based personalization to all InstantSearch queries
 * Uses optionalFilters with score boosting - doesn't exclude results, just boosts relevant ones
 * Automatically refreshes search when user changes
 */
function PersonalizedConfigure() {
  const { personalizationFilters, currentUser } = useUser();
  const { shopBoostFilters, currentShop } = useClickCollect();
  const { refresh } = useInstantSearch();
  const prevUserIdRef = useRef<string | null>(null);
  const prevShopIdRef = useRef<string | null>(null);

  // Merge user preferences + shop boost into optionalFilters
  const optionalFilters = useMemo(() => {
    const filters: string[] = [
      ...(personalizationFilters || []),
      ...shopBoostFilters,
    ];
    return filters.length > 0 ? filters : undefined;
  }, [personalizationFilters, shopBoostFilters]);

  // Configure personalization
  useConfigure({
    hitsPerPage: 12,
    optionalFilters,
  });

  // Refresh search when user or shop changes
  useEffect(() => {
    const currentUserId = currentUser?.id ?? null;
    const currentShopId = currentShop?.objectID ?? null;

    const userChanged =
      prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId;
    const shopChanged =
      prevShopIdRef.current !== null && prevShopIdRef.current !== currentShopId;

    if (userChanged || shopChanged) {
      refresh();
    }

    prevUserIdRef.current = currentUserId;
    prevShopIdRef.current = currentShopId;
  }, [currentUser?.id, currentShop?.objectID, refresh]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <UserProvider>
        <ClickCollectProvider>
          <SelectionProvider>
            <SidepanelProvider>
            <InstantSearch
              compositionID={ALGOLIA_CONFIG.COMPOSITION_ID}
              searchClient={searchClient}
              future={{
                preserveSharedStateOnUnmount: true,
              }}
              routing={true}
            >
              <PersonalizedConfigure />
              <Suspense fallback={<NavBarSkeleton />}>
                <NavBar />
              </Suspense>
              {children}
            </InstantSearch>
            </SidepanelProvider>
          </SelectionProvider>
          <ShopSelectorSheet />
        </ClickCollectProvider>
      </UserProvider>
    </CartProvider>
  );
}

function NavBarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded animate-pulse" />
          <div className="hidden sm:block w-24 h-6 bg-muted rounded animate-pulse" />
          <div className="flex-1 max-w-md h-10 bg-muted rounded animate-pulse" />
          <div className="w-10 h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </header>
  );
}
