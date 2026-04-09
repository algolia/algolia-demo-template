"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import { InstantSearch, useConfigure, useInstantSearch } from "react-instantsearch";
import { CartProvider } from "@/components/cart/cart-context";
import { NavBar } from "@/components/navbar/navbar";
import { SidepanelProvider } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { SelectionProvider } from "@/components/selection/selection-context";
import { UserProvider, useUser } from "@/components/user/user-context";
import { ClickCollectProvider, useClickCollect } from "@/components/click-collect/click-collect-context";
import { useCart } from "@/components/cart/cart-context";
import { compositionClient } from "@algolia/composition";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { LanguageProvider } from "@/components/language/language-context";

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
  const { personalizationFilters, currentUser, segments } = useUser();
  const { shopBoostFilters, storeFirstFilter, storeMode } = useClickCollect();
  const { cartStoreBoosts } = useCart();
  const { refresh } = useInstantSearch();
  const prevUserIdRef = useRef<string | null>(null);
  const prevShopBoostsRef = useRef<string[]>([]);
  const prevSegmentsRef = useRef<string[]>([]);

  // Merge user personalization, shop boost, and cart store boost filters
  const optionalFilters = useMemo(() => {
    const filters: string[] = [];
    if (personalizationFilters?.length) filters.push(...personalizationFilters);
    if (shopBoostFilters?.length) filters.push(...shopBoostFilters);
    if (cartStoreBoosts?.length) filters.push(...cartStoreBoosts);
    return filters.length > 0 ? filters : undefined;
  }, [personalizationFilters, shopBoostFilters, cartStoreBoosts]);

  // Configure personalization
  useConfigure({
    hitsPerPage: 12,
    optionalFilters: storeMode === "store-first" ? undefined : optionalFilters,
    filters: storeFirstFilter || undefined,
    ruleContexts: segments.length > 0 ? segments : undefined,
  });

  // Refresh when user, shop boosts, or segments change
  useEffect(() => {
    const currentUserId = currentUser?.id ?? null;
    const userChanged = prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId;
    const boostsChanged = JSON.stringify(prevShopBoostsRef.current) !== JSON.stringify(shopBoostFilters);
    const segmentsChanged = JSON.stringify(prevSegmentsRef.current) !== JSON.stringify(segments);

    if (userChanged || boostsChanged || segmentsChanged) {
      refresh();
    }

    prevUserIdRef.current = currentUserId;
    prevShopBoostsRef.current = shopBoostFilters;
    prevSegmentsRef.current = segments;
  }, [currentUser?.id, shopBoostFilters, segments, refresh]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
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
        </ClickCollectProvider>
      </UserProvider>
    </CartProvider>
    </LanguageProvider>
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
