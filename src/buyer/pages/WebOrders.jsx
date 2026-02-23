import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./WebOrders.css";
import productsData from "../../mock/products.json"; // Fallback for edit modal
import PdfModal from "../components/PdfModal";
import { useAuth } from "../../context/AuthContext";
import { useNotificationCounts } from "../../context/NotificationCountsContext";
import { ordersService, productsService } from "../../services";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Stack,
  Tooltip,
  Box,
  Alert,
  Autocomplete,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CloneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  RequestQuote as RequestQuoteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

function WebOrders() {
  const { user } = useAuth();
  const { refreshCounts } = useNotificationCounts();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [isCloneMode, setIsCloneMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [cloneLoading, setCloneLoading] = useState(false);

  // Clone confirmation dialog state
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [orderToClone, setOrderToClone] = useState(null);
  const [cloneNotes, setCloneNotes] = useState("");
  const [cloneItems, setCloneItems] = useState([]);
  const [cloneSelectedProduct, setCloneSelectedProduct] = useState(null);
  const [cloneAddQuantity, setCloneAddQuantity] = useState(1);

  // Products from database for clone dialog
  const [dbProducts, setDbProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch orders for the current logged-in buyer using the /orders/my endpoint
      const result = await ordersService.getMyOrders();

      if (result.success) {
        // Transform API orders to display format
        const userOrders = (result.data || []).map((order) => ({
          _id: order._id, // MongoDB ID for API calls
          web_order_id: order.order_id || order.po_number,
          order_id: order.po_number || order.order_id,
          customer_id: order.customer_id,
          order_date: order.createdAt || order.created_at || order.order_date,
          order_type: order.order_type || "ORDER",
          status: order.status,
          payment_status: order.payment_status || (order.status === "QUOTED" ? "QUOTED" : "PENDING"),
          total_amount: order.total_amount || 0,
          items_count: order.items?.length || 0,
          items: order.items,
          notes: order.customer_notes || order.notes,
          priority: order.priority,
          quote_number: order.converted_to_quote_id,
          buyer_name: order.customer_name,
          isQuoteRequest: order.order_type === "QUOTE_REQUEST" || order.status === "PENDING",
        }));

        // Sort by date (newest first)
        const sortedOrders = userOrders.sort(
          (a, b) => new Date(b.order_date) - new Date(a.order_date)
        );

        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } else {
        setError(result.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("[WebOrders] Error loading orders:", err);
      setError(err.message || "An error occurred while fetching orders");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load user's orders from API
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.order_date);
        const fromDate = new Date(dateRange.from);
        return orderDate >= fromDate;
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.order_date);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return orderDate <= toDate;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.web_order_id?.toLowerCase().includes(search) ||
          order.order_id?.toLowerCase().includes(search) ||
          order.customer_id?.toLowerCase().includes(search) ||
          order.notes?.toLowerCase().includes(search) ||
          order.status?.toLowerCase().includes(search)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, dateRange, orders]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ from: "", to: "" });
  };

  // State for quote request details dialog
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const handleViewClick = (order) => {
    if (order.isQuoteRequest) {
      // Show details dialog for quote requests
      setDetailsOrder(order);
      setShowDetailsDialog(true);
    } else {
      // Show PDF modal for regular orders
      setSelectedOrder(order);
      setShowPdfModal(true);
    }
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrder(null);
  };

  const handleCloseDetailsDialog = () => {
    setShowDetailsDialog(false);
    setDetailsOrder(null);
  };

  // Handle Edit click
  const handleEditClick = (order) => {
    if (order.isQuoteRequest) return; // Don't allow editing quote requests
    setEditingOrder({ ...order });
    setEditItems(order.items?.map((item) => ({ ...item })) || []);
    setIsCloneMode(false);
    setShowEditModal(true);
  };

  // Fetch products from database for clone dialog
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const result = await productsService.getAll();
      if (result.success && result.data?.products) {
        setDbProducts(result.data.products);
      }
    } catch (err) {
      console.error("[WebOrders] Error fetching products:", err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Handle Clone click - show confirmation dialog
  const handleCloneClick = (order) => {
    if (!order._id) {
      setError("Cannot clone this order - missing order ID");
      return;
    }
    setOrderToClone(order);
    setCloneNotes("");
    // Initialize clone items from order items
    setCloneItems(order.items?.map((item) => ({ ...item })) || []);
    setCloneSelectedProduct(null);
    setCloneAddQuantity(1);
    setShowCloneDialog(true);
    // Fetch products from database
    fetchProducts();
  };

  // Close clone confirmation dialog
  const handleCloseCloneDialog = () => {
    setShowCloneDialog(false);
    setOrderToClone(null);
    setCloneNotes("");
    setCloneItems([]);
    setCloneSelectedProduct(null);
    setCloneAddQuantity(1);
    setDbProducts([]);
  };

  // Clone item quantity change
  const handleCloneQuantityChange = (index, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (qty > 0) {
      setCloneItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  // Clone remove item
  const handleCloneRemoveItem = (index) => {
    setCloneItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clone add product
  const handleCloneAddProduct = () => {
    if (cloneSelectedProduct && cloneAddQuantity > 0) {
      // Check if product already exists in items
      const existingIndex = cloneItems.findIndex(
        (item) => item.product_id === cloneSelectedProduct.product_id ||
                  item.part_number === cloneSelectedProduct.part_number
      );

      if (existingIndex !== -1) {
        // Update existing item quantity
        setCloneItems((prev) =>
          prev.map((item, i) =>
            i === existingIndex
              ? { ...item, quantity: item.quantity + cloneAddQuantity }
              : item
          )
        );
      } else {
        // Add new item
        const newItem = {
          product_id: cloneSelectedProduct.product_id,
          part_number: cloneSelectedProduct.part_number,
          product_name: cloneSelectedProduct.product_name,
          quantity: cloneAddQuantity,
        };
        setCloneItems((prev) => [...prev, newItem]);
      }

      // Reset selection
      setCloneSelectedProduct(null);
      setCloneAddQuantity(1);
    }
  };

  // Confirm clone and send for quotation
  const handleConfirmClone = async () => {
    if (!orderToClone?._id || cloneItems.length === 0) {
      setError("Please add at least one item to send for quotation");
      return;
    }

    setCloneLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowCloneDialog(false);

    try {
      // Use submitQuoteRequest with the modified items
      const requestData = {
        customer_id: user?.user_id || orderToClone.customer_id,
        customer_name: user?.name || orderToClone.buyer_name,
        customer_email: user?.email,
        priority: "NORMAL",
        customer_notes: cloneNotes || `Re-order based on ${orderToClone.web_order_id}`,
        items: cloneItems.map((item) => ({
          product_id: item.product_id,
          part_number: item.part_number,
          product_name: item.product_name,
          quantity: item.quantity,
        })),
        total_items: cloneItems.reduce((sum, item) => sum + item.quantity, 0),
        unique_products: cloneItems.length,
      };

      const result = await ordersService.submitQuoteRequest(requestData);

      if (result.success) {
        const newOrder = result.data;
        setSuccessMessage(
          `Quotation request sent successfully! New order number: ${newOrder?.order_id || newOrder?.po_number || "Created"}. We will process your request shortly.`
        );
        // Refresh orders list to show the new order
        await fetchOrders();
        // Refresh notification counts immediately
        refreshCounts();
      } else {
        setError(result.error || "Failed to send quotation request");
      }
    } catch (err) {
      console.error("[WebOrders] Error sending quote request:", err);
      setError(err.message || "An error occurred while sending the quotation request");
    } finally {
      setCloneLoading(false);
      setOrderToClone(null);
      setCloneNotes("");
      setCloneItems([]);
      setCloneSelectedProduct(null);
      setCloneAddQuantity(1);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (index, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (qty > 0) {
      setEditItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: qty,
                total_price: qty * item.unit_price,
              }
            : item
        )
      );
    }
  };

  // Handle remove item
  const handleRemoveItem = (index) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle add product
  const handleAddProduct = () => {
    if (selectedProduct && addQuantity > 0) {
      // Check if product already exists in items
      const existingIndex = editItems.findIndex(
        (item) => item.product_id === selectedProduct.product_id
      );

      if (existingIndex !== -1) {
        // Update existing item quantity
        setEditItems((prev) =>
          prev.map((item, i) =>
            i === existingIndex
              ? {
                  ...item,
                  quantity: item.quantity + addQuantity,
                  total_price: (item.quantity + addQuantity) * item.unit_price,
                }
              : item
          )
        );
      } else {
        // Add new item
        const newItem = {
          product_id: selectedProduct.product_id,
          part_number: selectedProduct.part_number,
          product_name: selectedProduct.product_name,
          quantity: addQuantity,
          unit_price: selectedProduct.your_price,
          total_price: addQuantity * selectedProduct.your_price,
        };
        setEditItems((prev) => [...prev, newItem]);
      }

      // Reset selection
      setSelectedProduct(null);
      setAddQuantity(1);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return editItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  // Handle save
  const handleSaveOrder = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 85; // Fixed shipping
    const totalAmount = subtotal + tax + shipping;

    const updatedOrder = {
      ...editingOrder,
      items: editItems,
      items_count: editItems.length,
      subtotal,
      tax,
      shipping,
      total_amount: totalAmount,
    };

    if (isCloneMode) {
      // Add new order to the list
      const newWebOrder = {
        web_order_id: updatedOrder.web_order_id,
        order_id: updatedOrder.order_id,
        customer_id: updatedOrder.customer_id,
        order_date: updatedOrder.order_date,
        order_type: "WEB",
        status: "DRAFT",
        payment_status: "UNPAID",
        total_amount: totalAmount,
        items_count: editItems.length,
        notes: updatedOrder.notes,
      };
      setOrders((prev) => [newWebOrder, ...prev]);
    } else {
      // Update existing order
      setOrders((prev) =>
        prev.map((o) =>
          o.web_order_id === editingOrder.web_order_id
            ? { ...o, items_count: editItems.length, total_amount: totalAmount }
            : o
        )
      );
    }

    // Close modal
    setShowEditModal(false);
    setEditingOrder(null);
    setEditItems([]);
    setIsCloneMode(false);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingOrder(null);
    setEditItems([]);
    setIsCloneMode(false);
    setSelectedProduct(null);
    setAddQuantity(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="web-orders-container">
      <div className="page-header">
        <Box>
          <h1 className="page-title" style={{ marginBottom: 4 }}>My Orders</h1>
          <Typography variant="body2" color="text.secondary">
            Track your quote requests and orders
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Refresh orders">
            <IconButton
              onClick={fetchOrders}
              disabled={loading}
              color="primary"
              size="small"
            >
              <RefreshIcon sx={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </IconButton>
          </Tooltip>
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
        </Stack>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="filters-section">
        <TextField
          size="small"
          placeholder="Search by Order ID, Web Order ID, or Customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
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
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
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

      <div className="orders-table-container">
        {loading ? (
          <div className="loading-container" style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading your orders...</Typography>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Type</th>
                <th>Qty Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <tr key={order.web_order_id}>
                    <td>{formatDate(order.order_date)}</td>
                    <td>
                      <span className="order-id">{order.web_order_id}</span>
                    </td>
                    <td>
                      <span
                        className={`type-badge ${order.isQuoteRequest ? "quote-request" : "web-order"}`}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor: order.isQuoteRequest ? "#fff3e0" : "#e3f2fd",
                          color: order.isQuoteRequest ? "#e65100" : "#1565c0",
                        }}
                      >
                        {order.isQuoteRequest ? "Quote Request" : "Web Order"}
                      </span>
                    </td>
                    <td>{order.items_count}</td>
                    <td>
                      <span
                        className={`status-badge ${order.status?.toLowerCase()}`}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor:
                            order.status === "PENDING" ? "#fff8e1" :
                            order.status === "QUOTED" ? "#e8f5e9" :
                            order.status === "CANCELLED" ? "#ffebee" :
                            order.status === "OPEN" ? "#e3f2fd" :
                            order.status === "DISPATCHED" ? "#f3e5f5" : "#f5f5f5",
                          color:
                            order.status === "PENDING" ? "#f57f17" :
                            order.status === "QUOTED" ? "#2e7d32" :
                            order.status === "CANCELLED" ? "#c62828" :
                            order.status === "OPEN" ? "#1565c0" :
                            order.status === "DISPATCHED" ? "#7b1fa2" : "#616161",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewClick(order)}
                            sx={{ minWidth: "auto", p: 0.5 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        {!order.isQuoteRequest && (
                          <Tooltip title="Edit Order">
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              onClick={() => handleEditClick(order)}
                              sx={{ minWidth: "auto", p: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title={order.isQuoteRequest ? "Re-send Quote Request" : "Re-order / Send for Quotation"}>
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            onClick={() => handleCloneClick(order)}
                            disabled={cloneLoading}
                            sx={{ minWidth: "auto", p: 0.5 }}
                          >
                            {cloneLoading && orderToClone?._id === order._id ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <CloneIcon fontSize="small" />
                            )}
                          </Button>
                        </Tooltip>
                      </Stack>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results" style={{ padding: "40px 20px" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <RequestQuoteIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        {user ? "No orders yet" : "Please log in to view your orders"}
                      </Typography>
                      {user && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Start by browsing products and raising a quote request. Your orders will appear here.
                          </Typography>
                          <Stack direction="row" spacing={2} justifyContent="center">
                            <Button
                              variant="outlined"
                              startIcon={<ShoppingCartIcon />}
                              onClick={() => navigate("/products")}
                            >
                              Browse Products
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<RequestQuoteIcon />}
                              onClick={() => navigate("/cart")}
                              sx={{
                                bgcolor: "#000",
                                "&:hover": { bgcolor: "#333" },
                              }}
                            >
                              Go to Cart
                            </Button>
                          </Stack>
                        </>
                      )}
                    </Box>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-footer">
        <div className="results-info">
          Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
          {filteredOrders.length !== orders.length && ` (filtered from ${orders.length} total)`}
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
        type="weborder"
      />

      {/* Edit/Clone Order Modal */}
      <Dialog
        open={showEditModal}
        onClose={handleCloseEditModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {isCloneMode ? "Clone Order" : "Edit Order"} - {editingOrder?.web_order_id}
            </Typography>
            <IconButton onClick={handleCloseEditModal} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {editingOrder && (
            <Box>
              {isCloneMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You are creating a new enquiry. Modify items as needed and save.
                </Alert>
              )}

              {/* Order Info */}
              <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {editingOrder.order_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(editingOrder.order_date)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {editingOrder.status}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Add Product Section */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Add Product
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                <Autocomplete
                  options={productsData.products}
                  getOptionLabel={(option) =>
                    `${option.part_number} - ${option.product_name}`
                  }
                  value={selectedProduct}
                  onChange={(_, newValue) => setSelectedProduct(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Product"
                      size="small"
                      placeholder="Type part number or product name..."
                    />
                  )}
                  sx={{ flex: 1, minWidth: 400 }}
                />
                <TextField
                  label="Qty"
                  type="number"
                  size="small"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(parseInt(e.target.value, 10) || 1)}
                  slotProps={{
                    htmlInput: { min: 1 },
                  }}
                  sx={{ width: 80 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  disabled={!selectedProduct}
                >
                  Add
                </Button>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Items Table */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Order Items ({editItems.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Part Number</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Product Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Quantity
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editItems.length > 0 ? (
                      editItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(index, e.target.value)
                              }
                              slotProps={{
                                htmlInput: { min: 1, style: { textAlign: "center" } },
                              }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Remove Item">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            No items in this order. Add products above.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveOrder}
            disabled={editItems.length === 0}
          >
            {isCloneMode ? "Create Order" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quote Request Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                Order Details - {detailsOrder?.web_order_id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted on {detailsOrder && formatDate(detailsOrder.order_date)}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDetailsDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {detailsOrder && (
            <Box>
              {/* Status and Priority */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: 600,
                        backgroundColor:
                          detailsOrder.status === "PENDING" ? "#fff8e1" :
                          detailsOrder.status === "QUOTED" ? "#e8f5e9" :
                          detailsOrder.status === "CANCELLED" ? "#ffebee" : "#f5f5f5",
                        color:
                          detailsOrder.status === "PENDING" ? "#f57f17" :
                          detailsOrder.status === "QUOTED" ? "#2e7d32" :
                          detailsOrder.status === "CANCELLED" ? "#c62828" : "#616161",
                      }}
                    >
                      {detailsOrder.status}
                    </span>
                  </Box>
                </Box>
                {detailsOrder.priority && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Priority
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "13px",
                          fontWeight: 600,
                          backgroundColor:
                            detailsOrder.priority === "HIGH" ? "#fff3e0" :
                            detailsOrder.priority === "LOW" ? "#e3f2fd" : "#f5f5f5",
                          color:
                            detailsOrder.priority === "HIGH" ? "#e65100" :
                            detailsOrder.priority === "LOW" ? "#1565c0" : "#616161",
                        }}
                      >
                        {detailsOrder.priority}
                      </span>
                    </Box>
                  </Box>
                )}
              </Stack>

              {/* Notes */}
              {detailsOrder.notes && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#f9f9f9", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {detailsOrder.notes}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Items Table */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Items ({detailsOrder.items_count})
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Part Number</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Product Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailsOrder.items?.length > 0 ? (
                      detailsOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {item.part_number}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell align="center">
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: "4px",
                                backgroundColor: "#e3f2fd",
                                color: "#1565c0",
                                fontWeight: 600,
                              }}
                            >
                              {item.quantity}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            No items in this order
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Quote Info (if converted) */}
              {detailsOrder.quote_number && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  This request has been converted to quotation: <strong>{detailsOrder.quote_number}</strong>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog} startIcon={<CloseIcon />}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone / Re-order Confirmation Dialog */}
      <Dialog
        open={showCloneDialog}
        onClose={handleCloseCloneDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Re-order / Send for Quotation</Typography>
              <Typography variant="caption" color="text.secondary">
                Based on order {orderToClone?.web_order_id}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseCloneDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {orderToClone && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Modify items as needed, then send for quotation. Our team will review and provide you with an updated quote.
              </Alert>

              {/* Add Product Section */}
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                Add Product {productsLoading && "(Loading...)"}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                <Autocomplete
                  options={dbProducts}
                  getOptionLabel={(option) =>
                    `${option.part_number} - ${option.product_name}`
                  }
                  value={cloneSelectedProduct}
                  onChange={(_, newValue) => setCloneSelectedProduct(newValue)}
                  loading={productsLoading}
                  filterOptions={(options, { inputValue }) => {
                    const searchLower = inputValue.toLowerCase();
                    return options.filter(
                      (opt) =>
                        opt.part_number?.toLowerCase().includes(searchLower) ||
                        opt.product_name?.toLowerCase().includes(searchLower)
                    ).slice(0, 50); // Limit to 50 results for performance
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Product"
                      size="small"
                      placeholder="Type part number or product name..."
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option._id || option.product_id}>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {option.part_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.product_name}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ flex: 1, minWidth: 300 }}
                  noOptionsText={productsLoading ? "Loading products..." : "No products found"}
                />
                <TextField
                  label="Qty"
                  type="number"
                  size="small"
                  value={cloneAddQuantity}
                  onChange={(e) => setCloneAddQuantity(parseInt(e.target.value, 10) || 1)}
                  slotProps={{
                    htmlInput: { min: 1 },
                  }}
                  sx={{ width: 80 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCloneAddProduct}
                  disabled={!cloneSelectedProduct}
                  size="small"
                >
                  Add
                </Button>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Items Table */}
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                Items to be Quoted ({cloneItems.length} items)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>Part Number</TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>Product Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 100 }}>
                        Quantity
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 80 }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cloneItems.length > 0 ? (
                      cloneItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {item.part_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleCloneQuantityChange(index, e.target.value)}
                              slotProps={{
                                htmlInput: { min: 1, style: { textAlign: "center" } },
                              }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Remove Item">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCloneRemoveItem(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            No items. Add products above to continue.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Notes Field */}
              <TextField
                label="Additional Notes (Optional)"
                placeholder="Any special requirements or notes for this quotation request..."
                multiline
                rows={2}
                fullWidth
                value={cloneNotes}
                onChange={(e) => setCloneNotes(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseCloneDialog} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<RequestQuoteIcon />}
            onClick={handleConfirmClone}
            disabled={cloneLoading || cloneItems.length === 0}
          >
            {cloneLoading ? "Sending..." : `Send for Quotation (${cloneItems.length} items)`}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default WebOrders;
