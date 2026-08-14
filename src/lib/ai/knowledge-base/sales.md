# Sales History

## 1. Topic / Purpose
The Sales module provides a comprehensive record of all transactions processed through the POS system. It allows staff to view, add, void (delete), and export transaction records.

## 2. Navigation
* **Sidebar Label:** Sales
* **Route:** `/sales`

## 3. Available Features
* View a paginated list of all transactions.
* View detailed receipt information for a specific transaction (items purchased, cashier, payment method, time).
* Add a manual transaction record.
* Bulk add transactions via CSV upload.
* Delete (Void) selected transactions.
* Filter transactions by Date, Status, Payment Method, and Cashier.
* Search transactions by Receipt ID.
* Export sales data to Excel.

## 4. Step-by-Step Procedures

### How to view transaction details
1. Open Sales from the sidebar.
2. Locate the transaction in the list.
3. Click on the transaction row or card. A side drawer will open displaying the full receipt details, including the specific items ordered.

### How to add a manual transaction
1. Open Sales from the sidebar.
2. Click the "Add Transaction" button.
3. Fill in the receipt details (Amount, Payment Method, Status, Date/Time).
4. (Optional) Add specific order items.
5. Click "Save Transaction".

### How to void (delete) a transaction
1. Open Sales from the sidebar.
2. Select the transaction(s) using the checkboxes on the left side of the rows (desktop) or cards (mobile).
3. Click the "Delete Selected" button that appears at the top.
4. Confirm the deletion. Note: Deleting a transaction that was marked "Completed" will automatically refund the associated inventory items (if any).

### How to export sales history
1. Open Sales from the sidebar.
2. Apply any desired filters (date, status, etc.).
3. Click the "Export Excel" button.
4. The downloaded file will reflect the currently filtered list of transactions.

### How to bulk import sales
1. Open Sales from the sidebar.
2. Click the "Bulk Add" button.
3. Upload a properly formatted CSV file containing transaction data.

## 5. UI Terminology
* **Add Transaction**: Button to manually create a sales record.
* **Bulk Add**: Button to import multiple sales records from a CSV.
* **Delete Selected**: Action to void checked transactions.
* **Export Excel**: Downloads the current sales list.
* **Receipt ID**: Unique identifier for the transaction (e.g., #TRX-12345).

## 6. Field Descriptions
* **Receipt ID**: Auto-generated or manually entered ID.
* **Amount**: Total monetary value of the transaction.
* **Payment Method**: Cash, Card, GCash, Maya, etc.
* **Status**: Completed, Pending, or Voided.
* **Cashier**: The staff member who processed the transaction.
* **Date**: The timestamp of the transaction.

## 7. Statuses and Meanings
* **Completed**: The transaction was successful. Revenue is counted, and inventory is deducted.
* **Pending**: The transaction is awaiting payment confirmation (often used for online/wallet payments). Inventory might not be deducted yet depending on configuration.
* **Voided**: The transaction was cancelled or refunded. Revenue is not counted, and inventory is returned.

## 8. Permissions
* Administrators and Managers can view all sales and perform voids/deletions.
* Cashiers can typically view their own sales history for the current shift but may not have permission to delete/void transactions without manager approval.

## 9. Common Mistakes / Important Notes
* Deleting a transaction is permanent and affects historical reporting. Ensure you have the correct transaction selected before confirming.
* The "Export Excel" function respects your current filters. If you want a full export, ensure all filters are cleared first.
