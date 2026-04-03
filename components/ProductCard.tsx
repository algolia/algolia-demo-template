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
import { useSelection } from "@/components/selection/selection-context";
import { Checkbox } from "@/components/ui/checkbox";
import { PreferenceKey, extractProductFieldValues } from "@/lib/types/user";
import { PREFERENCE_METADATA } from "@/lib/demo-config/users";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Check, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import { getPriceInfo, getPreferredCategory } from "@/lib/utils/product";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { parseColorValue } from "@/components/filters-sidebar";

function getHighestCategoryLevel(
  hierarchicalCategories: Product["hierarchical_categories"]
): string | null {
  if (hierarchicalCategories?.lvl2) return hierarchicalCategories.lvl2;
  if (hierarchicalCategories?.lvl1) return hierarchicalCategories.lvl1;
  return hierarchicalCategories?.lvl0 || null;
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
  /** If set, shows a "Sponsorizzato" badge with this label instead of the raw key */
  sponsoredLabel?: string;
  className?: string;
}

/**
 * Displays a badge for products injected by smart groups.
 * - If sponsoredLabel is provided: blue "Sponsorizzato" badge (retail media inline placement)
 * - If legacy injectedItemKey exists: amber badge with raw key (backward compatible)
 * - Otherwise: nothing
 */
function SmartGroupBadge({ product, sponsoredLabel, className = "" }: SmartGroupBadgeProps) {
  if (sponsoredLabel) {
    return (
      <span
        className={cn(
          "absolute top-0 left-0 z-10 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-br-lg border-r-2 border-b-2 border-blue-300",
          className
        )}
      >
        Sponsorizzato
      </span>
    );
  }

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
              <p className="font-semibold mb-2">Personalized for you</p>
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
// Selection Checkbox Component
// ============================================================================

interface SelectionCheckboxProps {
  product: Product;
  compact?: boolean;
}

function SelectionCheckbox({ product, compact = false }: SelectionCheckboxProps) {
  const { isSelected, toggleSelection } = useSelection();
  const productId = product.objectID;
  const selected = isSelected(productId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelection({
      objectID: productId,
      name: product.name || "Untitled Product",
      brand: product.brand,
      price: product.price?.value,
      imageUrl: product.primary_image,
    });
  };

  const size = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className="absolute top-2 left-2 z-10"
      onClick={handleToggle}
    >
      <Checkbox
        checked={selected}
        className={cn(
          size,
          "bg-background/90 backdrop-blur-sm border-2",
          selected && "border-primary"
        )}
      />
    </div>
  );
}

// ============================================================================
// Color Swatches Component
// ============================================================================

function ColorSwatches({ product, size = "w-4 h-4" }: { product: Product; size?: string }) {
  const colors = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; hex: string }[] = [];

    // Current product color (if available)
    const p = product as any;
    if (p.color?.filter_group) {
      const { name, hex } = parseColorValue(p.color.filter_group);
      if (hex) {
        seen.add(hex);
        result.push({ name, hex });
      }
    }

    // Variant colors (if available)
    if (p.variants) {
      for (const variant of p.variants) {
        if (variant.color?.filter_group) {
          const { name, hex } = parseColorValue(variant.color.filter_group);
          if (hex && !seen.has(hex)) {
            seen.add(hex);
            result.push({ name, hex });
          }
        }
      }
    }

    return result;
  }, [product]);

  if (colors.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {colors.map(({ name, hex }) => (
          <Tooltip key={hex} delayDuration={200}>
            <TooltipTrigger asChild>
              <span
                className={cn("rounded-full border border-border shrink-0", size)}
                style={{ backgroundColor: hex }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs capitalize">
              {name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Product Card Component (Full Size)
// ============================================================================

interface ProductCardProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
  selectable?: boolean;
  /** If set, shows "Sponsorizzato" badge for inline retail media placement */
  sponsoredLabel?: string;
}

export function ProductCard({ product, showCartControls = true, showBadges = true, selectable = false, sponsoredLabel }: ProductCardProps) {
  const { isSelected } = useSelection();
  const imageUrl = product.primary_image || "";
  const productName = product.name || "Untitled Product";
  const productId = product.objectID;

  if (!productId) {
    return null;
  }

  const highestCategory = getHighestCategoryLevel(product.hierarchical_categories);
  const { price, originalPrice, hasDiscount, discountPercentage } = getPriceInfo(product);
  const category = getPreferredCategory(product);

  const smartGroupKey = getSmartGroupKey(product);
  const selected = selectable && isSelected(productId);

  return (
    <Link
      href={`/products/${productId}`}
      className={cn(
        "border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer block relative",
        sponsoredLabel && "border-2 border-blue-300",
        !sponsoredLabel && smartGroupKey && "border-2 border-amber-400",
        selected && "border-2 border-primary"
      )}
    >
      <SmartGroupBadge product={product} sponsoredLabel={sponsoredLabel} />
      {selectable && <SelectionCheckbox product={product} />}
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

      <div className="relative w-full h-56 bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-muted">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{productName}</h3>
        {product.brand && <p className="text-sm text-primary mb-2">{product.brand}</p>}

        {product.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {highestCategory && (
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {highestCategory}
            </span>
          </div>
        )}

        <ColorSwatches product={product} />

        {price > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xl font-bold text-foreground">
              {formatPrice(price)}
            </p>
            {hasDiscount && (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
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
// Product List Item Component (Full Size)
// ============================================================================

interface ProductListItemProps {
  product: Product;
  showCartControls?: boolean;
  showBadges?: boolean;
  selectable?: boolean;
  sponsoredLabel?: string;
}

export function ProductListItem({ product, showCartControls = true, showBadges = true, selectable = false, sponsoredLabel }: ProductListItemProps) {
  const { isSelected } = useSelection();
  const imageUrl = product.primary_image || "";
  const productName = product.name || "Untitled Product";
  const productLink = `/products/${product.objectID}`;
  const productId = product.objectID;
  const { price, originalPrice, hasDiscount, discountPercentage } = getPriceInfo(product);
  const category = getPreferredCategory(product);

  const smartGroupKey = getSmartGroupKey(product);
  const selected = selectable && isSelected(productId);

  if (!productId) {
    return null;
  }

  return (
    <Link
      href={productLink}
      className={cn(
        "group flex gap-4 border border-border rounded-lg overflow-hidden bg-background hover:shadow-lg transition-all duration-300 p-4 relative",
        sponsoredLabel && "border-2 border-blue-300",
        !sponsoredLabel && smartGroupKey && "border-2 border-amber-400",
        selected && "border-2 border-primary"
      )}
    >
      <SmartGroupBadge product={product} sponsoredLabel={sponsoredLabel} />
      {selectable && <SelectionCheckbox product={product} />}
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
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
        )}
        {product.list_categories && product.list_categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.list_categories.map((cat: string, idx: number) => (
              <span
                key={idx}
                className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2">
          <ColorSwatches product={product} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        {price > 0 && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xl font-bold text-foreground">{formatPrice(price)}</p>
            {hasDiscount && (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
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
  const imageUrl = product.primary_image || "";
  const productName = product.name || "Product";
  const productId = product.objectID;
  const { price, originalPrice, hasDiscount, discountPercentage } = getPriceInfo(product);
  const category = getPreferredCategory(product);

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
        <div className="mt-1">
          <ColorSwatches product={product} size="w-3 h-3" />
        </div>
        {price > 0 && (
          <div className="mt-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground">
                {formatPrice(price)}
              </p>
              {hasDiscount && (
                <span className="text-[9px] font-semibold bg-red-500 text-white px-1 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[10px] text-muted-foreground line-through">
                {formatPrice(originalPrice)}
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
  const imageUrl = product.primary_image || "";
  const productName = product.name || "Product";
  const productId = product.objectID;
  const { price, originalPrice, hasDiscount, discountPercentage } = getPriceInfo(product);
  const category = getPreferredCategory(product);

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
                {formatPrice(price)}
              </p>
              {hasDiscount && (
                <span className="text-[9px] font-semibold bg-red-500 text-white px-1 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});
