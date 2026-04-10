"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useSearchBox } from "react-instantsearch";
import { algoliasearch } from "algoliasearch";
import {
  SearchIcon,
  MicIcon,
  MicOffIcon,
  XIcon,
  TrendingUp,
  FolderOpen,
  BookOpen,
} from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Product } from "@/lib/types/product";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/user/user-context";
import { CompactProductListItem } from "@/components/ProductCard";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { HIERARCHICAL_CATEGORIES } from "@/lib/demo-config/categories";

/** Popular queries shown when the search bar is empty / first focused */
const POPULAR_QUERIES = [
  "dog food",
  "royal canin",
  "kibble",
  "flea treatment",
  "cat snacks",
];

const searchClient = algoliasearch(
  ALGOLIA_CONFIG.APP_ID,
  ALGOLIA_CONFIG.SEARCH_API_KEY
);

export type QuerySuggestion = {
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

type CategoryHit = {
  value: string;
  count: number;
  highlighted: string;
};

type ArticleHit = {
  objectID: string;
  title: string;
  summary: string;
  url: string;
  categories: string[];
};

type SelectableItem = QuerySuggestion | Product | CategoryHit | ArticleHit;

export function HighlightedText({ value }: { value: string }) {
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

function PopularQueries({
  selectedIndex,
  indexOffset,
  onSelect,
  onHover,
}: {
  selectedIndex: number;
  indexOffset: number;
  onSelect: (query: string) => void;
  onHover: (index: number) => void;
}) {
  return (
    <>
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Popular searches
      </div>
      {POPULAR_QUERIES.map((query, i) => {
        const itemIndex = indexOffset + i;
        const isSelected = selectedIndex === itemIndex;

        return (
          <CommandItem
            key={query}
            value={`popular-${query}`}
            onSelect={() => onSelect(query)}
            onMouseEnter={() => onHover(itemIndex)}
            data-selected={isSelected}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
              isSelected && "bg-accent text-accent-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{query}</span>
          </CommandItem>
        );
      })}
    </>
  );
}

/** Top-level categories shown when the search bar is empty */
const POPULAR_CATEGORIES = Object.values(HIERARCHICAL_CATEGORIES).map((cat) => ({
  value: cat.name,
  label: cat.name,
  count: cat.count ?? 0,
  Icon: cat.icon,
}));

function PopularCategoryResults({
  selectedIndex,
  indexOffset,
  onSelect,
  onHover,
}: {
  selectedIndex: number;
  indexOffset: number;
  onSelect: (categoryPath: string) => void;
  onHover: (index: number) => void;
}) {
  return (
    <>
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Categories
      </div>
      {POPULAR_CATEGORIES.map((cat, i) => {
        const itemIndex = indexOffset + i;
        const isSelected = selectedIndex === itemIndex;

        return (
          <CommandItem
            key={cat.value}
            value={`pop-cat-${cat.value}`}
            onSelect={() => onSelect(cat.value)}
            onMouseEnter={() => onHover(itemIndex)}
            data-selected={isSelected}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
              isSelected && "bg-accent text-accent-foreground"
            )}
          >
            <cat.Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{cat.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {cat.count}
            </span>
          </CommandItem>
        );
      })}
    </>
  );
}

function CategoryResults({
  categories,
  selectedIndex,
  indexOffset,
  onSelect,
  onHover,
}: {
  categories: CategoryHit[];
  selectedIndex: number;
  indexOffset: number;
  onSelect: (categoryPath: string) => void;
  onHover: (index: number) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <>
      {categories.map((cat, i) => {
        const itemIndex = indexOffset + i;
        const isSelected = selectedIndex === itemIndex;

        return (
          <CommandItem
            key={cat.value}
            value={`category-${cat.value}`}
            onSelect={() => onSelect(cat.value)}
            onMouseEnter={() => onHover(itemIndex)}
            data-selected={isSelected}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
              isSelected && "bg-accent text-accent-foreground"
            )}
          >
            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              <HighlightedText value={cat.highlighted} />
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {cat.count}
            </span>
          </CommandItem>
        );
      })}
    </>
  );
}

function SuggestionsResults({
  suggestions,
  selectedIndex,
  indexOffset,
  onSelect,
  onHover,
}: {
  suggestions: QuerySuggestion[];
  selectedIndex: number;
  indexOffset: number;
  onSelect: (query: string) => void;
  onHover: (index: number) => void;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No suggestions
      </div>
    );
  }

  return (
    <>
      {suggestions.map((hit, i) => {
        const itemIndex = indexOffset + i;
        const isSelected = selectedIndex === itemIndex;

        return (
          <CommandItem
            key={hit.objectID}
            value={`suggestion-${hit.objectID}`}
            onSelect={() => onSelect(hit.objectID)}
            onMouseEnter={() => onHover(itemIndex)}
            data-selected={isSelected}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
              isSelected && "bg-accent text-accent-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              {hit._highlightResult?.query?.value ? (
                <HighlightedText value={hit._highlightResult.query.value} />
              ) : (
                hit.objectID
              )}
            </span>
          </CommandItem>
        );
      })}
    </>
  );
}

function ProductResults({
  products,
  selectedIndex,
  indexOffset,
  onSelect,
  onHover,
}: {
  products: Product[];
  selectedIndex: number;
  indexOffset: number;
  onSelect: (productId: string) => void;
  onHover: (index: number) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <>
      {products.map((hit, i) => {
        const itemIndex = indexOffset + i;
        const isSelected = selectedIndex === itemIndex;

        return (
          <CommandItem
            key={hit.objectID}
            value={`product-${hit.objectID}`}
            onSelect={() => onSelect(hit.objectID!)}
            onMouseEnter={() => onHover(itemIndex)}
            data-selected={isSelected}
            className={cn("p-0 cursor-pointer", isSelected && "bg-accent")}
          >
            <CompactProductListItem
              product={hit}
              showCartControls={false}
              showBadges={false}
              className="border-0 rounded-none p-0 bg-transparent hover:bg-transparent hover:border-transparent"
            />
          </CommandItem>
        );
      })}
    </>
  );
}

function ArticleResults({
  articles,
  selectedIndex,
  indexOffset,
  onSelect,
  onHover,
}: {
  articles: ArticleHit[];
  selectedIndex: number;
  indexOffset: number;
  onSelect: (url: string) => void;
  onHover: (index: number) => void;
}) {
  if (articles.length === 0) return null;

  return (
    <>
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Articles
      </div>
      {articles.map((article, i) => {
        const itemIndex = indexOffset + i;
        const isSelected = selectedIndex === itemIndex;

        return (
          <CommandItem
            key={article.objectID}
            value={`article-${article.objectID}`}
            onSelect={() => onSelect(article.url)}
            onMouseEnter={() => onHover(itemIndex)}
            data-selected={isSelected}
            className={cn(
              "flex items-start gap-3 px-3 py-2.5 cursor-pointer",
              isSelected && "bg-accent text-accent-foreground"
            )}
          >
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-sm line-clamp-1">{article.title}</span>
              {article.categories.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {article.categories[0]}
                </span>
              )}
            </div>
          </CommandItem>
        );
      })}
    </>
  );
}

export function LiveSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { refine, query: instantSearchQuery } = useSearchBox();
  const { personalizationFilters } = useUser();
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [categories, setCategories] = useState<CategoryHit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<ArticleHit[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isEmptyQuery = !searchQuery.trim();

  // Build flat list of all selectable items
  const selectableItems = useMemo<SelectableItem[]>(() => {
    if (isEmptyQuery) {
      const items: SelectableItem[] = POPULAR_QUERIES.map((q) => ({
        objectID: q,
        query: q,
        count: 0,
      }));
      // Add popular categories as CategoryHit items
      POPULAR_CATEGORIES.forEach((c) =>
        items.push({ value: c.value, count: c.count, highlighted: c.label })
      );
      // Add articles to empty-state selectable items
      articles.forEach((a) => items.push(a));
      return items;
    }
    if (isMobile) {
      // Mobile with-query: suggestions -> products -> articles (no categories)
      const items: SelectableItem[] = [];
      suggestions.forEach((s) => items.push(s));
      products.forEach((p) => items.push(p));
      articles.forEach((a) => items.push(a));
      return items;
    }
    // Desktop with-query: suggestions -> categories -> articles -> products
    const items: SelectableItem[] = [];
    suggestions.forEach((s) => items.push(s));
    categories.forEach((c) => items.push(c));
    articles.forEach((a) => items.push(a));
    products.forEach((p) => items.push(p));
    return items;
  }, [suggestions, categories, articles, products, isEmptyQuery, isMobile]);

  const navigateWithQuery = useCallback(
    (query: string) => {
      if (pathname !== "/") {
        router.push(
          `/?${ALGOLIA_CONFIG.INDEX_NAME}%5Bquery%5D=${encodeURIComponent(
            query
          )}`
        );
      } else {
        refine(query);
      }
    },
    [pathname, router, refine]
  );

  const handleTranscriptEnd = useCallback(
    (finalTranscript: string) => {
      const trimmedTranscript = finalTranscript.trim();
      if (trimmedTranscript) {
        setInputValue(trimmedTranscript);
        setSearchQuery(trimmedTranscript);
        setIsOpen(false);
        setSelectedIndex(-1);
        navigateWithQuery(trimmedTranscript);
      }
    },
    [navigateWithQuery]
  );

  const { supported, listening, transcript, toggle } = useSpeechRecognition({
    lang: "en-US",
    silenceTimeout: 0.5 * 1000,
    onTranscriptEnd: handleTranscriptEnd,
  });

  const displayValue = listening && transcript ? transcript : inputValue;

  // Sync local state when InstantSearch query is cleared externally (e.g. logo click)
  useEffect(() => {
    if (instantSearchQuery === "" && inputValue !== "") {
      setInputValue("");
      setSearchQuery("");
    }
  }, [instantSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const queryToSearch = listening && transcript ? transcript : searchQuery;

    const fetchResults = async () => {
      try {
        // Parallel: query suggestions + products + articles + category facet search
        const [searchResults, facetResult] = await Promise.all([
          searchClient.search({
            requests: [
              {
                indexName: ALGOLIA_CONFIG.QUERY_SUGGESTIONS_INDEX,
                query: queryToSearch,
                hitsPerPage: 5,
              },
              {
                indexName: ALGOLIA_CONFIG.INDEX_NAME,
                query: queryToSearch,
                hitsPerPage: 4,
                optionalFilters: personalizationFilters,
              },
              {
                indexName: ALGOLIA_CONFIG.ARTICLES_INDEX,
                query: queryToSearch,
                hitsPerPage: 3,
              },
            ],
          }),
          searchClient.searchForFacetValues({
            indexName: ALGOLIA_CONFIG.INDEX_NAME,
            facetName: "categoryPageId",
            searchForFacetValuesRequest: {
              facetQuery: queryToSearch,
              maxFacetHits: 5,
            },
          }),
        ]);

        const suggestionsResult = searchResults.results[0];
        const productsResult = searchResults.results[1];
        const articlesResult = searchResults.results[2];

        if ("hits" in suggestionsResult) {
          setSuggestions(suggestionsResult.hits as QuerySuggestion[]);
        }
        if ("hits" in productsResult) {
          setProducts(productsResult.hits as Product[]);
        }
        if (articlesResult && "hits" in articlesResult) {
          setArticles(articlesResult.hits as ArticleHit[]);
        }

        // Map facet hits to CategoryHit
        setCategories(
          (facetResult.facetHits || []).map((fh) => ({
            value: fh.value,
            count: fh.count,
            highlighted: fh.highlighted,
          }))
        );

        setSelectedIndex(-1);
      } catch (error) {
        console.error("Autocomplete search error:", error);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 150);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isOpen, listening, transcript, personalizationFilters]);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSearchQuery(value);
    setSelectedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSuggestionSelect = (suggestionQuery: string) => {
    setInputValue(suggestionQuery);
    setSearchQuery(suggestionQuery);
    setIsOpen(false);
    setSelectedIndex(-1);
    navigateWithQuery(suggestionQuery);
  };

  const handleProductSelect = (productId: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push(`/products/${productId}`);
  };

  const handleCategorySelect = (categoryPath: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    // categoryPageId values use " > " separator, URL uses "/"
    const slugParts = categoryPath.split(" > ");
    router.push(`/category/${slugParts.join("/")}`);
  };

  const handleArticleSelect = (url: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryToSubmit = listening && transcript ? transcript : inputValue;
    if (queryToSubmit.trim()) {
      const trimmedQuery = queryToSubmit.trim();
      setInputValue(trimmedQuery);
      setSearchQuery(trimmedQuery);
      setIsOpen(false);
      setSelectedIndex(-1);
      navigateWithQuery(trimmedQuery);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setInputValue("");
    setSearchQuery("");
    setSelectedIndex(-1);
  };

  const updateInputForSelection = (newIndex: number) => {
    if (newIndex === -1) {
      setInputValue(searchQuery);
      return;
    }
    const item = selectableItems[newIndex];
    if (item && "query" in item) {
      setInputValue((item as QuerySuggestion).query);
    }
  };

  const handleKeyDownWrapper = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    const totalItems = selectableItems.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev < totalItems - 1 ? prev + 1 : prev;
          updateInputForSelection(newIndex);
          return newIndex;
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev > -1 ? prev - 1 : prev;
          updateInputForSelection(newIndex);
          return newIndex;
        });
        break;

      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          e.preventDefault();
          const item = selectableItems[selectedIndex];
          if (item && "query" in item) {
            handleSuggestionSelect((item as QuerySuggestion).query);
          } else if (item && "highlighted" in item) {
            handleCategorySelect((item as CategoryHit).value);
          } else if (item && "summary" in item) {
            handleArticleSelect((item as ArticleHit).url);
          } else {
            handleProductSelect((item as Product).objectID!);
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        setInputValue(searchQuery);
        inputRef.current?.blur();
        break;
    }
  };

  const handleHoverWrapper = (index: number) => {
    setSelectedIndex(index);
  };

  const mobileOverlay =
    isMobile && isOpen && isMounted
      ? createPortal(
          <div
            className="fixed inset-0 z-100 bg-background flex flex-col"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="flex items-center gap-2 p-4 border-b bg-primary shrink-0">
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={mobileInputRef}
                    value={displayValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDownWrapper}
                    placeholder="Search products..."
                    className="pl-10 pr-4 h-12 bg-background"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
                {supported && (
                  <button
                    type="button"
                    onClick={toggle}
                    className={cn(
                      "p-2 rounded-full transition-colors shrink-0",
                      listening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    aria-label={
                      listening ? "Stop voice search" : "Start voice search"
                    }
                  >
                    {listening ? (
                      <MicOffIcon className="h-5 w-5" />
                    ) : (
                      <MicIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </form>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Close search"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <Command
              className="flex-1 rounded-none overflow-hidden"
              shouldFilter={false}
            >
              <CommandList className="h-full max-h-none overflow-y-auto">
                {isEmptyQuery ? (
                  <>
                    <CommandGroup className="px-2">
                      <PopularQueries
                        selectedIndex={selectedIndex}
                        indexOffset={0}
                        onSelect={handleSuggestionSelect}
                        onHover={handleHoverWrapper}
                      />
                    </CommandGroup>
                    <CommandGroup className="px-2">
                      <PopularCategoryResults
                        selectedIndex={selectedIndex}
                        indexOffset={POPULAR_QUERIES.length}
                        onSelect={handleCategorySelect}
                        onHover={handleHoverWrapper}
                      />
                    </CommandGroup>
                    {articles.length > 0 && (
                      <CommandGroup className="px-2">
                        <ArticleResults
                          articles={articles}
                          selectedIndex={selectedIndex}
                          indexOffset={POPULAR_QUERIES.length + POPULAR_CATEGORIES.length}
                          onSelect={handleArticleSelect}
                          onHover={handleHoverWrapper}
                        />
                      </CommandGroup>
                    )}
                  </>
                ) : (
                  <>
                    {/* Horizontal scrolling suggestion pills */}
                    {suggestions.length > 0 && (
                      <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-border">
                        {suggestions.map((hit, i) => {
                          const itemIndex = i;
                          const isSelected = selectedIndex === itemIndex;
                          return (
                            <button
                              key={hit.objectID}
                              type="button"
                              onClick={() => handleSuggestionSelect(hit.objectID)}
                              className={cn(
                                "shrink-0 px-3 py-1.5 text-sm font-medium border rounded-full whitespace-nowrap transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border text-foreground hover:bg-muted"
                              )}
                            >
                              {hit._highlightResult?.query?.value ? (
                                <HighlightedText value={hit._highlightResult.query.value} />
                              ) : (
                                hit.objectID
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <CommandGroup className="px-2 pb-2">
                      <ProductResults
                        products={products}
                        selectedIndex={selectedIndex}
                        indexOffset={suggestions.length}
                        onSelect={handleProductSelect}
                        onHover={handleHoverWrapper}
                      />
                    </CommandGroup>

                    {articles.length > 0 && (
                      <CommandGroup className="px-2 pb-4">
                        <ArticleResults
                          articles={articles}
                          selectedIndex={selectedIndex}
                          indexOffset={suggestions.length + products.length}
                          onSelect={handleArticleSelect}
                          onHover={handleHoverWrapper}
                        />
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={displayValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDownWrapper}
              placeholder="Search products..."
              className="pl-12 pr-4 py-4 h-14 bg-background border rounded-[0.5rem]"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={512}
              type="search"
            />
          </div>
          {supported && (
            <button
              type="button"
              onClick={toggle}
              className={cn(
                "p-2 rounded-full transition-colors",
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              aria-label={
                listening ? "Stop voice search" : "Start voice search"
              }
            >
              {listening ? (
                <MicOffIcon className="h-6 w-6" />
              ) : (
                <MicIcon className="h-6 w-6" />
              )}
            </button>
          )}
        </form>

        {isOpen && !isMobile && (
          <div className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
            "w-[900px]"
          )}>
            <Command
              className="w-full border rounded-xl shadow-lg bg-popover"
              shouldFilter={false}
            >
              <CommandList className="max-h-[70vh]">
                {isEmptyQuery ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-x">
                    <div className="p-2">
                      <CommandGroup>
                        <PopularQueries
                          selectedIndex={selectedIndex}
                          indexOffset={0}
                          onSelect={handleSuggestionSelect}
                          onHover={handleHoverWrapper}
                        />
                      </CommandGroup>
                    </div>
                    <div className="p-2">
                      <CommandGroup>
                        <PopularCategoryResults
                          selectedIndex={selectedIndex}
                          indexOffset={POPULAR_QUERIES.length}
                          onSelect={handleCategorySelect}
                          onHover={handleHoverWrapper}
                        />
                      </CommandGroup>
                    </div>
                    {articles.length > 0 && (
                      <div className="p-2">
                        <CommandGroup>
                          <ArticleResults
                            articles={articles}
                            selectedIndex={selectedIndex}
                            indexOffset={POPULAR_QUERIES.length + POPULAR_CATEGORIES.length}
                            onSelect={handleArticleSelect}
                            onHover={handleHoverWrapper}
                          />
                        </CommandGroup>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-x">
                    <div className="p-2">
                      <CommandGroup>
                        <SuggestionsResults
                          suggestions={suggestions}
                          selectedIndex={selectedIndex}
                          indexOffset={0}
                          onSelect={handleSuggestionSelect}
                          onHover={handleHoverWrapper}
                        />
                      </CommandGroup>
                      {categories.length > 0 && (
                        <CommandGroup heading="Categories">
                          <CategoryResults
                            categories={categories}
                            selectedIndex={selectedIndex}
                            indexOffset={suggestions.length}
                            onSelect={handleCategorySelect}
                            onHover={handleHoverWrapper}
                          />
                        </CommandGroup>
                      )}
                    </div>

                    <div className="p-2">
                      {articles.length > 0 && (
                        <CommandGroup>
                          <ArticleResults
                            articles={articles}
                            selectedIndex={selectedIndex}
                            indexOffset={suggestions.length + categories.length}
                            onSelect={handleArticleSelect}
                            onHover={handleHoverWrapper}
                          />
                        </CommandGroup>
                      )}
                      <CommandGroup>
                        <ProductResults
                          products={products}
                          selectedIndex={selectedIndex}
                          indexOffset={suggestions.length + categories.length + articles.length}
                          onSelect={handleProductSelect}
                          onHover={handleHoverWrapper}
                        />
                      </CommandGroup>
                    </div>
                  </div>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {mobileOverlay}
    </>
  );
}
