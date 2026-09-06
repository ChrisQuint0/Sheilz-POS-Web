export type OrderStatus = "Completed" | "Void (Not Made)" | "Void (Consumed)";
export type OrderType = "Dine-In" | "Take-Out";
export type PaymentMethod = string;

export type OrderItem = {
  productId?: string;
  name: string;
  qty: number;
  size: string;
  temperature: string;
  usesPackaging: boolean;
  unitPrice: number;
};

export interface Transaction {
  id: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  amount: number;
  paymentMethod: PaymentMethod;
  cashier: string;
  
  // Audit Info
  createdBy: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;

  // Payment Details (Frontend Preparation)
  cashTendered?: number;
  changeAmount?: number;
}

