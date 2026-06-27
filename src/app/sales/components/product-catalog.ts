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
  addons?: ProductAddon[];
}

export const PRODUCT_CATALOG: Product[] = [
  // Coffee
  {
    name: "Brewed",
    category: "Coffee",
    variants: [{ size: "16oz", temp: "Hot", price: 65 }]
  },
  {
    name: "Americano",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 100 },
      { size: "16oz", temp: "Cold", price: 110 },
      { size: "16oz", temp: "Hot", price: 100 }
    ]
  },
  {
    name: "Golden Americano",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 120 },
      { size: "16oz", temp: "Cold", price: 130 },
      { size: "16oz", temp: "Hot", price: 130 }
    ]
  },
  {
    name: "Cafe Latte",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 115 },
      { size: "16oz", temp: "Cold", price: 125 },
      { size: "16oz", temp: "Hot", price: 125 }
    ]
  },
  {
    name: "Cappuccino",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 125 },
      { size: "16oz", temp: "Cold", price: 135 },
      { size: "16oz", temp: "Hot", price: 135 }
    ]
  },
  {
    name: "Salted Caramel",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 130 },
      { size: "16oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Hot", price: 140 }
    ]
  },
  {
    name: "Spanish Latte",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 130 },
      { size: "16oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Hot", price: 140 }
    ]
  },
  {
    name: "Hazelnut Latte",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 130 },
      { size: "16oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Hot", price: 140 }
    ]
  },
  {
    name: "White Chocolate",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 130 },
      { size: "16oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Hot", price: 140 }
    ]
  },
  {
    name: "Caramel Macchiato",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Cold", price: 150 },
      { size: "16oz", temp: "Hot", price: 150 }
    ]
  },
  {
    name: "Butterscotch Macchiato",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Cold", price: 150 },
      { size: "16oz", temp: "Hot", price: 150 }
    ]
  },
  {
    name: "Mocha",
    category: "Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 140 },
      { size: "16oz", temp: "Cold", price: 150 },
      { size: "16oz", temp: "Hot", price: 150 }
    ]
  },

  // Non-Coffee
  {
    name: "Matcha Latte",
    category: "Non-Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 160 },
      { size: "16oz", temp: "Cold", price: 170 },
      { size: "16oz", temp: "Hot", price: 170 }
    ]
  },
  {
    name: "Signature Chocolate",
    category: "Non-Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 100 },
      { size: "16oz", temp: "Cold", price: 110 },
      { size: "16oz", temp: "Hot", price: 110 }
    ]
  },
  {
    name: "Matcha Strawberry",
    category: "Non-Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 160 },
      { size: "16oz", temp: "Cold", price: 170 }
    ]
  },
  {
    name: "Strawberry Milk",
    category: "Non-Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 160 },
      { size: "16oz", temp: "Cold", price: 170 }
    ]
  },
  {
    name: "Choco Berry",
    category: "Non-Coffee",
    variants: [
      { size: "12oz", temp: "Cold", price: 160 },
      { size: "16oz", temp: "Cold", price: 170 }
    ]
  },

  // Sparkling Drinks
  ...["Strawberry Lemonade", "Passionfruit", "Green Apple", "Honey Lemon", "Lychee", "Mango"].map(name => ({
    name,
    category: "Sparkling Drinks",
    variants: [
      { size: "12oz", temp: "Cold", price: 89 },
      { size: "16oz", temp: "Cold", price: 99 }
    ]
  })),

  // Tea
  {
    name: "Honey Tea",
    category: "Tea",
    variants: [
      { size: null, temp: null, price: 100 }
    ],
    addons: [
      { name: "Additional Honey", price: 10 }
    ]
  },

  // Blueberry Series
  {
    name: "Blueberry Matcha",
    category: "Blueberry Series",
    variants: [
      { size: "12oz", temp: null, price: 170 },
      { size: "16oz", temp: null, price: 180 }
    ]
  },
  {
    name: "Blueberry Milk",
    category: "Blueberry Series",
    variants: [
      { size: "12oz", temp: null, price: 100 },
      { size: "16oz", temp: null, price: 110 }
    ]
  },
  {
    name: "Blueberry Soda",
    category: "Blueberry Series",
    variants: [
      { size: "12oz", temp: null, price: 89 },
      { size: "16oz", temp: null, price: 99 }
    ]
  },

  // Cloud Nine Series
  {
    name: "White Mocha",
    category: "Cloud Nine Series",
    variants: [
      { size: "12oz", temp: null, price: 150 },
      { size: "16oz", temp: null, price: 160 }
    ]
  },
  {
    name: "Seasalt Caramel",
    category: "Cloud Nine Series",
    variants: [
      { size: "12oz", temp: null, price: 150 },
      { size: "16oz", temp: null, price: 160 }
    ]
  },
  {
    name: "Velvet Vanilla",
    category: "Cloud Nine Series",
    variants: [
      { size: "12oz", temp: null, price: 150 },
      { size: "16oz", temp: null, price: 160 }
    ]
  },
  {
    name: "Honey Uji Matcha",
    category: "Cloud Nine Series",
    variants: [
      { size: "12oz", temp: null, price: 180 },
      { size: "16oz", temp: null, price: 190 }
    ]
  },

  // Pastries
  ...[
    { name: "Salted Caramel Brownie", price: 65 },
    { name: "Pecan Caramel Cinnamon Roll", price: 60 },
    { name: "Cheese Roll", price: 40 },
    { name: "Choco Walnut Cookies", price: 60 },
    { name: "Choco Chip Banana Bread", price: 65 },
    { name: "Choco Chip Cookies", price: 40 }
  ].map(p => ({
    name: p.name,
    category: "Pastries",
    variants: [
      { size: null, temp: null, price: p.price }
    ]
  }))
];
