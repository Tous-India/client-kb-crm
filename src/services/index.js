/**
 * Services Index
 * Export all services from a single entry point
 */

// API Configuration & Client
export { default as apiClient } from './api/client';
export { ENDPOINTS } from './api/endpoints';
export { API_CONFIG, USE_MOCK_DATA } from './api/config';

// Auth Service
export { default as authService } from './auth.service';

// Purchase Management Services
export { default as suppliersService } from './suppliers.service';
export { default as piAllocationsService } from './piAllocations.service';
export { default as purchaseDashboardService } from './purchaseDashboard.service';
export { default as proformaInvoicesService } from './proformaInvoices.service';
export { default as supplierOrdersService } from './supplierOrders.service';

// Order Management Services
export { default as ordersService } from './orders.service';
export { default as purchaseOrdersService } from './purchaseOrders.service';
export { default as quotationsService } from './quotations.service';

// Product Management Services
export { default as categoriesService } from './categories.service';
export { default as brandsService } from './brands.service';
export { default as productsService } from './products.service';

// Invoice Services
export { default as invoicesService } from './invoices.service';

// Payment Services
export { default as paymentRecordsService } from './paymentRecords.service';

// Dispatch Services
export { default as dispatchesService } from './dispatches.service';
