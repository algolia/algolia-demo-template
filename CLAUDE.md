# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HSN Store - An e-commerce demo built with Next.js 16, React 19, and Algolia's Composition API with Agent Studio integration. The application features AI-powered product discovery, personalized user profiles, and intelligent shopping assistance.

## Key Technologies

- **Next.js 16**: App Router, Server Components, React 19
- **Algolia**: Composition API, Agent Studio (AI agents), InstantSearch
- **AI SDK v5**: Vercel's AI SDK for agent chat interfaces
- **UI**: Tailwind CSS 4, shadcn/ui components, Radix UI primitives
- **Package Manager**: pnpm

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint codebase
pnpm lint
```

## Environment Variables

Required variables in `.env`:
- `NEXT_PUBLIC_ALGOLIA_APP_ID`: Algolia application ID
- `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`: Algolia search API key
- `ALGOLIA_ADMIN_API_KEY`: Algolia admin API key (for indexing, not exposed to client)
- `NEXT_PUBLIC_ALGOLIA_INDEX_NAME`: Algolia index name (e.g., `hsnstore_products`)
- `NEXT_PUBLIC_ALGOLIA_COMPOSITION_ID`: Composition ID (e.g., `comp1767629920097___hsnstore_products`)
- `NEXT_PUBLIC_ALGOLIA_AGENT_ID`: Primary agent for sidepanel assistant
- `NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID`: Suggestion agent
- `NEXT_PUBLIC_ALGOLIA_CHECKOUT_AGENT_ID`: Checkout recommendations agent
- `NEXT_PUBLIC_AGENT_API_KEY`: API key for Agent Studio

## New Demo Setup

Follow these steps to set up the repository for a new demo/customer:

### 1. Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Algolia account with Composition API and Agent Studio access

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Algolia Core
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_search_api_key
ALGOLIA_ADMIN_API_KEY=your_admin_api_key

# Index and Composition
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=your_index_name
NEXT_PUBLIC_ALGOLIA_COMPOSITION_ID=your_composition_id

# Agent Studio (optional - for AI features)
NEXT_PUBLIC_AGENT_API_KEY=your_agent_api_key
NEXT_PUBLIC_ALGOLIA_AGENT_ID=your_agent_id
NEXT_PUBLIC_ALGOLIA_SUGGESTION_AGENT_ID=your_suggestion_agent_id
NEXT_PUBLIC_ALGOLIA_CHECKOUT_AGENT_ID=your_checkout_agent_id

NODE_ENV=development
```

### 4. Prepare Product Data

Place your product feed XML file at `data/hsn-feed.xml`. The XML should follow this structure:

```xml
<rss>
  <products>
    <product>
      <sqr:id>123</sqr:id>
      <sqr:title>Product Name</sqr:title>
      <sqr:sku>SKU123</sqr:sku>
      <sqr:description>Product description</sqr:description>
      <sqr:short_description>Short desc</sqr:short_description>
      <sqr:brand>Brand Name</sqr:brand>
      <sqr:url>https://example.com/product</sqr:url>
      <sqr:image_link>https://example.com/image.jpg</sqr:image_link>
      <sqr:stock>100</sqr:stock>
      <sqr:status>Habilitado</sqr:status>
      <sqr:price>29.99</sqr:price>
      <sqr:normal_price>39.99</sqr:normal_price>
      <sqr:category0><node>Category1</node></sqr:category0>
      <sqr:category1><node>Subcategory</node></sqr:category1>
      <!-- Additional fields as needed -->
    </product>
  </products>
</rss>
```

### 5. Index Products and Create Composition

Run the indexing script to:
- Parse and transform the XML feed
- Index products to Algolia
- Configure index settings (searchable attributes, facets, ranking)
- Create/update the Composition API composition

```bash
pnpm tsx scripts/index-products.ts
```

The script will output progress:
```
Reading XML feed...
Parsing XML...
Found X products in feed
Transforming products...
Transformed X products (skipped Y)
Connecting to Algolia...
Indexing products in batches...
Configuring index settings...
Creating/updating composition...
Done!
```

### 6. Configure Image Domains

Update `next.config.ts` to allow images from your product image CDN:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-image-cdn.com',
      },
      // Add additional domains as needed
    ],
  },
};

export default nextConfig;
```

### 7. Update Product Type (if needed)

If your product data has different fields, update `lib/types/product.ts` to match. The indexing script transforms data to this structure:

```typescript
interface Product {
  objectID: string;
  id: string;
  title: string;
  sku: string;
  brand: string;
  description: string;
  shortDescription: string;
  url: string;
  imageUrl: string;
  stock: number;
  inStock: boolean;
  price: number;
  normalPrice: number;
  discount: number;
  discountPercentage: number;
  categories: { lvl0: string[]; lvl1: string[]; lvl2: string[]; lvl3: string[] };
  hierarchicalCategories: { lvl0: string[]; lvl1: string[]; lvl2: string[]; lvl3: string[] };
  // ... additional fields
}
```

### 8. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 to see the demo.

### Index Settings Reference

The indexing script configures:

**Searchable Attributes** (in priority order):
- `title` - ordered (beginning matches rank higher)
- `brand`, `titleEn`, `sku` - unordered
- `categories.lvl0-2` - same priority, unordered
- `shortDescription` - unordered
- `characteristics`, `ingredients` - same priority, unordered
- `description` - lowest priority, unordered

**Facets:**
- `brand`, `categories.lvl0-2` (searchable)
- `hierarchicalCategories.lvl0-3`
- `characteristics`, `ingredients`, `format`
- `inStock`, `price`, `rating` (filter only)

**Custom Ranking:**
- In-stock products first
- Higher rating
- More reviews

## Architecture

### App Structure

**Pages:**
- `/` - Home/search page with product listing
- `/products/[id]` - Product detail page (SSR with Algolia data fetch)
- `/category/[...slug]` - Category browsing page
- `/checkout` - Checkout page with AI recommendations
- `/user/[id]` - User profile selection page

**Key Directories:**
- `app/` - Next.js App Router pages and layouts
- `components/` - React components organized by feature
- `lib/` - Utilities and type definitions
- `lib/types/` - TypeScript interfaces (Product, User, etc.)

### Context Providers

The app uses a nested provider structure in `components/providers.tsx`:

1. **CartProvider** - Global shopping cart state
2. **UserProvider** - Current user profile selection (for personalization)
3. **ClickCollectProvider** - Store pickup location and shop selection
4. **SidepanelProvider** - Controls AI assistant sidepanel visibility
5. **InstantSearch** - Algolia search/composition state with routing

All providers wrap the application in `app/layout.tsx`.

### AI Agent System

The application features three specialized AI agents powered by Algolia Agent Studio:

**1. Sidepanel Agent** (`components/sidepanel-agent-studio/`)
- Context-aware assistant that appears on search and product pages
- Automatically injects page context (URL state, current product, user profile)
- Uses `context-snapshot.ts` to resolve and hydrate context before each message
- Tools: `addToCart`, `showItems`
- Hook: `useAgentStudio()` in `hooks/use-agent-studio.ts`

**2. Product Page Agent** (`components/sidepanel-agent-studio/components/product-page-agent.tsx`)
- Specialized agent for product detail pages
- Has direct access to current product data
- Generates contextual follow-up questions via `useFollowUpQuestions()`

**3. Checkout Agent** (`components/checkout-agent/`)
- Provides complementary product recommendations during checkout
- Uses cart context to suggest relevant items
- Tool: `SuggestProductsWithReason` (returns ObjectIDs with reasoning)
- Hook: `useCheckoutSuggestionAgent()` in `hooks/use-checkout-suggestion-agent.ts`

**Context Injection Pattern:**
All agents use a `[CONTEXT]{...}[/CONTEXT]` message format to inject structured data (page type, URL state, product info, user preferences) into the conversation. See `context-snapshot.ts` for implementation details.

**URL State Tracking:**
The sidepanel agent uses a singleton hook (`useUrlSuggestionTrigger`) that wraps Next.js hooks (`usePathname`, `useSearchParams`) to detect URL changes. Only ONE active subscription exists at a time (singleton pattern) to prevent duplicate triggers when multiple component instances are present. Changes are debounced (250ms) and only trigger when the conversation is empty.

**Single Instance Architecture:**
Only ONE `SidepanelExperience` component is rendered in the navbar. Multiple trigger buttons (desktop + mobile) communicate with it via `SidepanelContext`. The component has `showTrigger={false}` to prevent its default trigger button, and custom Brain icon buttons are positioned in the navbar. This ensures:
- Single conversation state across mobile/desktop
- No duplicate suggestion generation
- Consistent follow-up questions
- See `AGENT_INSTANCE_FIX.md` for detailed documentation

### User Personalization

The application features a comprehensive personalization system that adapts search results, filters, and AI recommendations based on user profiles.

**User Profile Structure** (`lib/types/user.ts`)

Each user profile contains preference weights (scores) for various product attributes:
- `categoryPageId` - Specific category pages (e.g., "Cane > Cibo Secco")
- `categories` - General categories (e.g., "Piccoli Animali")
- `hierarchicalCategories.lvl0-3` - Category hierarchy levels
- `età.value` - Age preferences (e.g., "PUPPY", "ADULTO", "ANZIANO")
- `funzione.value` - Function preferences (e.g., "CONTROLLO DEL PESO", "SENSIBILITA'")
- `formato.value` - Format preferences (e.g., "MULTIPACK", "SINGOLA")
- `brand` - Brand preferences (e.g., "ROYAL CANIN", "CROCI")

**Preference Score Format:**
- Each preference has a numeric score (0-20) indicating strength
- Higher scores = stronger preference
- Scores are used for sorting and boosting

**UserContext Implementation** (`components/user/user-context.tsx`)

The `UserProvider` component manages:
- Current user selection state
- User switching via `selectUserById()`
- Computed `personalizationFilters` array

The `personalizationFilters` are automatically generated from user preferences in the format:
```
"facetName:value<score=N>"
```

Examples:
- `"età.value:PUPPY<score=20>"`
- `"brand:ROYAL CANIN<score=17>"`
- `"hierarchicalCategories.lvl0:Gatto<score=20>"`

**Personalization Usage Throughout the App:**

1. **"For You" Filter** (`components/filters-sidebar.tsx`)
   - Displays personalized filter suggestions at the top of the sidebar
   - Parses `personalizationFilters` from UserContext
   - Groups preferences by facet and sorts by score (descending)
   - Only shows preferences with available results (count > 0)
   - Users can toggle individual preferences on/off
   - Acts as standard Algolia refinements (uses `useRefinementList`)
   - Hidden when no user is selected
   - Uses `PREFERENCE_METADATA` for human-readable facet titles

2. **Search Result Boosting** (via Composition API)
   - User preferences are sent to Algolia Composition API
   - Results are boosted based on matching preference attributes
   - Higher-scored preferences have stronger influence

3. **AI Agent Context** (all agents)
   - User preferences injected into agent context via `[CONTEXT]` blocks
   - Agents use preferences to provide personalized recommendations
   - Follow-up questions adapt to user profile

4. **Preference Metadata** (`lib/types/user.ts`)
   - `PREFERENCE_METADATA` maps facet names to display titles
   - Used in UI to show user-friendly labels
   - Example: `"età.value"` → `"Age (Età)"`

**14 Demo User Profiles:**
- New puppy owner
- Senior dog owner
- Indoor cat owner
- Multi-cat household
- Dog + cat owner
- Active dog lifestyle
- Health-conscious cat owner
- Rabbit owner
- Aquarium enthusiast
- Bird owner
- Kitten owner
- Large dog owner
- Spoiled cat parent
- Dog grooming focused

### Click & Collect System

The application features a comprehensive Click & Collect (store pickup) system that allows users to select a pickup location and see product availability at nearby stores.

**Components** (`components/click-collect/`)

1. **ClickCollectSelector** (`click-collect-selector.tsx`)
   - Main entry point - a Sheet panel triggered from the navbar
   - 3-step wizard flow: Location → Date → Shop
   - Supports two view modes: List and Map
   - Integrates with browser geolocation or manual address entry

2. **ClickCollectContext** (`click-collect-context.tsx`)
   - Global state provider for shop selection
   - Persists selections to localStorage (shop, location, pickup date)
   - Computes `shopBoostFilters` for Algolia personalization
   - Key state:
     - `userLocation` - User's coordinates (from browser or address)
     - `selectedPickupDate` - Chosen pickup date
     - `currentShop` - Selected shop for pickup
     - `nearbyShops` - Shops within NEARBY_RADIUS_KM (50km)
     - `allShopsByDistance` - All shops sorted by distance

3. **AddressSearch** (`address-search.tsx`)
   - Geocoding input using Mapbox API
   - Debounced search with autocomplete results
   - Returns coordinates for shop distance calculations

4. **ShopList** (`shop-list.tsx`)
   - Displays shops as selectable cards
   - Shows distance, address, and pickup time estimates
   - `ShopCard` - Full shop card with distance and express pickup indicator
   - `ShopCardSimple` - Simplified version for compact displays

5. **LocationMap** (`location-map.tsx`)
   - Interactive map using Leaflet with OpenStreetMap tiles
   - Dynamically imported (no SSR) to avoid window issues
   - Custom markers for user location, shops, and selected shop
   - Tooltips show shop details on hover
   - Click-to-select location and shop functionality

6. **AvailabilityBadge** (`availability-badge.tsx`)
   - Product-level availability indicator
   - Shows different states:
     - In stock at selected shop (green - "Pronto in 1 ora" or "Disponibile oggi")
     - Available at nearby shop (blue - shows shop name and distance)
     - Available at distant shop (amber)
     - Out of stock - shipping required (gray)
     - No shop selected - shows count of shops with stock

**Utility Files**

- `lib/click-collect-utils.ts` - Helper functions:
  - `calculateDistance()` - Haversine formula for distance calculation
  - `formatDistance()` - Display formatting (m/km)
  - `hasExpressPickup()` - Check if shop qualifies for 1-hour pickup (≤10km)
  - `getPickupTimeLabel()` - Italian labels for pickup time estimates
  - `formatPickupDate()` - Date formatting with "Oggi"/"Domani" handling

- `lib/algolia-locations.ts` - Algolia integration:
  - `fetchShops()` - Get all shops from `arcaplanet_locations` index
  - `fetchShopsByDistance()` - Geo-sorted shops using `aroundLatLng`
  - `fetchNearbyShops()` - Shops within radius using `aroundRadius`

- `lib/mapbox-geocoding.ts` - Address geocoding via Mapbox API (map display uses Leaflet/OpenStreetMap)

**Types** (`lib/types/shop.ts`)
```typescript
interface Shop {
  id: string;
  name: string;
  city: string;
  address?: string;
  region?: string;
  _geoloc: { lat: number; lng: number };
}

interface ShopWithDistance extends Shop {
  distance: number;  // km from user
  hasExpressPickup: boolean;  // true if ≤10km
}

// Constants
SHOP_BOOST_SCORE = 25      // Score for shop availability boost
NEARBY_RADIUS_KM = 50      // Radius for "nearby" shops
EXPRESS_PICKUP_RADIUS_KM = 10  // Radius for 1-hour express pickup
```

**Search Result Boosting**

When shops are selected, the context computes `shopBoostFilters` that boost products available at nearby shops:
- Filters format: `shopAvailability.shopId:<shop-id><score=N>`
- Closest shop gets highest score (25), decreasing by 3 for each subsequent shop
- Sent to Algolia Composition API for personalized ranking

**Integration Points**
- Navbar: Truck icon button opens the selector panel
- ProductCard: Shows `AvailabilityBadge` when shop is selected
- Providers: `ClickCollectProvider` wraps the app in `providers.tsx`

### State Management

- **Global State**: React Context (Cart, User, Sidepanel, ClickCollect)
- **Search State**: Algolia InstantSearch with URL routing
- **AI Chat State**: AI SDK v5 `useChat` hook

### Algolia Integration

**Composition API:**
- Client initialized in `providers.tsx` using `compositionClient()`
- Composition ID: `comp1767629920097___arcaplanet_products`
- InstantSearch components use composition for search with AI-enhanced results

**Agent Studio:**
- Three separate agents with different specializations
- Custom transport layer injects context via `prepareSendMessagesRequest`
- Streaming enabled with AI SDK v5 compatibility mode
- Client-side tool execution for cart operations and product display

## Component Patterns

**Search Components:**
- `SearchPage.tsx` - Main search interface with filters and results
- `filters-sidebar.tsx` - Algolia refinement lists
- `search-autocomplete.tsx` - Predictive search with AI-powered suggestions

**Product Components:**
- `ProductPage.tsx` - Product detail view with agent integration
- `ProductCard.tsx` - Product grid/list item
- `ProductToolbar.tsx` - Sort and view options

**Navigation:**
- `navbar/navbar.tsx` - Main navigation with search, cart, user selector
- `navbar/search-autocomplete.tsx` - Search bar with autocomplete
- `navbar/cart-sheet.tsx` - Cart sidebar
- `navbar/categories-sheet.tsx` - Category navigation

## Important Notes

- Always use `pnpm` as the package manager (not npm/yarn)
- Product images are hosted on external CDNs (configure domains in `next.config.ts`)
- InstantSearch state persists via URL routing with `preserveSharedStateOnUnmount`
- Agent tool calls execute client-side for cart operations (no API routes needed)
- Context snapshots cache product data to avoid redundant fetches (500ms timeout)
- The indexing script (`scripts/index-products.ts`) both indexes products AND creates the Algolia Composition

## Type Safety

Key interfaces:
- `Product` (`lib/types/product.ts`) - Product record from Algolia with fields: `objectID`, `title`, `brand`, `price`, `normalPrice`, `discountPercentage`, `imageUrl`, `categories`, `hierarchicalCategories`, etc.
- `User` - User profile with preference weights
- `CartItem` - Shopping cart item structure
- `ContextSnapshot` - Page context for AI agents (page type, URL state, product, user)
