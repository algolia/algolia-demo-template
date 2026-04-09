"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteHits, useSearchBox, useInstantSearch } from "react-instantsearch";
import { algoliasearch } from "algoliasearch";
import Image from "next/image";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, Dog, Cat, Rabbit, ArrowRight, Search } from "lucide-react";
import { Product } from "@/lib/types/product";
import { ProductCard, ProductListItem } from "@/components/ProductCard";
import { ProductToolbar, SearchStats } from "@/components/ProductToolbar";
import { FiltersSidebar, ActiveFilters } from "@/components/filters-sidebar";
import { Configure } from "react-instantsearch";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { useSidepanel } from "@/components/sidepanel-agent-studio/context/sidepanel-context";
import { useCollapsibleFilters } from "@/components/hooks/use-collapsible-filters";
import { SparklesIcon } from "lucide-react";
import { classifyHits } from "@/lib/retail-media";
import { SponsoredCarousel } from "@/components/retail-media/SponsoredCarousel";
import { SponsoredBanner } from "@/components/retail-media/SponsoredBanner";
import { RetailMediaOverlay } from "@/components/retail-media/RetailMediaOverlay";

// Lazy-initialize search client to avoid issues during SSR/build
let searchClient: ReturnType<typeof algoliasearch> | null = null;
function getSearchClient() {
  if (!searchClient && ALGOLIA_CONFIG.APP_ID && ALGOLIA_CONFIG.SEARCH_API_KEY) {
    searchClient = algoliasearch(ALGOLIA_CONFIG.APP_ID, ALGOLIA_CONFIG.SEARCH_API_KEY);
  }
  return searchClient;
}

// Type for query suggestions
type QuerySuggestion = {
  objectID: string;
  query: string;
  count: number;
  _highlightResult?: {
    query: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
  };
};

// Helper component for highlighted text
function HighlightedText({ value }: { value: string }) {
  const parts = value.split(/(<em>.*?<\/em>)/);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const emMatch = part.match(/^<em>(.*)<\/em>$/);
        if (emMatch) {
          return (
            <span key={index} className="font-normal">
              {emMatch[1]}
            </span>
          );
        }
        return (
          <span key={index} className="font-semibold">
            {part}
          </span>
        );
      })}
    </>
  );
}

function AgentSuggestions() {
  const { agentSuggestions, agentSuggestionsLoading, openSidepanel } = useSidepanel();

  if (agentSuggestionsLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <SparklesIcon size={14} className="animate-pulse" />
          <span className="animate-pulse">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (agentSuggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <SparklesIcon size={14} className="shrink-0 text-muted-foreground" />
        {agentSuggestions.map((suggestion, index) => (
          <button
            key={`agent-${index}`}
            onClick={() => openSidepanel(suggestion)}
            className="shrink-0 px-4 py-2 text-sm font-medium border border-border rounded-full bg-background hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuerySuggestions({
  query,
  onSuggestionClick,
}: {
  query: string;
  onSuggestionClick: (query: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        return;
      }

      try {
        const client = getSearchClient();
        if (!client) {
          setSuggestions([]);
          return;
        }
        const results = await client.search({
          requests: [
            {
              indexName: `${ALGOLIA_CONFIG.INDEX_NAME}_query_suggestions`,
              query: query,
              hitsPerPage: 8,
            },
          ],
        });

        const suggestionsResult = results.results[0];
        if ("hits" in suggestionsResult) {
          setSuggestions(suggestionsResult.hits as QuerySuggestion[]);
        }
      } catch (error) {
        console.error("Query suggestions error:", error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {suggestions.map((hit) => (
          <button
            key={hit.objectID}
            onClick={() => onSuggestionClick(hit.query)}
            className="shrink-0 px-4 py-2 text-sm font-medium border border-border rounded-full bg-background hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
            type="button"
          >
            {hit._highlightResult?.query?.value ? (
              <HighlightedText value={hit._highlightResult.query.value} />
            ) : (
              hit.query
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Banner {
  image?: {
    urls?: { url: string }[];
    title?: string;
  };
  link?: {
    url?: string;
    target?: string;
  };
}

function RuleBanner() {
  const { results } = useInstantSearch();

  const banners = (results?.renderingContent as {
    widgets?: { banners?: Banner[] };
  })?.widgets?.banners;

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {banners.map((banner, index) => {
        const imageUrl = banner.image?.urls?.[0]?.url;
        if (!imageUrl) return null;

        const content = (
          <div className="relative w-full overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={banner.image?.title || "Promotional banner"}
              width={1200}
              height={300}
              className="w-full h-auto object-cover"
              priority={index === 0}
            />
          </div>
        );

        if (banner.link?.url) {
          return (
            <a
              key={index}
              href={banner.link.url}
              target={banner.link.target || "_self"}
              rel={banner.link.target === "_blank" ? "noopener noreferrer" : undefined}
              className="block hover:opacity-95 transition-opacity"
            >
              {content}
            </a>
          );
        }

        return <div key={index}>{content}</div>;
      })}
    </div>
  );
}

function ZeroResultsFallback() {
  const { openSidepanel } = useSidepanel();
  const { query } = useSearchBox();

  const suggestions = [
    {
      label: "Chiedi al nostro esperto",
      message: query
        ? `Non trovo "${query}" nel catalogo. Puoi aiutarmi a trovare un'alternativa?`
        : "Ciao! Ho bisogno di aiuto per trovare il prodotto giusto.",
    },
    {
      label: "Consigliami per il mio cucciolo",
      message: "Ho un cucciolo, cosa mi consigli come primo acquisto?",
    },
    {
      label: "Cerca negli articoli",
      message: query
        ? `Hai articoli o guide su "${query}"?`
        : "Quali guide avete per nuovi proprietari di animali?",
    },
  ];

  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
      <p className="text-lg font-medium text-foreground mb-1">
        Nessun prodotto trovato
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {query
          ? `Nessun risultato per "${query}". Prova a chiedere al nostro assistente!`
          : "Prova a modificare la ricerca o chiedi aiuto al nostro assistente."}
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => openSidepanel(s.message)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-colors text-left"
          >
            <SparklesIcon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomHits({ viewMode, compact, selectable }: { viewMode: "grid" | "list"; compact?: boolean; selectable?: boolean }) {
  const { hits, showMore, isLastPage } = useInfiniteHits<Product>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Classify hits into retail media placement buckets
  const classified = useMemo(
    () => classifyHits(hits, ALGOLIA_CONFIG.COMPOSITION_ID),
    [hits]
  );

  // Official Algolia pattern for infinite scroll
  useEffect(() => {
    if (sentinelRef.current !== null) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLastPage) {
            showMore();
          }
        });
      });

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [isLastPage, showMore]);

  if (hits.length === 0) {
    return <ZeroResultsFallback />;
  }

  // Split grid at row 1 to insert banner.
  // Round each section to full rows so no orphan cards appear.
  const cols = compact ? 3 : 4;
  const hasBanners = classified.banners.length > 0;
  const bannerInsertIndex = hasBanners ? cols * 1 : classified.gridHits.length;
  const beforeBanner = classified.gridHits.slice(0, bannerInsertIndex);
  const rawAfter = classified.gridHits.slice(bannerInsertIndex);
  const afterBanner = isLastPage
    ? rawAfter
    : rawAfter.slice(0, Math.floor(rawAfter.length / cols) * cols);
  const gridClasses = `grid grid-cols-2 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`;

  if (viewMode === "list") {
    return (
      <div className="ais-InfiniteHits">
        {/* Carousel above list */}
        {classified.carousel && (
          <SponsoredCarousel
            label={classified.carousel.label}
            products={classified.carousel.hits as Product[]}
          />
        )}

        <div className="ais-InfiniteHits-list space-y-4">
          {beforeBanner.map((hit, index) => (
            <ProductListItem
              key={`${hit.objectID}-${index}`}
              product={hit as Product}
              sponsoredLabel={classified.inlinePlacements.get(hit.objectID!)}
              selectable={selectable}
            />
          ))}

          {/* Banner between rows */}
          {classified.banners.map((banner, i) => (
            <SponsoredBanner key={`banner-${i}`} label={banner.label} products={banner.hits as Product[]} />
          ))}

          {afterBanner.map((hit, index) => (
            <ProductListItem
              key={`${hit.objectID}-after-${index}`}
              product={hit as Product}
              sponsoredLabel={classified.inlinePlacements.get(hit.objectID!)}
              selectable={selectable}
            />
          ))}
          <div ref={sentinelRef} className="ais-InfiniteHits-sentinel" aria-hidden="true" />
        </div>

        {/* Retail media debug overlay */}
        <RetailMediaOverlay classified={classified} />
      </div>
    );
  }

  return (
    <div className="ais-InfiniteHits">
      {/* Carousel above grid */}
      {classified.carousel && (
        <SponsoredCarousel
          label={classified.carousel.label}
          products={classified.carousel.hits as Product[]}
        />
      )}

      {/* First chunk of grid (before banner) */}
      <div className={`ais-InfiniteHits-list ${gridClasses}`}>
        {beforeBanner.map((hit, index) => (
          <ProductCard
            key={`${hit.objectID}-${index}`}
            product={hit as Product}
            sponsoredLabel={classified.inlinePlacements.get(hit.objectID!)}
            selectable
          />
        ))}
      </div>

      {/* Banners between rows */}
      {classified.banners.map((banner, i) => (
        <SponsoredBanner key={`banner-${i}`} label={banner.label} products={banner.hits as Product[]} />
      ))}

      {/* Remaining grid (after banner) */}
      {afterBanner.length > 0 && (
        <div className={`ais-InfiniteHits-list ${gridClasses}`}>
          {afterBanner.map((hit, index) => (
            <ProductCard
              key={`${hit.objectID}-after-${index}`}
              product={hit as Product}
              sponsoredLabel={classified.inlinePlacements.get(hit.objectID!)}
              selectable={selectable}
            />
          ))}
          <div ref={sentinelRef} className="ais-InfiniteHits-sentinel col-span-full" aria-hidden="true" />
        </div>
      )}

      {/* Sentinel fallback if no afterBanner */}
      {afterBanner.length === 0 && (
        <div ref={sentinelRef} className="ais-InfiniteHits-sentinel" aria-hidden="true" />
      )}

      {/* Retail media debug overlay */}
      <RetailMediaOverlay classified={classified} />
    </div>
  );
}

export default function SearchPage() {
  const { query, refine } = useSearchBox();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { isSidepanelOpen } = useSidepanel();
  const { filtersOpen, toggleFilters } = useCollapsibleFilters();

  const handleSuggestionClick = (suggestionQuery: string) => {
    refine(suggestionQuery);
  };

  // Homepage — no query active
  if (!query) {
    const promos = [
      {
        href: "/category/Cane",
        icon: Dog,
        title: "Cane",
        subtitle: "Alimentazione, snack e accessori per il tuo cane",
        sponsor: "Royal Canin",
        accent: "bg-primary",
      },
      {
        href: "/category/Gatto",
        icon: Cat,
        title: "Gatto",
        subtitle: "Cibo umido, secco e giochi per il tuo gatto",
        sponsor: "Purina Pro Plan",
        accent: "bg-foreground",
      },
      {
        href: "/category/Piccoli Animali",
        icon: Rabbit,
        title: "Piccoli Animali",
        subtitle: "Roditori, uccelli, pesci e rettili",
        sponsor: "Vitakraft",
        accent: "bg-muted-foreground",
      },
    ];

    const quickSearches = [
      "Cibo secco cane",
      "Antiparassitari",
      "Snack gatto",
      "Crocchette",
      "Royal Canin",
    ];

    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        {/* Hero */}
        <div className="mb-12 md:mb-16 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-4">
            Tutto per i tuoi<br />
            <span className="text-primary">amici animali</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Cerca tra migliaia di prodotti per cani, gatti e piccoli animali.
          </p>

          {/* Quick search pills */}
          <div className="flex flex-wrap gap-2">
            {quickSearches.map((q) => (
              <button
                key={q}
                onClick={() => refine(q)}
                className="group flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                type="button"
              >
                <Search className="w-3 h-3 opacity-40 group-hover:opacity-70" />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Sponsored category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {promos.map((promo) => (
            <Link
              key={promo.href}
              href={promo.href}
              className="group relative bg-background p-8 md:p-10 flex flex-col justify-between min-h-[220px] transition-colors hover:bg-muted/50"
            >
              {/* Sponsor tag */}
              <div className="flex items-center justify-between mb-auto">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Sponsorizzato &middot; {promo.sponsor}
                </span>
              </div>

              {/* Content */}
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${promo.accent} p-2 text-primary-foreground`}>
                    <promo.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">
                    {promo.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {promo.subtitle}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Esplora la categoria
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-6 px-4">
      {/* Display current search query */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Results for:{" "}
          <span className="text-primary">&quot;{query}&quot;</span>
        </h1>
      </div>

      {/* Agent Suggestions */}
      <AgentSuggestions />

      {/* Query Suggestions */}
      <QuerySuggestions
        query={query}
        onSuggestionClick={handleSuggestionClick}
      />

      <div className="flex gap-8">
        {/* Desktop Sidebar - collapsible */}
        <div
          className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            filtersOpen ? "w-64" : "w-0"
          }`}
        >
          <div className="w-64">
            <FiltersSidebar />
          </div>
        </div>

        {/* Product Listing */}
        <div className="flex-1 min-w-0">
          <RuleBanner />
          <ActiveFilters />
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={toggleFilters}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            >
              {filtersOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
              <span>{filtersOpen ? "Hide filters" : "Filters"}</span>
            </button>
            <SearchStats />
            <div className="flex-1" />
            <ProductToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sidebar={<FiltersSidebar />}
            />
          </div>
          <Configure getRankingInfo={true} />
          <CustomHits viewMode={viewMode} compact={isSidepanelOpen} selectable={isSidepanelOpen} />
        </div>
      </div>
    </div>
  );
}
