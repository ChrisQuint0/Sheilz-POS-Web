# Sheilz POS Web — Admin & Backoffice Dashboard

A premium web-based administration and business intelligence dashboard built with Next.js for Sheilz Coffee. This web application serves as the back-office command center, complementing the Sheilz POS Mobile terminal. Both platforms synchronize in real time using Supabase for cloud storage, ensuring centralized tracking of orders, stock levels, and staff operations.

For the detailed screen-by-screen system specs, refer to [USER_FLOWS.md](file:///d:/Code/Shielz-POS-Web/sheilz-pos-web/USER_FLOWS.md).

---

## Key Modules & Features

### Dashboard & Basic Analytics

- **Daily KPIs**: Real-time trackers for Total Revenue, Orders Today, Average Order Value (AOV), and Stock Alerts, with trend indicators comparing performance against the previous day.
- **Weekly Trends**: A quick-view chart displaying the sales revenue trend over the week.
- **Recent Activity**: A rolling feed showcasing critical system operations (e.g., stock changes, logins, or configuration edits).
- **Low Stock Warning**: Highlights the 3 most critical low-stock ingredients for immediate replenishment.

### POS Configuration (POS Settings)

- **Product Catalog**: Centralized view of all menu items. Admins can click any product to modify pricing, description, category, size, or temperature availability in the Edit Product Modal.
- **Global Parameters**: A drag-and-drop ordering interface to organize product categories, payment options, sizes, and temperature chips.
- **Product Configurator**: A multi-step flow for adding new products:
  1. Upload product thumbnail images directly to Supabase storage.
  2. Input basic name, description, category, and type (Beverage vs. Pastry).
  3. Toggle size availability and temperature settings (automatically skipped for pastries).
  4. Link ingredients and specify exact ingredient gram/mL amounts for automatic stock deduction (Recipe Configuration).
  5. Toggle active POS availability.

### Sales History & Transaction Ledger

- **Interactive Data Table**: Powered by AG Grid React on desktop for high-performance sorting, column resizing, filtering, and bulk deletions. Adapts to responsive, touch-friendly cards on mobile.
- **Granular Filters**: Filter by status (Completed, Voided), payment method (Cash, GCash, Maya, BPI), cashier name, or search query.
- **Manual Entry & Auditing**: Manually record transactions or open the transaction detail drawer to inspect cashier, payment, item subtotals, and modification logs.
- **Manager Authorization**: Deletion or adjustments to sales records are password-protected via the Authorization Modal.
- **Exports**: Instant file downloads to Excel (`.xlsx`) sheet format matching current filter states.

### Inventory & Stock Control

- **Dual-View Ledger**: Toggle between Stock Management (ingredient catalog cards) and the Transactions Ledger (audit logs of all movements).
- **Alert Statuses**: Color-coded stock level gauges (Green/Healthy, Orange/Low, Red/Critical, Black/Out of stock).
- **Automatic Deduction**: Synced mobile sales automatically deduct raw ingredients based on the configured recipes.
- **Manual Adjustment**: Log spoilage, waste, and manual adjustments.
- **Replenishment System**: Log item intakes, update current stock levels, specify supplier/delivery costs, and record expense payment methods.
- **Exports**: Save inventory stock status or transaction ledgers to CSV files.

### Team & Staff Access Control (RBAC)

- **Staff Roster**: Manage account status (Active, Inactive) and edit display names or emails.
- **Role-Based Access Control**: Assign roles (Administrator, Manager, Cashier) to enforce access permissions.
- **Account Provisioning**: Add staff accounts manually or import users in bulk via a formatted CSV/Excel template.
- **Security Controls**: Direct password resets for staff members losing credentials.

### Immutable Audit Logs

- **Security Feeds**: Chronological timeline tracking system events (logins, logouts, database updates, adjustments).
- **Metadata Collection**: Logs the specific user, action type, target ID, client IP address, and browser User Agent.
- **Payload Viewer**: Inspect detailed before-and-after JSON state changes to trace modifications.
- **Dynamic Search & Export**: Filter by action types, dates, or severity levels and export to Excel/CSV.

### Business Intelligence (Analytics)

- **Sales Analytics**: Deep-dive charts tracking revenue trends over custom ranges.
- **Category Breakdown**: Product category revenue shares represented via interactive donut charts.
- **Performance Leaderboards**: Tracks top-selling drinks/pastries by quantity sold and revenue generated.
- **Heatmaps**: Identifies peak business hours and peak days to schedule staff efficiently.
- **Ingredient Turnover**: Lists the most consumed and least consumed ingredients to aid procurement and minimize waste.
- **Exports**: Raw analytics numbers are exportable to Excel (`.xlsx`), while visual charts can be exported to a polished PDF report document.

---

## Technology Stack

- **Core Framework**: [Next.js 16 (App Router)](https://nextjs.org) with [React 19](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling & UI**: [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), and custom vanilla CSS variables for a premium, unified theme
- **Database & Auth**: [Supabase JS Client](https://supabase.com)
- **Advanced Tables**: [AG Grid Community](https://www.ag-grid.com) (Quartz theme)
- **Charts Engine**: [Chart.js](https://www.chartjs.org) via [react-chartjs-2](https://react-chartjs-2.js.org)
- **Export Libraries**: [SheetJS (XLSX)](https://sheetjs.com) for spreadsheet reporting, [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com) for visual PDF compiles

---

## Project Setup & Configuration

### Prerequisites

- **Node.js** v20+
- **npm** v10+

### 1. Installation

Clone the repository and install the project dependencies:

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Running the Development Server

Launch the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

### 4. Build for Production

To bundle the web app for deployment:

```bash
npm run build
npm run start
```

---

## Project Structure

```text
src/
├── app/                  # Next.js App Router folders
│   ├── analytics/        # Business Intelligence graphs, KPI metrics, PDF exports
│   ├── audit/            # Action monitoring, JSON payload diff drawers, CSV exports
│   ├── dashboard/        # Main landing widgets, summary metrics cards, week overview
│   ├── inventory/        # Ingredient cards, Replenishment logs, category toggles
│   ├── login/            # Administrator secure login screen
│   ├── pos-settings/     # Product grid list, category sorting, recipe setups
│   ├── sales/            # Transaction grid list, transaction breakdown drawers
│   ├── team/             # RBAC controls, account status management, user imports
│   ├── globals.css       # Core Tailwind & custom variables design guidelines
│   ├── layout.tsx        # Global shell including Sidebar and Header navigation
│   └── page.tsx          # Initial entry router redirection
├── components/           # Shared UI components (Modals, Custom select, drawers)
│   └── ui/               # shadcn baseline components (button, input, badge)
├── hooks/                # Custom React hooks (e.g. useMediaQuery)
└── lib/                  # Library initializers (Supabase setup, helper utilities)
```
