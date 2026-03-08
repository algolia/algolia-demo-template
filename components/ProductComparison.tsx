"use client";

import { useEffect, useState } from "react";
import { recommendClient } from "@algolia/recommend";
import Image from "next/image";
import Link from "next/link";
import { Star, Eye, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/types/product";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";
import { formatPrice } from "@/lib/utils/format";
import { getPriceInfo } from "@/lib/utils/product";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

const client = recommendClient(
  ALGOLIA_CONFIG.APP_ID,
  ALGOLIA_CONFIG.SEARCH_API_KEY
);

interface ProductComparisonProps {
  product: Product;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  if (!rating && !count) return <span className="text-muted-foreground">–</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

function ComparisonProductCard({
  product,
  isCurrent,
}: {
  product: Product;
  isCurrent?: boolean;
}) {
  const { addItem } = useCart();
  const images = product.image_urls?.length
    ? product.image_urls
    : product.primary_image
      ? [product.primary_image]
      : [];

  const handleAddToCart = () => {
    addItem({
      id: product.objectID,
      name: product.name,
      price: product.price?.value || 0,
      quantity: 1,
      image: images[0],
      brand: product.brand,
    });
  };

  return (
    <div className="flex flex-col items-center text-center gap-2">
      {isCurrent && (
        <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <Eye className="w-3 h-3" />
          Currently viewing
        </div>
      )}
      {!isCurrent && <div className="h-5" />}
      <Link
        href={`/products/${product.objectID}`}
        className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden group"
      >
        {images[0] ? (
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </Link>
      <Link
        href={`/products/${product.objectID}`}
        className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-tight min-h-[2.5rem]"
      >
        {product.name}
      </Link>
      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={handleAddToCart}>
        <ShoppingCart className="w-3.5 h-3.5" />
        Add to cart
      </Button>
    </div>
  );
}

type ComparisonRow = {
  label: string;
  getValue: (product: Product) => React.ReactNode;
};

/** Attrs to exclude from comparison (redundant with other rows or not useful) */
const EXCLUDED_ATTRS = new Set([
  "Brand",
  "Product Dimensions",
  "Item Dimensions LxWxH",
  "Item Weight",
  "Package Weight",
  "Manufacturer",
]);

/**
 * Build comparison rows dynamically from the products being compared.
 * Shows Price + Rating as fixed rows, then attrs shared by most products.
 */
function buildComparisonRows(products: Product[]): ComparisonRow[] {
  const fixedRows: ComparisonRow[] = [
    {
      label: "Price",
      getValue: (product) => {
        const { price, originalPrice, hasDiscount } = getPriceInfo(product);
        if (!price) return <span className="text-muted-foreground">–</span>;
        return (
          <div>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through block">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-lg font-bold">{formatPrice(price)}</span>
          </div>
        );
      },
    },
    {
      label: "Customer Rating",
      getValue: (product) => (
        <StarRating
          rating={product.reviews?.rating || 0}
          count={product.reviews?.count || 0}
        />
      ),
    },
  ];

  // Count how many products have each attr key
  const keyCounts: Record<string, number> = {};
  for (const p of products) {
    if (!p.attrs) continue;
    for (const key of Object.keys(p.attrs)) {
      if (!EXCLUDED_ATTRS.has(key)) {
        keyCounts[key] = (keyCounts[key] || 0) + 1;
      }
    }
  }

  // Sort by frequency (most common first), then alphabetically
  const attrKeys = Object.entries(keyCounts)
    .filter(([, count]) => count >= 3) // at least 3 products must have it
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6) // limit to top 6 attrs
    .map(([key]) => key);

  const attrRows: ComparisonRow[] = attrKeys.map((key) => ({
    label: key,
    getValue: (product) => {
      const value = product.attrs?.[key];
      if (!value) return <span className="text-muted-foreground">–</span>;
      return <span>{value}</span>;
    },
  }));

  return [...fixedRows, ...attrRows];
}

/** Shared comparison table UI */
function ComparisonTable({
  title,
  product,
  recommendedProducts,
  loading,
}: {
  title: string;
  product: Product;
  recommendedProducts: Product[];
  loading: boolean;
}) {
  if (!loading && recommendedProducts.length === 0) return null;

  const allProducts = [product, ...recommendedProducts];
  const comparisonRows = buildComparisonRows(allProducts);

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Product cards row */}
        <div
          className="grid gap-4 p-4 bg-background"
          style={{
            gridTemplateColumns: `repeat(${allProducts.length}, minmax(0, 1fr))`,
          }}
        >
          {allProducts.map((p, i) => (
            <ComparisonProductCard
              key={p.objectID}
              product={p}
              isCurrent={i === 0}
            />
          ))}
        </div>

        {/* Comparison rows */}
        {comparisonRows.map((row) => (
          <div key={row.label}>
            {/* Row header */}
            <div className="px-4 py-2 bg-muted/50 border-t border-border">
              <span className="text-sm font-semibold">{row.label}</span>
            </div>
            {/* Row values */}
            <div
              className="grid gap-4 px-4 py-3 border-t border-border/50"
              style={{
                gridTemplateColumns: `repeat(${allProducts.length}, minmax(0, 1fr))`,
              }}
            >
              {allProducts.map((p) => (
                <div key={p.objectID} className="text-sm">
                  {row.getValue(p)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hook to fetch recommendations for a given model */
function useRecommendations(
  objectID: string,
  model: "related-products" | "looking-similar",
  max: number = 4
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    client
      .getRecommendations({
        requests: [
          {
            indexName: ALGOLIA_CONFIG.INDEX_NAME,
            objectID,
            model,
            maxRecommendations: max,
            threshold: 0,
          },
        ],
      })
      .then((r) => {
        if (cancelled) return;
        setProducts((r.results[0]?.hits as Product[]) || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [objectID, model, max]);

  return { products, loading };
}

/** Compare with Related Products (bought/viewed together) */
export default function ProductComparison({ product }: ProductComparisonProps) {
  const { products, loading } = useRecommendations(product.objectID, "related-products");

  return (
    <ComparisonTable
      title="Compare Similar Products"
      product={product}
      recommendedProducts={products}
      loading={loading}
    />
  );
}

/** Compare with Looking Similar (visually similar items) */
export function LookingSimilarComparison({ product }: ProductComparisonProps) {
  const { products, loading } = useRecommendations(product.objectID, "looking-similar");

  return (
    <ComparisonTable
      title="Compare Looking Similar"
      product={product}
      recommendedProducts={products}
      loading={loading}
    />
  );
}
