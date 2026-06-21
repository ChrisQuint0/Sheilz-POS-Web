export type OrderStatus = "Completed" | "Void (Not Made)" | "Void (Consumed)";
export type PaymentMethod = "Cash" | "GCash" | "BPI" | "Maya";

export interface OrderItem {
  id: string;
  name: string;
  size?: "12oz" | "16oz" | "22oz";
  temp?: "Hot" | "Cold" | "Blended";
  qty: number;
}

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

// Generate dummy data
export const initialTransactions: Transaction[] = [
  {
    id: "tx-001",
    orderId: "20260621-001",
    createdAt: "2026-06-21T08:15:00",
    customerName: "Maria Garcia",
    status: "Completed",
    items: [
      { id: "it-001", name: "Spanish Latte", size: "16oz", temp: "Cold", qty: 1 },
      { id: "it-002", name: "Croissant", qty: 2 }
    ],
    amount: 320,
    paymentMethod: "GCash",
    cashier: "Joshua T.",
    createdBy: "Joshua T.",
  },
  {
    id: "tx-002",
    orderId: "20260621-002",
    createdAt: "2026-06-21T08:30:00",
    customerName: "Walk-In",
    status: "Completed",
    items: [
      { id: "it-003", name: "Americano", size: "12oz", temp: "Hot", qty: 1 }
    ],
    amount: 110,
    paymentMethod: "Cash",
    cashier: "Joshua T.",
    createdBy: "Joshua T.",
  },
  {
    id: "tx-003",
    orderId: "20260621-003",
    createdAt: "2026-06-21T09:05:00",
    customerName: "Juan Dela Cruz",
    status: "Void (Not Made)",
    items: [
      { id: "it-004", name: "Iced Matcha Latte", size: "16oz", temp: "Cold", qty: 1 },
      { id: "it-005", name: "Caramel Macchiato", size: "16oz", temp: "Cold", qty: 1 }
    ],
    amount: 380,
    paymentMethod: "Maya",
    cashier: "Maria R.",
    createdBy: "Maria R.",
    lastModifiedBy: "Admin",
    lastModifiedAt: "2026-06-21T09:10:00"
  },
  {
    id: "tx-004",
    orderId: "20260621-004",
    createdAt: "2026-06-21T10:12:00",
    customerName: "Ana Santos",
    status: "Completed",
    items: [
      { id: "it-006", name: "White Chocolate Mocha", size: "16oz", temp: "Blended", qty: 2 }
    ],
    amount: 440,
    paymentMethod: "BPI",
    cashier: "Joshua T.",
    createdBy: "Joshua T.",
  },
  {
    id: "tx-005",
    orderId: "20260621-005",
    createdAt: "2026-06-21T10:35:00",
    customerName: "Walk-In",
    status: "Void (Consumed)",
    items: [
      { id: "it-007", name: "Flat White", size: "12oz", temp: "Hot", qty: 1 }
    ],
    amount: 150,
    paymentMethod: "Cash",
    cashier: "Maria R.",
    createdBy: "Maria R.",
    lastModifiedBy: "Admin",
    lastModifiedAt: "2026-06-21T10:45:00"
  },
  // Adding more dummy data to test scrolling
];

for(let i = 6; i <= 50; i++) {
  const pad = i.toString().padStart(3, '0');
  initialTransactions.push({
    id: `tx-${pad}`,
    orderId: `20260621-${pad}`,
    createdAt: new Date(new Date("2026-06-21T11:00:00").getTime() + i * 600000).toISOString(),
    customerName: i % 3 === 0 ? "Walk-In" : `Customer ${i}`,
    status: i % 15 === 0 ? "Void (Not Made)" : "Completed",
    items: [
      { id: `it-10${i}`, name: i % 2 === 0 ? "Spanish Latte" : "Americano", size: "16oz", temp: "Cold", qty: 1 }
    ],
    amount: i % 2 === 0 ? 180 : 110,
    paymentMethod: i % 4 === 0 ? "GCash" : "Cash",
    cashier: i % 2 === 0 ? "Joshua T." : "Maria R.",
    createdBy: i % 2 === 0 ? "Joshua T." : "Maria R.",
  })
}
