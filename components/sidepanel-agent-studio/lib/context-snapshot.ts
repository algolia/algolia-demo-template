import { getObjectsByIds } from '@/lib/getObjectByIDs';
import { Product } from '@/lib/types/product';
import { User } from '@/lib/types/user';
import { ALGOLIA_CONFIG } from '@/lib/algolia-config';

// ============================================================================
// Types
// ============================================================================

export type PageType = 'search' | 'product' | 'category' | 'home' | 'other';

export type SearchState = {
  query?: string;
  filters: Record<string, string[]>;
  range?: Record<string, { min?: number; max?: number } | string>;
  sort?: string;
  page?: number;
};

export type ContextSnapshot = {
  page: {
    pageType: PageType;
  };
  algolia: {
    indexName: string;
    searchState: SearchState;
  };
  product?: {
    objectID: string;
    name?: string;
    brand?: string;
    price?: string;
    description?: string;
  };
  user?: User;
  isFirstMessage?: boolean;
  selectedProducts?: Array<{
    objectID: string;
    name: string;
    brand?: string;
    price?: string;
  }>;
};

// Simple in-memory cache for product data
const productCache = new Map<string, ContextSnapshot['product']>();

// ============================================================================
// Page type detection
// ============================================================================

/**
 * Strips the Next.js basePath prefix from a pathname so route matching
 * works regardless of deployment path (e.g. /demos/twinset/products/123 → /products/123).
 */
function stripBasePath(pathname: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname;
}

/**
 * Detects page type and extracts product objectID from the current pathname.
 * Uses simple string matching — no regex needed for 5 known routes.
 */
function detectPage(pathname: string): { pageType: PageType; objectID?: string } {
  const path = stripBasePath(pathname);

  // /products/[id]
  if (path.startsWith('/products/')) {
    const id = path.split('/')[2];
    if (id) return { pageType: 'product', objectID: decodeURIComponent(id) };
  }

  // /category/[...slug]
  if (path.startsWith('/category/')) {
    return { pageType: 'category' };
  }

  // / (home — but may also be search if there are active filters)
  if (path === '/' || path === '') {
    return { pageType: 'home' };
  }

  return { pageType: 'other' };
}

// ============================================================================
// Context Resolution
// ============================================================================

// Type for InstantSearch UI state (subset we care about)
type IndexUiState = {
  query?: string;
  refinementList?: Record<string, string[]>;
  range?: Record<string, { min?: number; max?: number } | string>;
  sortBy?: string;
  page?: number;
  [key: string]: unknown;
};

/**
 * Builds the context snapshot from InstantSearch uiState + current URL.
 * This is the only context resolver — uses uiState for search state
 * and the URL pathname (with basePath stripped) for page detection.
 */
export function resolveContext(
  indexUiState: IndexUiState | undefined
): Omit<ContextSnapshot, 'product'> & { objectID?: string } {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  const searchState: SearchState = {
    query: indexUiState?.query,
    filters: indexUiState?.refinementList || {},
    range: indexUiState?.range,
    sort: indexUiState?.sortBy,
    page: indexUiState?.page,
  };

  let { pageType, objectID } = detectPage(pathname);

  // Refine: home with active search state → search page
  if (pageType === 'home' && (searchState.query || Object.keys(searchState.filters).length > 0)) {
    pageType = 'search';
  }

  return {
    page: { pageType },
    algolia: {
      indexName: ALGOLIA_CONFIG.INDEX_NAME,
      searchState,
    },
    objectID,
  };
}

// ============================================================================
// Context Hydration
// ============================================================================

/**
 * Enriches the context with product data when on a product page.
 * Caches results to avoid repeated fetches for the same objectID.
 */
export async function hydrateContext(
  baseCtx: Omit<ContextSnapshot, 'product'> & { objectID?: string }
): Promise<ContextSnapshot> {
  const { objectID, ...ctx } = baseCtx;

  if (!objectID) return ctx;

  // Check cache
  const cached = productCache.get(objectID);
  if (cached) return { ...ctx, product: cached };

  try {
    const fetchPromise = getObjectsByIds<Product>([objectID], ctx.algolia.indexName);
    const timeoutPromise = new Promise<Product[]>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 500)
    );

    const [product] = await Promise.race([fetchPromise, timeoutPromise]);

    if (product) {
      const snapshot: ContextSnapshot['product'] = {
        objectID: product.objectID || objectID,
        name: product.name,
        brand: product.brand,
        price: product.price?.toString(),
        description: product.description?.slice(0, 200),
      };
      productCache.set(objectID, snapshot);
      return { ...ctx, product: snapshot };
    }

    const minimal: ContextSnapshot['product'] = { objectID };
    productCache.set(objectID, minimal);
    return { ...ctx, product: minimal };
  } catch {
    return { ...ctx, product: { objectID } };
  }
}

// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Creates a [CONTEXT] message to prepend to the conversation.
 * Uses 'user' role since Agent Studio API only accepts 'user' or 'assistant'.
 */
export function makeContextSystemMessage(ctx: ContextSnapshot) {
  return {
    role: 'user' as const,
    parts: [
      {
        type: 'text' as const,
        text: `[CONTEXT]${JSON.stringify(ctx)}[/CONTEXT]`,
      },
    ],
  };
}
