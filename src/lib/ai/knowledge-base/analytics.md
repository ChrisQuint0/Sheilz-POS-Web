# Analytics

## 1. Topic / Purpose
The Analytics module provides deep insights into business performance through various charts and metrics. It helps management understand sales trends, product popularity, operational efficiency, and inventory turnover.

## 2. Navigation
* **Sidebar Label:** Analytics
* **Route:** `/analytics`

## 3. Available Features
* **Global Filtering**: Filter all analytics data by Date Range and Branch (if applicable).
* **KPI Cards**: Summary metrics for Revenue, Orders, Average Order Value, and Items Sold.
* **Revenue Chart**: Line/Bar chart showing revenue over time.
* **Category Performance**: Breakdown of sales by product category.
* **Product Performance**: Lists of Best Sellers and Revenue Contributors.
* **Peak Activity**: Analysis of busiest hours of the day and busiest days of the week.
* **Payment Insights**: Breakdown of transactions by payment method.
* **Operational Insights**: Analysis of transaction statuses (Completed, Voided) and void reasons.
* **Inventory Analytics**: Lists of Most Consumed and Least Consumed ingredients.
* **Inventory Turnover**: Metrics indicating how quickly inventory is sold and replaced.
* **Exporting**: Export underlying data to Excel or export visual charts to a PDF report.

## 4. Step-by-Step Procedures

### How to filter analytics data
1. Open Analytics from the sidebar.
2. Use the controls at the top of the page (AnalyticsFilters component) to select a Date Range (e.g., Today, This Week, This Month, Custom).
3. The dashboard will automatically refresh to reflect the selected period.

### How to export analytics data to Excel
1. Open Analytics from the sidebar.
2. Apply desired date filters.
3. Click the "Export Excel" button in the filter bar.
4. A spreadsheet containing detailed raw data for the selected period will download.

### How to export charts to PDF
1. Open Analytics from the sidebar.
2. Apply desired date filters.
3. Click the "Export Charts" button.
4. A PDF document containing the visual charts currently displayed on the dashboard will download.

## 5. UI Terminology
* **Export Excel**: Downloads raw data.
* **Export Charts**: Downloads a PDF of the visuals.
* **Best Sellers**: Products with the highest quantity sold.
* **Revenue Contributors**: Products that generated the most total revenue (price * quantity).
* **Peak Hours**: Time of day with the highest transaction volume.
* **Inventory Turnover**: A ratio showing how many times inventory has been sold and replaced over the period.

## 6. Permissions
* Administrators and Managers have access to Analytics.
* Cashiers do not have access to this module.

## 7. Common Mistakes / Important Notes
* Analytics data is heavily dependent on the selected Date Range. Always verify the date filter before exporting reports for accounting or management review.
* "Best Sellers" (quantity) and "Revenue Contributors" (monetary value) may differ significantly if you sell high-volume cheap items vs. low-volume expensive items. Both perspectives are provided for comprehensive analysis.
