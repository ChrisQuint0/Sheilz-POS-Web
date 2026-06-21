export type AuditSeverity = "Low" | "Medium" | "High" | "Critical"
export type AuditCategory = "Authentication" | "Sales" | "Inventory" | "Team Management" | "Products" | "Analytics" | "System"

export interface AuditUser {
  id: string
  name: string
  role: string
  email: string
}

export interface AuditTarget {
  type: string
  id: string
  name: string
}

export interface AuditDetails {
  previousValue?: string | Record<string, any>
  newValue?: string | Record<string, any>
  metadata?: Record<string, any>
}

export interface AuditLog {
  id: string
  timestamp: string // ISO date string
  user: AuditUser
  category: AuditCategory
  action: string
  target?: AuditTarget
  severity: AuditSeverity
  ipAddress: string
  device: string
  details?: AuditDetails
}

// Generate realistic mock data
const MOCK_ACTIONS = {
  "Authentication": [
    { action: "User Login", severity: "Low", targetType: "User" },
    { action: "User Logout", severity: "Low", targetType: "User" },
    { action: "Failed Login", severity: "Medium", targetType: "User" },
    { action: "Password Reset", severity: "High", targetType: "User" }
  ],
  "Sales": [
    { action: "Transaction Created", severity: "Low", targetType: "Transaction" },
    { action: "Transaction Edited", severity: "Medium", targetType: "Transaction" },
    { action: "Transaction Deleted", severity: "High", targetType: "Transaction" },
    { action: "Transaction Voided (Not Made)", severity: "Medium", targetType: "Transaction" },
    { action: "Transaction Voided (Consumed)", severity: "High", targetType: "Transaction" }
  ],
  "Inventory": [
    { action: "Ingredient Created", severity: "Low", targetType: "Ingredient" },
    { action: "Inventory Replenished", severity: "Low", targetType: "Inventory" },
    { action: "Inventory Adjusted", severity: "Medium", targetType: "Inventory" },
    { action: "Waste Recorded", severity: "Medium", targetType: "Inventory" },
    { action: "Stock Correction", severity: "Medium", targetType: "Inventory" }
  ],
  "Team Management": [
    { action: "User Created", severity: "Medium", targetType: "User" },
    { action: "User Updated", severity: "Medium", targetType: "User" },
    { action: "Role Changed", severity: "High", targetType: "User" },
    { action: "User Deactivated", severity: "High", targetType: "User" },
    { action: "User Deleted", severity: "Critical", targetType: "User" }
  ],
  "Products": [
    { action: "Product Created", severity: "Medium", targetType: "Product" },
    { action: "Product Updated", severity: "Low", targetType: "Product" },
    { action: "Product Archived", severity: "Medium", targetType: "Product" },
    { action: "Product Deleted", severity: "High", targetType: "Product" }
  ],
  "System": [
    { action: "Settings Updated", severity: "Medium", targetType: "Settings" },
    { action: "Backup Created", severity: "Low", targetType: "Backup" }
  ],
  "Analytics": [
    { action: "Report Exported", severity: "Low", targetType: "Report" }
  ]
}

const mockUsers: AuditUser[] = [
  { id: "U-1", name: "John Doe", role: "Administrator", email: "john@sheilz.com" },
  { id: "U-2", name: "Jane Smith", role: "Manager", email: "jane@sheilz.com" },
  { id: "U-3", name: "Alice Johnson", role: "Cashier", email: "alice@sheilz.com" }
]

const devices = [
  "Chrome on Windows",
  "Safari on iPhone",
  "Firefox on macOS",
  "Edge on Windows"
]

const ips = ["192.168.1.15", "192.168.1.22", "10.0.0.5", "172.16.0.8"]

export const MOCK_AUDIT_LOGS: AuditLog[] = Array.from({ length: 150 }).map((_, i) => {
  const categoryNames = Object.keys(MOCK_ACTIONS) as AuditCategory[]
  const category = categoryNames[i % categoryNames.length]
  const actionList = MOCK_ACTIONS[category]
  const actionObj = actionList[i % actionList.length]
  
  const user = mockUsers[i % mockUsers.length]
  
  // Create a deterministic date based on the index
  const date = new Date("2026-06-21T12:00:00Z")
  date.setDate(date.getDate() - (i % 30))
  date.setHours(10 + (i % 8), 15 + (i % 45))

  return {
    id: `AL-${1000 + i}`,
    timestamp: date.toISOString(),
    user: user,
    category: category,
    action: actionObj.action,
    severity: actionObj.severity as AuditSeverity,
    target: {
      type: actionObj.targetType,
      id: `T-${(i * 13) % 10000}`,
      name: `${actionObj.targetType} Record`
    },
    ipAddress: ips[i % ips.length],
    device: devices[i % devices.length],
    details: {
      metadata: {
        "Note": "System generated record."
      }
    }
  }
})

// Sort descending by default
MOCK_AUDIT_LOGS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
