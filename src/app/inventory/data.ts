export type Unit = 'g' | 'ml' | 'oz' | 'pump' | 'piece';

export interface Category {
  id: string;
  name: string;
}

export type Status = 'Healthy' | 'Low Stock' | 'Critical Stock' | 'Out of Stock';

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  unit: Unit;
  currentStock: number;
  maxCapacity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'Replenishment' 
  | 'Automatic POS Deduction' 
  | 'Manual Adjustment' 
  | 'Waste / Spoilage' 
  | 'Stock Correction';

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  type: TransactionType;
  previousStock: number;
  quantityChanged: number;
  newStock: number;
  userId: string;
  date: string;
  notes?: string;
  expenseDetails?: {
    deliveryCost: number;
    paymentMethod: 'Cash' | 'GCash' | 'Maya' | 'Bank Transfer' | 'Credit Card';
    supplier?: string;
    receivedBy: string;
    deliveryDate: string;
    deliveryTime: string;
  };
}

// Initial Mock Data
export const initialCategories: Category[] = [
  { id: 'cat-coffee', name: 'Coffee' },
  { id: 'cat-dairy', name: 'Dairy' },
  { id: 'cat-syrups', name: 'Syrups' },
  { id: 'cat-powders', name: 'Powders' },
  { id: 'cat-fruits', name: 'Fruits' },
  { id: 'cat-other', name: 'Miscellaneous' },
];

export const initialUnits: Unit[] = ['g', 'ml', 'oz', 'pump', 'piece'];

export const initialInventoryItems: InventoryItem[] = [
  { id: 'inv-1', name: 'Coffee Beans', categoryId: 'cat-coffee', unit: 'g', currentStock: 2500, maxCapacity: 5000, lowStockThreshold: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-2', name: 'Milk', categoryId: 'cat-dairy', unit: 'ml', currentStock: 8000, maxCapacity: 20000, lowStockThreshold: 2000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-3', name: 'Whipping Cream', categoryId: 'cat-dairy', unit: 'ml', currentStock: 1500, maxCapacity: 5000, lowStockThreshold: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-4', name: 'Condensed Milk', categoryId: 'cat-dairy', unit: 'g', currentStock: 2000, maxCapacity: 5000, lowStockThreshold: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-5', name: 'Matcha Powder', categoryId: 'cat-powders', unit: 'g', currentStock: 0, maxCapacity: 2000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-6', name: 'Uji Matcha Powder', categoryId: 'cat-powders', unit: 'g', currentStock: 800, maxCapacity: 2000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-7', name: 'Honey', categoryId: 'cat-syrups', unit: 'g', currentStock: 1200, maxCapacity: 3000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-8', name: 'Vanilla Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 400, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-9', name: 'French Vanilla Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 350, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-10', name: 'Hazelnut Syrup', categoryId: 'cat-syrups', unit: 'g', currentStock: 1500, maxCapacity: 3000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-11', name: 'Caramel Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 450, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-12', name: 'Salted Caramel Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 300, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-13', name: 'Butterscotch Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 250, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-14', name: 'White Chocolate Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 200, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-15', name: 'Strawberry Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 150, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-16', name: 'Strawberry Jam', categoryId: 'cat-fruits', unit: 'g', currentStock: 800, maxCapacity: 2000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-17', name: 'Blueberry Syrup', categoryId: 'cat-syrups', unit: 'g', currentStock: 1200, maxCapacity: 3000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-18', name: 'Blueberry Jam', categoryId: 'cat-fruits', unit: 'g', currentStock: 900, maxCapacity: 2000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-19', name: 'Lemon Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 400, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-20', name: 'Lemon Juice', categoryId: 'cat-fruits', unit: 'ml', currentStock: 1500, maxCapacity: 5000, lowStockThreshold: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-21', name: 'Yuzu Lime Syrup', categoryId: 'cat-syrups', unit: 'pump', currentStock: 350, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-22', name: 'Chocolate Powder', categoryId: 'cat-powders', unit: 'g', currentStock: 2500, maxCapacity: 5000, lowStockThreshold: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-23', name: 'Chocolate Drizzle', categoryId: 'cat-syrups', unit: 'g', currentStock: 1200, maxCapacity: 3000, lowStockThreshold: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-24', name: 'Cinnamon Powder', categoryId: 'cat-powders', unit: 'g', currentStock: 400, maxCapacity: 1000, lowStockThreshold: 200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-25', name: 'Salt', categoryId: 'cat-other', unit: 'g', currentStock: 800, maxCapacity: 2000, lowStockThreshold: 300, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-26', name: 'Soda Water', categoryId: 'cat-other', unit: 'ml', currentStock: 10000, maxCapacity: 30000, lowStockThreshold: 5000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-27', name: 'Water', categoryId: 'cat-other', unit: 'ml', currentStock: 50000, maxCapacity: 100000, lowStockThreshold: 10000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-28', name: 'Ice', categoryId: 'cat-other', unit: 'g', currentStock: 15000, maxCapacity: 50000, lowStockThreshold: 10000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'inv-29', name: 'Lemon Garnish', categoryId: 'cat-fruits', unit: 'piece', currentStock: 45, maxCapacity: 100, lowStockThreshold: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const initialTransactions: InventoryTransaction[] = [
  {
    id: 'txn-1',
    ingredientId: 'inv-1',
    type: 'Replenishment',
    previousStock: 1500,
    quantityChanged: 1000,
    newStock: 2500,
    userId: 'Admin User',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    notes: 'Weekly delivery',
    expenseDetails: {
      deliveryCost: 1250.00,
      paymentMethod: 'Bank Transfer',
      supplier: 'ABC Beverage Supplies',
      receivedBy: 'Admin User',
      deliveryDate: '2026-06-20',
      deliveryTime: '09:30 AM',
    }
  },
  {
    id: 'txn-2',
    ingredientId: 'inv-2',
    type: 'Automatic POS Deduction',
    previousStock: 8050,
    quantityChanged: -50,
    newStock: 8000,
    userId: 'system',
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  }
];

// Helper to determine status based on item stats
export function getInventoryStatus(item: InventoryItem): Status {
  if (item.currentStock === 0) return 'Out of Stock';
  
  // Critical stock: at or below 50% of the low stock threshold
  if (item.currentStock <= item.lowStockThreshold / 2) return 'Critical Stock';
  
  // Low stock: at or below the low stock threshold
  if (item.currentStock <= item.lowStockThreshold) return 'Low Stock';
  
  return 'Healthy';
}
