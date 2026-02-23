# Supplier Management System - Implementation Plan

## Overview

KB Enterprises operates as a **trader** - receiving orders from buyers, then sourcing products from multiple suppliers to fulfill those orders. This system will manage the **purchase side** of operations, tracking which suppliers fulfill which items from customer orders (linked to Proforma Invoices).

---
 
## Business Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER ORDER FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Customer Order → Quotation → Proforma Invoice (PI) → Payment → Dispatch   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PI Items need to be sourced
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPPLIER SOURCING FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PI Item (Qty: 20)                                                          │
│       │                                                                     │
│       ├──► Supplier A (Qty: 10) ──► Supplier PO #SP001                     │
│       │                                                                     │
│       ├──► Supplier B (Qty: 5)  ──► Supplier PO #SP002                     │
│       │                                                                     │
│       └──► Supplier C (Qty: 5)  ──► Supplier PO #SP003                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Scenarios

### Scenario 1: Single PI → Multiple Suppliers
One PI with 5 different items can be sourced from 3 different suppliers based on best pricing/availability.

### Scenario 2: Single Item → Multiple Suppliers
One item with quantity 20 can be split: 10 from Supplier A, 5 from Supplier B, 5 from Supplier C.

### Scenario 3: Multiple PIs → Single Supplier
Multiple PI items can be consolidated into one Supplier Purchase Order for bulk pricing.

---

## System Architecture

### New Pages to Create

| Page | Route | Purpose |
|------|-------|---------|
| Suppliers | `/admin/suppliers` | Manage supplier master data (CRUD) |
| Supplier Purchase Orders | `/admin/supplier-orders` | Create/manage orders to suppliers |
| PI Allocation | `/admin/pi-allocation` | Allocate PI items to suppliers |
| Purchase Dashboard | `/admin/purchase-dashboard` | Overview of all purchase activities |

### New Mock Data Files

| File | Purpose |
|------|---------|
| `suppliers.json` | Supplier master data |
| `supplierOrders.json` | Purchase orders to suppliers |
| `piAllocations.json` | PI item to supplier mapping |

---

## Data Models

### 1. Supplier Master (`suppliers.json`)

```json
{
  "suppliers": [
    {
      "supplier_id": "SUP001",
      "supplier_code": "ATS-MFG",
      "supplier_name": "ATS Manufacturing Co.",
      "supplier_type": "MANUFACTURER",
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
        "gstin": "07CARPR7906M1ZR",
        "pan": "CARPR7906M",
        "registration_no": "REG-2024-001"
      },

      "bank_details": {
        "bank_name": "ICICI Bank Ltd",
        "account_name": "ATS Manufacturing Co.",
        "account_number": "036705501190",
        "ifsc_code": "ICIC0000367",
        "swift_code": "ABORINBB",
        "branch": "SEC 11 ROHINI DELHI"
      },

      "terms": {
        "payment_terms": "Net 30",
        "currency": "USD",
        "credit_limit": 50000.00,
        "credit_used": 12500.00,
        "delivery_terms": "FOB Origin",
        "lead_time_days": 14,
        "minimum_order": 500.00
      },

      "products_supplied": ["PROD001", "PROD002", "PROD008"],

      "performance": {
        "total_orders": 45,
        "total_value": 125000.00,
        "on_time_delivery_rate": 95.5,
        "quality_rating": 4.8,
        "last_order_date": "2025-01-08T10:00:00Z"
      },

      "notes": "Reliable supplier for hydraulic components",
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2025-01-10T14:30:00Z"
    }
  ]
}
```

### 2. Supplier Purchase Orders (`supplierOrders.json`)

```json
{
  "supplierOrders": [
    {
      "spo_id": "SPO-2025-001",
      "spo_number": "SP250001",
      "supplier_id": "SUP001",
      "supplier_name": "ATS Manufacturing Co.",

      "order_date": "2025-01-10T10:00:00Z",
      "expected_delivery": "2025-01-24T00:00:00Z",
      "status": "ORDERED",

      "currency": "USD",
      "exchange_rate": 83.50,

      "items": [
        {
          "item_id": "SPO-ITEM-001",
          "product_id": "PROD001",
          "part_number": "ATS-M1-S5",
          "product_name": "DIE, STR. SHANK 5/32 (M1-K)",
          "quantity": 10,
          "unit_cost": 850.00,
          "total_cost": 8500.00,
          "pi_allocations": [
            {
              "pi_id": "PI-2024-010",
              "pi_number": "PI240010",
              "pi_item_id": "PI-ITEM-001",
              "allocated_qty": 5
            },
            {
              "pi_id": "PI-2024-012",
              "pi_number": "PI240012",
              "pi_item_id": "PI-ITEM-003",
              "allocated_qty": 5
            }
          ]
        }
      ],

      "subtotal": 8500.00,
      "tax": 850.00,
      "shipping": 150.00,
      "total_amount": 9500.00,
      "total_amount_inr": 793250.00,

      "payment_status": "PARTIAL",
      "amount_paid": 4750.00,
      "balance_due": 4750.00,

      "payment_history": [
        {
          "payment_id": "SPAY-001",
          "amount": 4750.00,
          "payment_date": "2025-01-10",
          "payment_method": "WIRE_TRANSFER",
          "reference": "TXN-SPO-001",
          "notes": "50% advance payment"
        }
      ],

      "receiving_status": "PENDING",
      "received_items": [],

      "shipping_address": {
        "street": "Plot No 145, Pocket 25",
        "city": "Rohini",
        "state": "Delhi",
        "zip": "110085",
        "country": "India"
      },

      "notes": "Urgent order for customer PI240010",
      "created_by": "Admin User",
      "created_at": "2025-01-10T10:00:00Z"
    }
  ]
}
```

### 3. PI Allocations (`piAllocations.json`)

```json
{
  "piAllocations": [
    {
      "allocation_id": "ALLOC-001",
      "pi_id": "PI-2024-010",
      "pi_number": "PI240010",
      "pi_item_id": "PI-ITEM-001",
      "product_id": "PROD001",
      "part_number": "ATS-M1-S5",
      "product_name": "DIE, STR. SHANK 5/32 (M1-K)",
      "total_pi_qty": 20,

      "allocations": [
        {
          "supplier_id": "SUP001",
          "supplier_name": "ATS Manufacturing",
          "spo_id": "SPO-2025-001",
          "spo_number": "SP250001",
          "allocated_qty": 10,
          "unit_cost": 850.00,
          "total_cost": 8500.00,
          "status": "ORDERED",
          "expected_date": "2025-01-24",
          "received_qty": 0
        },
        {
          "supplier_id": "SUP002",
          "supplier_name": "Global Parts Inc",
          "spo_id": "SPO-2025-002",
          "spo_number": "SP250002",
          "allocated_qty": 5,
          "unit_cost": 875.00,
          "total_cost": 4375.00,
          "status": "PENDING",
          "expected_date": null,
          "received_qty": 0
        },
        {
          "supplier_id": null,
          "supplier_name": null,
          "spo_id": null,
          "spo_number": null,
          "allocated_qty": 5,
          "unit_cost": null,
          "total_cost": null,
          "status": "UNALLOCATED",
          "expected_date": null,
          "received_qty": 0
        }
      ],

      "summary": {
        "total_qty": 20,
        "allocated_qty": 15,
        "unallocated_qty": 5,
        "ordered_qty": 10,
        "received_qty": 0,
        "allocation_complete": false
      },

      "sell_price": 1032.36,
      "avg_cost_price": 858.33,
      "profit_margin": 16.85,

      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T14:00:00Z"
    }
  ]
}
```

---

## Page Designs

### 1. Suppliers Page (`/admin/suppliers`)

**Features:**
- List all suppliers with search/filter
- Add new supplier (modal/form)
- Edit supplier details
- View supplier performance metrics
- Toggle supplier status (Active/Inactive)

**Table Columns:**
| Code | Name | Type | Contact | Credit Limit | Used | Status | Actions |
|------|------|------|---------|--------------|------|--------|---------|

**Actions:** View | Edit | Orders History | Deactivate

---

### 2. Supplier Purchase Orders (`/admin/supplier-orders`)

**Features:**
- List all supplier POs with filters (Status, Supplier, Date Range)
- Create new Supplier PO
- Link items to PI allocations
- Track payment status
- Track receiving/delivery status
- Print Supplier PO

**Table Columns:**
| SPO # | Supplier | Order Date | Items | Total | Paid | Status | Receiving | Actions |
|-------|----------|------------|-------|-------|------|--------|-----------|---------|

**Statuses:**
- `DRAFT` - Order created but not sent
- `ORDERED` - Order sent to supplier
- `PARTIAL_RECEIVED` - Some items received
- `RECEIVED` - All items received
- `CANCELLED` - Order cancelled

---

### 3. PI Allocation Page (`/admin/pi-allocation`)

**Features:**
- View all PIs with pending allocations
- Allocate PI items to suppliers
- Split quantities across multiple suppliers
- Create Supplier POs from allocations
- Track allocation status per item

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ PI Allocation                                        [Filter ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PI #: PI240010 | Customer: John Smith | Total: $9,646.71   │ │
│ │ Status: APPROVED | Payment: PAID                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ITEMS:                                                          │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Part: ATS-M1-S5 | Qty: 20 | Sell: $1,032.36              │   │
│ │                                                           │   │
│ │ Allocations:                                              │   │
│ │ ┌─────────────────────────────────────────────────────┐   │   │
│ │ │ ✓ SUP001: ATS Mfg    | Qty: 10 | Cost: $850 | ORD  │   │   │
│ │ │ ✓ SUP002: Global Inc | Qty: 5  | Cost: $875 | PND  │   │   │
│ │ │ ○ Unallocated        | Qty: 5  | [+ Add Supplier]  │   │   │
│ │ └─────────────────────────────────────────────────────┘   │   │
│ │                                                           │   │
│ │ Progress: ████████████░░░░ 75% Allocated                  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [Create Supplier PO from Allocations]  [View All Allocations]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Purchase Dashboard (`/admin/purchase-dashboard`)

**Features:**
- Overview metrics (Total Orders, Pending, Received, Value)
- PIs awaiting allocation
- Supplier POs by status
- Recent supplier activities
- Profit margin analysis
- Quick actions (Create PO, View Allocations)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Purchase Dashboard                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ Pending  │ │ Ordered  │ │ Received │ │ Total    │            │
│ │ Orders   │ │ Value    │ │ This Mo  │ │ Suppliers│            │
│ │    12    │ │ $45,230  │ │ $32,100  │ │    18    │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                 │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ PIs Needing Allocation (5)  │ │ Supplier Orders Status      │ │
│ │                             │ │                             │ │
│ │ PI240015 - 3 items pending  │ │ ██████████ Ordered (8)     │ │
│ │ PI240016 - 1 item pending   │ │ ████████   Partial (6)     │ │
│ │ PI240017 - 5 items pending  │ │ ██████     Received (4)    │ │
│ │ ...                         │ │                             │ │
│ └─────────────────────────────┘ └─────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Recent Supplier Activity                                    │ │
│ │                                                             │ │
│ │ • SP250003 received from Global Parts - $12,500           │ │
│ │ • SP250002 shipped - tracking TRK123456                   │ │
│ │ • New PO created for ATS Manufacturing - $8,500           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
frontend2/src/
├── admin/
│   ├── pages/
│   │   ├── Suppliers.jsx              # NEW - Supplier management
│   │   ├── SupplierOrders.jsx         # NEW - Supplier PO management
│   │   ├── PIAllocation.jsx           # NEW - PI item allocation
│   │   └── PurchaseDashboard.jsx      # NEW - Purchase overview
│   │
│   └── components/
│       ├── AddSupplierDialog.jsx      # NEW - Add/Edit supplier modal
│       ├── SupplierPOPrintPreview.jsx # NEW - Supplier PO print
│       ├── AllocationDialog.jsx       # NEW - Allocate items dialog
│       └── CreateSPODialog.jsx        # NEW - Create supplier PO dialog
│
├── mock/
│   ├── suppliers.json                 # NEW - Supplier master data
│   ├── supplierOrders.json            # NEW - Supplier purchase orders
│   └── piAllocations.json             # NEW - PI to supplier mappings
│
└── App.jsx                            # Update routes
```

---

## Navigation Update

Add to AdminLayout sidebar:

```jsx
// New menu section: "Purchase Management"
{
  section: "Purchase Management",
  items: [
    { name: "Dashboard", path: "/admin/purchase-dashboard", icon: <DashboardIcon /> },
    { name: "Suppliers", path: "/admin/suppliers", icon: <BusinessIcon /> },
    { name: "Supplier Orders", path: "/admin/supplier-orders", icon: <ShoppingCartIcon /> },
    { name: "PI Allocation", path: "/admin/pi-allocation", icon: <AssignmentIcon /> },
  ]
}
```

---

## Implementation Steps

### Phase 1: Foundation (Mock Data & Basic Pages)
1. Create `suppliers.json` with sample data
2. Create `supplierOrders.json` with sample data
3. Create `piAllocations.json` with sample data
4. Create `Suppliers.jsx` page with CRUD operations
5. Add routes to `App.jsx`
6. Update AdminLayout navigation

### Phase 2: Supplier Orders
1. Create `SupplierOrders.jsx` page
2. Create `CreateSPODialog.jsx` component
3. Create `SupplierPOPrintPreview.jsx` component
4. Implement payment tracking
5. Implement receiving workflow

### Phase 3: PI Allocation
1. Create `PIAllocation.jsx` page
2. Create `AllocationDialog.jsx` component
3. Link allocations to Supplier Orders
4. Implement split quantity functionality
5. Add progress tracking

### Phase 4: Dashboard & Integration
1. Create `PurchaseDashboard.jsx` page
2. Add metrics calculations
3. Integrate with existing PI pages
4. Add quick actions
5. Implement profit margin tracking

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| Supplier CRUD | Add, edit, view, deactivate suppliers |
| Supplier PO | Create orders to suppliers with item linking |
| PI Allocation | Allocate PI items to suppliers with qty split |
| Payment Tracking | Track payments to suppliers |
| Receiving | Track goods received from suppliers |
| Profit Analysis | Compare sell price vs cost price |
| Dashboard | Overview of all purchase activities |
| Print/Export | Supplier PO print preview |

---

## Status Workflow

### Supplier Order Status Flow:
```
DRAFT → ORDERED → PARTIAL_RECEIVED → RECEIVED
                ↘ CANCELLED
```

### Allocation Status Flow:
```
UNALLOCATED → ALLOCATED → ORDERED → PARTIAL_RECEIVED → RECEIVED
```

---

## Profit Tracking

For each PI item allocation:
- **Sell Price**: Price charged to customer (from PI)
- **Cost Price**: Price paid to supplier (from SPO)
- **Margin**: (Sell - Cost) / Sell × 100

This allows admin to:
- See profit per item
- Compare supplier pricing
- Make informed sourcing decisions

---

## Verification Steps

After implementation:
1. Create a new supplier and verify data saves
2. Create a supplier PO and link to PI items
3. Allocate PI items across multiple suppliers
4. Split single item quantity across suppliers
5. Track payment to supplier
6. Mark items as received
7. Verify profit calculations
8. Print supplier PO document
9. Check dashboard metrics update correctly

---

*Document Version: 1.0*
*Created: February 2025*
*For: KB Enterprises CRM - Supplier Management Module*
