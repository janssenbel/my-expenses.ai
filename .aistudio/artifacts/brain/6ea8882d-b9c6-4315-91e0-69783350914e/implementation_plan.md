# Verdant Ledger — Mobile Expense & Budget Tracker

Verdant Ledger is a mobile-first personal finance and expense tracking web application designed for rapid thumb-friendly transaction logging, real-time category budget monitoring, visual spending analytics, recurring subscription tracking, and receipt scanning with instant local persistence.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and design choices have been confirmed from your preferences and form the foundation of this plan:

- **Confirmed Core Feature Scope**: Daily expense & income logging alongside **Category Budgets & Spending Limits**, **Visual Spending Analytics & Charts**, **Recurring Bills & Subscription Tracking**, and **Receipt Photo Scanning + CSV Export/Import**.
- **Confirmed Visual Aesthetic**: **Clean Fintech Light with Emerald Accents** — crisp daylight-legible surfaces (`#F8FAFC` / `#FFFFFF`), slate typography (`#0F172A`), and disciplined emerald (`#059669`) action and positive-cashflow highlights.
- **Confirmed Data Storage Strategy**: **Local Device Storage with Instant Access & Rich Demo Data** — zero-friction startup pre-populated with realistic sample transactions, budgets, and recurring bills, plus one-tap reset, JSON/CSV export, and CSV import.
- **Responsive Mobile-to-Desktop Ergonomics**: Optimized for one-handed smartphone viewports (`375px–430px`) with a fixed bottom navigation bar and slide-up action sheets, while expanding cleanly into a multi-column financial command layout (`max-w-6xl`) on desktop screens without trapping the interface in a narrow strip.

---

## 1. Overview & Core Concept

- **What It Does**: Enables users to log daily expenses in seconds using a custom tactile keypad or receipt camera/photo upload, track spending velocity against monthly category limits, visualize cash flow trends across interactive charts, and manage upcoming recurring bills and subscriptions before they renew.
- **Target Audience / Persona**: On-the-go individuals and budget-conscious professionals who want the tactile speed of a native mobile finance app combined with deep visual clarity, without mandatory cloud account sign-ups.
- **Key Value**: Eliminates the friction of manual bookkeeping by pairing a 3-tap quick-entry bottom sheet and AI-assisted receipt extraction with immediate visual feedback on how every purchase impacts monthly category budgets.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Zero-State & Instant Demo Onboarding**:
   - Launching the app immediately loads a curated, realistic current-month financial ledger (coffee, groceries, transit, dining, utilities, and recurring subscriptions) stored in `localStorage`.
   - Users can filter by date or time period right away, or clear demo data to start a fresh personal ledger from the Settings drawer.
2. **One-Handed Quick Expense Entry & Receipt Scanning**:
   - Tapping the prominent emerald `+ Log Expense` button opens a smooth slide-up Bottom Sheet (`rounded-t-3xl`) anchored in the natural thumb zone.
   - Users can either tap **Scan Receipt** (upload or snap a receipt photo, or test with built-in sample receipts, parsed via server-side Gemini Vision into merchant, amount, date, category, and line items) or enter an amount via the tactile numeric keypad, pick a category, toggle recurring status, and save.
3. **Category Budgets & Threshold Alerts**:
   - Navigating to the **Budgets** view displays overall monthly budget utilization alongside individual category progress bars and SVG progress rings.
   - Categories approaching 80% utilization display an Amber warning state (`Approaching limit`), and categories exceeding 100% display a Crimson alert state (`Over budget`) paired with clear text indicators. Users can edit monthly limits or add custom budgets at any time.
4. **Spending Analytics & Visual Charts**:
   - Navigating to the **Analytics** view presents daily/weekly spending bar charts, category breakdown donut/horizontal distribution charts, month-over-month burn rate comparisons, and top merchant rankings.
5. **Recurring Bills & Subscription Calendar**:
   - Navigating to the **Recurring** view shows upcoming fixed bills and subscriptions sorted by due date, monthly committed total, and a one-tap `"Mark Paid & Log"` action that records the bill into the main transaction ledger and advances the next renewal date.

### Visual Identity & Theme

- **Aesthetic Direction**: Clean Fintech Light — precision financial utility inspired by modern mobile banking interfaces, prioritizing high outdoor contrast, scannable tabular numerals, and generous whitespace over nested card clutter.
- **Color Palette & 60-30-10 Distribution**:
  - **60% Dominant Neutral Canvas**: Cool Alabaster background (`#F8FAFC`) with pure white (`#FFFFFF`) elevated surface modules.
  - **30% Structural Surfaces & Typography**: Deep Slate primary text (`#0F172A`), Muted Slate metadata (`#64748B`), and crisp 1px hairline borders (`#E2E8F0`).
  - **10% Accent & Semantic Budget**:
    - Primary Brand / Action: Deep Emerald (`#059669`, hover `#047857`, soft tint `#ECFDF5`).
    - Nominal / Under Budget: Emerald Green (`#16A34A` + explicit status text).
    - Warning / 80%+ Budget Used: Warm Amber (`#D97706` + explicit status text).
    - Overdue / Over Budget: Crimson (`#DC2626` + explicit status text).
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display & Headings**: `Plus Jakarta Sans` (600 SemiBold / 700 Bold) with `text-wrap: balance` for section headers and hero balance figures.
  - **Body & Controls**: `DM Sans` (400 Regular / 500 Medium) for crisp legibility across transaction rows and interactive filter buttons.
  - **Financial Numerals & Telemetry**: `JetBrains Mono` with mandatory `font-variant-numeric: tabular-nums` (`tabular-nums`) on all currency amounts, percentages, dates, and budget counters so decimals align vertically.
- **Component Styling, Touch Ergonomics & Spatial Math**:
  - **Touch Hitboxes**: Every interactive button, category selector, date pill, and transaction row enforces a minimum `44x44px` touch target (`min-h-[44px] min-w-[44px]`).
  - **15% Sticky Viewport Cap**: The compact sticky top bar (`52px`) and mobile bottom navigation bar (`60px`) stay strictly under the 15% mobile viewport height cap, leaving over 85% of vertical space for scrollable content.
  - **Zero-Pill Metadata Discipline**: Transaction category names, payment methods, and timestamps render as clean, unboxed inline text separated by middle dots (`Groceries · Card · Nov 6`), never wrapped in static pill badges.
  - **Single-Elevation Depth**: Cards use a single subtle hairline border (`border border-slate-200/80`) with `rounded-2xl` geometry and minimum `16px–20px` outer padding, separating internal rows with inset hairline dividers rather than nesting cards inside cards.
- **Interactive Feedback & Motion**:
  - Compositor-only transitions (`transform`, `opacity`) settling within `150ms–200ms` (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Tactile active press scaling (`active:scale-[0.98]`) on keypad buttons and primary CTAs, skeleton loading placeholders during receipt AI extraction, and non-intrusive toast confirmations on save/export/undo.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mobile-First Ergonomics with Responsive Multi-Column Desktop Expansion**
  - *Chosen Approach*: On mobile (`< 768px`), render a thumb-zone bottom navigation bar and slide-up bottom sheets; on desktop (`>= 1024px`), automatically adapt to a clean 3-zone header and multi-column workspace (`max-w-6xl`) where the ledger, budget gauges, and analytics charts sit side-by-side.
  - *Why*: Delivers authentic one-handed mobile ergonomics on phones while respecting full desktop viewports without leaving an isolated phone strip in an empty screen.
  - *Alternatives Considered*: Fixed `max-w-md` phone frame wrapper on desktop (rejected because it wastes desktop screen real estate and violates viewport presence standards).
- **Decision 2: Local-First Storage with Structured CSV Import/Export & Demo Reset**
  - *Chosen Approach*: Persist all transactions, category budgets, and recurring rules in versioned `localStorage` with instant hydration, paired with RFC-compliant CSV export, CSV import parser, and one-click sample data restore.
  - *Why*: Matches your preference for immediate access without login walls while ensuring data portability for spreadsheets.
  - *Alternatives Considered*: Mandatory cloud database setup (rejected per user preference for instant local storage).
- **Decision 3: Hybrid Expense Capture (Tactile Keypad + Server-Side Gemini Receipt Vision)**
  - *Chosen Approach*: Provide a fast custom numeric keypad for everyday 3-second manual logging, plus an Express server route (`/api/receipts/scan`) powered by `@google/genai` (`gemini-3.8-flash`) with structured JSON output to extract merchant, total, date, and category from receipt images.
  - *Why*: Combines zero-latency manual entry with effortless automated capture for paper/digital receipts while keeping the Gemini API key strictly on the server.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Verdant Ledger Application Shell                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Top Navigation Bar (Brand Wordmark · View Switcher · + Log Expense CTA)│  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│         ┌────────────────────────────┼────────────────────────────┐          │
│         ▼                            ▼                            ▼          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐  │
│  │   Overview & Ledger  │  │  Budgets & Limits    │  │ Analytics & Bills  │  │
│  │  - Date Strip Filter │  │  - Monthly Utilization│  │ - Spending Trends  │  │
│  │  - Cashflow Summary  │  │  - Category Gauges   │  │ - Category Breakdown│ │
│  │  - Search & Category │  │  - Threshold Alerts  │  │ - Recurring Bills  │  │
│  │  - Tap-to-Edit Rows  │  │  - Inline Limit Edit │  │ - Mark Paid Action │  │
│  └──────────────────────┘  └──────────────────────┘  └────────────────────┘  │
│         │                            │                            │          │
│         └────────────────────────────┼────────────────────────────┘          │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │           Interactive Slide-Up Sheets & Data Utilities                 │  │
│  │  - Quick Expense / Income Sheet (Tactile Keypad + Category Selector)   │  │
│  │  - Receipt Scanner Modal (Photo Upload / Sample Receipt -> API Proxy)  │  │
│  │  - Data Manager Drawer (CSV Export, CSV Import, Demo Reset, Currency)  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌───────────────────────────────────────┐ ┌────────────────────────────────────┐
│   Client Ledger Store (localStorage)  │ │   Express API Server (server.ts)   │
│  - transactions[]: TransactionRecord  │ │  - POST /api/receipts/scan         │
│  - budgets[]: CategoryBudget          │ │    Uses @google/genai              │
│  - recurring[]: RecurringExpense      │ │    Model: gemini-3.8-flash         │
│  - settings: Currency & Month Filter  │ │    Structured JSON Receipt Schema  │
└───────────────────────────────────────┘ └────────────────────────────────────┘
```

### Data Model & State

- **`Transaction`**: `id`, `title` (merchant/description), `amount` (numeric), `type` (`'expense' | 'income'`), `category` (`'Food & Dining' | 'Groceries' | 'Transport' | 'Housing & Bills' | 'Shopping' | 'Health' | 'Entertainment' | 'Income'`), `date` (ISO `YYYY-MM-DD`), `paymentMethod` (`'Card' | 'Cash' | 'Transfer' | 'Apple Pay'`), `notes`, `receiptItems` (optional array of extracted receipt line items), `recurringId` (optional link).
- **`CategoryBudget`**: `category`, `monthlyLimit`, `alertThreshold` (default `0.8`), dynamically computed `spentAmount`, `remainingAmount`, and `status` (`'nominal' | 'warning' | 'exceeded'`).
- **`RecurringBill`**: `id`, `title`, `amount`, `category`, `frequency` (`'monthly' | 'weekly' | 'yearly'`), `nextDueDate` (ISO date), `autoPay` (boolean), `lastPaidDate`.

### Interactive Component & State Mapping

- **Header & Mobile Bottom Tab Bar**: Switches active view (`Overview`, `Budgets`, `Analytics`, `Recurring`, `Data & CSV`) and triggers the `+ Log Expense` Bottom Sheet from any screen.
- **Horizontal Date & Month Scroller**: Interactive `<button>` controls allowing users to filter transactions and budget calculations by specific day, week, or month, with an instant `"All This Month"` reset.
- **Ledger Search & Filter Bar**: Live client-side search across merchant names and notes, combined with interactive category filter tabs and sort controls (`Newest`, `Highest Amount`).
- **Quick Entry & Edit Bottom Sheet**: Supports creating a new transaction or editing/deleting an existing transaction when a row is tapped. Validates non-zero amounts and required titles before committing to state.
- **Receipt Scanner Flow**: Converts uploaded receipt image (or selected sample receipt image) to base64, posts to `/api/receipts/scan`, displays a skeleton loader while `gemini-3.8-flash` extracts structured fields, and pre-fills the expense form for user confirmation.
- **Recurring Bill Manager**: Allows adding new recurring subscriptions, toggling active status, and clicking `"Log Payment"` to atomically create a dated `Transaction` entry and advance `nextDueDate` by one billing cycle.
- **CSV Export & Import Handler**: Generates downloadable `.csv` files of the filtered or full ledger and parses uploaded `.csv` files with column validation and preview confirmation.
