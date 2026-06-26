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

/** Map a Supabase `profiles` row (snake_case) to the UI `User` type (camelCase). */
export function mapProfileToUser(row: {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
}): User {
  return {
    id: row.id,
    avatar: row.avatar_url ?? undefined,
    displayName: row.display_name,
    email: row.email,
    role: row.role as Role,
    status: row.status as Status,
    lastLogin: row.last_login ?? undefined,
    createdDate: row.created_at,
  };
}

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
