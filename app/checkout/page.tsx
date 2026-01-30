"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Truck,
  Lock,
  ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CheckoutAIBlock from "@/components/checkout-agent/components/checkout-suggestion-agent";

function CheckoutPage() {
  const { items, removeItem, updateQuantity, itemCount, total, clearCart } =
    useCart();

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const shippingCost = shippingMethod === "express" ? 9.99 : 4.99;
  const orderTotal = total + shippingCost;

  if (!items) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Il tuo carrello è vuoto
            </h1>
            <p className="text-muted-foreground mb-8">
              Aggiungi prodotti per iniziare lo shopping
            </p>
            <Button asChild>
              <Link href="/">Continua lo shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Continua lo shopping
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShoppingBag className="h-8 w-8" />
            Checkout
          </h1>
          <p className="text-muted-foreground mt-1">
            {itemCount} {itemCount === 1 ? "articolo" : "articoli"} nel carrello
          </p>
        </div>
              {/* Checkout Suggestion Agent */}
      <CheckoutAIBlock
        applicationId={process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!}
        apiKey={process.env.NEXT_PUBLIC_AGENT_API_KEY!}
        agentId={process.env.NEXT_PUBLIC_ALGOLIA_CHECKOUT_SUGGESTION_AGENT_ID!}
      />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Informazioni di spedizione
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input id="firstName" placeholder="Mario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input id="lastName" placeholder="Rossi" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="mario.rossi@email.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Telefono *</Label>
                  <Input id="phone" type="tel" placeholder="+39 123 456 7890" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Indirizzo *</Label>
                  <Input id="address" placeholder="Via Roma 123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Città *</Label>
                  <Input id="city" placeholder="Milano" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">CAP *</Label>
                  <Input id="postalCode" placeholder="20100" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="province">Provincia *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MI">Milano</SelectItem>
                      <SelectItem value="RM">Roma</SelectItem>
                      <SelectItem value="NA">Napoli</SelectItem>
                      <SelectItem value="TO">Torino</SelectItem>
                      <SelectItem value="FI">Firenze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Shipping Method */}
              <div>
                <h3 className="font-medium mb-4">Metodo di spedizione</h3>
                <RadioGroup
                  value={shippingMethod}
                  onValueChange={setShippingMethod}
                  className="space-y-3"
                >
                  <label
                    htmlFor="standard"
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      shippingMethod === "standard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="standard" id="standard" />
                      <div>
                        <p className="font-medium">Spedizione Standard</p>
                        <p className="text-sm text-muted-foreground">
                          3-5 giorni lavorativi
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">€4.99</span>
                  </label>
                  <label
                    htmlFor="express"
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      shippingMethod === "express"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="express" id="express" />
                      <div>
                        <p className="font-medium">Spedizione Express</p>
                        <p className="text-sm text-muted-foreground">
                          1-2 giorni lavorativi
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">€9.99</span>
                  </label>
                </RadioGroup>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Metodo di pagamento</h2>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3 mb-6"
              >
                <label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Carta di credito/debito</span>
                </label>
                <label
                  htmlFor="paypal"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "paypal"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="paypal" id="paypal" />
                  <span className="font-bold text-blue-600">Pay</span>
                  <span className="font-bold text-blue-800">Pal</span>
                </label>
              </RadioGroup>

              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Numero carta *</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nome sulla carta *</Label>
                    <Input id="cardName" placeholder="MARIO ROSSI" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Scadenza *</Label>
                      <Input id="expiry" placeholder="MM/AA" maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input id="cvv" placeholder="123" maxLength={4} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>I tuoi dati di pagamento sono protetti e crittografati</span>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Riepilogo ordine</h2>

              {/* Cart Items */}
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.image ? (
                      <div className="relative w-16 h-16 shrink-0 bg-muted rounded-md overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 bg-muted rounded-md flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {item.brand && (
                        <p className="text-xs text-primary font-medium uppercase">
                          {item.brand}
                        </p>
                      )}
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center border border-border rounded">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-muted transition-colors"
                            aria-label="Diminuisci quantità"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-muted transition-colors"
                            aria-label="Aumenta quantità"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              €{(item.originalPrice * item.quantity).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 h-fit text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Rimuovi articolo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotale</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spedizione</span>
                  <span>€{shippingCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Totale</span>
                  <span>€{orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full mt-6" size="lg">
                Completa ordine
              </Button>

              <Button
                variant="ghost"
                className="w-full mt-2 text-muted-foreground"
                onClick={clearCart}
              >
                Svuota carrello
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return <CheckoutPage />;
}
