import { Category, PaymentMethod, Product, Size, TemperatureOption, Ingredient } from './types';

export const initialIngredients: Ingredient[] = [
  { id: 'ing-1', name: 'Coffee Beans' },
  { id: 'ing-2', name: 'Milk' },
  { id: 'ing-3', name: 'Whipping Cream' },
  { id: 'ing-4', name: 'Condensed Milk' },
  { id: 'ing-5', name: 'Matcha Powder' },
  { id: 'ing-6', name: 'Uji Matcha Powder' },
  { id: 'ing-7', name: 'Honey' },
  { id: 'ing-8', name: 'Vanilla Syrup' },
  { id: 'ing-9', name: 'French Vanilla Syrup' },
  { id: 'ing-10', name: 'Hazelnut Syrup' },
  { id: 'ing-11', name: 'Caramel Syrup' },
  { id: 'ing-12', name: 'Salted Caramel Syrup' },
  { id: 'ing-13', name: 'Butterscotch Syrup' },
  { id: 'ing-14', name: 'White Chocolate Syrup' },
  { id: 'ing-15', name: 'Strawberry Syrup' },
  { id: 'ing-16', name: 'Strawberry Jam' },
  { id: 'ing-17', name: 'Blueberry Syrup' },
  { id: 'ing-18', name: 'Blueberry Jam' },
  { id: 'ing-19', name: 'Lemon Syrup' },
  { id: 'ing-20', name: 'Lemon Juice' },
  { id: 'ing-21', name: 'Yuzu Lime Syrup' },
  { id: 'ing-22', name: 'Chocolate Powder' },
  { id: 'ing-23', name: 'Chocolate Drizzle' },
  { id: 'ing-24', name: 'Cinnamon Powder' },
  { id: 'ing-25', name: 'Salt' },
  { id: 'ing-26', name: 'Soda Water' },
  { id: 'ing-27', name: 'Water' },
  { id: 'ing-28', name: 'Ice' },
  { id: 'ing-29', name: 'Lemon Garnish' },
];

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Coffee' },
  { id: 'cat-2', name: 'Non-Coffee' },
  { id: 'cat-3', name: 'Sparkling Drinks' },
  { id: 'cat-4', name: 'Tea' },
  { id: 'cat-5', name: 'Pastries' },
  { id: 'cat-6', name: 'Limited Time' },
];

export const initialSizes: Size[] = [
  { id: 'size-12', name: '12oz' },
  { id: 'size-16', name: '16oz' },
  { id: 'size-22', name: '22oz' },
];

export const initialTemperatures: TemperatureOption[] = [
  { id: 'temp-hot', name: 'Hot' },
  { id: 'temp-cold', name: 'Cold' },
  { id: 'temp-blended', name: 'Blended' },
];

export const initialPaymentMethods: PaymentMethod[] = [
  { id: 'pm-cash', name: 'Cash', isEnabled: true },
  { id: 'pm-gcash', name: 'GCash', isEnabled: true },
  { id: 'pm-maya', name: 'Maya', isEnabled: true },
  { id: 'pm-credit', name: 'Credit Card', isEnabled: true },
];

// Base product list based on specifications
export const initialProducts: Product[] = [
  // Coffee Products
  {
    id: 'prod-1',
    name: 'Brewed',
    categoryId: 'cat-1',
    type: 'Beverage',
    sizes: ['size-16'],
    temperatures: ['temp-hot'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-2',
    name: 'Americano',
    categoryId: 'cat-1',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-3',
    name: 'Golden Americano',
    categoryId: 'cat-1',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-4',
    name: 'Cafe Latte',
    categoryId: 'cat-1',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-5',
    name: 'Cappuccino',
    categoryId: 'cat-1',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-6',
    name: 'Spanish Latte',
    categoryId: 'cat-1',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=300&auto=format&fit=crop'
  },
  
  // Non-Coffee
  {
    id: 'prod-7',
    name: 'Matcha Latte',
    categoryId: 'cat-2',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-8',
    name: 'Matcha Strawberry',
    categoryId: 'cat-2',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=300&auto=format&fit=crop'
  },

  // Sparkling Drinks
  {
    id: 'prod-9',
    name: 'Strawberry Lemonade',
    categoryId: 'cat-3',
    type: 'Beverage',
    sizes: ['size-12', 'size-16'],
    temperatures: ['temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=300&auto=format&fit=crop'
  },

  // Tea
  {
    id: 'prod-10',
    name: 'Honey Tea',
    categoryId: 'cat-4',
    type: 'Beverage',
    sizes: ['size-16'], // Only one size
    temperatures: ['temp-hot', 'temp-cold'],
    hasRecipe: true,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?q=80&w=300&auto=format&fit=crop'
  },

  // Pastries
  {
    id: 'prod-11',
    name: 'Salted Caramel Brownie',
    categoryId: 'cat-5',
    type: 'Pastry',
    sizes: [],
    temperatures: [],
    hasRecipe: false,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-12',
    name: 'Cheese Roll',
    categoryId: 'cat-5',
    type: 'Pastry',
    sizes: [],
    temperatures: [],
    hasRecipe: false,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'prod-13',
    name: 'Choco Chip Cookies',
    categoryId: 'cat-5',
    type: 'Pastry',
    sizes: [],
    temperatures: [],
    hasRecipe: false,
    recipes: {},
    isVisible: true,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=300&auto=format&fit=crop'
  }
];
