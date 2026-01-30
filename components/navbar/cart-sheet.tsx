"use client";

import Image from "next/image";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
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
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export function CartSheet() {
  const {
    items,
    removeItem,
    updateQuantity,
    itemCount,
    total,
    clearCart,
  } = useCart();
  const router = useRouter();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="relative"
          aria-label="Open cart"
        >
          <ShoppingCart className="size-8" />
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
            Carrello ({itemCount} {itemCount === 1 ? "articolo" : "articoli"})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Il tuo carrello è vuoto
            </h3>
            <p className="text-sm text-muted-foreground">
              Aggiungi prodotti per iniziare lo shopping
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  {item.image ? (
                    <div className="relative w-20 h-20 shrink-0 bg-muted rounded-md overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 bg-muted rounded-md flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-xs text-primary font-medium uppercase">
                        {item.brand}
                      </p>
                    )}
                    <h4 className="text-sm font-medium text-foreground line-clamp-2">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-foreground">
                        €{item.price.toFixed(2)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          €{item.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1 hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
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
              ))}
            </div>

            <SheetFooter className="flex-col gap-4 border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground">Subtotale</span>
                <span className="text-lg font-bold">€{total.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  Svuota
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
