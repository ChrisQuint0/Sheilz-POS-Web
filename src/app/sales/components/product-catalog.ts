export interface ProductAddon {
  name: string;
  price: number;
}

export interface ProductVariant {
  size: string | null;
  temp: string | null;
  price: number;
}

export interface Product {
  name: string;
  category: string;
  variants: ProductVariant[];
}

