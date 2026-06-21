export type Role = "Administrator" | "Manager" | "Cashier";
export type Status = "Active" | "Inactive";

export interface User {
  id: string;
  avatar?: string;
  displayName: string;
  email: string;
  role: Role;
  status: Status;
  lastLogin?: string; // ISO date string
  createdDate: string; // ISO date string
}

export const MOCK_USERS: User[] = [
  {
    id: "1",
    avatar: "/sheilz_pos_logo.png",
    displayName: "Jane Admin",
    email: "jane@sheilz.com",
    role: "Administrator",
    status: "Active",
    lastLogin: "2026-06-21T09:35:00Z",
    createdDate: "2025-01-10T08:00:00Z"
  },
  {
    id: "2",
    displayName: "Mark Manager",
    email: "mark@sheilz.com",
    role: "Manager",
    status: "Active",
    lastLogin: "2026-06-20T14:20:00Z",
    createdDate: "2025-02-15T09:00:00Z"
  },
  {
    id: "3",
    displayName: "Sarah Cashier",
    email: "sarah@sheilz.com",
    role: "Cashier",
    status: "Active",
    lastLogin: "2026-06-21T07:15:00Z",
    createdDate: "2025-06-20T10:00:00Z"
  },
  {
    id: "4",
    displayName: "John Doe",
    email: "john@sheilz.com",
    role: "Cashier",
    status: "Inactive",
    createdDate: "2025-11-05T08:30:00Z"
  }
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Administrator: [
    "Access Web Dashboard",
    "Access Mobile POS",
    "Manage Products",
    "Manage Inventory",
    "Manage Sales History",
    "Manage Team Members",
    "Reset Passwords",
    "Create Users",
    "Delete Users",
    "Edit Historical Sales Records",
    "Delete Historical Sales Records",
    "Void Transactions",
    "Access Analytics",
    "Access Audit Logs"
  ],
  Manager: [
    "Access Web Dashboard",
    "Access Mobile POS",
    "View Sales History",
    "View Inventory",
    "Update Inventory",
    "View Team Members",
    "View Analytics",
    "Void Transactions"
  ],
  Cashier: [
    "Access Mobile POS",
    "Create Orders",
    "Process Payments",
    "View Current-Day Transactions"
  ]
};
