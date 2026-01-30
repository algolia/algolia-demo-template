/**
 * ProductCard.tsx - Product Display Components
 *
 * This file contains all product card variants used throughout the application.
 * It's the single source of truth for product display logic, including:
 * - Price calculations (fullSellingPrice, listPrice, discounts)
 * - Personalization icons (sparkle badges for user preference matches)
 * - Cart controls (add to cart, quantity management)
 * - Discount badges (percentage off, savings amount)
 *
 * COMPONENTS EXPORTED:
 *
 * 1. ProductCard (Full Size - Grid View)
 *    - Used in: app/page.tsx (SearchPage main grid)
 *    - Display: Full product info with image, title, brand, description, category, price
 *    - Features: Discount badge, personalization icon, add to cart button
 *    - Props: { product: Product, showCartControls?: boolean }
 *
 * 2. ProductListItem (Full Size - List View)
 *    - Used in: app/page.tsx (SearchPage list view)
 *    - Display: Horizontal layout with image, details, and price column
 *    - Features: Same as ProductCard but optimized for list layout
 *    - Props: { product: Product, showCartControls?: boolean }
 *
 * 3. CompactProductCard (Compact - Grid View)
 *    - Used in: AI agent chat interfaces (sidepanel, product page agent)
 *    - Display: Narrow 160px cards for chat product recommendations
 *    - Features: Smaller fonts, compact spacing, mini discount badges
 *    - Props: { product: Product, showCartControls?: boolean }
 *
 * 4. CompactProductListItem (Compact - List View)
 *    - Used in: components/navbar/search-autocomplete.tsx (autocomplete dropdown)
 *    - Display: Horizontal compact layout for search results
 *    - Features: Small image, truncated text, inline pricing with discounts
 *    - Props: { product: Product, showCartControls?: boolean, className?: string }
 *
 * PRICING LOGIC:
 * - Uses Product.price as the current/selling price
 * - Uses Product.normalPrice as the original price (before discount)
 * - Uses Product.discountPercentage if available, otherwise calculates: ((normalPrice - price) / normalPrice) × 100
 * - Shows discount badge and strikethrough original price when hasDiscount = true
 *
 * PERSONALIZATION:
 * - PersonalizationIcon component shows sparkle badge when product matches user preferences
 * - Tooltip displays matched facets (e.g., "Age: PUPPY (20/20)", "Brand: ROYAL CANIN (17/20)")
 * - Uses extractProductFieldValues() to match product attributes against user.preferences
 *
 * CART INTEGRATION:
 * - QuantityControls component handles add to cart functionality
 * - Shows "+" button when quantity = 0
 * - Shows "-/quantity/+" controls when item is in cart
 * - Includes visual confirmation animation on add
 * - Can be hidden via showCartControls={false} prop (defaults to true)
 *
 * MAINTAINABILITY:
 * - All product display logic is centralized here
 * - Changes to pricing, discounts, or product display only need to be made once
 * - Autocomplete component uses CompactProductListItem to avoid duplication
 * - Consistent styling and behavior across all views
 *
 * USAGE EXAMPLES:
 *
 * // Default usage - shows cart controls
 * <ProductCard product={product} />
 *
 * // Hide cart controls (read-only view)
 * <ProductCard product={product} showCartControls={false} />
 *
 * // In autocomplete dropdown with custom styling (no border, no padding)
 * <CompactProductListItem
 *   product={product}
 *   showCartControls={false}
 *   className="border-0 rounded-none p-0"
 * />
 *
 * // In read-only contexts (email, print, etc.)
 * <CompactProductCard product={product} showCartControls={false} />
 */

import React, { memo, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types/product";
import { useCart } from "@/components/cart/cart-context";
import { useUser } from "@/components/user/user-context";
import { PREFERENCE_METADATA, PreferenceKey, extractProductFieldValues } from "@/lib/types/user";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Check, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

function getHighestCategoryLevel(
  hierarchicalCategories: Product["hierarchicalCategories"]
): string | null {
  if (hierarchicalCategories?.lvl3?.length) return hierarchicalCategories.lvl3[0];
  if (hierarchicalCategories?.lvl2?.length) return hierarchicalCategories.lvl2[0];
  if (hierarchicalCategories?.lvl1?.length) return hierarchicalCategories.lvl1[0];
  return hierarchicalCategories?.lvl0?.[0] || null;
}

// ============================================================================
// Smart Group Badge Component
// ============================================================================

/**
 * Extracts the injectedItemKey from the Composition API's _rankingInfo
 * This indicates the item was injected by a smart group
 */
function getSmartGroupKey(product: Product): string | null {
  const rankingInfo = (product as Product & { _rankingInfo?: {
    composed?: Record<string, { injectedItemKey?: string }>;
  } })._rankingInfo;

  return rankingInfo?.composed?.[ALGOLIA_CONFIG.COMPOSITION_ID]?.injectedItemKey || null;
}

interface SmartGroupBadgeProps {
  product: Product;
  className?: string;
}

/**
 * Displays a badge for products injected by smart groups
 * Shows the injectedItemKey value as the badge label
 * Positioned at top-left with a border accent
 */
function SmartGroupBadge({ product, className = "" }: SmartGroupBadgeProps) {
  const smartGroupKey = getSmartGroupKey(product);

  if (!smartGroupKey) return null;

  return (
    <span
      className={cn(
        "absolute top-0 left-0 z-10 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-br-lg border-r-2 border-b-2 border-amber-400 capitalize",
        className
      )}
    >
      {smartGroupKey}
    </span>
  );
}

// ============================================================================
// Product Badges Component (Personalization)
// ============================================================================

interface PersonalizationMatch {
  facetTitle: string;
  value: string;
  score: number;
}

interface ProductBadgesProps {
  product: Product;
  compact?: boolean;
}

function ProductBadges({ product, compact = false }: ProductBadgesProps) {
  const { currentUser } = useUser();

  // Calculate personalization matches
  const personalizationMatches = useMemo(() => {
    if (!currentUser?.preferences) return [];

    const foundMatches: PersonalizationMatch[] = [];

    (Object.keys(currentUser.preferences) as PreferenceKey[]).forEach((preferenceKey) => {
      const userPrefs = currentUser.preferences[preferenceKey];
      if (!userPrefs || Object.keys(userPrefs).length === 0) return;

      const productValues = extractProductFieldValues(product, preferenceKey);

      productValues.forEach((value) => {
        const score = userPrefs[value];
        if (score !== undefined) {
          const metadata = PREFERENCE_METADATA[preferenceKey];
          foundMatches.push({
            facetTitle: metadata?.title || preferenceKey,
            value,
            score,
          });
        }
      });
    });

    return foundMatches;
  }, [currentUser, product]);

  const hasPersonalization = personalizationMatches.length > 0;

  // Don't render anything if no badges to show
  if (!hasPersonalization) return null;

  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";
  const badgeSize = compact ? "h-5 w-5" : "h-6 w-6";

  return (
    <div
      className="absolute bottom-2 left-2 z-10 flex items-center gap-1"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Personalization Badge */}
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-purple-100 text-purple-700 cursor-pointer",
                badgeSize
              )}
            >
              <Sparkles className={iconSize} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="text-sm">
              <p className="font-semibold mb-2">Personalizzato per te</p>
              <div className="space-y-1">
                {personalizationMatches.map((match, index) => (
                  <div key={index} className="text-xs">
                    <span className="text-muted-foreground">{match.facetTitle}:</span>{" "}
                    <span className="font-medium">{match.value}</span>
                    <span className="text-muted-foreground ml-1">({match.score}/20)</span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// Quantity Controls Component
// ============================================================================

interface QuantityControlsProps {
  productId: string;
  productName: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  brand?: string;
  category?: string;
  compact?: boolean;
}

function QuantityControls({
  productId,
  productName,
  price,
  originalPrice,
  imageUrl,
  brand,
  category,
  compact = false,
}: QuantityControlsProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const cartItem = items.find((item) => item.id === productId);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: productId,
      name: productName,
      price,
      originalPrice,
      image: imageUrl,
      brand,
      category,
    });

    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 1500);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(productId, quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(productId, quantity - 1);
  };

  const buttonSize = compact ? "h-6 w-6" : "h-7 w-7";
  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";

  if (quantity === 0) {
    return (
      <Button
        onClick={handleAdd}
        size="icon-sm"
        variant="default"
        className={`absolute top-2 right-2 z-10 transition-all ${buttonSize} ${
          showConfirmation ? "bg-green-600 hover:bg-green-600" : ""
        }`}
        aria-label="Add to cart"
      >
        {showConfirmation ? (
          <Check className={iconSize} />
        ) : (
          <Plus className={iconSize} />
        )}
      </Button>
    );
  }

  return (
    <div
      className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background border rounded-md shadow-sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        onClick={handleDecrease}
        size="icon-sm"
        variant="ghost"
        className={buttonSize}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span
        className={`text-center font-medium ${compact ? "w-5 text-xs" : "w-6 text-sm"}`}
      >
        {quantity}
      </span>
      <Button
        onClick={handleIncrease}
        size="icon-sm"
        variant="ghost"
        className={buttonSize}
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================================================
// Product Card Component (Full Size)
// ============================================================================

interface ProductCardProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
}

export function ProductCard({ product, showCartControls = true, showBadges = true }: ProductCardProps) {
  const imageUrl = product.imageUrl || "";
  const productName = product.title || "Untitled Product";
  const productId = product.objectID;

  if (!productId) {
    return null;
  }

  const highestCategory = getHighestCategoryLevel(product.hierarchicalCategories);
  const price = product.price || 0;
  const originalPrice = product.normalPrice || 0;
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercentage = product.discountPercentage || (hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  // Extract category - prefer lvl1 for a good balance of specificity
  const category =
    product.hierarchicalCategories?.lvl1?.[0] ||
    product.hierarchicalCategories?.lvl0?.[0] ||
    product.categories?.lvl0?.[0];

  const smartGroupKey = getSmartGroupKey(product);

  return (
    <Link
      href={`/products/${productId}`}
      className={cn(
        "border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer block relative",
        smartGroupKey && "border-2 border-amber-400"
      )}
    >
      <SmartGroupBadge product={product} />
      {showBadges && <ProductBadges product={product} />}
      {showCartControls && (
        <QuantityControls
          productId={productId}
          productName={productName}
          price={price}
          originalPrice={hasDiscount ? originalPrice : undefined}
          imageUrl={imageUrl}
          brand={product.brand}
          category={category}
        />
      )}

      {imageUrl && (
        <Image
          src={imageUrl}
          alt={productName}
          width={100}
          height={100}
          className="h-40 w-auto object-cover rounded mb-3 justify-center align-middle items-center"
        />
      )}
      <h3 className="font-semibold text-lg mb-2">{productName}</h3>
      {product.brand && <p className="text-sm text-primary mb-2">{product.brand}</p>}

      {product.shortDescription && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {product.shortDescription}
        </p>
      )}

      {highestCategory && (
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {highestCategory}
          </span>
        </div>
      )}

      {price > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-foreground">
            €{price.toFixed(2)}
          </p>
          {hasDiscount && (
            <>
              <p className="text-sm text-muted-foreground line-through">
                €{originalPrice.toFixed(2)}
              </p>
              <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded">
                -{discountPercentage}%
              </span>
            </>
          )}
        </div>
      )}
    </Link>
  );
}

// ============================================================================
// Product List Item Component (Full Size)
// ============================================================================

interface ProductListItemProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
}

export function ProductListItem({ product, showCartControls = true, showBadges = true }: ProductListItemProps) {
  const imageUrl = product.imageUrl || "";
  const productName = product.title || "Untitled Product";
  const productLink = `/products/${product.objectID}`;
  const productId = product.objectID;
  const price = product.price || 0;
  const originalPrice = product.normalPrice || 0;
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercentage = product.discountPercentage || (hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  // Extract category - prefer lvl1 for a good balance of specificity
  const category =
    product.hierarchicalCategories?.lvl1?.[0] ||
    product.hierarchicalCategories?.lvl0?.[0] ||
    product.categories?.lvl0?.[0];

  const smartGroupKey = getSmartGroupKey(product);

  if (!productId) {
    return null;
  }

  return (
    <Link
      href={productLink}
      className={cn(
        "group flex gap-4 border border-border rounded-lg overflow-hidden bg-background hover:shadow-lg transition-all duration-300 p-4 relative",
        smartGroupKey && "border-2 border-amber-400"
      )}
    >
      <SmartGroupBadge product={product} />
      {showBadges && <ProductBadges product={product} />}
      {showCartControls && (
        <QuantityControls
          productId={productId}
          productName={productName}
          price={price}
          originalPrice={hasDiscount ? originalPrice : undefined}
          imageUrl={imageUrl}
          brand={product.brand}
          category={category}
        />
      )}

      <div className="relative w-32 h-32 shrink-0 bg-muted rounded-md overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {product.brand && (
          <p className="text-xs text-primary font-medium mb-1 uppercase tracking-wide">
            {product.brand}
          </p>
        )}
        <h3 className="font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {productName}
        </h3>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.shortDescription}
          </p>
        )}
        {product.categories?.lvl0 && product.categories.lvl0.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.categories.lvl0.map((cat, idx) => (
              <span
                key={idx}
                className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        {price > 0 && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xl font-bold text-foreground">€{price.toFixed(2)}</p>
            {hasDiscount && (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  €{originalPrice.toFixed(2)}
                </p>
                <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// Compact Product Card Component (for chat display)
// ============================================================================

interface CompactProductCardProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
}

export const CompactProductCard = memo(function CompactProductCard({
  product,
  showCartControls = true,
  showBadges = true,
}: CompactProductCardProps) {
  const imageUrl = product.imageUrl || "";
  const productName = product.title || "Prodotto";
  const productId = product.objectID;
  const price = product.price || 0;
  const originalPrice = product.normalPrice || 0;
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercentage = product.discountPercentage || (hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  // Extract category - prefer lvl1 for a good balance of specificity
  const category =
    product.hierarchicalCategories?.lvl1?.[0] ||
    product.hierarchicalCategories?.lvl0?.[0] ||
    product.categories?.lvl0?.[0];

  if (!productId) {
    return null;
  }

  return (
    <Link
      href={`/products/${productId}`}
      className="group block border border-border rounded-lg overflow-hidden bg-background hover:shadow-md hover:border-primary/50 transition-all duration-200 relative w-40"
    >
      {showBadges && <ProductBadges product={product} compact />}
      {showCartControls && (
        <QuantityControls
          productId={productId}
          productName={productName}
          price={price}
          originalPrice={hasDiscount ? originalPrice : undefined}
          imageUrl={imageUrl}
          brand={product.brand}
          category={category}
          compact
        />
      )}

      <div className="relative w-full h-28 bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain p-2"
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No img
          </div>
        )}
      </div>

      <div className="p-2">
        {product.brand && (
          <p className="text-[10px] text-primary font-medium uppercase tracking-wide mb-0.5 truncate">
            {product.brand}
          </p>
        )}
        <h4 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {productName}
        </h4>
        {price > 0 && (
          <div className="mt-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground">
                €{price.toFixed(2)}
              </p>
              {hasDiscount && (
                <span className="text-[9px] font-semibold bg-red-500 text-white px-1 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[10px] text-muted-foreground line-through">
                €{originalPrice.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});

// ============================================================================
// Compact Product List Item Component (for chat display)
// ============================================================================

interface CompactProductListItemProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
  className?: string;
}

export const CompactProductListItem = memo(function CompactProductListItem({
  product,
  showCartControls = true,
  showBadges = true,
  className = "",
}: CompactProductListItemProps) {
  const imageUrl = product.imageUrl || "";
  const productName = product.title || "Prodotto";
  const productId = product.objectID;
  const price = product.price || 0;
  const originalPrice = product.normalPrice || 0;
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercentage = product.discountPercentage || (hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  // Extract category - prefer lvl1 for a good balance of specificity
  const category =
    product.hierarchicalCategories?.lvl1?.[0] ||
    product.hierarchicalCategories?.lvl0?.[0] ||
    product.categories?.lvl0?.[0];

  if (!productId) {
    return null;
  }

  return (
    <Link
      href={`/products/${productId}`}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 relative",
        className
      )}
    >
      {showBadges && <ProductBadges product={product} compact />}
      {showCartControls && (
        <QuantityControls
          productId={productId}
          productName={productName}
          price={price}
          originalPrice={hasDiscount ? originalPrice : undefined}
          imageUrl={imageUrl}
          brand={product.brand}
          category={category}
          compact
        />
      )}

      {imageUrl ? (
        <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted relative">
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain p-0.5"
            sizes="64px"
          />
        </div>
      ) : (
        <div className="w-16 h-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
          No img
        </div>
      )}
      <div className="flex-1 min-w-0">
        {product.brand && (
          <p className="text-xs text-primary font-medium uppercase tracking-wide mb-0.5">
            {product.brand}
          </p>
        )}
        <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {productName}
        </h4>
        {price > 0 && (
          <div className="mt-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground">
                €{price.toFixed(2)}
              </p>
              {hasDiscount && (
                <span className="text-[9px] font-semibold bg-red-500 text-white px-1 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                €{originalPrice.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});
