/**
 * Centralized API Endpoints Configuration
 * All API endpoints are defined here for easy maintenance
 */

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    ME: '/auth/me',
    // Multi-step registration with OTP verification
    REGISTER_INITIATE: '/auth/register/initiate',
    REGISTER_VERIFY_OTP: '/auth/register/verify-otp',
    REGISTER_COMPLETE: '/auth/register/complete',
    REGISTER_RESEND_OTP: '/auth/register/resend-otp',
    // Forgot password with OTP verification
    FORGOT_PASSWORD_INITIATE: '/auth/forgot-password/initiate',
    FORGOT_PASSWORD_VERIFY_OTP: '/auth/forgot-password/verify-otp',
    FORGOT_PASSWORD_RESET: '/auth/forgot-password/reset',
    FORGOT_PASSWORD_RESEND_OTP: '/auth/forgot-password/resend-otp',
  },

  // Purchase Orders
  PURCHASE_ORDERS: {
    LIST: '/purchase-orders',
    GET: (id) => `/purchase-orders/${id}`,
    CREATE: '/purchase-orders',
    UPDATE: (id) => `/purchase-orders/${id}`,
    DELETE: (id) => `/purchase-orders/${id}`,
    CONVERT_TO_QUOTE: (id) => `/purchase-orders/${id}/convert-to-quote`,
    GET_BY_STATUS: (status) => `/purchase-orders?status=${status}`,
  },

  // Quotations
  QUOTATIONS: {
    LIST: '/quotations',
    GET: (id) => `/quotations/${id}`,
    CREATE: '/quotations',
    UPDATE: (id) => `/quotations/${id}`,
    DELETE: (id) => `/quotations/${id}`,
    MARK_PAID: (id) => `/quotations/${id}/mark-paid`,
    CONVERT_TO_ORDER: (id) => `/quotations/${id}/convert-to-order`,
    RENEW: (id) => `/quotations/${id}/renew`,
    GET_BY_STATUS: (status) => `/quotations?status=${status}`,
    GET_EXPIRED: '/quotations?status=EXPIRED',
    MY_QUOTATIONS: '/quotations/my',
    ACCEPT: (id) => `/quotations/${id}/accept`,
    REJECT: (id) => `/quotations/${id}/reject`,
    SEND_EMAIL: (id) => `/quotations/${id}/send-email`,
    SEND_INQUIRY: (id) => `/quotations/${id}/inquiry`,
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    GET: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id) => `/orders/${id}`,
    DELETE: (id) => `/orders/${id}`,
    DISPATCH: (id) => `/orders/${id}/dispatch`,
    GET_BY_STATUS: (status) => `/orders?status=${status}`,
    // New endpoints for quote request flow
    QUOTE_REQUEST: '/orders/quote-request',
    PENDING: '/orders/pending',
    CONVERT_TO_QUOTATION: (id) => `/orders/${id}/convert-to-quotation`,
    MY_ORDERS: '/orders/my',
    CLONE: (id) => `/orders/${id}/clone`,
  },

  // Web Orders
  WEB_ORDERS: {
    LIST: '/web-orders',
    GET: (id) => `/web-orders/${id}`,
    CREATE: '/web-orders',
    UPDATE: (id) => `/web-orders/${id}`,
    DELETE: (id) => `/web-orders/${id}`,
    GET_BY_STATUS: (status) => `/web-orders?status=${status}`,
  },

  // Invoices
  INVOICES: {
    LIST: '/invoices',
    MY: '/invoices/my',
    GET: (id) => `/invoices/${id}`,
    CREATE: '/invoices',
    CREATE_MANUAL: '/invoices/manual',
    CREATE_FROM_PI: '/invoices/from-pi',
    BY_PI: (piId) => `/invoices/by-pi/${piId}`,
    UPDATE: (id) => `/invoices/${id}`,
    UPDATE_ITEMS: (id) => `/invoices/${id}/items`,
    UPDATE_STATUS: (id) => `/invoices/${id}/status`,
    DELETE: (id) => `/invoices/${id}`,
    DUPLICATE: (id) => `/invoices/${id}/duplicate`,
    PDF: (id) => `/invoices/${id}/pdf`,
    DOWNLOAD: (id) => `/invoices/${id}/download`,
    SEND_EMAIL: (id) => `/invoices/${id}/send-email`,
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    GET: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
    SEARCH: '/products/search',
    GET_BY_CATEGORY: (categoryId) => `/products?categoryId=${categoryId}`,
  },

  // Users
  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    GET_BY_ROLE: (role) => `/users?role=${role}`,
    // Profile endpoints (for current user)
    PROFILE: '/users/profile/me',
    UPDATE_PROFILE: '/users/profile/me',
    CHANGE_PASSWORD: '/users/profile/password',
    // Contact endpoint (send message to admin via CRM)
    CONTACT: '/users/contact',
    // Registration approval endpoints (admin only)
    PENDING_APPROVALS: '/users/pending-approvals',
    PENDING_APPROVALS_COUNT: '/users/pending-approvals/count',
    APPROVE: (id) => `/users/${id}/approve`,
    REJECT: (id) => `/users/${id}/reject`,
    // Status management endpoints
    ACTIVATE: (id) => `/users/${id}/activate`,
    DEACTIVATE: (id) => `/users/${id}/deactivate`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    GET: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  // Brands
  BRANDS: {
    LIST: '/brands',
    GET: (id) => `/brands/${id}`,
    CREATE: '/brands',
    UPDATE: (id) => `/brands/${id}`,
    DELETE: (id) => `/brands/${id}`,
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId) => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId) => `/cart/items/${itemId}`,
    CLEAR: '/cart/clear',
  },

  // Statements
  STATEMENTS: {
    LIST: '/statements',
    GET: (id) => `/statements/${id}`,
    DOWNLOAD: (id) => `/statements/${id}/download`,
  },

  // Suppliers
  SUPPLIERS: {
    LIST: '/suppliers',
    GET: (id) => `/suppliers/${id}`,
    CREATE: '/suppliers',
    UPDATE: (id) => `/suppliers/${id}`,
    DELETE: (id) => `/suppliers/${id}`,
    UPDATE_STATUS: (id) => `/suppliers/${id}/status`,
    STATS: '/suppliers/stats/summary',
    SEARCH: '/suppliers/search',
  },

  // PI Allocations
  PI_ALLOCATIONS: {
    LIST: '/pi-allocations',
    GET: (id) => `/pi-allocations/${id}`,
    GET_BY_PI: (piId) => `/pi-allocations/by-pi/${piId}`,
    CREATE: '/pi-allocations',
    UPDATE: (id) => `/pi-allocations/${id}`,
    DELETE: (id) => `/pi-allocations/${id}`,
    BULK_SAVE: '/pi-allocations/bulk',
    SUMMARY: '/pi-allocations/summary/stats',
    UPDATE_STATUS: (id) => `/pi-allocations/${id}/status`,
    RECEIVE: (id) => `/pi-allocations/${id}/receive`,
  },

  // Purchase Dashboard
  PURCHASE_DASHBOARD: {
    SUMMARY: '/purchase-dashboard/summary',
    SUPPLIER_STATS: '/purchase-dashboard/supplier-stats',
    PENDING_ALLOCATIONS: '/purchase-dashboard/pending-allocations',
    ALLOCATION_PROGRESS: '/purchase-dashboard/allocation-progress',
    RECENT_ACTIVITY: '/purchase-dashboard/recent-activity',
  },

  // Proforma Invoices
  PROFORMA_INVOICES: {
    LIST: '/proforma-invoices',
    MY: '/proforma-invoices/my',
    OPEN: '/proforma-invoices/open', // PIs with remaining items to dispatch
    COMPLETED: '/proforma-invoices/completed', // Fully dispatched PIs
    GET: (id) => `/proforma-invoices/${id}`,
    CREATE: '/proforma-invoices',
    UPDATE: (id) => `/proforma-invoices/${id}`,
    DELETE: (id) => `/proforma-invoices/${id}`,
    APPROVE: (id) => `/proforma-invoices/${id}/approve`,
    REJECT: (id) => `/proforma-invoices/${id}/reject`,
    CONVERT_TO_ORDER: (id) => `/proforma-invoices/${id}/convert-to-order`,
  },

  // Payment Records (Buyer payment submissions for admin verification)
  PAYMENT_RECORDS: {
    LIST: '/payment-records',
    MY: '/payment-records/my',
    PENDING: '/payment-records/pending',
    GET: (id) => `/payment-records/${id}`,
    BY_PI: (piId) => `/payment-records/by-pi/${piId}`,
    CREATE: '/payment-records',
    VERIFY: (id) => `/payment-records/${id}/verify`,
    REJECT: (id) => `/payment-records/${id}/reject`,
    ADMIN_UPDATE: (id) => `/payment-records/${id}/admin-update`,
    ADMIN_COLLECT: '/payment-records/admin-collect',
  },

  // Supplier Orders (SPO)
  SUPPLIER_ORDERS: {
    LIST: '/supplier-orders',
    GET: (id) => `/supplier-orders/${id}`,
    GET_BY_SUPPLIER: (supplierId) => `/supplier-orders/by-supplier/${supplierId}`,
    CREATE: '/supplier-orders',
    UPDATE: (id) => `/supplier-orders/${id}`,
    DELETE: (id) => `/supplier-orders/${id}`,
    UPDATE_STATUS: (id) => `/supplier-orders/${id}/status`,
    ADD_PAYMENT: (id) => `/supplier-orders/${id}/payment`,
    RECEIVE_ITEMS: (id) => `/supplier-orders/${id}/receive`,
    SUMMARY: '/supplier-orders/summary',
  },

  // Dispatches
  DISPATCHES: {
    LIST: '/dispatches',
    MY: '/dispatches/my',
    GET: (id) => `/dispatches/${id}`,
    CREATE: '/dispatches',
    DELETE: (id) => `/dispatches/${id}`,
    BY_SOURCE: (sourceType, sourceId) => `/dispatches/by-source/${sourceType}/${sourceId}`,
    SUMMARY: (sourceType, sourceId) => `/dispatches/summary/${sourceType}/${sourceId}`,
  },

  // Dashboard
  DASHBOARD: {
    // Buyer dashboard
    BUYER_STATS: '/dashboard/buyer-stats',
    BUYER_RECENT_ORDERS: '/dashboard/buyer-recent-orders',
    // Admin dashboard
    SUMMARY: '/dashboard/summary',
    SALES_OVERVIEW: '/dashboard/sales-overview',
    RECENT_ORDERS: '/dashboard/recent-orders',
    PENDING_PAYMENTS: '/dashboard/pending-payments',
    INVENTORY_ALERTS: '/dashboard/inventory-alerts',
    TOP_PRODUCTS: '/dashboard/top-products',
    TOP_BUYERS: '/dashboard/top-buyers',
    ORDER_STATUS_BREAKDOWN: '/dashboard/order-status-breakdown',
    REVENUE_BY_MONTH: '/dashboard/revenue-by-month',
  },

  // Archives (Legacy Data)
  ARCHIVES: {
    LIST: '/archives',
    GET: (id) => `/archives/${id}`,
    CREATE: '/archives',
    UPDATE: (id) => `/archives/${id}`,
    DELETE: (id) => `/archives/${id}`,
    SEARCH: '/archives/search',
    STATS: '/archives/stats',
    BULK_IMPORT: '/archives/bulk',
    FISCAL_YEARS: '/archives/fiscal-years',
    BUYERS: '/archives/buyers',
  },
};

export default ENDPOINTS;
