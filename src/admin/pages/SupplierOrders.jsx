import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TextField,
  IconButton,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add,
  Edit,
  Search,
  Visibility,
  Close,
  LocalShipping,
  Payment,
  Receipt,
  Business,
  ShoppingCart,
  CheckCircle,
  Cancel,
  Schedule,
  AttachMoney,
  Inventory,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import supplierOrdersService from "../../services/supplierOrders.service";
import suppliersService from "../../services/suppliers.service";
import { showSuccess, showError } from "../../utils/toast";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function SupplierOrders() {
  const { usdToInr } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);

  // Filter and pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("order_date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "WIRE_TRANSFER",
    reference: "",
    notes: "",
  });

  // Receiving form state
  const [receivingItems, setReceivingItems] = useState([]);

  // Fetch data from APIs
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersResult, suppliersResult] = await Promise.all([
        supplierOrdersService.getAll(),
        suppliersService.getAll(),
      ]);

      if (ordersResult.success) {
        setOrders(ordersResult.data?.supplierOrders || []);
      } else {
        console.error("Failed to fetch orders:", ordersResult.error);
      }

      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data?.suppliers || []);
      } else {
        console.error("Failed to fetch suppliers:", suppliersResult.error);
      }
    } catch (err) {
      showError("Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.spo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || order.supplier_id === supplierFilter;
      const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
      return matchesSearch && matchesStatus && matchesSupplier && matchesPayment;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";
      if (sortBy === "order_date" || sortBy === "expected_delivery") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    if (amount === null || amount === undefined) return "-";
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "RECEIVED":
        return "success";
      case "ORDERED":
        return "primary";
      case "PARTIAL_RECEIVED":
        return "warning";
      case "DRAFT":
        return "default";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIAL":
        return "warning";
      case "UNPAID":
        return "error";
      default:
        return "default";
    }
  };

  // Handle View Details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsTab(0);
    setShowDetailsModal(true);
  };

  // Handle Add Payment
  const handleAddPayment = (order) => {
    setSelectedOrder(order);
    setPaymentForm({
      amount: order.balance_due || 0,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "WIRE_TRANSFER",
      reference: "",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  // Handle Save Payment
  const handleSavePayment = async () => {
    if (!selectedOrder || paymentForm.amount <= 0) return;

    try {
      const result = await supplierOrdersService.addPayment(
        selectedOrder.spo_id || selectedOrder._id,
        {
          amount: paymentForm.amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference: paymentForm.reference,
          notes: paymentForm.notes,
        }
      );

      if (result.success) {
        // Refresh data after successful payment
        await fetchData();
        setShowPaymentModal(false);
        showSuccess("Payment added successfully");
      } else {
        showError(result.error || "Failed to add payment");
      }
    } catch (err) {
      console.error("Error adding payment:", err);
      showError("Failed to add payment");
    }
  };

  // Handle Mark Received
  const handleMarkReceived = (order) => {
    setSelectedOrder(order);
    setReceivingItems(
      order.items?.map((item) => ({
        item_id: item.item_id,
        part_number: item.part_number,
        product_name: item.product_name,
        ordered_qty: item.quantity,
        already_received: item.received_qty || 0,
        receiving_qty: item.quantity - (item.received_qty || 0),
        condition: "GOOD",
        notes: "",
      })) || []
    );
    setShowReceivingModal(true);
  };

  // Handle Save Receiving
  const handleSaveReceiving = async () => {
    if (!selectedOrder) return;

    try {
      const receiveData = {
        received_date: new Date().toISOString().split("T")[0],
        items: receivingItems.map((item) => ({
          item_id: item.item_id,
          quantity_received: item.receiving_qty,
          condition: item.condition,
          notes: item.notes,
        })),
      };

      const result = await supplierOrdersService.receiveItems(
        selectedOrder.spo_id || selectedOrder._id,
        receiveData
      );

      if (result.success) {
        // Refresh data after successful receiving
        await fetchData();
        setShowReceivingModal(false);
        showSuccess("Items received successfully");
      } else {
        showError(result.error || "Failed to receive items");
      }
    } catch (err) {
      console.error("Error receiving items:", err);
      showError("Failed to receive items");
    }
  };

  // Handle Update Status
  const handleUpdateStatus = async (order, newStatus) => {
    try {
      const result = await supplierOrdersService.updateStatus(
        order.spo_id || order._id,
        newStatus
      );

      if (result.success) {
        // Refresh data after successful status update
        await fetchData();
        showSuccess("Status updated successfully");
      } else {
        showError(result.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      showError("Failed to update status");
    }
  };

  // Calculate stats
  const stats = {
    totalOrders: orders.length,
    orderedValue: orders
      .filter((o) => o.status === "ORDERED")
      .reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pendingPayment: orders
      .filter((o) => o.payment_status !== "PAID")
      .reduce((sum, o) => sum + (o.balance_due || 0), 0),
    receivedThisMonth: orders.filter((o) => {
      if (o.status !== "RECEIVED") return false;
      const received = o.received_items?.[o.received_items.length - 1];
      if (!received) return false;
      const receivedDate = new Date(received.received_date);
      const now = new Date();
      return (
        receivedDate.getMonth() === now.getMonth() &&
        receivedDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Supplier Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track and manage purchase orders to suppliers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
            sx={{ bgcolor: "#1976d2" }}
          >
            Create Order
          </Button>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#e3f2fd", height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ShoppingCart color="primary" />
              <Box>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {stats.totalOrders}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Orders
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#fff3e0", height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Schedule color="warning" />
              <Box>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  ${formatCurrency(stats.orderedValue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ordered Value
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#fce4ec", height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AttachMoney color="error" />
              <Box>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ${formatCurrency(stats.pendingPayment)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending Payment
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#e8f5e9", height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Inventory color="success" />
              <Box>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {stats.receivedThisMonth}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Received This Month
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="ORDERED">Ordered</MenuItem>
              <MenuItem value="PARTIAL_RECEIVED">Partial Received</MenuItem>
              <MenuItem value="RECEIVED">Received</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={supplierFilter}
              label="Supplier"
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <MenuItem value="all">All Suppliers</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentFilter}
              label="Payment"
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="PARTIAL">Partial</MenuItem>
              <MenuItem value="UNPAID">Unpaid</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {filteredOrders.length} order(s) found
          </Typography>
        </Stack>
      </Paper>

      {/* Orders Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "spo_number"}
                    direction={sortOrder}
                    onClick={() => {
                      setSortBy("spo_number");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    SPO #
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "order_date"}
                    direction={sortOrder}
                    onClick={() => {
                      setSortBy("order_date");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Order Date
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Items
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Total (USD)
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Paid
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Payment
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Loading orders...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <TableRow key={order.spo_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {order.spo_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Expected: {formatDate(order.expected_delivery)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.supplier_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.order_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${order.items?.length || 0} items`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ${formatCurrency(order.total_amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₹{formatCurrency(order.total_amount_inr, "INR")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${formatCurrency(order.amount_paid)}
                      </Typography>
                      {order.balance_due > 0 && (
                        <Typography variant="caption" color="error">
                          Due: ${formatCurrency(order.balance_due)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.status?.replace("_", " ")}
                        size="small"
                        color={getStatusColor(order.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.payment_status}
                        size="small"
                        variant="outlined"
                        color={getPaymentStatusColor(order.payment_status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {order.payment_status !== "PAID" && (
                          <Tooltip title="Add Payment">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleAddPayment(order)}
                            >
                              <Payment fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status !== "RECEIVED" && order.status !== "CANCELLED" && (
                          <Tooltip title="Mark Received">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleMarkReceived(order)}
                            >
                              <LocalShipping fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No orders found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredOrders.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* View Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                {selectedOrder?.spo_number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedOrder?.supplier_name} | {formatDate(selectedOrder?.order_date)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={selectedOrder?.status?.replace("_", " ")}
                size="small"
                color={getStatusColor(selectedOrder?.status)}
              />
              <Chip
                label={selectedOrder?.payment_status}
                size="small"
                variant="outlined"
                color={getPaymentStatusColor(selectedOrder?.payment_status)}
              />
              <IconButton onClick={() => setShowDetailsModal(false)}>
                <Close />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs
            value={detailsTab}
            onChange={(_, newValue) => setDetailsTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
          >
            <Tab icon={<Receipt />} iconPosition="start" label="Items" />
            <Tab icon={<Payment />} iconPosition="start" label="Payments" />
            <Tab icon={<LocalShipping />} iconPosition="start" label="Receiving" />
            <Tab icon={<Business />} iconPosition="start" label="Details" />
          </Tabs>

          {/* Items Tab */}
          <TabPanel value={detailsTab} index={0}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Part #</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">Qty</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Unit Cost</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Total</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">Received</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>PI Allocations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder?.items?.map((item) => (
                    <TableRow key={item.item_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.part_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.product_name}</Typography>
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">${formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell align="right">${formatCurrency(item.total_cost)}</TableCell>
                      <TableCell align="center">
                        <Stack alignItems="center" spacing={0.5}>
                          <Typography variant="body2">
                            {item.received_qty || 0} / {item.quantity}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={((item.received_qty || 0) / item.quantity) * 100}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                            color={
                              (item.received_qty || 0) >= item.quantity
                                ? "success"
                                : "primary"
                            }
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {item.pi_allocations?.map((alloc) => (
                          <Chip
                            key={alloc.pi_id}
                            label={`${alloc.pi_number} (${alloc.allocated_qty})`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Order Summary */}
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body1">${formatCurrency(selectedOrder?.subtotal)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Tax</Typography>
                  <Typography variant="body1">${formatCurrency(selectedOrder?.tax)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Shipping</Typography>
                  <Typography variant="body1">${formatCurrency(selectedOrder?.shipping)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${formatCurrency(selectedOrder?.total_amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹{formatCurrency(selectedOrder?.total_amount_inr, "INR")}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Payments Tab */}
          <TabPanel value={detailsTab} index={1}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper sx={{ p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${formatCurrency(selectedOrder?.total_amount)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper sx={{ p: 2, bgcolor: "#e3f2fd", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${formatCurrency(selectedOrder?.amount_paid)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper sx={{ p: 2, bgcolor: "#fce4ec", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                  <Typography variant="h6" fontWeight="bold" color="error">
                    ${formatCurrency(selectedOrder?.balance_due)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper sx={{ p: 2, bgcolor: "#fff3e0", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedOrder?.payment_status}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Payment History
            </Typography>
            {selectedOrder?.payment_history?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.payment_history.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>${formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.payment_method?.replace("_", " ")}</TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell>{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No payments recorded yet</Alert>
            )}
          </TabPanel>

          {/* Receiving Tab */}
          <TabPanel value={detailsTab} index={2}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, md: 4 }}>
                <Paper sx={{ p: 2, bgcolor: "#e3f2fd", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Receiving Status</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedOrder?.receiving_status || "PENDING"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Paper sx={{ p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Expected Delivery</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatDate(selectedOrder?.expected_delivery)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 2, bgcolor: "#fff3e0", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Receiving Records</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedOrder?.received_items?.length || 0}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Receiving History
            </Typography>
            {selectedOrder?.received_items?.length > 0 ? (
              selectedOrder.received_items.map((record) => (
                <Paper key={record.received_id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(record.received_date)}
                    </Typography>
                    <Chip label={record.received_id} size="small" variant="outlined" />
                  </Stack>
                  {record.item_id && (
                    <Typography variant="caption" color="text.secondary">
                      Qty: {record.quantity_received} | Condition: {record.condition}
                    </Typography>
                  )}
                  {record.items?.map((item, idx) => (
                    <Typography key={idx} variant="caption" display="block" color="text.secondary">
                      {item.item_id}: Qty {item.quantity_received} - {item.condition}
                    </Typography>
                  ))}
                </Paper>
              ))
            ) : (
              <Alert severity="info">No receiving records yet</Alert>
            )}
          </TabPanel>

          {/* Details Tab */}
          <TabPanel value={detailsTab} index={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Supplier Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Supplier</Typography>
                      <Typography variant="body2">{selectedOrder?.supplier_name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Currency</Typography>
                      <Typography variant="body2">{selectedOrder?.currency}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Exchange Rate</Typography>
                      <Typography variant="body2">1 USD = ₹{selectedOrder?.exchange_rate}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Shipping Address
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    {selectedOrder?.shipping_address?.street}<br />
                    {selectedOrder?.shipping_address?.city}, {selectedOrder?.shipping_address?.state} {selectedOrder?.shipping_address?.zip}<br />
                    {selectedOrder?.shipping_address?.country}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Notes
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    {selectedOrder?.notes || "No notes"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Created by {selectedOrder?.created_by} on {formatDate(selectedOrder?.created_at)}
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          {selectedOrder?.payment_status !== "PAID" && (
            <Button
              variant="outlined"
              startIcon={<Payment />}
              onClick={() => {
                setShowDetailsModal(false);
                handleAddPayment(selectedOrder);
              }}
            >
              Add Payment
            </Button>
          )}
          {selectedOrder?.status !== "RECEIVED" && selectedOrder?.status !== "CANCELLED" && (
            <Button
              variant="contained"
              startIcon={<LocalShipping />}
              onClick={() => {
                setShowDetailsModal(false);
                handleMarkReceived(selectedOrder);
              }}
            >
              Mark Received
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add Payment</Typography>
            <IconButton onClick={() => setShowPaymentModal(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Balance Due: <strong>${formatCurrency(selectedOrder?.balance_due)}</strong>
          </Alert>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Payment Date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, payment_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentForm.payment_method}
                  label="Payment Method"
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, payment_method: e.target.value })
                  }
                >
                  <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                  <MenuItem value="CHECK">Check</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Reference Number"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, reference: e.target.value })
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                rows={2}
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePayment}
            disabled={paymentForm.amount <= 0}
          >
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark Received Modal */}
      <Dialog
        open={showReceivingModal}
        onClose={() => setShowReceivingModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Mark Items Received</Typography>
            <IconButton onClick={() => setShowReceivingModal(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Recording received items for <strong>{selectedOrder?.spo_number}</strong>
          </Alert>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Part #</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Ordered</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Already Received</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Receiving Now</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Condition</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receivingItems.map((item, index) => (
                  <TableRow key={item.item_id}>
                    <TableCell>{item.part_number}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell align="center">{item.ordered_qty}</TableCell>
                    <TableCell align="center">{item.already_received}</TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="number"
                        value={item.receiving_qty}
                        onChange={(e) => {
                          const newItems = [...receivingItems];
                          newItems[index].receiving_qty = Math.min(
                            parseInt(e.target.value) || 0,
                            item.ordered_qty - item.already_received
                          );
                          setReceivingItems(newItems);
                        }}
                        inputProps={{
                          min: 0,
                          max: item.ordered_qty - item.already_received,
                          style: { textAlign: "center", width: 60 },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={item.condition}
                          onChange={(e) => {
                            const newItems = [...receivingItems];
                            newItems[index].condition = e.target.value;
                            setReceivingItems(newItems);
                          }}
                        >
                          <MenuItem value="GOOD">Good</MenuItem>
                          <MenuItem value="DAMAGED">Damaged</MenuItem>
                          <MenuItem value="DEFECTIVE">Defective</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceivingModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveReceiving}
            disabled={receivingItems.every((item) => item.receiving_qty === 0)}
          >
            Save Receiving
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Order Modal - Placeholder */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Create Supplier Order</Typography>
            <IconButton onClick={() => setShowCreateModal(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info">
            Create Supplier Order functionality will be implemented with PI Allocation integration.
            For now, orders are managed through the mock data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default SupplierOrders;
