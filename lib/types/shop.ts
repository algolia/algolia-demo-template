export interface Shop {
  objectID: string;
  name: string;
  city: string;
  address: string;
  region: string;
  postalCode: string;
  phone: string;
  hours: string;
  _geoloc: { lat: number; lng: number };
}

export interface ShopWithDistance extends Shop {
  distance: number; // km
}

export interface ShopAvailability {
  shopId: string;
  inStock: boolean;
  qty: number;
}
