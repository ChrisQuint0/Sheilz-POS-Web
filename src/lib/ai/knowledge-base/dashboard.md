# Dashboard

## 1. Topic / Purpose
The Dashboard serves as the central operations overview for the Sheilz POS administration application. It provides at-a-glance metrics regarding daily performance, revenue trends, and critical stock alerts.

## 2. Navigation
* **Sidebar Label:** Dashboard
* **Route:** `/dashboard`

## 3. Available Features
* View Total Revenue for the selected period.
* View Total Orders for the selected period.
* View Average Order Value for the selected period.
* View Stock Alerts indicating items running low on stock.
* View Revenue Trend chart showing revenue over the past week (or custom period).
* Refresh dashboard data manually.
* Export dashboard data to a PDF report.
* Navigate to previous or next periods in the revenue trend chart.

## 4. Step-by-Step Procedures

### How to export dashboard data
1. Open Dashboard from the sidebar.
2. Click the "Export Data" button in the top right corner.
3. Wait for the export to generate; a PDF file will be downloaded.

### How to view low stock items from the dashboard
1. Open Dashboard from the sidebar.
2. Locate the "Stock Alerts" card.
3. Click "View affected items →". This will redirect you to the Inventory page filtered by low stock.

### How to refresh dashboard data
1. Open Dashboard from the sidebar.
2. Click the "Refresh" button located near the top right.

## 5. UI Terminology
* **Refresh**: Button to reload the data on the page.
* **Export Data**: Button to download a PDF report containing the KPIs, revenue trend, and stock alerts.
* **Total Revenue**: KPI card displaying the gross revenue.
* **Orders Today / Total Orders**: KPI card displaying the total number of completed transactions.
* **Avg. Order Value**: KPI card displaying the average revenue per order.
* **Stock Alerts**: KPI card showing the number of items that have reached or fallen below their low stock threshold.
* **Revenue Trend**: Section displaying the line chart of revenue over a period.
* **Peak day**: Indicator showing the day with the highest revenue in the currently viewed trend period.

## 6. Field Descriptions
* **Total Revenue**: Includes only orders with a status of "Completed".
* **Revenue Trend Chart**: Displays daily revenue totals. Use the previous (<) and next (>) arrows to navigate between weeks.

## 7. Statuses and Meanings
* **Stock Alerts Count**: Displays the raw number of distinct inventory items that currently require replenishment based on their configured threshold.

## 8. Permissions
* The Dashboard is accessible to Administrators and Managers. Cashiers may be restricted from viewing certain overall revenue statistics or from navigating to the audit logs directly from dashboard alerts.

## 9. Common Mistakes / Important Notes
* The Revenue Trend chart only accounts for "Completed" orders. Voided orders do not contribute to revenue metrics.

## 10. Related Functionality
* **Inventory**: Clicking on the stock alerts link navigates to the Inventory module with a low-stock filter automatically applied.
