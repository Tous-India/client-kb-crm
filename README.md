# KB CRM Frontend

React-based Customer Relationship Management (CRM) application with admin portal, buyer portal, product management, order processing, and financial tracking.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool & dev server |
| MUI (Material UI) | 7.x | Component library |
| MUI X Data Grid | 8.x | Advanced data tables |
| Tailwind CSS | 4.x | Utility-first CSS |
| React Router | 7.x | Client-side routing |
| TanStack React Query | 5.x | Data fetching & caching |
| Zustand | 5.x | State management |
| Axios | 1.x | HTTP client |
| html2pdf.js | 0.12.x | PDF export |
| react-toastify | 10.x | Toast notifications |
| Lucide React | 0.562.x | Icons |
| Vitest | 4.x | Testing framework |

---

## Project Structure

```
frontend2/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
│
├── public/
│   ├── kb.jpg                    # Company logo
│   ├── bg.webp                   # Background image
│   └── login.webp                # Login page image
│
└── src/
    ├── App.jsx                   # Root component with routing
    ├── main.jsx                  # Entry point
    ├── index.css                 # Global styles
    │
    ├── admin/                    # Admin Portal
    │   ├── layout/
    │   │   └── AdminLayout.jsx   # Admin layout with sidebar, header, notifications
    │   │
    │   ├── pages/                # 25+ Admin pages
    │   │   ├── Dashboard.jsx
    │   │   ├── Users.jsx
    │   │   ├── PendingApprovals.jsx
    │   │   ├── Products.jsx
    │   │   ├── AddEditProduct.jsx
    │   │   ├── Categories.jsx
    │   │   ├── Brands.jsx
    │   │   ├── Quotations.jsx
    │   │   ├── PerformaInvoices.jsx
    │   │   ├── Orders.jsx
    │   │   ├── DispatchedOrders.jsx
    │   │   ├── Invoices.jsx
    │   │   ├── ManualInvoice.jsx
    │   │   ├── Payments.jsx
    │   │   ├── PaymentRecords.jsx
    │   │   ├── Statements.jsx
    │   │   ├── BuyerTransactions.jsx
    │   │   ├── PurchaseOrders.jsx
    │   │   ├── Suppliers.jsx
    │   │   ├── SupplierOrders.jsx
    │   │   ├── PIAllocation.jsx
    │   │   ├── PurchaseDashboard.jsx
    │   │   ├── ProfitAnalysis.jsx
    │   │   └── Archives.jsx
    │   │
    │   └── components/           # Admin-specific components
    │       ├── InvoicePrintPreview.jsx
    │       ├── QuotationPrintPreview.jsx
    │       ├── PerformaInvoicePrintPreview.jsx
    │       ├── DispatchPrintPreview.jsx
    │       ├── StatementPrintPreview.jsx
    │       ├── PurchaseOrderPrintPreview.jsx
    │       ├── InvoicePreview.jsx
    │       ├── EditPIItemsDialog.jsx
    │       ├── SendEmailModal.jsx
    │       ├── EmailPreviewModal.jsx
    │       └── BankDetailsCard.jsx
    │
    ├── buyer/                    # Buyer Portal
    │   ├── layout/
    │   │   ├── BuyerLayout.jsx
    │   │   └── BuyerLayout.css
    │   │
    │   ├── pages/                # 17 Buyer pages
    │   │   ├── Dashboard.jsx
    │   │   ├── Products.jsx
    │   │   ├── SingleProduct.jsx
    │   │   ├── Cart.jsx
    │   │   ├── WebOrders.jsx
    │   │   ├── Quote.jsx
    │   │   ├── QuoteRequest.jsx
    │   │   ├── OpenOrders.jsx
    │   │   ├── Shipments.jsx
    │   │   ├── ProformaInvoices.jsx
    │   │   ├── Invoices.jsx
    │   │   ├── Statements.jsx
    │   │   ├── 8130.jsx
    │   │   ├── MultiSearchEngine.jsx
    │   │   └── Profile.jsx
    │   │
    │   └── components/           # Buyer-specific components
    │       ├── Header.jsx
    │       ├── Sidebar.jsx
    │       ├── PdfModal.jsx
    │       ├── SendInquiryModal.jsx
    │       ├── ContactModal.jsx
    │       ├── Card.jsx
    │       └── CompanyCard.jsx
    │
    ├── pages/                    # Public/Shared pages
    │   ├── AuthPage.jsx          # Combined Login/Register with animations
    │   ├── ForgotPassword.jsx    # Password reset flow
    │   └── NotFound.jsx          # 404 page
    │
    ├── components/               # Shared components
    │   ├── ProtectedRoute.jsx    # Route protection by role
    │   ├── NotificationSettings.jsx
    │   ├── Logo.jsx
    │   ├── LoadingSpinner.jsx
    │   └── ErrorDisplay.jsx
    │
    ├── context/                  # React Context providers
    │   ├── AuthContext.jsx       # Authentication state & methods
    │   ├── CurrencyContext.jsx   # USD/INR conversion rates
    │   └── NotificationCountsContext.jsx
    │
    ├── hooks/                    # Custom React Query hooks
    │   ├── useProducts.js
    │   ├── useOrders.js
    │   ├── useInvoices.js
    │   ├── useQuotations.js
    │   ├── useDispatchedOrders.js
    │   ├── usePurchaseOrders.js
    │   ├── useUsers.js
    │   ├── useDashboard.js
    │   └── useDesktopNotifications.js
    │
    ├── stores/                   # Zustand state stores
    │   ├── useCartStore.js
    │   ├── useProductsStore.js
    │   ├── useUsersStore.js
    │   ├── useInvoicesStore.js
    │   ├── useDispatchedOrdersStore.js
    │   ├── useQuoteRequestStore.js
    │   ├── useNotificationStore.js
    │   └── useArchivesStore.js
    │
    ├── services/                 # API service modules
    │   ├── api/
    │   │   ├── client.js         # Axios instance with interceptors
    │   │   └── endpoints.js      # API endpoint constants
    │   ├── auth.service.js
    │   ├── products.service.js
    │   ├── orders.service.js
    │   ├── invoices.service.js
    │   ├── quotations.service.js
    │   ├── proformaInvoices.service.js
    │   ├── dispatches.service.js
    │   ├── paymentRecords.service.js
    │   ├── suppliers.service.js
    │   ├── piAllocations.service.js
    │   ├── purchaseDashboard.service.js
    │   ├── users.service.js
    │   └── ... (18 total services)
    │
    ├── utils/                    # Utility functions
    │   ├── passwordValidator.js  # Password strength validation
    │   ├── notificationSound.js  # Notification audio
    │   └── toast.js              # Toast helpers
    │
    └── __tests__/                # Test files
        ├── utils/
        ├── stores/
        ├── hooks/
        └── services/
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file for custom API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview   # Preview production build
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:ui` | Run tests with visual UI |

---

## Routing

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `AuthPage` | Login form |
| `/register` | `AuthPage` | Registration wizard |
| `/forgot-password` | `ForgotPassword` | Password reset |

### Admin Routes (Protected)

All routes under `/admin` require `ADMIN` or `SUPER_ADMIN` role.

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | `Dashboard` | Admin dashboard |
| `/admin/users` | `Users` | User management |
| `/admin/pending-approvals` | `PendingApprovals` | Approve/reject registrations |
| `/admin/products` | `Products` | Product catalog |
| `/admin/products/add` | `AddEditProduct` | Add new product |
| `/admin/products/edit/:id` | `AddEditProduct` | Edit product |
| `/admin/categories` | `Categories` | Category management |
| `/admin/brands` | `Brands` | Brand management |
| `/admin/quotations` | `Quotations` | Quotation management (5 tabs) |
| `/admin/performa-invoices` | `PerformaInvoices` | PI management |
| `/admin/orders` | `Orders` | Open orders |
| `/admin/dispatched-orders` | `DispatchedOrders` | Shipped orders |
| `/admin/invoices` | `Invoices` | Invoice list |
| `/admin/manual-invoice` | `ManualInvoice` | Create manual invoice |
| `/admin/payments` | `Payments` | Payment tracking |
| `/admin/payment-records` | `PaymentRecords` | Buyer payments |
| `/admin/statements` | `Statements` | Account statements |
| `/admin/buyer-transactions/:id` | `BuyerTransactions` | Per-buyer history |
| `/admin/purchase-orders` | `PurchaseOrders` | Purchase orders |
| `/admin/suppliers` | `Suppliers` | Supplier management |
| `/admin/pi-allocation` | `PIAllocation` | Allocate PI items |
| `/admin/purchase-dashboard` | `PurchaseDashboard` | Purchase analytics |
| `/admin/profit-analysis` | `ProfitAnalysis` | Profit/loss analysis |
| `/admin/archives` | `Archives` | Archived documents |

### Buyer Routes (Protected)

All routes under `/` require `BUYER` or `ADMIN` role.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Buyer dashboard |
| `/products` | `Products` | Product catalog |
| `/products/:id` | `SingleProduct` | Product details |
| `/cart` | `Cart` | Shopping cart |
| `/web-orders` | `WebOrders` | Order history |
| `/quote` | `Quote` | View quotations |
| `/quote-request` | `QuoteRequest` | Request quotation |
| `/open-orders` | `OpenOrders` | Active orders |
| `/shipments` | `Shipments` | Track shipments |
| `/proforma-invoices` | `ProformaInvoices` | View PIs |
| `/invoices` | `Invoices` | Invoice history |
| `/statements` | `Statements` | Account statements |
| `/8130` | `8130` | 8130 certificates |
| `/multi-search` | `MultiSearchEngine` | Multi-part search |
| `/profile` | `Profile` | User profile |

---

## Key Features

### Authentication Page (AuthPage)

Combined Login/Register page with:
- **Animated toggle** between Login and Register
- **Sliding panel animation** on desktop
- **Responsive design** - separate mobile layout
- **Multi-step registration** (4 steps):
  1. Basic Info (name, email, phone, company)
  2. Email Verification (6-digit OTP)
  3. Create Password (with strength indicator)
  4. Success (pending admin approval)
- **Password strength validation** with requirements checklist

### Quotation Management

5-tab workflow for quotation lifecycle:

| Tab | Status | Available Actions |
|-----|--------|-------------------|
| **Open** | `OPEN` | View, Email, Print, Edit, Clone |
| **Accepted** | `ACCEPTED` | View, Email, Print, Edit, Clone, **Convert to PI** |
| **Rejected** | `REJECTED` | View, Email, Print, Edit, Renew |
| **Expired** | `EXPIRED` | View, Email, Print, Renew, Clone |
| **Converted** | `CONVERTED` | View, Email, Print only |

### PI Allocation

Allocate PI items to multiple suppliers:
- 4 supplier slots per item
- Per-item cost and quantity tracking
- Payment term selection (Advance, COD, 30D, 60D, 90D)
- Real-time profit/margin calculation
- INR conversion with configurable rate
- Download PO per supplier

### Purchase Dashboard

Purchase analytics with:
- Total sales, cost, paid, unpaid stats
- INR conversion display
- Allocation profit summary
- Per-PI profit tracking with supplier breakdown
- Margin percentage indicators

### Print Preview Components

Professional A4-format documents:

| Component | Document | Theme Color |
|-----------|----------|-------------|
| `InvoicePrintPreview` | Invoice | Blue (#1976d2) |
| `QuotationPrintPreview` | Quotation | Orange (#ed6c02) |
| `PerformaInvoicePrintPreview` | PI | Purple (#9c27b0) |
| `DispatchPrintPreview` | Dispatch | Green (#4caf50) |
| `StatementPrintPreview` | Statement | Blue (#1976d2) |
| `PurchaseOrderPrintPreview` | PO | Blue (#1976d2) |

**Features:**
- Dual currency (USD + INR)
- Exchange rate display
- Bank details section
- Authorized signatory
- Print/PDF via browser

---

## State Management

### Context Providers

| Context | Purpose |
|---------|---------|
| `AuthContext` | User authentication, login/logout, token management |
| `CurrencyContext` | USD/INR exchange rate |
| `NotificationCountsContext` | Pending approval/notification counts |

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `useCartStore` | Shopping cart items, quantities |
| `useProductsStore` | Product filters, search, pagination |
| `useUsersStore` | User list filters, search |
| `useInvoicesStore` | Invoice filters |
| `useDispatchedOrdersStore` | Dispatch filters, tracking |
| `useQuoteRequestStore` | Quote request form state |
| `useNotificationStore` | Notification preferences |
| `useArchivesStore` | Archive filters |

### React Query Hooks

| Hook | Purpose |
|------|---------|
| `useProducts` | Product CRUD operations |
| `useOrders` | Order management |
| `useInvoices` | Invoice operations |
| `useQuotations` | Quotation lifecycle |
| `useDispatchedOrders` | Dispatch tracking |
| `usePurchaseOrders` | PO management |
| `useUsers` | User management |
| `useDashboard` | Dashboard stats |
| `useDesktopNotifications` | Browser notifications |

---

## API Services

All services are in `src/services/`:

| Service | Description |
|---------|-------------|
| `auth.service.js` | Login, register, password reset |
| `products.service.js` | Product CRUD |
| `orders.service.js` | Order operations |
| `invoices.service.js` | Invoice management |
| `quotations.service.js` | Quotation lifecycle |
| `proformaInvoices.service.js` | PI operations |
| `dispatches.service.js` | Dispatch tracking |
| `paymentRecords.service.js` | Buyer payments |
| `suppliers.service.js` | Supplier management |
| `piAllocations.service.js` | PI item allocations |
| `purchaseDashboard.service.js` | Purchase analytics |
| `categories.service.js` | Category management |
| `brands.service.js` | Brand management |
| `users.service.js` | User management |
| `dashboard.service.js` | Dashboard stats |
| `supplierOrders.service.js` | Supplier orders |
| `archives.service.js` | Document archiving |

### API Client Configuration

Located in `src/services/api/client.js`:
- Base URL: `http://localhost:5000/api` (or `VITE_API_URL`)
- Automatic JWT token injection
- Response/error interceptors
- 401 handling (redirect to login)

---

## Components

### Shared Components

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Route guard with role checking |
| `NotificationSettings` | Notification preferences |
| `Logo` | Company logo component |
| `LoadingSpinner` | Loading indicator |
| `ErrorDisplay` | Error message display |

### Admin Components

| Component | Purpose |
|-----------|---------|
| `AdminLayout` | Layout with sidebar, header, notifications |
| `InvoicePrintPreview` | Invoice print template |
| `QuotationPrintPreview` | Quotation print template |
| `PerformaInvoicePrintPreview` | PI print template |
| `DispatchPrintPreview` | Dispatch print template |
| `StatementPrintPreview` | Statement print template |
| `EditPIItemsDialog` | Edit PI items modal |
| `SendEmailModal` | Send document via email |
| `BankDetailsCard` | Bank information display |

### Buyer Components

| Component | Purpose |
|-----------|---------|
| `BuyerLayout` | Buyer layout with header, sidebar |
| `Header` | Buyer header with navigation |
| `Sidebar` | Buyer navigation sidebar |
| `PdfModal` | PDF preview modal |
| `SendInquiryModal` | Send inquiry form |
| `ContactModal` | Contact form |
| `Card` | Generic card component |
| `CompanyCard` | Company information card |

---

## Utilities

### Password Validator

`src/utils/passwordValidator.js`

```javascript
import { validatePassword, getStrengthColor, getRequirementItems } from './passwordValidator';

const result = validatePassword('MyPassword123!');
// result = {
//   isValid: true,
//   strength: 5,
//   strengthLabel: 'Strong',
//   requirements: {
//     minLength: true,
//     hasUppercase: true,
//     hasLowercase: true,
//     hasNumber: true,
//     hasSpecial: true
//   }
// }
```

### Toast Notifications

`src/utils/toast.js`

```javascript
import { showSuccess, showError, showWarning, showInfo } from './toast';

showSuccess('Operation successful');
showError('Something went wrong');
showWarning('Please review');
showInfo('Note: ...');
```

---

## Testing

### Run Tests

```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:coverage # With coverage
npm run test:ui       # Visual UI
```

### Test Structure

```
src/__tests__/
├── utils/
│   └── passwordValidator.test.js
├── stores/
│   ├── useProductsStore.test.js
│   ├── useCartStore.test.js
│   ├── useQuoteRequestStore.test.js
│   ├── useDispatchedOrdersStore.test.js
│   └── useNotificationStore.test.js
├── hooks/
└── services/
```

### Testing Libraries

- **Vitest** - Test runner
- **@testing-library/react** - React testing utilities
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment
- **msw** - API mocking

---

## Styling

### MUI Theme

Custom theme in `App.jsx`:

```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#1890ff' },
    secondary: { main: '#52c41a' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});
```

### Global CSS

`src/index.css`:
- Base styles
- Print styles
- Number input spinner removal
- Responsive breakpoints

### Tailwind CSS

Used alongside MUI for utility classes:
- Spacing: `p-4`, `m-2`, `gap-3`
- Flexbox: `flex`, `items-center`, `justify-between`
- Text: `text-sm`, `font-bold`, `text-gray-500`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API URL |

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Performance

- **Code splitting** - Dynamic imports for routes
- **React Query caching** - Automatic request deduplication
- **Zustand** - Minimal re-renders
- **Vite** - Fast HMR and builds

---

## License

Proprietary software owned by KB Enterprises.
