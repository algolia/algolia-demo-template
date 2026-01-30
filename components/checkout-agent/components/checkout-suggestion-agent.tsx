"use client";

import { SparklesIcon, Plus, Minus, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/types/product";
import { getObjectsByIds } from "@/lib/getObjectByIDs";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user/user-context";
import { CheckoutContext, CartItemContext } from "@/lib/types/checkout-context";
import {
  useCheckoutSuggestionAgent,
  SuggestionItem,
  SuggestProductsWithReasonToolCall,
} from "../hooks/use-checkout-suggestion-agent";
import { ALGOLIA_CONFIG } from "@/lib/algolia-config";

export interface CheckoutAIBlockConfig {
  applicationId: string;
  apiKey: string;
  agentId: string;
  indexName?: string;
}

const AnimatedShinyText = ({ children }: { children: React.ReactNode }) => (
  <span className="text-neutral-600/70 dark:text-neutral-400/70 animate-pulse">
    {children}
  </span>
);

function AddToCartButton({ product }: { product: Product }) {
  const { items, addItem, updateQuantity } = useCart();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const productId = product.objectID || product.productid;
  const productName = product.productname || product.producttitle || "Prodotto";
  const price = product.fullSellingPrice;
  const imageUrl = product.images?.[0] || "";

  const cartItem = items.find((item) => item.id === productId);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Extract category - prefer lvl1 for a good balance of specificity
    const category =
      product.hierarchicalCategories?.lvl1 ||
      product.hierarchicalCategories?.lvl0 ||
      product.categories?.[0];

    addItem({
      id: productId || "",
      name: productName,
      price,
      image: imageUrl,
      brand: product.brand,
      category,
    });

    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 1500);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (productId) updateQuantity(productId, quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (productId) updateQuantity(productId, quantity - 1);
  };

  if (quantity === 0) {
    return (
      <Button
        onClick={handleAdd}
        size="icon-sm"
        variant="default"
        className={`h-6 w-6 shrink-0 transition-all ${
          showConfirmation ? "bg-green-600 hover:bg-green-600" : ""
        }`}
        aria-label="Add to cart"
      >
        {showConfirmation ? (
          <Check className="h-3 w-3" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
      </Button>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 bg-background border rounded shrink-0"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        onClick={handleDecrease}
        size="icon-sm"
        variant="ghost"
        className="h-5 w-5"
        aria-label="Decrease quantity"
      >
        <Minus className="h-2.5 w-2.5" />
      </Button>
      <span className="w-4 text-center text-xs font-medium">{quantity}</span>
      <Button
        onClick={handleIncrease}
        size="icon-sm"
        variant="ghost"
        className="h-5 w-5"
        aria-label="Increase quantity"
      >
        <Plus className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}

function SuggestionCard({
  product,
  reasoning,
}: {
  product: Product;
  reasoning: string;
}) {
  const imageUrl = product.images?.[0] || "";
  const productName = product.productname || product.producttitle || "Prodotto";
  const productId = product.objectID || product.productid;

  return (
    <div className="space-y-1">
      <div className="group flex items-center gap-2 p-2 rounded-md border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all">
        <Link
          href={`/products/${productId}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {imageUrl ? (
            <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-muted relative">
              <Image
                src={imageUrl}
                alt={productName}
                fill
                className="object-contain p-0.5"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="w-10 h-10 shrink-0 rounded bg-muted" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {productName}
            </p>
            {product.prezzo && (
              <p className="text-xs font-semibold text-primary">
                €{product.prezzo}
              </p>
            )}
          </div>
        </Link>
        <AddToCartButton product={product} />
      </div>
      <p className="text-[10px] text-muted-foreground italic line-clamp-2 px-1">
        {reasoning}
      </p>
    </div>
  );
}

export default function CheckoutAIBlock({
  applicationId,
  apiKey,
  agentId,
  indexName = ALGOLIA_CONFIG.INDEX_NAME,
}: CheckoutAIBlockConfig) {
  const { items, itemCount, total } = useCart();
  const { currentUser } = useUser();

  // Build context from cart and user
  const checkoutContext = useMemo<CheckoutContext>(() => {
    const cartItems: CartItemContext[] = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      brand: item.brand,
      category: item.category,
    }));

    return {
      cart: {
        items: cartItems,
        itemCount,
        total,
      },
      ...(currentUser && {
        user: {
          description: currentUser.description,
          preferences: currentUser.preferences,
        },
      }),
    };
  }, [items, itemCount, total, currentUser]);

  const { generateSuggestions, isGenerating, messages } =
    useCheckoutSuggestionAgent({
      applicationId,
      apiKey,
      agentId: process.env.NEXT_PUBLIC_ALGOLIA_CHECKOUT_AGENT_ID ?? agentId,
      context: checkoutContext,
    });

  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!hasTriggered) {
      setHasTriggered(true);
      generateSuggestions();
    }
  }, [hasTriggered, generateSuggestions]);

  // Extract search queries from algolia_search_index tool calls
  const searchQueries = useMemo<string[]>(() => {
    const queries: string[] = [];
    for (const message of messages) {
      if (message.role === "assistant") {
        for (const part of message.parts) {
          // Check for algolia_search_index tool calls
          const toolPart = part as {
            type?: string;
            state?: string;
            input?: { query?: string };
          };
          if (
            toolPart.type === "tool-algolia_search_index" &&
            toolPart.state === "output-available" &&
            toolPart.input?.query
          ) {
            queries.push(toolPart.input.query);
          }
        }
      }
    }
    return [...new Set(queries)]; // Remove duplicates
  }, [messages]);

  const suggestions = useMemo<SuggestionItem[]>(() => {
    for (const message of messages) {
      if (message.role === "assistant") {
        for (const part of message.parts) {
          const toolPart = part as SuggestProductsWithReasonToolCall;
          if (
            toolPart.type === "tool-SuggestProductsWithReason" &&
            toolPart.state === "output-available" &&
            toolPart.output?.items
          ) {
            return toolPart.output.items;
          }
        }
      }
    }
    return [];
  }, [messages]);

  // Check if currently searching
  const isSearching = useMemo(() => {
    for (const message of messages) {
      if (message.role === "assistant") {
        for (const part of message.parts) {
          const toolPart = part as { type?: string; state?: string };
          if (
            toolPart.type === "tool-algolia_search_index" &&
            (toolPart.state === "input-streaming" ||
              toolPart.state === "input-available")
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [messages]);

  useEffect(() => {
    if (suggestions.length === 0 || products.size > 0) return;

    const fetchProducts = async () => {
      setIsFetchingProducts(true);
      try {
        const productIds = suggestions.map((s) => s.ObjectID);
        const fetchedProducts = await getObjectsByIds<Product>(
          productIds,
          indexName
        );

        const productMap = new Map<string, Product>();
        for (const product of fetchedProducts) {
          if (product) {
            const id = product.objectID ?? product.productid;
            if (id) productMap.set(id, product);
          }
        }
        setProducts(productMap);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsFetchingProducts(false);
      }
    };

    fetchProducts();
  }, [suggestions, indexName, products.size]);

  const isLoading = isGenerating || isFetchingProducts;

  if (!isLoading && suggestions.length === 0 && hasTriggered) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <SparklesIcon size={14} className="text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Suggerimenti AI
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {isSearching && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <SparklesIcon size={10} className="animate-pulse" />
              <AnimatedShinyText>Ricerca prodotti...</AnimatedShinyText>
            </p>
          )}
          {!isSearching && isGenerating && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <SparklesIcon size={10} className="animate-pulse" />
              <AnimatedShinyText>Generazione suggerimenti...</AnimatedShinyText>
            </p>
          )}
          {isFetchingProducts && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <SparklesIcon size={10} className="animate-pulse" />
              <AnimatedShinyText>Caricamento prodotti...</AnimatedShinyText>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Show search queries if any */}
          {searchQueries.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Cercato:{" "}
              {searchQueries.map((q, i) => (
                <span key={q}>
                  {i > 0 && ", "}
                  <span className="font-medium">&quot;{q}&quot;</span>
                </span>
              ))}
            </p>
          )}

          {/* Product suggestions */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {suggestions.map((suggestion) => {
              const product = products.get(suggestion.ObjectID);
              if (!product) return null;
              return (
                <div key={suggestion.ObjectID} className="shrink-0 w-56">
                  <SuggestionCard
                    product={product}
                    reasoning={suggestion.reasoning}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
