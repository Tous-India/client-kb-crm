import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { NotificationCountsProvider } from "./context/NotificationCountsContext";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Import Admin Components
import AdminLayout from "./admin/layout/AdminLayout.jsx";
import AdminDashboard from "./admin/pages/Dashboard.jsx";
import AdminPurchaseOrders from "./admin/pages/PurchaseOrders.jsx";
import AdminPayments from "./admin/pages/Payments.jsx";
import AdminOrders from "./admin/pages/Orders.jsx";
import AdminInvoices from "./admin/pages/Invoices.jsx";
import AdminPerformaInvoices from "./admin/pages/PerformaInvoices.jsx";
import AdminStatements from "./admin/pages/Statements.jsx";
import AdminBuyerTransactions from "./admin/pages/BuyerTransactions.jsx";
import AdminDispatchedOrders from "./admin/pages/DispatchedOrders.jsx";
import AdminProducts from "./admin/pages/Products.jsx";
import AdminAddEditProduct from "./admin/pages/AddEditProduct.jsx";
import AdminUsers from "./admin/pages/Users.jsx";
import AdminManualInvoice from "./admin/pages/ManualInvoice.jsx";
import AdminSuppliers from "./admin/pages/Suppliers.jsx";
import AdminPIAllocation from "./admin/pages/PIAllocation.jsx";
import AdminPurchaseDashboard from "./admin/pages/PurchaseDashboard.jsx";
import AdminCategories from "./admin/pages/Categories.jsx";
import AdminBrands from "./admin/pages/Brands.jsx";
import AdminQuotations from "./admin/pages/Quotations.jsx";
import AdminPaymentRecords from "./admin/pages/PaymentRecords.jsx";
import AdminArchives from "./admin/pages/Archives.jsx";

// Import Buyer Components
import BuyerLayout from "./buyer/layout/BuyerLayout.jsx";
import BuyerDashboard from "./buyer/pages/Dashboard.jsx";
import BuyerProducts from "./buyer/pages/Products.jsx";
import BuyerSingleProduct from "./buyer/pages/SingleProduct.jsx";
import BuyerCart from "./buyer/pages/Cart.jsx";
import BuyerInvoices from "./buyer/pages/Invoices.jsx";
import BuyerStatements from "./buyer/pages/Statements.jsx";
import BuyerProfile from "./buyer/pages/Profile.jsx";
import BuyerWebOrders from "./buyer/pages/WebOrders.jsx";
import BuyerQuote from "./buyer/pages/Quote.jsx";
import BuyerOpenOrders from "./buyer/pages/OpenOrders.jsx";
import BuyerShipments from "./buyer/pages/Shipments.jsx";
import BuyerEightyOneThirty from "./buyer/pages/8130.jsx";
import BuyerMultiSearchEngine from "./buyer/pages/MultiSearchEngine.jsx";
import BuyerProformaInvoices from "./buyer/pages/ProformaInvoices.jsx";
import BuyerQuoteRequest from "./buyer/pages/QuoteRequest.jsx";

// Import Auth Components
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Import Admin Pending Approvals
import AdminPendingApprovals from "./admin/pages/PendingApprovals.jsx";

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1890ff",
    },
    secondary: {
      main: "#52c41a",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Routes - Protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<AdminDashboard />} />
        <Route path="purchase-orders" element={<AdminPurchaseOrders />} />
        <Route path="quotations" element={<AdminQuotations />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="performa-invoices" element={<AdminPerformaInvoices />} />
        <Route path="payment-records" element={<AdminPaymentRecords />} />
        <Route path="statements" element={<AdminStatements />} />
        <Route path="buyer-transactions/:customerId" element={<AdminBuyerTransactions />} />
        <Route path="dispatched-orders" element={<AdminDispatchedOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AdminAddEditProduct />} />
        <Route path="products/edit/:id" element={<AdminAddEditProduct />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="pending-approvals" element={<AdminPendingApprovals />} />
        <Route path="manual-invoice" element={<AdminManualInvoice />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
        <Route path="pi-allocation" element={<AdminPIAllocation />} />
        <Route path="purchase-dashboard" element={<AdminPurchaseDashboard />} />
        <Route path="archives" element={<AdminArchives />} />
      </Route>

      {/* Buyer Routes - Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["BUYER", "ADMIN"]}>
            <BuyerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<BuyerDashboard />} />
        <Route path="products" element={<BuyerProducts />} />
        <Route path="products/:id" element={<BuyerSingleProduct />} />
        <Route path="cart" element={<BuyerCart />} />
        <Route path="web-orders" element={<BuyerWebOrders />} />
        <Route path="quote" element={<BuyerQuote />} />
        <Route path="quote-request" element={<BuyerQuoteRequest />} />
        <Route path="proforma-invoices" element={<BuyerProformaInvoices />} />
        <Route path="open-orders" element={<BuyerOpenOrders />} />
        <Route path="shipments" element={<BuyerShipments />} />
        <Route path="invoices" element={<BuyerInvoices />} />
        <Route path="statements" element={<BuyerStatements />} />
        <Route path="8130" element={<BuyerEightyOneThirty />} />
        <Route path="multi-search" element={<BuyerMultiSearchEngine />} />
        <Route path="profile" element={<BuyerProfile />} />
      </Route>

      {/* 404 Not Found Route - Must be last */}
      <Route path="*" element={<NotFound />} />
    </>
  )
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <NotificationCountsProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
              <RouterProvider router={router} />
            </ThemeProvider>
          </NotificationCountsProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
