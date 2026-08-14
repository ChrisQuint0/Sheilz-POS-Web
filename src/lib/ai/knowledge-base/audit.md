# Audit Logs

## 1. Topic / Purpose
The Audit module provides a secure, chronological record of system activity and user actions. It is crucial for security monitoring, troubleshooting, and ensuring accountability for critical changes within the POS application.

## 2. Navigation
* **Sidebar Label:** Audit (often under a "System" or "Settings" grouping)
* **Route:** `/audit`

## 3. Available Features
* View a comprehensive list of system events (logins, data modifications, exports, errors).
* View detailed information for a specific audit log entry (timestamp, user, IP address, exact action, before/after data changes).
* Filter logs by Date Range (preset or custom).
* Filter logs by specific User.
* Filter logs by Category (e.g., Authentication, Inventory, Sales, System).
* Filter logs by Action Type (e.g., Create, Update, Delete, Export, Login).
* Filter logs by Severity (Low, Medium, High, Critical).
* Search logs by user name, target entity, or record ID.
* Refresh log data.
* Export logs to CSV or Excel formats.

## 4. Step-by-Step Procedures

### How to investigate a specific action
1. Open Audit from the sidebar.
2. Use the search bar to enter relevant keywords (e.g., a receipt ID, an ingredient name, or a user's email).
3. Alternatively, apply filters to narrow down the timeframe, user, or category (e.g., filter Category by 'Inventory' and Action by 'Delete').
4. Click on the relevant log entry row or card to open the details drawer.
5. Review the "Details" section in the drawer to see exactly what changed (often presented as a JSON object showing previous and new values).

### How to export audit logs
1. Open Audit from the sidebar.
2. Apply filters to isolate the data you need (e.g., all 'High' severity events this month).
3. Click the "CSV" or "Excel" button in the top right corner.
4. A modal will appear asking you to confirm the date range for the export (All Time, Custom Range, or specific presets).
5. Confirm the export. The file will download containing the filtered log data.

## 5. UI Terminology
* **Refresh Logs**: Button to pull the latest events from the database.
* **Severity**: An indicator of the event's importance or potential risk (Low = Routine, Critical = Security concern or major data loss).
* **Category**: The module or area of the system where the event occurred.
* **Target**: The specific record or item that was affected (e.g., the name of the deleted product).

## 6. Field Descriptions in Details Drawer
* **Timestamp**: Exact date and time the event was recorded by the server.
* **User**: The staff member who initiated the action.
* **Action**: What was done (e.g., 'Product Updated').
* **Module/Category**: Where it happened (e.g., 'POS Settings').
* **Details/Payload**: Technical data showing the exact parameters of the request or the data state before/after the change.

## 7. Permissions
* Access to Audit Logs is strictly limited to Administrators. Managers and Cashiers cannot view this module.
* Audit logs are read-only; no user, not even Administrators, can edit or delete an audit log entry from this interface.

## 8. Common Mistakes / Important Notes
* The system records almost all significant actions. If a user claims they didn't delete a transaction or change a price, the Audit Log is the definitive source of truth.
* Exporting "All Time" logs can take a long time and result in very large files for older systems. It is recommended to use date filters for exports.
