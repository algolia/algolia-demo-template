import { getObjectsByIds } from '@/lib/getObjectByIDs';
import { Product } from '@/lib/types/product';
import { User } from '@/lib/types/user';
import { users } from '@/lib/demo-config/users';
import { ALGOLIA_CONFIG } from '@/lib/algolia-config';

// Type for InstantSearch UI state (from useInstantSearch().indexUiState)
type IndexUiState = {
  query?: string;
  refinementList?: Record<string, string[]>;
  range?: Record<string, { min?: number; max?: number } | string>;
  sortBy?: string;
  page?: number;
  menu?: Record<string, string>;
  hierarchicalMenu?: Record<string, string[]>;
  toggle?: Record<string, boolean>;
  // Allow additional unknown properties
  [key: string]: unknown;
};

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
    path: string;
    url: string;
    pageType: PageType;
  };
  algolia: {
    indexName: string;
    searchState: SearchState;
    /** @deprecated Use searchState instead */
    urlState?: Record<string, string>;
  };
  product?: {
    objectID: string;
    name?: string;
    brand?: string;
    price?: string;
    description?: string;
  };
  user?: User;
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
// URL State Resolution
// ============================================================================

/**
 * Creates a stable, deterministic signature for the current page state.
 * Used to detect URL changes and prevent duplicate regeneration.
 */
export function getPageStateSignature(): string {
  const url = new URL(window.location.href);
  const params = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${url.pathname}?${params}`;
}

/**
 * Resolves the current context from the URL without product hydration.
 * This is a pure function that reads from window.location.
 */
export function resolveContextFromUrl(): Omit<ContextSnapshot, 'product'> & { objectID?: string } {
  const url = new URL(window.location.href);
  const urlState = Object.fromEntries(url.searchParams.entries());
  const path = url.pathname;

  // Detect page type and extract objectID if on product page
  let pageType: PageType = 'other';
  let objectID: string | undefined;

  // Product page: /products/[id]
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    pageType = 'product';
    objectID = decodeURIComponent(productMatch[1]);
  }
  // Category page: /category/[...slug]
  else if (path.startsWith('/category/')) {
    pageType = 'category';
  }
  // Search page: has query param or other search-related params
  else if (
    urlState.query ||
    urlState.q ||
    Object.keys(urlState).some(key =>
      key.includes('refinementList') ||
      key.includes('range') ||
      key.includes('sortBy') ||
      key.includes('page')
    )
  ) {
    pageType = 'search';
  }

  return {
    page: {
      path,
      url: url.toString(),
      pageType,
    },
    algolia: {
      indexName: ALGOLIA_CONFIG.INDEX_NAME,
      searchState: {
        query: urlState.query || urlState.q,
        filters: {},
      },
      urlState,
    },
    objectID,
  };
}

/**
 * Resolves the current context using InstantSearch's clean uiState.
 * This is the preferred method - avoids manual URL parsing and composition prefix issues.
 *
 * @param indexUiState - The clean IndexUiState from useInstantSearch()
 */
export function resolveContextWithUiState(
  indexUiState: IndexUiState | undefined
): Omit<ContextSnapshot, 'product'> & { objectID?: string } {
  const url = new URL(window.location.href);
  const path = url.pathname;

  // Build clean searchState from IndexUiState
  const searchState: SearchState = {
    query: indexUiState?.query,
    filters: indexUiState?.refinementList || {},
    range: indexUiState?.range,
    sort: indexUiState?.sortBy,
    page: indexUiState?.page,
  };

  // Detect page type and extract objectID if on product page
  let pageType: PageType = 'other';
  let objectID: string | undefined;

  // Product page: /products/[id]
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    pageType = 'product';
    objectID = decodeURIComponent(productMatch[1]);
  }
  // Category page: /category/[...slug]
  else if (path.startsWith('/category/')) {
    pageType = 'category';
  }
  // Home page: root path with no search
  else if (path === '/' && !searchState.query && Object.keys(searchState.filters).length === 0) {
    pageType = 'home';
  }
  // Search page: has query or filters
  else if (searchState.query || Object.keys(searchState.filters).length > 0) {
    pageType = 'search';
  }

  return {
    page: {
      path,
      url: url.toString(),
      pageType,
    },
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
 * Hydrates the context with product data if on a product page.
 * Uses caching to avoid repeated fetches for the same objectID.
 */
export async function hydrateContext(
  baseCtx: Omit<ContextSnapshot, 'product'> & { objectID?: string }
): Promise<ContextSnapshot> {
  const { objectID, ...ctx } = baseCtx;

  // No objectID means we're not on a product page
  if (!objectID) {
    return ctx;
  }

  // Check cache first
  const cached = productCache.get(objectID);
  if (cached) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Context] Using cached product data for:', objectID);
    }
    return { ...ctx, product: cached };
  }

  try {
    // Fetch product with timeout to avoid blocking the send
    const fetchPromise = getObjectsByIds<Product>([objectID], ctx.algolia.indexName);
    const timeoutPromise = new Promise<Product[]>((_, reject) =>
      setTimeout(() => reject(new Error('Product fetch timeout')), 500)
    );

    const [product] = await Promise.race([fetchPromise, timeoutPromise]);

    if (product) {
      const productSnapshot: ContextSnapshot['product'] = {
        objectID: product.objectID || objectID,
        name: product.title,
        brand: product.brand,
        price: product.price?.toString(),
        description: product.description?.slice(0, 200), // Truncate for token efficiency
      };

      // Cache the result
      productCache.set(objectID, productSnapshot);

      if (process.env.NODE_ENV === 'development') {
        console.debug('[Context] Fetched and cached product:', productSnapshot.name);
      }

      return { ...ctx, product: productSnapshot };
    }

    // Product not found, return minimal product info
    const minimalProduct: ContextSnapshot['product'] = { objectID };
    productCache.set(objectID, minimalProduct);
    return { ...ctx, product: minimalProduct };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Context] Failed to fetch product, proceeding without product data:', error);
    }
    // On error, still include objectID so agent knows we're on a product page
    return { ...ctx, product: { objectID } };
  }
}

// ============================================================================
// User profile Context Hydration
// ============================================================================
/**
 * Hydrates the context with user profile
 */

export async function hydrateWithUserProfile(
  baseCtx: Omit<ContextSnapshot, 'user'> & { userId?: string }
): Promise<ContextSnapshot> {
  const { userId, ...ctx } = baseCtx;

  if (!userId) {
    return ctx;
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return ctx;
  }

  return { ...ctx, user: user };
}


// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Creates a context message to prepend to the conversation.
 * Uses 'user' role since Agent Studio API only accepts 'user' or 'assistant'.
 * The context is formatted with clear delimiters so the agent can parse it.
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

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clears the product cache. Useful for testing or when data might be stale.
 */
export function clearProductCache(): void {
  productCache.clear();
}

