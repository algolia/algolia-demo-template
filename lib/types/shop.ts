export interface ShopGeoloc {
  lat: number;
  lng: number;
}

export type StoreService = "fitting_room" | "personal_shopper" | "alterations" | "parking" | "click_collect";

export interface Shop {
  id: string;
  name: string;
  city: string;
  address?: string;
  region?: string;
  _geoloc: ShopGeoloc;
  phone?: string;
  openingHours?: string;
  services?: StoreService[];
}

export interface ShopWithDistance extends Shop {
  distance: number; // km from user
  hasExpressPickup: boolean; // true if < 10km (1hr pickup available)
}

export interface StoreAvailability {
  objectID: string;
  inStock: boolean;
}

export const SHOP_BOOST_SCORE = 25;
export const NEARBY_RADIUS_KM = 50;
export const EXPRESS_PICKUP_RADIUS_KM = 10;
