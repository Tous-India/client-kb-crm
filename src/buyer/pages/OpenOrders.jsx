import { useState, useEffect, useCallback } from "react";
import "./OpenOrders.css";
import PdfModal from "../components/PdfModal";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Box,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  LocalShipping,
  CheckCircle,
  Receipt,
  Refresh,
} from "@mui/icons-material";
import { ordersService, proformaInvoicesService } from "../../services";

function OpenOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Orders state - fetched from API
  const [orders, setOrders] = useState([]);

  // Fetch orders and proforma invoices from API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both orders and proforma invoices
      const [ordersResult, pisResult] = await Promise.all([
        ordersService.getMyOrders(),
        proformaInvoicesService.getMyProformas(),
      ]);

      const allItems = [];

      // Process regular orders
      if (ordersResult.success && ordersResult.data) {
        const processedOrders = (ordersResult.data || []).map(order => {
          const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          return {
            ...order,
            id: order._id,
            sourceType: 'ORDER',
            orderNumber: order.order_id,
            orderDate: order.order_date || order.createdAt,
            customerPO: order.po_number || '-',
            itemCount: order.items?.length || 0,
            totalAmount: order.total_amount || 0,
            totalQuantity: order.total_quantity || totalQuantity,
            delivered: order.dispatched_quantity || 0,
            remaining: order.pending_quantity || (totalQuantity - (order.dispatched_quantity || 0)),
            dispatch_history: order.dispatch_history || [],
            status: order.status,
          };
        });
        allItems.push(...processedOrders);
      }

      // Process proforma invoices (main dispatch tracking)
      if (pisResult.success && pisResult.data) {
        const pis = pisResult.data.proformaInvoices || pisResult.data || [];
        const processedPIs = pis.map(pi => {
          const totalQuantity = pi.total_quantity || pi.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          const dispatchedQty = pi.dispatched_quantity || 0;
          const pendingQty = pi.pending_quantity || (totalQuantity - dispatchedQty);

          // Determine status based on dispatch progress
          let status = 'OPEN';
          if (pi.dispatch_status === 'FULL' || dispatchedQty >= totalQuantity) {
            status = 'DISPATCHED';
          } else if (pi.dispatch_status === 'PARTIAL' || dispatchedQty > 0) {
            status = 'PROCESSING';
          }

          return {
            ...pi,
            id: pi._id,
            sourceType: 'PROFORMA_INVOICE',
            orderNumber: pi.proforma_number,
            orderDate: pi.issue_date || pi.createdAt,
            customerPO: pi.quotation_number || pi.po_number || '-',
            itemCount: pi.items?.length || 0,
            totalAmount: pi.total_amount || 0,
            totalQuantity: totalQuantity,
            delivered: dispatchedQty,
            remaining: pendingQty,
            dispatch_history: [],
            dispatch_status: pi.dispatch_status,
            dispatch_count: pi.dispatch_count || 0,
            status: status,
            payment_status: pi.payment_status,
          };
        });
        allItems.push(...processedPIs);
      }

      // Sort by date (newest first)
      allItems.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

      setOrders(allItems);

      if (!ordersResult.success && !pisResult.success) {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      console.error("[OpenOrders] Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders by tab (consider both status and dispatch_status for PIs)
  const openOrders = orders.filter(o => {
    if (o.sourceType === 'PROFORMA_INVOICE') {
      return o.dispatch_status !== 'FULL' && o.remaining > 0;
    }
    return o.status === "OPEN" || o.status === "PROCESSING";
  });
  const completedOrders = orders.filter(o => {
    if (o.sourceType === 'PROFORMA_INVOICE') {
      return o.dispatch_status === 'FULL' || o.remaining === 0;
    }
    return o.status === "DISPATCHED" || o.status === "DELIVERED";
  });
  const currentTabOrders = activeTab === 0 ? openOrders : completedOrders;

  // Apply search and date filters
  const getFilteredOrders = () => {
    let filtered = currentTabOrders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerPO?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate);
        const fromDate = new Date(dateRange.from);
        return orderDate >= fromDate;
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return orderDate <= toDate;
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ from: "", to: "" });
    setCurrentPage(1);
  };

  const handleViewClick = (order) => {
    setSelectedOrder({
      orderNumber: order.orderNumber,
      po: order.customerPO,
      order_date: formatDate(order.orderDate),
      totalAmount: `$${(order.totalAmount || 0).toFixed(2)}`,
      totalQuantity: order.totalQuantity,
      delivered: order.delivered,
      remaining: order.remaining,
      items_count: order.itemCount,
      items: order.items,
      dispatch_history: order.dispatch_history,
      status: order.status,
      sourceType: order.sourceType,
      dispatch_status: order.dispatch_status,
      dispatch_count: order.dispatch_count,
      payment_status: order.payment_status,
    });
    setShowPdfModal(true);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Calculate dispatch progress percentage
  const getDispatchProgress = (order) => {
    if (!order.totalQuantity || order.totalQuantity === 0) return 0;
    return Math.round((order.delivered / order.totalQuantity) * 100);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="open-orders-container">
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </Button>
          <Chip
            label={`Open: ${openOrders.length}`}
            color="warning"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Completed: ${completedOrders.length}`}
            color="success"
            variant="outlined"
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Rows per page</InputLabel>
            <Select
              value={itemsPerPage}
              label="Rows per page"
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <MenuItem value={5}>5 per page</MenuItem>
              <MenuItem value={10}>10 per page</MenuItem>
              <MenuItem value={20}>20 per page</MenuItem>
              <MenuItem value={50}>50 per page</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setCurrentPage(1);
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Open Orders</span>
                <Chip label={openOrders.length} size="small" color="warning" sx={{ height: 20, fontSize: '11px' }} />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Completed</span>
                <Chip label={completedOrders.length} size="small" color="success" sx={{ height: 20, fontSize: '11px' }} />
              </Box>
            }
          />
        </Tabs>
      </Box>

      <div className="filters-section">
        <TextField
          size="small"
          placeholder="Search by Order Number or PO..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          sx={{ flex: 1, minWidth: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          size="small"
          type="date"
          label="From Date"
          value={dateRange.from}
          onChange={(e) => {
            setDateRange({ ...dateRange, from: e.target.value });
            setCurrentPage(1);
          }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
          sx={{ minWidth: 150 }}
        />

        <TextField
          size="small"
          type="date"
          label="To Date"
          value={dateRange.to}
          onChange={(e) => {
            setDateRange({ ...dateRange, to: e.target.value });
            setCurrentPage(1);
          }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
          sx={{ minWidth: 150 }}
        />

        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearIcon />}
          onClick={clearFilters}
          size="small"
        >
          Clear Filters
        </Button>
      </div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ORDER DATE</th>
                <th>ORDER NUMBER</th>
                <th>PO NUMBER</th>
                <th>TOTAL AMOUNT</th>
                <th>TOTAL QTY</th>
                <th>DISPATCHED</th>
                <th>REMAINING</th>
                <th>PROGRESS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <strong>{order.orderNumber}</strong>
                        {order.sourceType === 'PROFORMA_INVOICE' && (
                          <Chip
                            label="PI"
                            size="small"
                            color="primary"
                            sx={{ fontSize: '9px', height: 18, ml: 0.5 }}
                          />
                        )}
                      </Box>
                    </td>
                    <td>
                      <span className="po-link">{order.customerPO}</span>
                    </td>
                    <td className="amount-cell">${(order.totalAmount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{order.totalQuantity}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Chip
                        label={order.delivered}
                        size="small"
                        color={order.delivered > 0 ? "success" : "default"}
                        sx={{ fontWeight: 600, fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Chip
                        label={order.remaining}
                        size="small"
                        color={order.remaining > 0 ? "warning" : "default"}
                        sx={{ fontWeight: 600, fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getDispatchProgress(order)}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          color={order.remaining === 0 ? "success" : "warning"}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 500, minWidth: 30 }}>
                          {getDispatchProgress(order)}%
                        </span>
                      </Box>
                    </td>
                    <td>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {order.status === "DISPATCHED" || order.status === "DELIVERED" || order.dispatch_status === "FULL" ? (
                          <>
                            <Tooltip title="Fully Dispatched">
                              <Chip
                                icon={<LocalShipping sx={{ fontSize: '14px !important' }} />}
                                label="Dispatched"
                                size="small"
                                color="success"
                                sx={{ fontSize: '10px', height: 22 }}
                              />
                            </Tooltip>
                            {(order.dispatch_history?.some(d => d.invoice_generated) || order.invoice_generated) && (
                              <Tooltip title="Invoice Generated">
                                <Chip
                                  icon={<Receipt sx={{ fontSize: '14px !important' }} />}
                                  label="Invoiced"
                                  size="small"
                                  color="primary"
                                  sx={{ fontSize: '10px', height: 22 }}
                                />
                              </Tooltip>
                            )}
                          </>
                        ) : order.delivered > 0 || order.dispatch_status === "PARTIAL" ? (
                          <Tooltip title={`${order.dispatch_count || 1} dispatch(es) made`}>
                            <Chip
                              label="Partial"
                              size="small"
                              color="info"
                              sx={{ fontSize: '10px', height: 22 }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            label="Pending"
                            size="small"
                            color="warning"
                            sx={{ fontSize: '10px', height: 22 }}
                          />
                        )}
                        {/* Payment status for PIs */}
                        {order.sourceType === 'PROFORMA_INVOICE' && order.payment_status && (
                          <Chip
                            label={order.payment_status === 'PAID' ? 'Paid' : order.payment_status === 'PARTIAL' ? 'Part Paid' : 'Unpaid'}
                            size="small"
                            color={order.payment_status === 'PAID' ? 'success' : order.payment_status === 'PARTIAL' ? 'info' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '10px', height: 22 }}
                          />
                        )}
                      </Box>
                    </td>
                    <td>
                      <button className="view-btn" onClick={() => handleViewClick(order)}>
                        <VisibilityIcon sx={{ width: 16, height: 16 }} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-results">
                    {activeTab === 0 ? "No open orders found" : "No completed orders found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-footer">
        <div className="results-info">
          Showing {filteredOrders.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
          {Math.min(indexOfLastItem, filteredOrders.length)} of{" "}
          {filteredOrders.length} orders
        </div>

        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setCurrentPage(value)}
            color="primary"
            showFirstButton
            showLastButton
            siblingCount={1}
            boundaryCount={1}
          />
        )}
      </div>

      {/* PDF Modal */}
      <PdfModal
        isOpen={showPdfModal}
        onClose={handleClosePdfModal}
        orderData={selectedOrder}
        type="po"
      />
    </div>
  );
}

export default OpenOrders;
