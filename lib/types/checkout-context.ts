import { User } from "./user";

export interface CartItemContext {
  name: string;
  quantity: number;
  brand?: string;
  category?: string;
}

export interface CheckoutContext {
  cart: {
    items: CartItemContext[];
    itemCount: number;
    total: number;
  };
  user?: {
    description: string;
    preferences: User["preferences"];
  };
}

