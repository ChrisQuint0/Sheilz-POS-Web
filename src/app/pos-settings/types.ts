export type ProductType = 'Beverage' | 'Pastry' | 'Other';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  type: string;
  image?: string;
  description?: string;
  hasRecipe: boolean;
  isVisible: boolean;
  sizes: string[];
  temperatures: string[];
  prices: Record<string, number>;
  recipes: Record<
    string,
    Array<{ ingredientId: string; quantity: string; unit: string }>
  >;
  archivedAt?: string; 
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
