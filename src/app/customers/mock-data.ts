export interface Customer {
  id: string;
  name: string;
  email: string;
  cardNumber: string;
  currentStamps: number;
  membershipDate: string;
  lifetimePurchases: number;
  redeemCount: number;
  status: "Active" | "Inactive";
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  action: string;
  detail: string;
  date: string;
  isRedemption: boolean;
}