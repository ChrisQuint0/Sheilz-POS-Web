export type ProductType = 'Beverage' | 'Pastry' | 'Other';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  type: ProductType;
  image?: string;
  description?: string;
  sizes: string[]; // size ids
  temperatures: string[]; // temp ids
  prices: Record<string, number>;
  hasRecipe: boolean;
  recipes: Record<string, { ingredientId: string; quantity: string; unit: string }[]>;
  isVisible: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface Size {
  id: string;
  name: string;
}

export interface TemperatureOption {
  id: string;
  name: string;
}
