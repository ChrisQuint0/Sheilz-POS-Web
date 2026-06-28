export type OrderStatus = "Completed" | "Void (Not Made)" | "Void (Consumed)";
export type PaymentMethod = "Cash" | "GCash" | "BPI" | "Maya";

export type OrderItem = {
  name: string;
  qty: number;
  size: string;
  temperature: string;
};

export interface Transaction {
  id: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  amount: number;
  paymentMethod: PaymentMethod;
  cashier: string;
  
  // Audit Info
  createdBy: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

