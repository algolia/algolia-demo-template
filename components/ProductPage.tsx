"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types/product";
import { formatPrice } from "@/lib/utils/format";
import { getPriceInfo, getPreferredCategory } from "@/lib/utils/product";
import ProductAskAI from "@/components/sidepanel-agent-studio/components/product-page-agent";
import ProductRecommendations from "@/components/ProductRecommendations";
import { useCart } from "@/components/cart/cart-context";
import { useClickCollect } from "@/components/click-collect/click-collect-context";
import { resolveStoreForProduct } from "@/lib/click-collect-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductPageProps {
  product: Product;
}

export default function ProductPage({ product }: ProductPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [pendingDifferentStore, setPendingDifferentStore] = useState<{
    storeId: string;
    storeName: string;
    cartStoreName: string;
  } | null>(null);
  const { addItem, primaryCartStore } = useCart();
  const { currentShop, nearbyShops } = useClickCollect();

  const images = product.image_urls?.length ? product.image_urls : product.primary_image ? [product.primary_image] : [];
  const productName = product.name || "Untitled Product";
  const categoryList = product.list_categories || [];

  // Price and discount calculations
  const { price, originalPrice, hasDiscount, discountPercentage } = getPriceInfo(product);

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAddToCart = () => {
    const productId = product.objectID || product.sku || "";
    if (!productId) return;

    const category = getPreferredCategory(product);

    const doAdd = (storeId?: string, storeName?: string) => {
      addItem({
        id: productId,
        name: productName,
        price,
        quantity,
        image: images[0],
        brand: product.brand,
        category,
        ...(storeId && storeName && { storeId, storeName }),
      });
    };

    const resolution = resolveStoreForProduct(
      product.availableInStores,
      currentShop,
      nearbyShops,
      primaryCartStore?.storeId,
      primaryCartStore?.storeName,
    );

    if (resolution.type === "resolved") {
      doAdd(resolution.storeId, resolution.storeName);
    } else if (resolution.type === "different-store") {
      setPendingDifferentStore({
        storeId: resolution.storeId,
        storeName: resolution.storeName,
        cartStoreName: resolution.cartStoreName,
      });
    } else {
      doAdd();
    }
  };

  const specifications = extractSpecifications(product);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          {categoryList.map((category: string, idx: number) => (
            <li key={idx} className="flex items-center gap-2">
              <span>/</span>
              <Link
                href={`/category/${encodeURIComponent(category)}`}
                className="hover:text-foreground transition-colors"
              >
                {category}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">
              {productName}
            </span>
          </li>
        </ol>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Images + Ask AI */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[selectedImageIndex]}
                    alt={`${productName} - Image ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain p-4"
                    priority
                  />

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 text-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${productName} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Ask AI - Below Images */}
            <ProductAskAI
              product={product}
            />
          </div>

          {/* Right Column: Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <Link
                href={`/brand/${encodeURIComponent(product.brand)}`}
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                {product.brand}
              </Link>
            )}

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {productName}
            </h1>

            {/* Product ID */}
            {product.sku && (
              <p className="text-sm text-muted-foreground">
                SKU: {product.sku}
              </p>
            )}

            {/* Price */}
            {price > 0 && (
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white font-semibold text-sm">
                      Save {discountPercentage}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      You save {formatPrice(Math.round(originalPrice - price))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Short Description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed line-clamp-4">
                {product.description}
              </p>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={decrementQuantity}
                  className="p-3 hover:bg-muted transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="p-3 hover:bg-muted transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="w-5 h-5" />
                Add to cart
              </Button>

              {/* Wishlist Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={isWishlisted ? "text-red-500 border-red-500" : ""}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                />
              </Button>

              {/* Share Button */}
              <Button variant="outline" size="lg">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-primary" />
                <span>Free shipping over {formatPrice(49)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RotateCcw className="w-5 h-5 text-primary" />
                <span>30-day returns</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-primary" />
                <span>Secure checkout</span>
              </div>
            </div>

            {/* Specifications */}
            {specifications.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h2 className="text-lg font-semibold mb-4">Specifications</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between sm:block">
                      <dt className="text-sm text-muted-foreground">
                        {spec.label}
                      </dt>
                      <dd className="text-sm font-medium">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Full Description - Full width below both columns */}
        {product.description && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold mb-4">Product Description</h2>
            <div
              className="prose prose-sm max-w-none text-muted-foreground [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </section>
        )}

        <ProductRecommendations objectID={product.objectID} />

      </main>

      <AlertDialog
        open={!!pendingDifferentStore}
        onOpenChange={(open) => !open && setPendingDifferentStore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Different store</AlertDialogTitle>
            <AlertDialogDescription>
              This product is not available at{" "}
              {pendingDifferentStore?.cartStoreName}. Would you like to add it from{" "}
              {pendingDifferentStore?.storeName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDifferentStore) {
                  const productId = product.objectID || product.sku || "";
                  addItem({
                    id: productId,
                    name: productName,
                    price,
                    quantity,
                    image: images[0],
                    brand: product.brand,
                    category: getPreferredCategory(product),
                    storeId: pendingDifferentStore.storeId,
                    storeName: pendingDifferentStore.storeName,
                  });
                }
                setPendingDifferentStore(null);
              }}
            >
              Add
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function to extract specifications from product
function extractSpecifications(
  product: Product
): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];

  if (product.brand) {
    specs.push({ label: "Brand", value: product.brand });
  }

  return specs;
}
