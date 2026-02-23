# KB CRM Frontend

A React-based Customer Relationship Management (CRM) application with ecommerce product management, order processing, and financial tracking capabilities.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework

## Features

### Admin Panel

- **Dashboard** - Overview and analytics
- **Products Management**
  - Product listing with image, part number, name, category, brand, price, and inventory
  - Add/Edit products on separate pages
  - Dual currency display (USD primary, INR conversion)
  - Color-coded inventory status (red: 0, orange: <10, green: 10+)
  - Multi-image upload support (main image + additional images)
  - Hard delete products with confirmation (permanent removal from database)
  - Unified view: Admin and Buyer see same products from database
- **Users Management** - User listing and management
- **Categories** - Product category management
- **Brands** - Brand management

### Order Management

- **Orders (Open Orders)**
  - View all pending orders with buyer details
  - Advance payment model support
  - Payment tracking with amount received vs total
  - Dispatch orders with dispatch date selection
  - View order details modal
  - Filter and search functionality

- **Dispatched Orders**
  - View all dispatched orders
  - Editable dispatch information (courier service, tracking number, dispatch date)
  - Update dispatch details after initial dispatch
  - Track shipment status

### Performa Invoice (PI) Management

- **PI Creation & Management**
  - Create PI from quotations or manually
  - Per-document USD to INR exchange rate
  - Terms & Conditions editor with predefined templates
  - Validity period selection (7, 15, 30 days with auto-expiry calculation)
  - Bank details display for payment instructions

- **Tab-Based Payment Filtering**
  - **All**: View all Proforma Invoices
  - **Paid**: Fully paid PIs with dispatched/undispatched sub-filter
  - **Partial**: Partially paid PIs
  - **Unpaid**: PIs with no payment received (shows expiry date alongside issue date)
  - **Expired**: Expired PIs requiring reactivation

- **Context-Specific Actions by Payment Status**
  | Status | Available Actions |
  |--------|-------------------|
  | **Paid & Dispatched** | View, Print, Email, Clone only |
  | **Paid & Undispatched** | View, Print, Email, Dispatch, Clone |
  | **Partial Paid** | View, Print, Email, Edit, Collect Payment, Dispatch, Clone |
  | **Unpaid** | View, Print, Email, Edit, Collect Payment, Dispatch, Clone |
  | **Expired** | View, Reactivate only |

- **PI Item Editing**
  - Add/remove items from existing PI (Unpaid/Partial only)
  - Edit quantity and unit price inline
  - Editable expiry/validity date
  - Live total recalculation
  - Track changes with "was: X" indicators
  - "Save and Send" button to save and notify buyer
  - Edit disabled for Paid or Dispatched PIs

- **PI Lifecycle Management**
  - **Reactivate**: Change EXPIRED status to APPROVED (same PI number preserved)
  - **Clone**: Create copy with new PI number in series (PI250001, PI250002...)
    - Resets payment to zero
    - Resets payment_status to UNPAID
    - Clears payment_history and dispatch info
    - Preserves all product information
  - Reactivation history tracking

- **Project-Based Dispatch**
  - Option to dispatch without full payment
  - Dispatch available for Unpaid, Partial, and Paid (undispatched) PIs
  - Mark as "Project" dispatch type
  - Project name tracking
  - Three dispatch types: STANDARD, PROJECT, CREDIT

- **Email Simulation**
  - Email preview modal when PI is created
  - Simulated email types: PI_CREATED, PAYMENT_RECEIVED, DISPATCH_NOTIFICATION
  - Professional email template with attachments display
  - Email action logging

### Quotation Management

- **Admin Quotation Page (Tab-Based)**
  - **Open Tab**: Pending quotations awaiting buyer response
    - Edit & Revise, Clone, Admin Reject actions
    - Revision badge with click to view history
  - **Accepted Tab**: Buyer-accepted quotations
    - Generate PI, Clone actions
    - Lock indicator for converted quotes
  - **Rejected Tab**: Rejected quotations (buyer or admin)
    - Edit & Create Revision, Clone, Renew actions
    - Shows rejection reason and rejector (Buyer/Admin)
  - **Expired Tab**: Expired quotations
    - Renew, Clone actions

- **Quotation Creation & Editing**
  - Per-document exchange rate (independent of global rate)
  - Add/Remove products with search autocomplete
  - Inline quantity and price editing
  - Additional charges (Tax, Shipping, Logistics, Custom Duty, Bank Charges)
  - Save & Send creates new revision and sends to buyer

- **Admin Reject Feature**
  - Admin can reject quotations on behalf of the business
  - Rejection reason input with suggestions
  - Moves quote to Rejected tab
  - Tracks admin_rejected flag for display

- **Revision History**
  - Edit rejected quotations to create new revisions
  - Track revision numbers (Rev 1, Rev 2, etc.)
  - Full revision history modal with dates, status, amounts, and notes
  - Revision badge on quotes (Rev 2, Rev 3, etc.)
  - Only latest revision can convert to PI

- **Quotation Lifecycle**
  - **Clone**: Create copy with new quotation number
  - **Renew**: Create new quote with extended validity
  - **Edit & Create Revision**: Update rejected quote, creates new revision

### Buyer Quotation Page

- **Tab-Based Quotation View**
  - **Received Tab**: New quotations pending buyer action
    - Days remaining indicator
    - Accept/Reject actions with reason input
  - **Accepted Tab**: Accepted quotations
    - Shows PI number if converted
  - **Rejected Tab**: Rejected quotations
    - Shows rejection date and reason
    - Distinguishes buyer vs seller rejection
  - **Expired Tab**: Expired quotations

- **Buyer Actions**
  - View quotation details with revision indicator
  - Accept quotation with confirmation
  - Reject quotation with reason
  - Print/PDF quotation
  - Revision notification (shows "Updated by seller" for revised quotes)

### Invoice Management

- **Three Invoice Types**
  1. **Tax Invoice** - Standard with GST/tax calculation
  2. **Reimbursement Invoice** - Expense reimbursement (no tax)
  3. **Bill of Supply** - Exempt/nil-rated supplies (no tax)

- **Invoice Series Management**
  - Sequential invoice numbering
  - Reserve/skip invoice numbers
  - Reserved numbers shown as placeholders
  - Manual invoice number assignment with availability check

- **Invoice Features**
  - Per-document exchange rate
  - Type-specific rendering and calculations
  - Tax breakdown display (CGST/SGST) for Tax Invoices

### Purchase Management

- **Suppliers Management**
  - Supplier listing with search and status filter
  - Add/Edit supplier with comprehensive information:
    - Basic Info: Code, Name, Status (Active/Inactive)
    - Contact: Person name, Phone, Primary & Secondary Email
    - Address: Street, City, State, ZIP, Country
    - Business Info: Tax ID, GSTIN, PAN, Registration No
    - Bank Details: Bank Name, Account Name, Account Number, Branch, IFSC, SWIFT
  - View supplier details in modal with tabs:
    - Info Tab: Contact & Business Information
    - Bank Tab: Bank account details
    - Orders Tab: Supplier order history
    - Performance Tab: Total orders, value, on-time rate, quality rating
  - Stats cards: Total Suppliers, Active Suppliers, Pending Orders, Outstanding Balance

- **PI Allocation**
  - Allocate customer PI items to suppliers
  - Split quantities across up to 3 suppliers per item
  - Track allocation status: Complete, Partial, Pending
  - Filter PIs by status and search
  - Real-time allocation tracking with remaining quantities
  - Generate individual supplier Purchase Orders (PDFs)
  - Each supplier gets their own downloadable PO with:
    - Supplier contact details
    - Customer/PI reference
    - Items allocated to that specific supplier
    - Quantities and totals
  - localStorage persistence for allocations

- **Purchase Dashboard**
  - Overview metrics for purchase activities
  - Stats cards:
    - Active Suppliers count
    - Fully Allocated PIs
    - PIs Needing Allocation
    - Pending Quantity to assign
  - Items Needing Allocation table with progress bars
  - Quick navigation to Suppliers and PI Allocation pages

### Financial Management

- **Transaction Statements**
  - Comprehensive view of all financial transactions
  - Summary cards showing Total Inflow, Total Outflow, Net Balance
  - Filter by buyer name
  - Filter by month
  - Search functionality
  - View individual buyer statements
  - Download statement as PDF
  - Print statement functionality

- **Payment Recording**
  - Bank details display in payment modal
  - Multiple payment methods support
  - Payment history tracking

### Product Image Handling

- Main product image upload
- Multiple additional images support
- Set any additional image as main
- Supported formats: JPG, PNG, GIF (Max 5MB each)
- Image preview with delete option

### Currency Features

- **Global Rate**: Real-time USD to INR conversion via API
- **Per-Document Rate**: Each PI, Invoice, and Quotation stores its own exchange rate
- Document calculations use stored rate, not global rate
- Exchange rate input field in create/edit dialogs

## Components

### Reusable Components

| Component | Location | Description |
|-----------|----------|-------------|
| `TermsConditionsEditor` | `admin/components/` | T&C editor with predefined templates |
| `BankDetailsCard` | `admin/components/` | Displays company bank information |
| `EditPIItemsDialog` | `admin/components/` | Edit items in existing PI |
| `EmailPreviewModal` | `admin/components/` | Email preview simulation |
| `InvoicePreview` | `admin/components/` | Type-aware invoice rendering |

## Project Structure

```
frontend2/
├── src/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── BankDetailsCard.jsx      # Bank info display
│   │   │   ├── EditPIItemsDialog.jsx    # PI item editing
│   │   │   ├── EmailPreviewModal.jsx    # Email simulation
│   │   │   ├── InvoicePreview.jsx       # Invoice rendering
│   │   │   └── TermsConditionsEditor.jsx # T&C editor
│   │   └── pages/
│   │       ├── Products.jsx             # Product listing
│   │       ├── AddEditProduct.jsx       # Add/Edit product form
│   │       ├── Users.jsx                # User management
│   │       ├── Orders.jsx               # Open orders
│   │       ├── DispatchedOrders.jsx     # Dispatched orders
│   │       ├── Statements.jsx           # Transaction statements
│   │       ├── Invoices.jsx             # Invoice management
│   │       ├── PerformaInvoices.jsx     # PI management
│   │       ├── Quotations.jsx           # Quotation management
│   │       ├── ManualInvoice.jsx        # Manual invoice creation
│   │       ├── Suppliers.jsx            # Supplier management
│   │       ├── PIAllocation.jsx         # PI to supplier allocation
│   │       ├── PurchaseDashboard.jsx    # Purchase overview
│   │       └── ...
│   ├── components/                      # Shared components
│   ├── context/
│   │   ├── CurrencyContext.jsx          # Currency conversion context
│   │   └── NotificationCountsContext.jsx # Real-time notification badge counts
│   ├── stores/
│   │   └── useInvoicesStore.js          # Zustand store for invoices UI state
│   ├── hooks/
│   │   └── useInvoices.js               # React Query hook for invoices data
│   ├── mock/                            # Mock data files
│   │   ├── performaInvoices.json        # PI data with exchange_rate, terms, validity
│   │   ├── invoices.json                # Invoice data with invoice_type
│   │   ├── quotations.json              # Quotation data with revisions
│   │   ├── payments.json                # Payment records
│   │   ├── settings.json                # Bank details, company info
│   │   ├── products.json                # Product catalog
│   │   ├── buyers.json                  # Customer data
│   │   ├── suppliers.json               # Supplier data
│   │   ├── supplierOrders.json          # Supplier purchase orders
│   │   ├── piAllocations.json           # PI to supplier allocations
│   │   └── ...
│   ├── App.jsx                          # Main app with routing
│   └── main.jsx                         # Entry point
├── public/                              # Static assets
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Routes

### Admin Routes

| Path | Description |
|------|-------------|
| `/admin` | Admin dashboard |
| `/admin/products` | Products listing |
| `/admin/products/add` | Add new product |
| `/admin/products/edit/:id` | Edit existing product |
| `/admin/users` | Users management |
| `/admin/users/:id` | User profile/details |
| `/admin/orders` | Open orders management |
| `/admin/dispatched-orders` | Dispatched orders tracking |
| `/admin/statements` | Transaction statements |
| `/admin/invoices` | Invoice management |
| `/admin/proforma-invoices` | Proforma invoices (with tabs) |
| `/admin/quotations` | Quotation management (with tabs) |
| `/admin/manual-invoice` | Create manual invoice |
| `/admin/suppliers` | Supplier management |
| `/admin/pi-allocation` | PI to supplier allocation |
| `/admin/purchase-dashboard` | Purchase overview dashboard |
| `/admin/categories` | Category management |
| `/admin/brands` | Brand management |

### Buyer Routes

| Path | Description |
|------|-------------|
| `/buyer` | Buyer dashboard |
| `/buyer/quotations` | Quotation management (Received/Accepted/Rejected/Expired tabs) |
| `/buyer/orders` | Order history |
| `/buyer/profile` | Buyer profile |

## Mock Data Schema

### Performa Invoice (performaInvoices.json)

```json
{
  "performa_invoice_id": "PI-2024-001",
  "performa_invoice_number": "PI240001",
  "exchange_rate": 83.5,
  "payment_status": "PAID",
  "payment_received": 12239.66,
  "payment_history": [
    {
      "payment_id": "PAY-001",
      "amount": 12239.66,
      "currency": "USD",
      "exchange_rate_at_payment": 83.5,
      "payment_method": "BANK_TRANSFER",
      "payment_date": "2024-12-05"
    }
  ],
  "dispatched": true,
  "dispatch_info": {
    "dispatch_date": "2024-12-16",
    "courier_service": "FedEx",
    "tracking_number": "FX789012345"
  },
  "terms_conditions": ["Payment terms..."],
  "validity_period": "30_DAYS",
  "valid_until": "2025-01-01T00:00:00Z",
  "cloned_from": null,
  "reactivation_history": []
}
```

### Invoice (invoices.json)

```json
{
  "invoice_id": "INV-00001",
  "invoice_type": "TAX_INVOICE",
  "exchange_rate": 83.5,
  "is_reserved": false,
  "reserved_by": null
}
```

### Quotation (quotations.json)

```json
{
  "quote_id": "QUO-2024-003",
  "quote_number": "Q240003",
  "customer_id": "BUYER002",
  "buyer_name": "Global Aviation Ltd",
  "buyer_email": "orders@globalaviation.com",
  "status": "PENDING",
  "exchange_rate": 83.25,
  "revision_number": 2,
  "last_sent_date": "2026-02-05T10:00:00Z",
  "revision_history": [
    {
      "revision": 1,
      "date": "2026-02-01T14:20:00Z",
      "status": "SENT",
      "total_amount": 38500.00,
      "notes": "Initial quote sent to customer"
    },
    {
      "revision": 2,
      "date": "2026-02-05T10:00:00Z",
      "status": "SENT",
      "total_amount": 36804.38,
      "notes": "Revised pricing per customer request"
    }
  ],
  "admin_rejected": false,
  "admin_rejection_reason": null,
  "converted_to_pi": false,
  "pi_number": null
}
```

### Settings (settings.json)

```json
{
  "bank_details": {
    "bank_name": "HDFC Bank",
    "account_name": "KB Solutions Pvt Ltd",
    "account_number": "50100XXXXXXX",
    "ifsc_code": "HDFC0001234",
    "swift_code": "HDFCINBBXXX",
    "branch": "Mumbai Main Branch"
  }
}
```

### Supplier (suppliers.json)

```json
{
  "supplier_id": "SUP001",
  "supplier_code": "ATS-MFG",
  "supplier_name": "ATS Manufacturing Co.",
  "status": "ACTIVE",
  "contact": {
    "primary_name": "John Doe",
    "email": "john@atsmanufacturing.com",
    "phone": "+1-555-0100",
    "secondary_email": "sales@atsmanufacturing.com"
  },
  "address": {
    "street": "123 Industrial Ave",
    "city": "Fort Lauderdale",
    "state": "FL",
    "zip": "33301",
    "country": "USA"
  },
  "business_info": {
    "tax_id": "12-3456789",
    "gstin": "",
    "pan": "",
    "registration_no": "REG-2024-001"
  },
  "bank_details": {
    "bank_name": "Bank of America",
    "account_name": "ATS Manufacturing Co.",
    "account_number": "4567891234",
    "ifsc_code": "",
    "swift_code": "BOFAUS3N",
    "branch": "Fort Lauderdale"
  },
  "performance": {
    "total_orders": 45,
    "total_value": 125000.00,
    "on_time_delivery_rate": 95.5,
    "quality_rating": 4.8,
    "last_order_date": "2026-01-08T10:00:00Z"
  }
}
```

## Business Logic

### Notification Badge System

The notification system tracks status changes using `updatedAt` timestamps:

```javascript
// NotificationCountsContext provides:
{
  counts: {
    // Admin counts
    pendingOrders: number,      // Orders updated since last viewed
    pendingPayments: number,    // Payments updated since last viewed
    // Buyer counts
    newQuotations: number,      // Quotations updated since last viewed
    newProformaInvoices: number,// PIs updated since last viewed
    orderUpdates: number,       // Orders updated since last viewed
  },
  markAsViewed: (category) => void,  // Resets count and saves timestamp
  refreshCounts: () => void,         // Manual refresh
}
```

**How it works:**
1. On page load/poll, fetch items from API with `updatedAt` timestamps
2. Compare each item's `updatedAt` with stored "last viewed" timestamp
3. Count items where `updatedAt > lastViewed`
4. When user clicks menu item, `markAsViewed()` saves current time to localStorage
5. Next poll shows only items updated after that timestamp

**localStorage Keys:**
- `lastViewedAdminOrders` - Admin: Purchase Orders
- `lastViewedAdminPayments` - Admin: Payment Records
- `lastViewedQuotes` - Buyer: Quotations
- `lastViewedPIs` - Buyer: Proforma Invoices
- `lastViewedOrders` - Buyer: Orders

### Dispatch & Invoice Flow

```
PI (Paid/Unpaid/Partial)
    → Click "Dispatch" button
    → Enter Shipping Details:
        - HSN Code (from supplier)
        - AWB Number (tracking)
        - Shipping By (courier)
        - Invoice Number (editable)
    → Toggle "Generate Invoice on Dispatch"
    → Click "Dispatch & Generate Invoice"
    → Creates:
        - Dispatch record with shipping info
        - Invoice linked to dispatch (if enabled)
    → PI marked as dispatched
```

### Advance Payment Model
- Orders require advance payment before dispatch
- Track payment received vs total order amount
- Orders can only be dispatched after payment confirmation
- Project-based dispatch allows dispatch without full payment

### Transaction Tracking
- All financial transactions tracked as inflow (payments received) or outflow (refunds, adjustments)
- Monthly and buyer-wise filtering for easy reconciliation
- Net balance calculation across all transactions

### Invoice Type Logic
| Type | Tax Applied | Use Case |
|------|-------------|----------|
| TAX_INVOICE | Yes (GST) | Standard sales with tax |
| REIMBURSEMENT | No | Expense reimbursement |
| BILL_OF_SUPPLY | No | Exempt/nil-rated supplies |

### PI Lifecycle States
```
PENDING/APPROVED
    ├── UNPAID → (Collect Payment) → PARTIAL/PAID
    │       └── (Dispatch Without Payment) → DISPATCHED
    ├── PARTIAL → (Collect Payment) → PAID
    │       └── (Dispatch) → DISPATCHED
    └── PAID → (Dispatch) → DISPATCHED

EXPIRED → (Reactivate, same number) → APPROVED (editable)

Any Status → (Clone) → New PI (PENDING, UNPAID, new number)
```

### PI Action Matrix
| Payment Status | Dispatched | View | Edit | Dispatch | Collect Payment | Clone | Reactivate |
|----------------|------------|------|------|----------|-----------------|-------|------------|
| PAID | Yes | Yes | No | No | No | Yes | No |
| PAID | No | Yes | No | Yes | No | Yes | No |
| PARTIAL | Any | Yes | Yes | Yes | Yes | Yes | No |
| UNPAID | Any | Yes | Yes | Yes | Yes | Yes | No |
| EXPIRED | Any | Yes | No | No | No | No | Yes |

### Quotation Lifecycle
```
PENDING (Open Tab)
    ├── Buyer Accept → ACCEPTED (Accept Tab)
    │       └── Generate PI → CONVERTED (locked)
    ├── Buyer Reject → REJECTED (Rejected Tab)
    │       └── Edit & Revise → New Revision (PENDING)
    └── Admin Reject → REJECTED (Rejected Tab)
            └── Edit & Revise → New Revision (PENDING)

EXPIRED (Expired Tab) → Renew → New Quote (PENDING)

Any Status → Clone → New Quotation (PENDING)
```

## Environment

The application uses Vite for development with Hot Module Replacement (HMR) enabled.

## Recent Updates

### Version 2.4 Features (Latest)

**Product Management Updates**
1. **Hard Delete** - Products permanently deleted from database (with confirmation dialog)
2. **Unified Product View** - Admin and Buyer see the same products from database
3. **Real API Data** - Buyer product page fetches from real API (no mock data)
4. **Cloudinary Cleanup** - Product images automatically removed from Cloudinary on delete
5. **Simplified Store** - Removed `is_active` filtering from Zustand product store

**Product Delete Flow**
```
Admin clicks Delete → Confirmation Dialog → API DELETE call
    → Backend removes from MongoDB
    → Backend deletes images from Cloudinary
    → React Query cache invalidated
    → Product removed from table immediately
```

**API Configuration**
- `USE_MOCK_DATA` flag in `services/api/config.js` controls data source
- Set `VITE_ENABLE_MOCK_DATA=false` in `.env` for production
- Products service always uses real API for consistency

### Version 2.3 Features

**Notification Badge System**
1. **Real-time Badge Indicators** - Red badge numbers in sidebar showing new updates
2. **Status Change Tracking** - Badges show items updated since last viewed (not total counts)
3. **Admin Badges** - Purchase Orders and Payment Records show pending item counts
4. **Buyer Badges** - Quotations, Proforma Invoices, and Orders show update counts
5. **Auto-refresh** - Counts poll every 30 seconds for real-time updates
6. **Mark as Viewed** - Clicking menu item resets badge count for that section
7. **localStorage Timestamps** - Tracks last viewed time per category

**Invoice Generation from Dispatch**
1. **Dispatch & Generate Invoice** - Single action to dispatch and create invoice
2. **Shipping Details** - HSN Code, AWB Number, Shipping By fields during dispatch
3. **Editable Invoice Number** - Custom invoice number input with auto-generation
4. **Shipping Provider Autocomplete** - Common carriers (FedEx, DHL, UPS, etc.)
5. **Generate Invoice Toggle** - Option to dispatch with or without invoice
6. **Invoice Links to Dispatch** - Invoice includes all dispatch/shipping info

**Payment Collection Updates**
1. **PI Exchange Rate** - Payments collected using PI's exchange rate (not editable)
2. **Rate Display** - Shows "(from Proforma Invoice)" indicator
3. **Consistent Conversions** - All calculations use PI's stored rate

**Enhanced Invoices Page**
1. **Date Column** - Invoice date displayed in DD MMM YYYY format
2. **Status Column** - Color-coded status chips (PAID, UNPAID, PARTIAL, CANCELLED)
3. **Status Filter** - Filter invoices by payment status
4. **Buyer Name Display** - Shows buyer_name instead of customer_id
5. **PI Exchange Rate** - INR conversion uses invoice's exchange rate

### Version 2.2 Features

**Purchase Management Module**
1. **Suppliers Page** - Full supplier management with CRUD operations
2. **Supplier Details Modal** - Tabbed view (Info, Bank, Orders, Performance)
3. **PI Allocation Page** - Allocate PI items to suppliers with quantity splitting
4. **Multi-Supplier Support** - Split item quantities across up to 3 suppliers
5. **Individual Supplier POs** - Generate separate PDF purchase orders per supplier
6. **Purchase Dashboard** - Overview metrics for purchase activities
7. **Allocation Progress Tracking** - Visual progress bars and status indicators
8. **localStorage Persistence** - Allocations saved locally for persistence

### Version 2.1 Features
1. **PI Tab-Based Filtering** - All, Paid, Partial, Unpaid, Expired tabs with counts
2. **Paid Tab Dispatch Filter** - Filter by Dispatched/Undispatched within Paid tab
3. **Context-Specific PI Actions** - Buttons shown based on payment status
4. **Enhanced Clone Function** - Resets payment to zero, keeps product info, new PI number
5. **Reactivate Preserves PI Number** - Expired PIs reactivated with same number
6. **Quotation Admin Reject** - Admin can reject quotes with reason
7. **Quotation Edit & Revise** - Edit rejected quotes to create new revision
8. **Add Products to Quotation** - Search and add products during edit
9. **Buyer Quotation Tabs** - Received, Accepted, Rejected, Expired tabs
10. **Revision History Modal** - View full revision timeline for quotations
11. **Email Sent Confirmation** - Shows email sent confirmation after Save & Send
12. **Full-Width PI Tabs** - Clean, professional tab layout
13. **Expiry Date Display** - Unpaid tab shows expiry date alongside issue date with expired indicator
14. **Editable Expiry Date** - Edit PI dialog allows changing the validity/expiry date
15. **Save and Send Button** - Edit PI uses "Save and Send" to indicate email notification
16. **Simplified Expired Tab** - Expired PIs show only View and Reactivate actions

### Version 2.0 Features
1. **Manual USD/INR per document** - Each document stores its own exchange rate
2. **Terms & Conditions for PI** - Editable T&C with validity periods
3. **Invoice series skip/reserve** - Reserve invoice numbers for later use
4. **Quotation revision history** - Track changes through revisions
5. **Bank info on PI & payments** - Display bank details for payments
6. **Three invoice types** - Tax Invoice, Reimbursement, Bill of Supply
7. **Editable PI items** - Add/remove/edit items with live calculation
8. **PI renew/clone/reactivate** - Lifecycle management for expired PIs
9. **Dispatch without payment** - Project-based dispatch option
10. **Quotation clone/renew** - Clone and reactivate quotations
11. **Email simulation** - Preview emails before sending (simulated)
