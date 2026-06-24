export type Unit = string;

export interface Category {
  id: string;
  name: string;
}

export type Status =
  | "Healthy"
  | "Low Stock"
  | "Critical Stock"
  | "Out of Stock";

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
  | "Replenishment"
  | "Automatic POS Deduction"
  | "Manual Adjustment"
  | "Waste / Spoilage"
  | "Stock Correction";

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
    paymentMethod: "Cash" | "GCash" | "Maya" | "Bank Transfer" | "Credit Card";
    supplier?: string;
    receivedBy: string;
    deliveryDate: string;
    deliveryTime: string;
  };
}


export const initialTransactions: InventoryTransaction[] = [
  {
    id: "txn-1",
    ingredientId: "inv-1",
    type: "Replenishment",
    previousStock: 1500,
    quantityChanged: 1000,
    newStock: 2500,
    userId: "Admin User",
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    notes: "Weekly delivery",
    expenseDetails: {
      deliveryCost: 1250.0,
      paymentMethod: "Bank Transfer",
      supplier: "ABC Beverage Supplies",
      receivedBy: "Admin User",
      deliveryDate: "2026-06-20",
      deliveryTime: "09:30 AM",
    },
  },
  {
    id: "txn-2",
    ingredientId: "inv-2",
    type: "Automatic POS Deduction",
    previousStock: 8050,
    quantityChanged: -50,
    newStock: 8000,
    userId: "system",
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
];

// Helper to determine status based on item stats
export function getInventoryStatus(item: InventoryItem): Status {
  if (item.currentStock === 0) return "Out of Stock";

  // Critical stock: at or below 50% of the low stock threshold
  if (item.currentStock <= item.lowStockThreshold / 2) return "Critical Stock";

  // Low stock: at or below the low stock threshold
  if (item.currentStock <= item.lowStockThreshold) return "Low Stock";

  return "Healthy";
}