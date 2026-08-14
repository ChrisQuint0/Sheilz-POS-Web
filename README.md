# ☕ Sheilz POS Web — Admin & Backoffice Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Assistant-8E75B2?style=flat-square&logo=googlegemini)](https://ai.google.dev)

A premium, enterprise-grade web administration and business intelligence dashboard built for **Sheilz Coffee**. Serving as the back-office command center, **Sheilz POS Web** operates in real-time synergy with the **Sheilz POS Mobile** terminal via Supabase cloud infrastructure. It centralizes sales tracking, multi-recipe inventory management, role-based staff provisioning, AI-powered business analytics, immutable audit logs, and system diagnostics.

---

## 🌟 Key Features & Modules

### 📊 1. Executive Dashboard & Real-Time KPIs

- **Live Metrics Cards**: Immediate tracking of **Total Revenue**, **Orders Today**, **Average Order Value (AOV)**, and **Stock Alerts**, complete with trend indicators comparing performance to historical baselines.
- **Weekly Revenue Trends**: Dynamic visual chart showing 7-day revenue performance.
- **Rolling Activity Stream**: Real-time event log tracking system actions (logins, stock changes, configuration updates).
- **Critical Inventory Highlights**: Direct visibility into top low-stock ingredients requiring immediate reordering.

### 🤖 2. Sheilz AI Assistant (Powered by Google Gemini)

- **Built-in Intelligent Copilot**: Integrated widget utilizing Google Gemini API with custom RAG (Retrieval-Augmented Generation) knowledge base integration.
- **Operational & Sales Insights**: Query business trends, inventory turnover, peak transaction hours, and menu suggestions using natural language.
- **Troubleshooting Support**: Instant assistance for staff on workflow execution, recipe setup, and system diagnostics.

### ⚙️ 3. POS Configuration & Recipe Management

- **Catalog Management**: Centralized management of beverages and pastries. Modify pricing, category, description, size, and temperature parameters.
- **Dynamic Category & Payment Ordering**: Drag-and-drop hierarchy customization for categories, payment methods, sizes, and temperature chips on POS terminals.
- **Multi-Step Product Wizard**:
  1. Upload product thumbnail media directly to Supabase Storage.
  2. Define name, description, category, and item type (Beverage vs. Pastry).
  3. Configure size and temperature availability (automatically bypasses temperature for pastries).
  4. **Recipe Configurator**: Map exact ingredient gram/mL amounts per size variant for automated sales-driven stock deduction.
  5. Toggle active terminal availability.

### 🛒 4. Sales History & Transaction Ledger

- **High-Performance Data Grid**: Powered by **AG Grid React (Quartz Theme)** with column sorting, resizing, filtering, and bulk operations. Responsive card view fallback for mobile viewports.
- **Granular Filtering**: Filter transactions by status (_Completed_, _Voided_), payment method (_Cash_, _GCash_, _Maya_, _BPI_), cashier, or text search.
- **Transaction Inspector Drawer**: Complete breakdown of sold items, size variants, custom modifiers, payment breakdowns, and exact timestamp logs.
- **Manager Authorization Modal**: Security barrier requiring high-privilege credentials to authorize deletions or record adjustments.
- **One-Click Data Export**: Download transaction sets directly to Microsoft Excel (`.xlsx`).

### 📦 5. Inventory & Stock Control

- **Dual-View Ledger**: Seamlessly toggle between **Stock Management** (ingredient cards with visual gauges) and **Movement Audit Ledger** (log of all stock adjustments).
- **Visual Alert Thresholds**: Color-coded stock status indicators (_Healthy / Green_, _Low / Orange_, _Critical / Red_, _Out of Stock / Black_).
- **Automated Deduction Engine**: Real-time deduction of raw coffee beans, milk, syrups, and packaging based on sales recipe mappings.
- **Manual Adjustments**: Record spoilage, damage, internal consumption, or physical count reconciliation.
- **Intake & Replenishment**: Log incoming inventory batches, update stock levels, input supplier unit costs, and track payment source.
- **CSV Ledger Export**: Export inventory stock status and movement logs to CSV format.

### 👥 6. Customer CRM & Loyalty Analytics

- **Customer Database**: Centralized customer profile repository.
- **Purchasing Insights**: Track purchase history, customer lifetime value (LTV), and frequency patterns.
- **Exporting Capabilities**: Export customer lists and segmentation data to Excel format.

### 🔐 7. Team & Staff Management (RBAC)

- **Role-Based Access Control (RBAC)**: Assign strict permissions for _Administrator_, _Manager_, and _Cashier_ roles.
- **Staff Roster**: Manage status (_Active_, _Inactive_), update display names, and control email assignments.
- **Bulk Account Provisioning**: Add staff accounts individually or import user lists via formatted CSV/Excel spreadsheets.
- **Credential Recovery**: Administrator-driven password reset functionality for team members.

### 🛡️ 8. Immutable Audit Logs & Security

- **Event Audit Feed**: Comprehensive chronological audit trail capturing all system events.
- **Rich Metadata Collection**: Logs initiating user, action type, target resource ID, client IP address, and browser User Agent parsing.
- **JSON Payload Diff Viewer**: Side-by-side inspection of before-and-after state payloads for data modifications.
- **Audit Search & Filter**: Filter by severity level, action category, or date range with Excel/CSV export capabilities.

### 🩺 9. System Diagnostics & Health Monitor

- **Health Overview**: System-wide status indicator for API endpoints, Supabase connections, and background workers.
- **Database Health Monitor**: Real-time DB performance monitoring, table stats, and RPC execution status.
- **Query Performance & Error Logs**: Insights into database query response times, warning centers, and application error logs.

### 📈 10. Advanced Business Intelligence & PDF Reporting

- **Interactive Visualizations**: Powered by **Chart.js** & **react-chartjs-2**.
- **Revenue Analytics**: Custom date range trend analysis.
- **Category Share Breakdown**: Donut charts illustrating revenue allocation across menu categories.
- **Top Product Leaderboards**: Ranking top menu items by volume sold and revenue generated.
- **Hourly & Daily Heatmaps**: Peak operational hour matrices to optimize shift scheduling.
- **Ingredient Turnover Matrix**: High/low ingredient consumption ratios for smarter purchasing.
- **Export Engine**: Export raw datasets to Excel (`.xlsx`) or generate camera-ready graphical PDF executive reports (`jsPDF` & `html2canvas`).

---

## 🛠️ Technology Stack

| Domain              | Technology / Library                                                                        | Purpose                                                       |
| :------------------ | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------ |
| **Core Framework**  | [Next.js 16 (App Router)](https://nextjs.org)                                               | Full-stack React framework with SSR and App Router            |
| **UI Library**      | [React 19](https://react.dev)                                                               | Frontend component library                                    |
| **Language**        | [TypeScript 5](https://www.typescriptlang.org)                                              | Type-safe JavaScript superset                                 |
| **Styling & Theme** | [Tailwind CSS 4](https://tailwindcss.com), `shadcn/ui`, `tw-animate-css`                    | Utility-first styling with modern design tokens               |
| **Database & Auth** | [Supabase Client & SSR](https://supabase.com)                                               | PostgreSQL database, RLS security, storage, and auth          |
| **AI Engine**       | [@google/genai](https://ai.google.dev)                                                      | Google Gemini API integration with custom RAG KB              |
| **Data Tables**     | [AG Grid Community 35](https://www.ag-grid.com)                                             | Desktop-grade data table with Quartz theme                    |
| **Charts & Graphs** | [Chart.js 4](https://www.chartjs.org) & [react-chartjs-2](https://react-chartjs-2.js.org)   | Interactive analytics visualizations                          |
| **Excel Export**    | [ExcelJS](https://github.com/exceljs/exceljs) & [SheetJS (XLSX)](https://sheetjs.com)       | Custom styled Excel spreadsheet generator                     |
| **PDF Reporting**   | [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com) | PDF rendering for executive reporting                         |
| **Utilities**       | `date-fns`, `ua-parser-js`, `lucide-react`, `sonner`                                        | Date handling, device parsing, icons, and toast notifications |

---

## 📁 Directory Structure

```text
sheilz-pos-web/
├── src/
│   ├── app/                      # Next.js App Router Pages & API Routes
│   │   ├── analytics/            # Business Intelligence charts, KPI metrics, PDF export
│   │   ├── api/                  # Backend API routes
│   │   │   ├── ai/chat/          # Gemini AI chat endpoint with RAG context
│   │   │   └── export-sales/     # Sales export endpoints
│   │   ├── audit/                # Immutable audit logs, JSON diff viewer, exports
│   │   ├── customers/            # Customer CRM database & purchasing analytics
│   │   ├── dashboard/            # Executive overview dashboard & live KPI widgets
│   │   ├── diagnostics/          # System health, DB query performance & error logs
│   │   ├── inventory/            # Ingredient cards, movement ledger & intake logs
│   │   ├── login/                # Administrator secure authentication
│   │   ├── pos-settings/         # Menu catalog, recipe configurer & drag-drop ordering
│   │   ├── sales/                # Transaction ledger (AG Grid), detail drawers, authorization
│   │   ├── team/                 # Staff RBAC, user status, bulk CSV/Excel import
│   │   ├── globals.css           # Tailwind CSS 4 setup & custom CSS variables
│   │   ├── layout.tsx            # Global application shell with Sidebar & Header
│   │   └── page.tsx              # Root entry route
│   ├── components/               # Reusable Application Components
│   │   ├── layout/               # Header, sidebar, and breadcrumb layout components
│   │   ├── sheilz-ai/            # Gemini AI chatbot drawer, floating button, and context
│   │   └── ui/                   # shadcn baseline UI primitives (buttons, dialogs, inputs)
│   ├── hooks/                    # Custom React hooks (e.g. useMediaQuery, profile hooks)
│   └── lib/                      # Infrastructure & Core Helpers
│       ├── ai/                   # Gemini client initialization, prompt templates, RAG loader
│       ├── pdf-export.ts         # High-resolution canvas to PDF report compiler
│       └── utils.ts              # Helper utility functions
├── supabase/
│   ├── config.toml               # Supabase CLI local configuration
│   └── migrations/               # PostgreSQL schema, RLS policies, RPC functions & seeds
├── public/                       # Static public assets and branding imagery
├── USER_FLOWS.md                 # Detailed feature breakdown and screen flow specifications
└── package.json                  # Dependencies, scripts, and build configuration
```

---

## ⚡ Quick Start & Installation

### Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ChrisQuint0/Sheilz-POS-Web.git
cd sheilz-pos-web
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI Integration
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Development Server

Start the local development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000` in your web browser.

### 4. Build for Production

To create an optimized production build:

```bash
npm run build
npm run start
```

To run lint checks across the codebase:

```bash
npm run lint
```

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS)**: Enforced across all Supabase PostgreSQL tables to guarantee that tenant data is isolated and staff privileges are verified at the database layer.
- **Elevated Privilege Verification**: Voids, sales record deletions, and major stock adjustments require high-level Manager / Admin re-authentication.
- **Auditability**: IP tracking, user-agent parsing, and before-and-after JSON snapshots ensure transparency and fraud prevention.

---

## 📄 License & Credits

Designed and developed exclusively for **Sheilz Coffee**.  
All rights reserved © 2026.
