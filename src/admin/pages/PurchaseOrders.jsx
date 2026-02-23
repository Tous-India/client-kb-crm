import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Stack,
  Alert,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Tabs,
  Tab,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  ShoppingCart,
  Description,
  CheckCircle,
  Search,
  Visibility,
  Person,
  Email,
  Close,
  Print,
  Refresh,
  NotificationsActive,
  HourglassEmpty,
  SwapHoriz,
  ContentCopy,
  Add,
  Delete,
} from "@mui/icons-material";
import { ordersService } from "../../services";
import { useCurrency } from "../../context/CurrencyContext";
import PurchaseOrderPrintPreview from "../components/PurchaseOrderPrintPreview";
import useNotificationStore from "../../stores/useNotificationStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30000;

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`orders-tabpanel-${index}`}
      aria-labelledby={`orders-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function PurchaseOrders() {
  const navigate = useNavigate();
  const { usdToInr } = useCurrency();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showViewItemsModal, setShowViewItemsModal] = useState(false);
  const [showPOPreview, setShowPOPreview] = useState(false);
  const [printPO, setPrintPO] = useState(null);
  const printRef = useRef(null);

  // Clone order state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneData, setCloneData] = useState(null);
  const [cloneLoading, setCloneLoading] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notification store and snackbar state
  const { addNotification } = useNotificationStore();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const knownOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Pagination and filter state for Pending Orders
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingRowsPerPage, setPendingRowsPerPage] = useState(10);
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");

  // Pagination and filter state for Converted/Quoted Orders
  const [convertedPage, setConvertedPage] = useState(0);
  const [convertedRowsPerPage, setConvertedRowsPerPage] = useState(10);
  const [convertedSearchTerm, setConvertedSearchTerm] = useState("");

  // Fetch orders from API
  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await ordersService.getAll();
      if (result.success) {
        const orders = result.data || [];

        // Check for new orders (for notifications)
        if (!isInitialLoadRef.current) {
          const newOrders = orders.filter(
            (order) =>
              order.status === "PENDING" &&
              !knownOrderIdsRef.current.has(order._id)
          );

          newOrders.forEach((order) => {
            const notification = {
              type: "NEW_ORDER",
              title: "New Quote Request",
              message: `${order.customer_name || "A buyer"} submitted a new quote request (${order.po_number || order.order_id})`,
              priority: order.priority || "NORMAL",
              requestId: order.po_number || order.order_id,
              buyerName: order.customer_name,
            };
            addNotification(notification);
            setSnackbar({
              open: true,
              message: `New quote request from ${order.customer_name || "buyer"}!`,
              severity: "info",
            });
          });
        }

        // Update known order IDs
        orders.forEach((order) => knownOrderIdsRef.current.add(order._id));
        isInitialLoadRef.current = false;

        setPurchaseOrders(orders);
      } else {
        setError(result.error || "Failed to fetch orders");
        toast.error(result.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("[PurchaseOrders] Error fetching:", err);
      setError(err.message || "Failed to fetch orders");
      toast.error(err.message || "Failed to fetch orders");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchOrders();

    // Set up polling for new orders
    const pollInterval = setInterval(() => {
      fetchOrders(false);
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [fetchOrders]);

  // Filter orders by status
  const pendingOrders = purchaseOrders.filter((po) => po.status === "PENDING");
  const convertedOrders = purchaseOrders.filter((po) =>
    po.status === "QUOTED" || po.status === "CONVERTED"
  );

  // Search filter
  const filterBySearch = (orders, searchTerm) => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter((po) =>
      po.po_number?.toLowerCase().includes(term) ||
      po.order_id?.toLowerCase().includes(term) ||
      po.customer_name?.toLowerCase().includes(term) ||
      po.customer_email?.toLowerCase().includes(term) ||
      po.items?.some((item) =>
        item.product_name?.toLowerCase().includes(term) ||
        item.part_number?.toLowerCase().includes(term)
      )
    );
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // View order items
  const handleViewItems = (po) => {
    setSelectedPO(po);
    setShowViewItemsModal(true);
  };

  // Print order
  const handlePrintPO = (po) => {
    setPrintPO(po);
    setShowPOPreview(true);
  };

  // Navigate to quotations page to create quote
  const handleCreateQuotation = (po) => {
    // Navigate to quotations page with order data
    navigate("/admin/quotations", { state: { orderToConvert: po } });
  };

  // Print functionality
  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Order - ${printPO?.po_number || printPO?.order_id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
    }
  };

  // Generate new PO number
  const generatePONumber = () => {
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `PO${year}${random}`;
  };

  // Handle clone order
  const handleCloneOrder = (po) => {
    const newPONumber = generatePONumber();
    const defaultExchangeRate = usdToInr || 83.5;
    setCloneData({
      originalPO: po,
      po_number: newPONumber,
      customer_id: po.customer_id,
      customer_name: po.customer_name,
      customer_email: po.customer_email,
      priority: po.priority || "NORMAL",
      customer_notes: po.customer_notes || "",
      internal_notes: "",
      exchange_rate: defaultExchangeRate,
      expiry_days: 30,
      logistic_charges: 0,
      custom_duty: 0,
      bank_charges: 0,
      other_charges: 0,
      items: po.items?.map((item) => ({
        ...item,
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
      })) || [],
    });
    setShowCloneModal(true);
  };

  // Update clone item
  const updateCloneItem = (index, field, value) => {
    setCloneData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]:
                field === "quantity"
                  ? parseInt(value) || 0
                  : field === "unit_price"
                  ? parseFloat(value) || 0
                  : value,
            }
          : item
      ),
    }));
  };

  // Add item to clone
  const addCloneItem = () => {
    setCloneData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: "",
          product_name: "",
          part_number: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    }));
  };

  // Calculate clone totals
  const calculateCloneTotals = () => {
    if (!cloneData) return { subtotal: 0, charges: 0, total: 0 };
    let subtotal = 0;
    cloneData.items.forEach((item) => {
      subtotal += (item.unit_price || 0) * (item.quantity || 0);
    });
    const charges =
      (cloneData.logistic_charges || 0) +
      (cloneData.custom_duty || 0) +
      (cloneData.bank_charges || 0) +
      (cloneData.other_charges || 0);
    return { subtotal, charges, total: subtotal + charges };
  };

  // Remove item from clone
  const removeCloneItem = (index) => {
    setCloneData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  // Submit cloned order
  const handleSubmitClone = async () => {
    if (!cloneData || cloneData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setCloneLoading(true);
    const totals = calculateCloneTotals();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (cloneData.expiry_days || 30));

    try {
      const orderData = {
        po_number: cloneData.po_number,
        customer_id: cloneData.customer_id,
        customer_name: cloneData.customer_name,
        customer_email: cloneData.customer_email,
        priority: cloneData.priority,
        customer_notes: cloneData.customer_notes,
        internal_notes: cloneData.internal_notes,
        exchange_rate: cloneData.exchange_rate,
        expiry_date: expiryDate.toISOString(),
        items: cloneData.items
          .filter((item) => item.product_name && item.quantity > 0)
          .map((item) => ({
            ...item,
            total_price: (item.unit_price || 0) * (item.quantity || 0),
          })),
        subtotal: totals.subtotal,
        logistic_charges: cloneData.logistic_charges,
        custom_duty: cloneData.custom_duty,
        bank_charges: cloneData.bank_charges,
        other_charges: cloneData.other_charges,
        total_amount: totals.total,
        status: "PENDING",
        order_type: "QUOTE_REQUEST",
        cloned_from: cloneData.originalPO?.po_number || cloneData.originalPO?.order_id,
      };

      const result = await ordersService.create(orderData);
      if (result.success) {
        toast.success(`Order ${cloneData.po_number} created successfully`);
        setShowCloneModal(false);
        setCloneData(null);
        fetchOrders();
        setActiveTab(0); // Switch to Pending tab to see new order
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (err) {
      console.error("[PurchaseOrders] Error cloning:", err);
      toast.error(err.message || "Failed to create order");
    } finally {
      setCloneLoading(false);
    }
  };

  // Get status chip
  const getStatusChip = (status) => {
    const statusConfig = {
      PENDING: { color: "warning", icon: <HourglassEmpty sx={{ fontSize: "14px !important" }} />, label: "Pending" },
      QUOTED: { color: "info", icon: <Description sx={{ fontSize: "14px !important" }} />, label: "Quoted" },
      CONVERTED: { color: "success", icon: <SwapHoriz sx={{ fontSize: "14px !important" }} />, label: "Converted" },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        color={config.color}
        sx={{ fontSize: "11px", height: "22px" }}
      />
    );
  };

  // Render order row
  const renderOrderRow = (po, showCreateQuoteButton = false, showCloneButton = false) => {
    return (
      <TableRow key={po._id} hover>
        {/* PO Number & Date */}
        <TableCell sx={{ fontSize: "13px" }}>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "13px" }}>
            {po.po_number || po.order_id}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(po.createdAt || po.order_date)}
          </Typography>
        </TableCell>

        {/* Customer */}
        <TableCell sx={{ fontSize: "13px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
            <Box>
              <Typography variant="body2" sx={{ fontSize: "13px" }}>
                {po.customer_name || "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {po.customer_email || "-"}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        {/* Items */}
        <TableCell sx={{ fontSize: "13px" }}>
          <Typography variant="body2" sx={{ fontSize: "13px" }}>
            {po.items?.length || 0} items
          </Typography>
          {po.items?.slice(0, 2).map((item, idx) => (
            <Typography key={idx} variant="caption" display="block" color="text.secondary">
              {item.product_name?.substring(0, 25)}...
            </Typography>
          ))}
          {po.items?.length > 2 && (
            <Typography variant="caption" color="primary">
              +{po.items.length - 2} more
            </Typography>
          )}
        </TableCell>

        {/* Priority */}
        <TableCell sx={{ fontSize: "13px" }}>
          {po.priority && (
            <Chip
              label={po.priority}
              size="small"
              color={po.priority === "HIGH" ? "error" : po.priority === "NORMAL" ? "primary" : "default"}
              sx={{ fontSize: "10px", height: "20px" }}
            />
          )}
        </TableCell>

        {/* Status */}
        <TableCell sx={{ fontSize: "13px" }}>
          {getStatusChip(po.status)}
          {po.converted_to_quote_id && (
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              Quote: {po.converted_to_quote_id}
            </Typography>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="View Items">
              <IconButton size="small" onClick={() => handleViewItems(po)}>
                <Visibility sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => handlePrintPO(po)}>
                <Print sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            {showCloneButton && (
              <Tooltip title="Clone Order">
                <IconButton size="small" onClick={() => handleCloneOrder(po)} color="primary">
                  <ContentCopy sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {showCreateQuoteButton && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleCreateQuotation(po)}
                sx={{ ml: 1, fontSize: "11px", textTransform: "none" }}
              >
                Create Quote
              </Button>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  // Render table
  const renderTable = (orders, searchTerm, page, rowsPerPage, setPage, setRowsPerPage, showCreateQuoteButton = false, showCloneButton = false) => {
    const filteredOrders = filterBySearch(orders, searchTerm);
    const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (filteredOrders.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No orders found{searchTerm ? " matching your search" : ""}.
        </Alert>
      );
    }

    return (
      <>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>PO #</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Items</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.map((po) => renderOrderRow(po, showCreateQuoteButton, showCloneButton))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredOrders.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ "& .MuiTablePagination-select, & .MuiTablePagination-displayedRows": { fontSize: "13px" } }}
        />
      </>
    );
  };

  // Stats
  const stats = [
    { label: "Pending", count: pendingOrders.length, color: "#ff9800", icon: <HourglassEmpty /> },
    { label: "Quoted/Converted", count: convertedOrders.length, color: "#4caf50", icon: <CheckCircle /> },
    { label: "Total", count: purchaseOrders.length, color: "#2196f3", icon: <ShoppingCart /> },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b0c1a] mb-1">Purchase Orders</h1>
            <p className="text-gray-600 text-sm">
              View and manage incoming quote requests from buyers
            </p>
          </div>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => fetchOrders()}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 6, sm: 4 }} key={stat.label}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: stat.color }}>
                  {stat.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Loading State */}
      {loading && purchaseOrders.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      {!loading && (
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": { textTransform: "none", minWidth: 120, fontSize: "13px" },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <HourglassEmpty sx={{ fontSize: 18, color: "warning.main" }} />
                  Pending ({pendingOrders.length})
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: "success.main" }} />
                  Quoted/Converted ({convertedOrders.length})
                </Box>
              }
            />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {/* Pending Orders Tab */}
            <TabPanel value={activeTab} index={0}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by PO number, customer name, product..."
                value={pendingSearchTerm}
                onChange={(e) => setPendingSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& input": { fontSize: "13px" } }}
              />
              {renderTable(
                pendingOrders,
                pendingSearchTerm,
                pendingPage,
                pendingRowsPerPage,
                setPendingPage,
                setPendingRowsPerPage,
                true // Show "Create Quote" button
              )}
            </TabPanel>

            {/* Converted Orders Tab */}
            <TabPanel value={activeTab} index={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by PO number, customer name, product..."
                value={convertedSearchTerm}
                onChange={(e) => setConvertedSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& input": { fontSize: "13px" } }}
              />
              {renderTable(
                convertedOrders,
                convertedSearchTerm,
                convertedPage,
                convertedRowsPerPage,
                setConvertedPage,
                setConvertedRowsPerPage,
                false, // No "Create Quote" button for already converted
                true // Show "Clone" button
              )}
            </TabPanel>
          </Box>
        </Paper>
      )}

      {/* View Items Modal */}
      <Dialog
        open={showViewItemsModal}
        onClose={() => setShowViewItemsModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPO?.po_number || selectedPO?.order_id}
              </Typography>
            </Box>
            {selectedPO && getStatusChip(selectedPO.status)}
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedPO && (
            <Stack spacing={3}>
              {/* Customer Info */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Customer Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">
                        {selectedPO.customer_name || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">
                        {selectedPO.customer_email || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Items Table */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Items ({selectedPO.items?.length || 0})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPO.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: "12px" }}>
                            <Typography variant="body2" sx={{ fontSize: "12px" }}>
                              {item.product_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.part_number} | {item.product_id}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: "12px" }}>
                            {item.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Customer Notes */}
              {selectedPO.customer_notes && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Customer Notes
                  </Typography>
                  <Typography variant="body2">{selectedPO.customer_notes}</Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button onClick={() => setShowViewItemsModal(false)} variant="outlined">
            Close
          </Button>
          {selectedPO?.status === "PENDING" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setShowViewItemsModal(false);
                handleCreateQuotation(selectedPO);
              }}
            >
              Create Quotation
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Print Preview Modal */}
      <Dialog
        open={showPOPreview}
        onClose={() => setShowPOPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          Print Preview - {printPO?.po_number || printPO?.order_id}
        </DialogTitle>
        <DialogContent>
          {printPO && (
            <div ref={printRef}>
              <PurchaseOrderPrintPreview order={printPO} />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowPOPreview(false)} variant="outlined">
            Close
          </Button>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          icon={<NotificationsActive />}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Clone Order Modal */}
      <Dialog
        open={showCloneModal}
        onClose={() => !cloneLoading && setShowCloneModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, minHeight: "80vh" } }}
      >
        <DialogTitle sx={{ pb: 1, bgcolor: "primary.50" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ContentCopy color="primary" /> Clone Order
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creating from: {cloneData?.originalPO?.po_number || cloneData?.originalPO?.order_id}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowCloneModal(false)}
              disabled={cloneLoading}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {cloneData && (
            <Stack spacing={3}>
              {/* Order Settings */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Order Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="New PO Number"
                      value={cloneData.po_number}
                      onChange={(e) => setCloneData({ ...cloneData, po_number: e.target.value })}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Priority"
                      select
                      value={cloneData.priority}
                      onChange={(e) => setCloneData({ ...cloneData, priority: e.target.value })}
                      SelectProps={{ native: true }}
                      sx={{ "& select": { fontSize: "13px" } }}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exchange Rate (1 USD = ₹)"
                      type="number"
                      value={cloneData.exchange_rate}
                      onChange={(e) => setCloneData({ ...cloneData, exchange_rate: parseFloat(e.target.value) || 83.5 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Validity (Days)"
                      type="number"
                      value={cloneData.expiry_days}
                      onChange={(e) => setCloneData({ ...cloneData, expiry_days: parseInt(e.target.value) || 30 })}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Customer Info (Read-only) */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Customer (Same as Original)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{cloneData.customer_name}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{cloneData.customer_email}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Items with Prices */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Items ({cloneData.items.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={addCloneItem}
                    sx={{ textTransform: "none", fontSize: "12px" }}
                  >
                    Add Item
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Product Name</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Part Number</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px", width: 90 }} align="center">Qty</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px", width: 130 }} align="right">Unit Price (USD)</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px", width: 130 }} align="right">Unit Price (INR)</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px", width: 110 }} align="right">Total (USD)</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px", width: 50 }} align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cloneData.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.product_name}
                              onChange={(e) => updateCloneItem(idx, "product_name", e.target.value)}
                              placeholder="Product name"
                              sx={{ "& input": { fontSize: "12px" } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.part_number}
                              onChange={(e) => updateCloneItem(idx, "part_number", e.target.value)}
                              placeholder="Part number"
                              sx={{ "& input": { fontSize: "12px" } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCloneItem(idx, "quantity", e.target.value)}
                              inputProps={{ min: 1, style: { textAlign: "center", fontSize: "12px" } }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.unit_price || 0}
                              onChange={(e) => updateCloneItem(idx, "unit_price", e.target.value)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              sx={{ width: 120, "& input": { fontSize: "12px", textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontSize: "12px", color: "text.secondary" }}>
                              ₹{((item.unit_price || 0) * cloneData.exchange_rate).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontSize: "12px", fontWeight: "bold" }}>
                              ${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeCloneItem(idx)}
                              disabled={cloneData.items.length === 1}
                            >
                              <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Additional Charges */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Additional Charges (USD)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Logistics"
                      type="number"
                      value={cloneData.logistic_charges}
                      onChange={(e) => setCloneData({ ...cloneData, logistic_charges: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Duty"
                      type="number"
                      value={cloneData.custom_duty}
                      onChange={(e) => setCloneData({ ...cloneData, custom_duty: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Bank Charges"
                      type="number"
                      value={cloneData.bank_charges}
                      onChange={(e) => setCloneData({ ...cloneData, bank_charges: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Other Charges"
                      type="number"
                      value={cloneData.other_charges}
                      onChange={(e) => setCloneData({ ...cloneData, other_charges: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ "& input": { fontSize: "13px" } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Notes */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Customer Notes
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={cloneData.customer_notes}
                      onChange={(e) => setCloneData({ ...cloneData, customer_notes: e.target.value })}
                      placeholder="Notes visible to customer..."
                      sx={{ "& textarea": { fontSize: "13px" } }}
                    />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Internal Notes
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={cloneData.internal_notes}
                      onChange={(e) => setCloneData({ ...cloneData, internal_notes: e.target.value })}
                      placeholder="Internal notes (not visible to customer)..."
                      sx={{ "& textarea": { fontSize: "13px" } }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {/* Totals */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "primary.50" }}>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${calculateCloneTotals().subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Additional Charges:</Typography>
                    <Typography variant="body2">${calculateCloneTotals().charges.toFixed(2)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" fontWeight="bold">Grand Total (USD):</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                      ${calculateCloneTotals().total.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Grand Total (INR):</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      ₹{(calculateCloneTotals().total * cloneData.exchange_rate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button
            onClick={() => setShowCloneModal(false)}
            variant="outlined"
            disabled={cloneLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitClone}
            disabled={cloneLoading}
            startIcon={cloneLoading ? <CircularProgress size={16} /> : <ContentCopy />}
          >
            {cloneLoading ? "Creating..." : "Create Cloned Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default PurchaseOrders;
