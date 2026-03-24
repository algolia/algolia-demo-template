export interface NutritionalInfo {
  calories?: number;
  fats?: number;
  proteins?: number;
  carbohydrates?: number;
  fiber?: number;
  water?: number;
  minerals?: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    potassium?: number;
    phosphorus?: number;
    sodium?: number;
    zinc?: number;
  };
  vitamins?: {
    a?: number;
    c?: number;
    e?: number;
    b6?: number;
    b12?: number;
    d?: number;
    k?: number;
  };
}

export interface Guide {
  objectID: string;
  id: string;
  title: string;
  slug: string;
  url: string;
  category: string;
  subcategory?: string;
  description: string;
  properties?: string;
  nutritionalInfo?: NutritionalInfo;
  seasonality: string[];
  imageUrl?: string;
  tags: string[];
  type: "product" | "category" | "wine";
  hasNutrition: boolean;
  hasImage: boolean;
}
