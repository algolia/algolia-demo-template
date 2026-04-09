"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  ShoppingBag,
  MapPin,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-context";
import type { CartItem } from "@/components/cart/cart-context";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils/format";
import { CartQuantityControls } from "@/components/cart-quantity-controls";

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="flex gap-3">
      {item.image ? (
        <div className="relative w-20 h-20 shrink-0 bg-muted rounded-md overflow-hidden">
          <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
        </div>
      ) : (
        <div className="w-20 h-20 shrink-0 bg-muted rounded-md flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {item.brand && (
          <p className="text-xs text-primary font-medium uppercase">{item.brand}</p>
        )}
        <h4 className="text-sm font-medium text-foreground line-clamp-2">{item.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-bold text-foreground">{formatPrice(item.price)}</p>
          {item.originalPrice && item.originalPrice > item.price && (
            <p className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <CartQuantityControls
            quantity={item.quantity}
            onUpdate={(qty) => updateQuantity(item.id, qty)}
            spanClassName="w-8 text-center text-sm"
          />
          <button
            onClick={() => removeItem(item.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartSheet() {
  const {
    items,
    itemCount,
    total,
    clearCart,
  } = useCart();
  const router = useRouter();

  const groupedByStore = useMemo(() => {
    const storeGroups = new Map<string, { storeName: string; items: CartItem[] }>();
    const delivery: CartItem[] = [];

    for (const item of items) {
      if (item.storeId && item.storeName) {
        const group = storeGroups.get(item.storeId);
        if (group) {
          group.items.push(item);
        } else {
          storeGroups.set(item.storeId, { storeName: item.storeName, items: [item] });
        }
      } else {
        delivery.push(item);
      }
    }

    return { storeGroups: Array.from(storeGroups.entries()), delivery };
  }, [items]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="relative"
          aria-label="Open cart"
        >
          <ShoppingCart className="size-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-primary-foreground text-xs font-medium flex items-center justify-center">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Your cart is empty
            </h3>
            <p className="text-sm text-muted-foreground">
              Add products to start shopping
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Store pickup groups */}
              {groupedByStore.storeGroups.map(([storeId, { storeName, items: storeItems }]) => (
                <div key={storeId}>
                  <div className="flex items-center gap-2 px-1 py-2 mb-2 border-b">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{storeName}</span>
                    <span className="text-xs text-muted-foreground">
                      ({storeItems.length} {storeItems.length === 1 ? "prodotto" : "prodotti"})
                    </span>
                  </div>
                  <div className="space-y-4">
                    {storeItems.map((item) => (
                      <CartItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Home delivery group */}
              {groupedByStore.delivery.length > 0 && (
                <div>
                  {groupedByStore.storeGroups.length > 0 && (
                    <div className="flex items-center gap-2 px-1 py-2 mb-2 border-b">
                      <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">Spedizione a domicilio</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {groupedByStore.delivery.map((item) => (
                      <CartItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <SheetFooter className="flex-col gap-4 border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold">{formatPrice(total)}</span>
              </div>

              <Separator />

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  Clear
                </Button>
                <Button className="flex-1" onClick={() => router.push("/checkout")}>Checkout</Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
