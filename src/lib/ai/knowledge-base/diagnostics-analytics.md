# Diagnostics Analytics

## Overview
The Diagnostics Analytics module (`/diagnostics`) is the system monitoring interface for administrators to track system health, database integrity, synchronization status, and operational issues.

## Navigation
To access Diagnostics Analytics, click **Diagnostics Analytics** in the sidebar.

## Dashboard Summary
The top of the page displays the following system health overview metrics:
- **POS Connection:** Terminal connectivity status.
- **Database:** Read/Write access status.
- **Authentication:** User session integrity status.
- **Storage:** Bucket availability status.
- **Last Synchronization:** Offline data sync timestamp.
- **API Response:** Average API response latency (e.g., in ms).
- **Server Clock:** Time synchronization timestamp.

## Warning Center
The Warning Center panel displays a scrollable list of active informational warnings requiring attention. If no warnings exist, it displays "No warnings detected."

## Application Details
The Application Details panel provides technical environment information, including key-value pairs representing the current state of the application architecture.

## Application Error Logs
The Error Logs grid displays a preview of recent application errors with the following columns:
- **Timestamp:** Time the error occurred.
- **Module:** The system module where the error originated.
- **Severity:** The severity level of the error.
- **Message:** The error message description.
- **Status:** Shows if the error is "Resolved" or another status.

## Database Health Monitor
The Database Health Monitor panel provides a real-time overview of PostgreSQL and Supabase database health:
- **Connection Pool:** Active connections versus maximum connections.
- **Database Size:** Used storage (GB) versus total storage (GB).
- **Database Uptime:** Uptime since last restart (e.g., Days and Hours).
- **Active Sessions:** The number of Idle, Active, and Waiting sessions.
- **Slow Queries:** The count of slow queries detected.
- **Cache Hit Ratio:** Percentage of cache hits, evaluated as Excellent, Good, or Poor.
- **Recent Database Events:** A timeline list of recent system database events.

## Query & Performance Insights
The Query & Performance Insights panel displays database performance metrics and application response diagnostics:
- **Avg Query Time:** The average query execution time (ms).
- **Fastest Query:** The fastest recorded query time (ms).
- **Slowest Query:** The slowest recorded query time (ms) and its associated name.
- **Average Times:** Average Read, Average Insert, and Average Update times (ms).
- **Transactions:** Transactions Per Minute (TPM) along with a historical sparkline chart.
- **Query Success:** The percentage rate of successful queries.
- **Failed Queries:** The count of failed queries.
- **Response Trend (Last 30m):** A bar chart showing response times over the last 30 minutes.
- **Recommendations:** A list of actionable Warning or Critical recommendations to improve performance.

## Available Actions
The header provides the following actions:
- **Refresh:** Reloads the diagnostics data.
- **Export Report:** Generates and downloads a PDF diagnostic report.

## How to Export Diagnostics Report
1. Open **Diagnostics Analytics** from the sidebar.
2. Click **Export Report** in the header.
3. A PDF containing the diagnostic data will be generated and downloaded to your device.

## Important Terminology
- **System Health:** A high-level overview of the functional status of major system components.
- **TPM:** Transactions Per Minute, measuring database activity rate.
- **Cache Hit Ratio:** The percentage of database queries successfully served from the cache rather than requiring a full database read.

## Common Questions
- How do I view system diagnostics?
- What do the database health metrics mean?
- How do I view application error logs?
- How do I export a diagnostics report?

## Limitations
The Diagnostics Analytics interface is currently a frontend-only interface displaying static or simulated telemetry data for demonstration purposes. It is not connected to production telemetry, real-time database monitors, or backend error logs. Sheilz AI should explain the available interface functionality and metric definitions, but should not claim that the data reflects the actual real-time state of a production backend or that the AI can perform automated system repairs.
