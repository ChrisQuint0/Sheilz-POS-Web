// ── Audit Log Enum Types ─────────────────────────────────────────────────────

export type AuditSeverity = "Low" | "Medium" | "High" | "Critical"

export type AuditCategory =
  | "Authentication"
  | "Sales"
  | "Inventory"
  | "Team Management"
  | "Products"
  | "Analytics"
  | "System"

export type AuditAction =
  // Authentication
  | "User Login" | "User Logout" | "Failed Login" | "Inactive Login Attempt" | "Password Reset"
  // Sales
  | "Transaction Created" | "Transaction Edited" | "Transaction Deleted"
  | "Transaction Voided (Not Made)" | "Transaction Voided (Consumed)"
  // Inventory
  | "Ingredient Created" | "Ingredient Updated" | "Ingredient Deleted" | "Inventory Replenished" | "Inventory Adjusted"
  | "Waste Recorded" | "Stock Correction"
  // Team Management
  | "User Created" | "User Updated" | "Role Changed"
  | "User Deactivated" | "User Reactivated" | "User Deleted"
  // Products
  | "Product Created" | "Product Updated" | "Product Archived" | "Product Restored" | "Product Deleted"
  // System
  | "Settings Updated" | "Backup Created"
  // Analytics
  | "Report Exported"

export type AuditTargetType =
  | "User" | "Transaction" | "Ingredient" | "Inventory"
  | "Product" | "Settings" | "Backup" | "Report"

// ── Audit Log Row (matches DB schema) ────────────────────────────────────────

export interface AuditLog {
  id: string
  created_at: string

  // User snapshot (denormalized at time of event)
  user_id: string | null
  user_name: string
  user_role: string
  user_email: string

  // Event classification
  category: AuditCategory
  action: AuditAction
  severity: AuditSeverity

  // Target entity
  target_type: AuditTargetType | null
  target_id: string | null
  target_name: string | null

  // Client info
  ip_address: string | null
  device: string | null

  // Change details (old/new values, metadata)
  details: {
    previousValue?: Record<string, any>
    newValue?: Record<string, any>
    metadata?: Record<string, any>
  } | null
}

// ── Constants for filter dropdowns ───────────────────────────────────────────

export const AUDIT_CATEGORIES: AuditCategory[] = [
  "Authentication", "Sales", "Inventory",
  "Team Management", "Products", "Analytics", "System"
]

export const AUDIT_ACTIONS: AuditAction[] = [
  "User Login", "User Logout", "Failed Login", "Inactive Login Attempt", "Password Reset",
  "Transaction Created", "Transaction Edited", "Transaction Deleted",
  "Transaction Voided (Not Made)", "Transaction Voided (Consumed)",
  "Ingredient Created", "Ingredient Updated", "Ingredient Deleted", "Inventory Replenished", "Inventory Adjusted",
  "Waste Recorded", "Stock Correction",
  "User Created", "User Updated", "Role Changed",
  "User Deactivated", "User Reactivated", "User Deleted",
  "Product Created", "Product Updated", "Product Archived", "Product Restored", "Product Deleted",
  "Settings Updated", "Backup Created",
  "Report Exported"
]

export const AUDIT_SEVERITIES: AuditSeverity[] = [
  "Low", "Medium", "High", "Critical"
]

export const AUDIT_TARGET_TYPES: AuditTargetType[] = [
  "User", "Transaction", "Ingredient", "Inventory",
  "Product", "Settings", "Backup", "Report"
]
