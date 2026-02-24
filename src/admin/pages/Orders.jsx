import { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Tooltip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  LocalShipping,
  Inventory,
  Search,
  FilterList,
  Visibility,
  CheckCircle,
  PictureAsPdf,
  Print,
  Cancel,
  Delete as DeleteIcon,
  Refresh,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import ordersService from "../../services/orders.service";
import proformaInvoicesService from "../../services/proformaInvoices.service";
import { dispatchesService } from "../../services";
import InvoicePrintPreview from "../components/InvoicePrintPreview";
import { showSuccess, showError } from "../../utils/toast";

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-content, .print-content * {
      visibility: visible;
    }
    .print-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
`;

function Orders() {
  const { usdToInr } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCollectDueModal, setShowCollectDueModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [dispatchForm, setDispatchForm] = useState({
    dispatch_date: new Date().toISOString().split("T")[0],
    courier_service: "",
    tracking_number: "",
    dispatch_notes: "",
  });

  // Shipping details for dispatch
  const [dispatchShipping, setDispatchShipping] = useState({
    hsn_code: "",
    awb_number: "",
    shipping_by: "",
    shipping_notes: "",
    generate_invoice: true,
    invoice_number: "",
  });

  // Loading and processing states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Print preview ref
  const invoicePrintRef = useRef(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Pagination and filter state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("order_date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch orders from database
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch open orders, dispatched orders, open PIs, AND completed PIs
      console.log("[Orders] Fetching orders and PIs...");
      const [openResult, dispatchedResult, openPIsResult, completedPIsResult] = await Promise.all([
        ordersService.getOpenOrders(),
        ordersService.getDispatchedOrders(),
        proformaInvoicesService.getOpenPIs(),
        proformaInvoicesService.getCompletedPIs(),
      ]);

      console.log("[Orders] Open Orders result:", openResult);
      console.log("[Orders] Dispatched Orders result:", dispatchedResult);
      console.log("[Orders] Open PIs result:", openPIsResult);
      console.log("[Orders] Completed PIs result:", completedPIsResult);

      const allOrders = [];

      // Process open orders
      if (openResult.success && openResult.data) {
        openResult.data.forEach((order) => {
          const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          allOrders.push({
            ...order,
            source_type: 'ORDER', // Mark as Order
            order_id: order.order_id,
            customer_id: order.buyer?.user_id || order.customer_id || "N/A",
            customer_name: order.buyer?.name || order.buyer_name || order.customer_name,
            order_date: order.order_date || order.createdAt,
            payment_received: order.payment_received || 0,
            payment_history: order.payment_history || [],
            payment_status: order.payment_status || "UNPAID",
            pi_number: order.pi_number || (order.proforma_invoice ? `PI-${order.order_id?.replace('ORD-', '')}` : `PI-${order.order_id?.replace('ORD-', '')}`),
            quotation_number: order.quotation?.quote_number || `QT-${order.order_id?.replace('ORD-', '')}`,
            total_quantity: order.total_quantity || totalQuantity,
            dispatched_quantity: order.dispatched_quantity || 0,
            pending_quantity: order.pending_quantity || (totalQuantity - (order.dispatched_quantity || 0)),
            dispatch_history: order.dispatch_history || [],
          });
        });
      }

      // Process dispatched orders
      if (dispatchedResult.success && dispatchedResult.data) {
        dispatchedResult.data.forEach((order) => {
          const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          allOrders.push({
            ...order,
            source_type: 'ORDER', // Mark as Order
            order_id: order.order_id,
            customer_id: order.buyer?.user_id || order.customer_id || "N/A",
            customer_name: order.buyer?.name || order.buyer_name || order.customer_name,
            order_date: order.order_date || order.createdAt,
            payment_received: order.payment_received || 0,
            payment_history: order.payment_history || [],
            payment_status: order.payment_status || "UNPAID",
            pi_number: order.pi_number || `PI-${order.order_id?.replace('ORD-', '')}`,
            quotation_number: order.quotation?.quote_number || `QT-${order.order_id?.replace('ORD-', '')}`,
            total_quantity: order.total_quantity || totalQuantity,
            dispatched_quantity: order.dispatched_quantity || totalQuantity,
            pending_quantity: order.pending_quantity || 0,
            dispatch_history: order.dispatch_history || [],
          });
        });
      }

      // Process open PIs (with remaining items to dispatch)
      if (openPIsResult.success && openPIsResult.data) {
        openPIsResult.data.forEach((pi) => {
          const totalQuantity = pi.total_quantity || pi.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          const dispatchedQty = pi.dispatched_quantity || 0;
          const pendingQty = pi.pending_quantity ?? (totalQuantity - dispatchedQty);

          // Only add if there are remaining items
          if (pendingQty > 0) {
            allOrders.push({
              ...pi,
              _id: pi._id,
              source_type: 'PROFORMA_INVOICE', // Mark as PI
              source_id: pi._id,
              order_id: pi.proforma_number, // Use PI number as order_id
              customer_id: pi.buyer?.user_id || pi.buyer_id || "N/A",
              customer_name: pi.buyer?.name || pi.buyer_name,
              order_date: pi.issue_date || pi.createdAt,
              payment_received: pi.payment_received || 0,
              payment_history: pi.payment_history || [],
              payment_status: pi.payment_status || "UNPAID",
              pi_number: pi.proforma_number,
              quotation_number: pi.quote_number || pi.quotation?.quote_number || "",
              total_quantity: totalQuantity,
              dispatched_quantity: dispatchedQty,
              pending_quantity: pendingQty,
              dispatch_status: pi.dispatch_status || "NONE",
              dispatch_count: pi.dispatch_count || 0,
              status: pendingQty > 0 ? "OPEN" : "DISPATCHED",
              items: pi.items || [],
              total_amount: pi.total_amount || 0,
              shipping_address: pi.shipping_address || {},
              billing_address: pi.billing_address || {},
            });
          }
        });
      }

      // Process completed PIs (fully dispatched)
      if (completedPIsResult.success && completedPIsResult.data) {
        completedPIsResult.data.forEach((pi) => {
          const totalQuantity = pi.total_quantity || pi.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          const dispatchedQty = pi.dispatched_quantity || totalQuantity;

          allOrders.push({
            ...pi,
            _id: pi._id,
            source_type: 'PROFORMA_INVOICE', // Mark as PI
            source_id: pi._id,
            order_id: pi.proforma_number, // Use PI number as order_id
            customer_id: pi.buyer?.user_id || pi.buyer_id || "N/A",
            customer_name: pi.buyer?.name || pi.buyer_name,
            order_date: pi.issue_date || pi.createdAt,
            payment_received: pi.payment_received || 0,
            payment_history: pi.payment_history || [],
            payment_status: pi.payment_status || "UNPAID",
            pi_number: pi.proforma_number,
            quotation_number: pi.quote_number || pi.quotation?.quote_number || "",
            total_quantity: totalQuantity,
            dispatched_quantity: dispatchedQty,
            pending_quantity: 0,
            dispatch_status: "FULL",
            dispatch_count: pi.dispatch_count || 1,
            status: "DISPATCHED", // Mark as completed/dispatched
            items: pi.items || [],
            total_amount: pi.total_amount || 0,
            shipping_address: pi.shipping_address || {},
            billing_address: pi.billing_address || {},
          });
        });
      }

      setOrders(allOrders);
    } catch (err) {
      console.error("[Orders] Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
      showError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  // Collect payment and dispatch - NEW FLOW
  const handleCollectPayment = async (order) => {
    setSelectedOrder(order);

    // Fetch dispatch summary to get remaining quantities per item
    const sourceType = order.source_type === 'PROFORMA_INVOICE' ? 'PROFORMA_INVOICE' : 'ORDER';
    const summaryResult = await dispatchesService.getSummary(sourceType, order._id);

    let items;
    if (summaryResult.success && summaryResult.data?.items) {
      // Use item-level remaining quantities from dispatch summary
      items = summaryResult.data.items
        .filter(item => item.remaining_quantity > 0) // Only show items with remaining qty
        .map((item) => ({
          ...item,
          product_id: item.product_id || item.part_number,
          quantity: item.remaining_quantity, // Remaining quantity
          invoice_quantity: item.remaining_quantity, // Pre-fill with remaining
          original_quantity: item.remaining_quantity, // Max is remaining
          unit_price: item.unit_price || 0,
          hsn_code: item.hsn_code || "",
          has_inventory: false,
          inventory_quantity: 0,
        }));
    } else {
      // Fallback: use original items (for orders with no dispatch history)
      items = order.items.map((item) => ({
        ...item,
        product_id: item.product_id || item.part_number,
        invoice_quantity: item.quantity,
        original_quantity: item.quantity,
        hsn_code: item.hsn_code || "",
        has_inventory: item.has_inventory || false,
        inventory_quantity: item.inventory_quantity || 0,
      }));
    }

    setInvoiceItems(items);

    // Reset dispatch form
    setDispatchForm({
      dispatch_date: new Date().toISOString().split("T")[0],
      courier_service: "",
      tracking_number: "",
      dispatch_notes: "",
    });

    // Reset shipping details and generate invoice number
    const invoiceNum = `INV-${new Date().toISOString().slice(2,4)}${(new Date().getMonth()+1).toString().padStart(2,'0')}-${Math.floor(10000 + Math.random() * 90000)}`;
    setDispatchShipping({
      hsn_code: "",
      awb_number: "",
      shipping_by: "",
      shipping_notes: "",
      generate_invoice: true,
      invoice_number: invoiceNum,
    });

    setShowCollectDueModal(true);
  };

  // Handle quantity change in invoice items
  const handleInvoiceQuantityChange = (index, newQuantity) => {
    const updatedItems = [...invoiceItems];
    const qty = Math.max(
      0,
      Math.min(newQuantity, updatedItems[index].original_quantity)
    );
    updatedItems[index].invoice_quantity = qty;
    setInvoiceItems(updatedItems);
  };

  // Handle HSS code change per item
  const handleItemHsnCodeChange = (index, hsnCode) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index].hsn_code = hsnCode;
    setInvoiceItems(updatedItems);
  };

  // Handle remove item from invoice
  const handleRemoveInvoiceItem = (index) => {
    const itemToRemove = invoiceItems[index];

    if (invoiceItems.length <= 1) {
      showError("Cannot remove item: At least one item must remain in the invoice.");
      return;
    }

    if (itemToRemove.has_inventory) {
      showError(`Cannot remove "${itemToRemove.product_name}": This product has inventory (${itemToRemove.inventory_quantity} units available). Items with inventory cannot be removed.`);
      return;
    }

    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
  };

  // Calculate invoice total
  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce((sum, item) => {
      return sum + item.unit_price * item.invoice_quantity;
    }, 0);
  };

  // Confirm dispatch - uses Dispatches API
  const confirmCollectDueAndDispatch = async () => {
    const itemsToDispatch = invoiceItems.filter(
      (item) => item.invoice_quantity > 0
    );

    if (itemsToDispatch.length === 0) {
      showError("Please include at least one item with quantity greater than 0");
      return;
    }

    const dispatchTotal = calculateInvoiceTotal();
    const dispatchedQty = itemsToDispatch.reduce((sum, item) => sum + item.invoice_quantity, 0);

    setProcessing(true);
    try {
      // Prepare dispatch data
      const dispatchData = {
        items: itemsToDispatch.map(item => ({
          product_id: item.product_id || item.part_number,
          product_name: item.product_name,
          part_number: item.part_number,
          quantity: item.invoice_quantity,
          unit_price: item.unit_price,
        })),
        shipping_info: {
          hsn_code: dispatchShipping.hsn_code,
          awb_number: dispatchShipping.awb_number,
          shipping_by: dispatchShipping.shipping_by,
          notes: dispatchShipping.shipping_notes,
        },
        generate_invoice: dispatchShipping.generate_invoice,
        invoice_number: dispatchShipping.generate_invoice ? dispatchShipping.invoice_number : null,
        dispatch_type: 'STANDARD',
      };

      // Use appropriate dispatch method based on source type
      const isFromPI = selectedOrder.source_type === 'PROFORMA_INVOICE';
      const result = isFromPI
        ? await dispatchesService.dispatchFromPI(selectedOrder._id, dispatchData)
        : await dispatchesService.dispatchFromOrder(selectedOrder._id, dispatchData);

      if (result.success) {
        const { is_fully_dispatched, invoice } = result.data;

        if (is_fully_dispatched) {
          showSuccess(`Order fully dispatched! Total: ${dispatchedQty} units ($${dispatchTotal.toFixed(2)})${invoice ? ` - Invoice ${invoice.invoice_number} generated` : ''}`);
        } else {
          const remainingQty = (selectedOrder.total_quantity || 0) - (selectedOrder.dispatched_quantity || 0) - dispatchedQty;
          showSuccess(`Partial dispatch completed! Dispatched: ${dispatchedQty} units. Remaining: ${remainingQty} units.${invoice ? ` Invoice ${invoice.invoice_number} generated` : ''}`);
        }

        // Refresh orders list
        await fetchOrders();
        setShowCollectDueModal(false);
      } else {
        showError(result.error || "Failed to dispatch order");
      }
    } catch (err) {
      console.error("[Orders] Error dispatching:", err);
      showError("Failed to dispatch order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };


  // Filter orders that are awaiting dispatch
  // Open Orders = All orders with status "OPEN" regardless of payment
  const openOrders = orders.filter((o) => o.status === "OPEN");

  // Completed Orders = All orders with status "DISPATCHED"
  const completedOrders = orders.filter((o) => o.status === "DISPATCHED");

  // Get current tab orders
  const currentTabOrders = activeTab === 0 ? openOrders : completedOrders;

  // Professional print handler
  const handlePrint = () => {
    const printContent = invoicePrintRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order - ${selectedOrder?.order_id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 0; }
              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
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

  // Professional PDF handler
  const handleDownloadPDF = () => {
    const printContent = invoicePrintRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order - ${selectedOrder?.order_id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 0; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              window.onload = function() {
                alert('Use "Save as PDF" option in the Print dialog to download as PDF');
                window.print();
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter and sort orders based on active tab
  const filteredOrders = currentTabOrders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.pi_number && order.pi_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.quotation_number && order.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let compareA, compareB;

    if (sortBy === "order_date") {
      compareA = new Date(a.order_date);
      compareB = new Date(b.order_date);
    } else if (sortBy === "total_amount") {
      compareA = a.total_amount;
      compareB = b.total_amount;
    } else if (sortBy === "order_id") {
      compareA = a.order_id;
      compareB = b.order_id;
    }

    return sortOrder === "asc"
      ? compareA > compareB
        ? 1
        : -1
      : compareA < compareB
      ? 1
      : -1;
  });

  const paginatedOrders = sortedOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handler functions
  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
    setPage(0); // Reset pagination when switching tabs
  };

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className="p-0!">
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <h1 className="text-2xl font-bold text-[#0b0c1a] mb-2">
              Open Orders
            </h1>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: "13px" }}
            >
              Track and manage order dispatches
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refresh">
              <IconButton onClick={fetchOrders} disabled={loading} color="primary">
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            <Chip
              icon={<Inventory />}
              label={`Open: ${openOrders.length}`}
              color="warning"
              variant="outlined"
              sx={{ fontSize: "13px" }}
              className="p-3!"
            />
            <Chip
              icon={<CheckCircle />}
              label={`Completed: ${completedOrders.length}`}
              color="success"
              variant="outlined"
              sx={{ fontSize: "13px" }}
              className="p-3!"
            />
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { fontSize: '14px', fontWeight: 600, textTransform: 'none' }
            }}
          >
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: '14px' }}>Open</Typography>
                  <Chip
                    label={openOrders.length}
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '12px', '& .MuiChip-label': { px: 1 } }}
                  />
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: '14px' }}>Completed</Typography>
                  <Chip
                    label={completedOrders.length}
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: '12px', '& .MuiChip-label': { px: 1 } }}
                  />
                </Stack>
              }
            />
          </Tabs>
        </Paper>

        {/* Search and Filter */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Order ID, Customer Name, PI, or Quotation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ "& input": { fontSize: "13px" } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "end",
                  gap: 1,
                }}
              >
                <FilterList color="action" />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "13px" }}
                >
                  Showing {paginatedOrders.length} of {filteredOrders.length}{" "}
                  {activeTab === 0 ? "open" : "completed"} orders
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Orders Table */}
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "order_id"}
                    direction={sortBy === "order_id" ? sortOrder : "asc"}
                    onClick={() => handleSortChange("order_id")}
                  >
                    <strong style={{ fontSize: "13px" }}>Order #</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>PI / Quotation</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>Customer</strong>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "order_date"}
                    direction={sortBy === "order_date" ? sortOrder : "asc"}
                    onClick={() => handleSortChange("order_date")}
                  >
                    <strong style={{ fontSize: "13px" }}>Order Date</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <strong style={{ fontSize: "13px" }}>Total Qty</strong>
                </TableCell>
                <TableCell align="center">
                  <strong style={{ fontSize: "13px" }}>Dispatched</strong>
                </TableCell>
                <TableCell align="center">
                  <strong style={{ fontSize: "13px" }}>Pending</strong>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === "total_amount"}
                    direction={sortBy === "total_amount" ? sortOrder : "asc"}
                    onClick={() => handleSortChange("total_amount")}
                  >
                    <strong style={{ fontSize: "13px" }}>Order Value</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <strong style={{ fontSize: "13px" }}>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Alert severity="info" sx={{ fontSize: "13px" }}>
                      No {activeTab === 0 ? "open" : "completed"} orders found
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order._id || order.order_id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                          label={order.source_type === 'PROFORMA_INVOICE' ? 'PI' : 'ORD'}
                          size="small"
                          color={order.source_type === 'PROFORMA_INVOICE' ? 'primary' : 'default'}
                          sx={{ fontSize: '10px', height: '18px', fontWeight: 600 }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ fontSize: "13px" }}
                        >
                          {order.order_id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" sx={{ fontSize: "12px", color: "primary.main" }}>
                          {order.pi_number}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: "11px", color: "text.secondary" }}>
                          {order.quotation_number}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: "13px" }}>
                          {order.customer_name || "N/A"}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: "11px", color: "text.secondary" }}>
                          {order.customer_id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: "13px" }}>
                        {new Date(order.order_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "13px" }}>
                        {order.total_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.dispatched_quantity || 0}
                        size="small"
                        color={order.dispatched_quantity > 0 ? "success" : "default"}
                        sx={{ fontSize: "12px", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.pending_quantity || 0}
                        size="small"
                        color={order.pending_quantity > 0 ? "warning" : "default"}
                        sx={{ fontSize: "12px", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0.5}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ fontSize: "13px" }}
                        >
                          ${order.total_amount.toFixed(2)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "11px" }}
                        >
                          ₹{(order.total_amount * usdToInr).toFixed(2)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="center"
                        flexWrap="wrap"
                      >
                        <Tooltip title="View Details">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewOrder(order)}
                            sx={{ minWidth: "auto", px: 1 }}
                          >
                            <Visibility fontSize="small" />
                          </Button>
                        </Tooltip>

                        {/* Dispatch button - only shown for OPEN orders */}
                        {activeTab === 0 && (
                          <Tooltip title="Dispatch Items">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<LocalShipping />}
                              onClick={() => handleCollectPayment(order)}
                              sx={{
                                fontSize: "12px",
                                px: 1.5,
                                py: 0.5,
                                textTransform: "none",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Dispatch
                            </Button>
                          </Tooltip>
                        )}

                        {/* Status badges for completed orders */}
                        {activeTab === 1 && (
                          <>
                            <Chip
                              icon={<LocalShipping sx={{ fontSize: '14px !important' }} />}
                              label="Dispatched"
                              size="small"
                              color="success"
                              sx={{ fontSize: "11px", height: 24 }}
                            />
                            {order.dispatch_history?.some(d => d.invoice_generated) && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                                label="Invoiced"
                                size="small"
                                color="primary"
                                sx={{ fontSize: "11px", height: 24 }}
                              />
                            )}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredOrders.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              "& .MuiTablePagination-select, & .MuiTablePagination-displayedRows":
                { fontSize: "13px" },
            }}
          />
        </TableContainer>

        {/* View Order Details Dialog */}
        <Dialog
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle className="no-print">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ fontSize: "18px" }}
                >
                  Order Details
                </Typography>
                {selectedOrder && (
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={selectedOrder.pi_number}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: "11px" }}
                    />
                    <Chip
                      label={selectedOrder.quotation_number}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "11px" }}
                    />
                  </Stack>
                )}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Print">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrint}
                    sx={{ fontSize: "13px" }}
                  >
                    Print
                  </Button>
                </Tooltip>
                <Tooltip title="Download PDF">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<PictureAsPdf />}
                    onClick={handleDownloadPDF}
                    sx={{ fontSize: "13px" }}
                  >
                    PDF
                  </Button>
                </Tooltip>
              </Stack>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {selectedOrder && (
              <Box>
                {/* Dispatch Tracking Summary */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          TOTAL QUANTITY
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          {selectedOrder.total_quantity}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          DISPATCHED
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          {selectedOrder.dispatched_quantity || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: selectedOrder.pending_quantity > 0 ? '#fff3e0' : '#e8f5e9' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          PENDING
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color={selectedOrder.pending_quantity > 0 ? 'warning.main' : 'success.main'}>
                          {selectedOrder.pending_quantity || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Progress Bar */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '11px' }}>Dispatch Progress</Typography>
                      <Typography variant="caption" sx={{ fontSize: '11px' }}>
                        {selectedOrder.total_quantity > 0
                          ? Math.round(((selectedOrder.dispatched_quantity || 0) / selectedOrder.total_quantity) * 100)
                          : 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={selectedOrder.total_quantity > 0
                        ? ((selectedOrder.dispatched_quantity || 0) / selectedOrder.total_quantity) * 100
                        : 0
                      }
                      sx={{ height: 8, borderRadius: 4 }}
                      color={selectedOrder.pending_quantity === 0 ? "success" : "warning"}
                    />
                  </Box>
                </Box>

                {/* Dispatch History */}
                {selectedOrder.dispatch_history && selectedOrder.dispatch_history.length > 0 && (
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ fontSize: '14px' }}>
                      Dispatch History ({selectedOrder.dispatch_history.length} dispatches)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>Dispatch ID</TableCell>
                            <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>Items</TableCell>
                            <TableCell align="center" sx={{ fontSize: '12px', fontWeight: 600 }}>Quantity</TableCell>
                            <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 600 }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selectedOrder.dispatch_history || []).map((dispatch, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontSize: '12px' }}>{dispatch.dispatch_id}</TableCell>
                              <TableCell sx={{ fontSize: '12px' }}>
                                {new Date(dispatch.dispatch_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell sx={{ fontSize: '12px' }}>
                                {(dispatch.items || []).map(i => i.product_name).join(', ')}
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: '12px' }}>
                                <Chip label={dispatch.total_quantity} size="small" color="success" sx={{ fontSize: '11px' }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '12px' }}>
                                ${dispatch.total_amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Print Preview */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#e8e8e8',
                    display: 'flex',
                    justifyContent: 'center',
                    overflowY: 'auto'
                  }}
                >
                  <InvoicePrintPreview
                    ref={invoicePrintRef}
                    invoice={{
                      ...selectedOrder,
                      invoice_number: selectedOrder.order_id,
                      invoice_date: selectedOrder.order_date,
                      customer_name: selectedOrder.customer_name || selectedOrder.customer_id,
                      billing_address: selectedOrder.shipping_address
                    }}
                    globalRate={usdToInr}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions className="no-print">
            <Button
              onClick={() => setShowViewModal(false)}
              sx={{ fontSize: "13px" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dispatch Products Modal */}
        <Dialog
          open={showCollectDueModal}
          onClose={() => setShowCollectDueModal(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              height: "90vh",
            },
          }}
        >
          <DialogTitle
            sx={{ borderBottom: "2px solid #4caf50", pb: 2, pt: 2.5 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalShipping sx={{ color: "success.main", fontSize: 28 }} />
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ fontSize: "22px", color: "text.primary" }}
                    >
                      Dispatch Products
                    </Typography>
                    {selectedOrder && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "13px" }}
                        >
                          Order: {selectedOrder.order_id} | Customer:{" "}
                          {selectedOrder.customer_name || selectedOrder.customer_id}
                        </Typography>
                        <Chip
                          label={selectedOrder.pi_number}
                          size="small"
                          color="primary"
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                        <Chip
                          label={selectedOrder.quotation_number}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
              <Tooltip title="Close">
                <Cancel
                  onClick={() => setShowCollectDueModal(false)}
                  sx={{ color: "text.secondary", cursor: "pointer" }}
                />
              </Tooltip>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0, overflow: "auto" }}>
            {selectedOrder && (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {/* Order Details Section */}
                <Box sx={{ p: 2, mx: 1, mt: 2 }}>
                  <Grid container spacing={2}>
                    {/* PI and Quotation Info */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', textTransform: 'uppercase' }}>
                          Reference Numbers
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '12px' }}>PI Number:</Typography>
                            <Chip label={selectedOrder.pi_number} size="small" color="primary" sx={{ fontSize: '11px' }} />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '12px' }}>Quotation:</Typography>
                            <Chip label={selectedOrder.quotation_number} size="small" variant="outlined" sx={{ fontSize: '11px' }} />
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Quantity Tracking */}
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', textTransform: 'uppercase' }}>
                          Dispatch Tracking
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 4 }}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                TOTAL QTY
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ fontSize: '20px' }}>
                                {selectedOrder.total_quantity}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                DISPATCHED
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ fontSize: '20px' }}>
                                {selectedOrder.dispatched_quantity || 0}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: selectedOrder.pending_quantity > 0 ? '#fff3e0' : '#e8f5e9', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                PENDING
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color={selectedOrder.pending_quantity > 0 ? 'warning.main' : 'success.main'} sx={{ fontSize: '20px' }}>
                                {selectedOrder.pending_quantity || 0}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        {/* Progress Bar */}
                        <Box sx={{ mt: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '10px' }}>Progress</Typography>
                            <Typography variant="caption" sx={{ fontSize: '10px' }}>
                              {selectedOrder.total_quantity > 0
                                ? Math.round(((selectedOrder.dispatched_quantity || 0) / selectedOrder.total_quantity) * 100)
                                : 0}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={selectedOrder.total_quantity > 0
                              ? ((selectedOrder.dispatched_quantity || 0) / selectedOrder.total_quantity) * 100
                              : 0
                            }
                            sx={{ height: 6, borderRadius: 3 }}
                            color={selectedOrder.pending_quantity === 0 ? "success" : "warning"}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                {/* Previous Dispatch History */}
                {selectedOrder.dispatch_history && selectedOrder.dispatch_history.length > 0 && (
                  <Box sx={{ mx: 3, mt: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ fontSize: '13px', color: 'text.primary' }}>
                        Previous Dispatches ({selectedOrder.dispatch_history.length})
                      </Typography>
                      <TableContainer sx={{ maxHeight: 150 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: '11px', fontWeight: 600, bgcolor: '#f5f5f5', py: 1 }}>Dispatch ID</TableCell>
                              <TableCell sx={{ fontSize: '11px', fontWeight: 600, bgcolor: '#f5f5f5', py: 1 }}>Date</TableCell>
                              <TableCell sx={{ fontSize: '11px', fontWeight: 600, bgcolor: '#f5f5f5', py: 1 }}>Items</TableCell>
                              <TableCell align="center" sx={{ fontSize: '11px', fontWeight: 600, bgcolor: '#f5f5f5', py: 1 }}>Qty</TableCell>
                              <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 600, bgcolor: '#f5f5f5', py: 1 }}>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(selectedOrder.dispatch_history || []).map((dispatch, idx) => (
                              <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                <TableCell sx={{ fontSize: '11px', py: 0.75 }}>{dispatch.dispatch_id}</TableCell>
                                <TableCell sx={{ fontSize: '11px', py: 0.75 }}>
                                  {new Date(dispatch.dispatch_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell sx={{ fontSize: '11px', py: 0.75, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {(dispatch.items || []).map(i => i.product_name).join(', ')}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '11px', py: 0.75 }}>
                                  <Chip label={dispatch.total_quantity} size="small" color="success" sx={{ fontSize: '10px', height: 18 }} />
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '11px', py: 0.75, fontWeight: 500 }}>
                                  ${dispatch.total_amount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                          Total Dispatched: <strong>{selectedOrder.dispatched_quantity} units</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '11px', color: 'success.main', fontWeight: 600 }}>
                          ${selectedOrder.dispatch_history.reduce((sum, d) => sum + d.total_amount, 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                )}

                {/* Shipping & Invoice Details Section */}
                <Box sx={{ mx: 3, mt: 2 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      border: "2px solid #ff9800",
                      bgcolor: "#fffde7",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <LocalShipping sx={{ color: "warning.main" }} />
                      <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">
                        Shipping & Invoice Details
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={dispatchShipping.generate_invoice}
                            onChange={(e) =>
                              setDispatchShipping((prev) => ({
                                ...prev,
                                generate_invoice: e.target.checked,
                              }))
                            }
                            size="small"
                            color="success"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "13px" }}>Generate Invoice on Dispatch</Typography>}
                        sx={{ ml: "auto" }}
                      />
                    </Stack>

                    <Grid container spacing={2}>
                      {dispatchShipping.generate_invoice && (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Invoice Number"
                            value={dispatchShipping.invoice_number}
                            onChange={(e) =>
                              setDispatchShipping((prev) => ({
                                ...prev,
                                invoice_number: e.target.value,
                              }))
                            }
                            sx={{ "& input": { fontSize: "13px" } }}
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="HSS NO."
                          value={dispatchShipping.hsn_code}
                          onChange={(e) =>
                            setDispatchShipping((prev) => ({
                              ...prev,
                              hsn_code: e.target.value,
                            }))
                          }
                          placeholder="e.g., IN-DL42659961966116Y"
                          sx={{ "& input": { fontSize: "13px" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="AWB Number"
                          value={dispatchShipping.awb_number}
                          onChange={(e) =>
                            setDispatchShipping((prev) => ({
                              ...prev,
                              awb_number: e.target.value,
                            }))
                          }
                          placeholder="Tracking number"
                          sx={{ "& input": { fontSize: "13px" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Shipping By"
                          value={dispatchShipping.shipping_by}
                          onChange={(e) =>
                            setDispatchShipping((prev) => ({
                              ...prev,
                              shipping_by: e.target.value,
                            }))
                          }
                          placeholder="e.g., FedEx, DHL"
                          sx={{ "& input": { fontSize: "13px" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Shipping Notes (Optional)"
                          value={dispatchShipping.shipping_notes}
                          onChange={(e) =>
                            setDispatchShipping((prev) => ({
                              ...prev,
                              shipping_notes: e.target.value,
                            }))
                          }
                          placeholder="Any additional shipping instructions..."
                          multiline
                          rows={2}
                          sx={{ "& textarea": { fontSize: "13px" } }}
                        />
                      </Grid>
                    </Grid>

                    {dispatchShipping.generate_invoice && (
                      <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2, fontSize: "12px" }}>
                        <strong>Invoice will be generated:</strong> Invoice #{dispatchShipping.invoice_number} will be created automatically upon dispatch with the shipping details above.
                      </Alert>
                    )}
                  </Paper>
                </Box>

                {/* Info Banner */}
                <Box
                  sx={{
                    bgcolor: "#e8f5e9",
                    borderLeft: "4px solid",
                    borderColor: "success.main",
                    p: 1.5,
                    mx: 3,
                    mt: 2,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: "13px" }}>
                      Select products to dispatch. Items will be procured from suppliers. Remaining items will stay in Open Orders.
                    </Typography>
                  </Stack>
                </Box>

                {/* Editable Items Table */}
                <Box
                  sx={{
                    mx: 3,
                    mt: 2,
                    mb: 2,
                    minHeight: "250px",
                    maxHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ fontSize: "15px", mb: 1.5 }}
                  >
                    Products to Dispatch (Editable)
                  </Typography>
                  <TableContainer
                    sx={{
                      border: "1px solid #e0e0e0",
                      flex: 1,
                      overflow: "auto",
                      maxHeight: "350px",
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Product
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Part Number
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Original Qty
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Dispatch Qty
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Unit Price
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Line Total
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: "#f5f5f5",
                              fontWeight: 600,
                              fontSize: "13px",
                              py: 1.5,
                            }}
                          >
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: "13px", fontWeight: 500 }}
                              >
                                {item.product_name}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: "13px" }}
                              >
                                {item.part_number}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: "14px", fontWeight: 500 }}
                              >
                                {item.original_quantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <TextField
                                type="number"
                                size="small"
                                value={item.invoice_quantity}
                                onChange={(e) =>
                                  handleInvoiceQuantityChange(
                                    index,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                slotProps={{
                                  htmlInput: {
                                    min: 0,
                                    max: item.original_quantity,
                                  },
                                }}
                                sx={{
                                  width: 80,
                                  "& input": {
                                    fontSize: "13px",
                                    textAlign: "center",
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Stack spacing={0.5} alignItems="flex-end">
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: "13px", fontWeight: 500 }}
                                >
                                  ${item.unit_price.toFixed(2)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: "11px" }}
                                >
                                  ₹{(item.unit_price * usdToInr).toFixed(2)}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Stack spacing={0.5} alignItems="flex-end">
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  sx={{ fontSize: "13px" }}
                                >
                                  $
                                  {(
                                    item.unit_price * item.invoice_quantity
                                  ).toFixed(2)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: "12px" }}
                                >
                                  ₹
                                  {(
                                    item.unit_price *
                                    item.invoice_quantity *
                                    usdToInr
                                  ).toFixed(2)}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Tooltip
                                title={
                                  invoiceItems.length <= 1
                                    ? "Cannot remove: At least one item required"
                                    : item.has_inventory
                                    ? "Cannot remove: Item has inventory"
                                    : "Remove item"
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveInvoiceItem(index)
                                    }
                                    disabled={
                                      invoiceItems.length <= 1 ||
                                      item.has_inventory
                                    }
                                    sx={{ minWidth: "auto", px: 1 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </Button>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {invoiceItems.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              align="center"
                              sx={{ py: 4 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No items available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Invoice Summary */}
                <Box sx={{ mx: 3, mb: 3 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ fontSize: "14px" }}
                        >
                          Order Summary
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "13px" }}
                            >
                              Original Order Total:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "13px" }}
                            >
                              ${selectedOrder.total_amount.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "13px" }}
                            >
                              Items to Dispatch:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ fontSize: "13px" }}
                            >
                              {
                                invoiceItems.filter(
                                  (item) => item.invoice_quantity > 0
                                ).length
                              }{" "}
                              of {invoiceItems.length}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, bgcolor: "#f5f5f5" }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ fontSize: "14px" }}
                        >
                          Dispatch Total
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ fontSize: "16px" }}
                            >
                              Total:
                            </Typography>
                            <Stack spacing={0} alignItems="flex-end">
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color="primary"
                                sx={{ fontSize: "18px" }}
                              >
                                ${calculateInvoiceTotal().toFixed(2)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: "12px" }}
                              >
                                ₹
                                {(calculateInvoiceTotal() * usdToInr).toFixed(
                                  2
                                )}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#fafafa",
            }}
          >
            <Button
              onClick={() => setShowCollectDueModal(false)}
              disabled={processing}
              sx={{ fontSize: "14px", textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <LocalShipping />}
              onClick={confirmCollectDueAndDispatch}
              disabled={
                processing ||
                invoiceItems.filter((item) => item.invoice_quantity > 0)
                  .length === 0
              }
              sx={{
                fontSize: "14px",
                textTransform: "none",
                px: 3,
                fontWeight: 600,
              }}
            >
              {processing ? "Dispatching..." : dispatchShipping.generate_invoice ? "Dispatch & Generate Invoice" : "Dispatch Products"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default Orders;
