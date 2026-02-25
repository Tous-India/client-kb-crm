import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Business,
  Payment,
  Description,
  ExpandMore,
  ExpandLess,
  Delete,
  Add,
  History,
  Edit,
  TrendingUp,
  LocationOn,
  Receipt,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Alert, Collapse } from "@mui/material";
import { toast } from "react-toastify";
import suppliersService from "../../services/suppliers.service";
import proformaInvoicesService from "../../services/proformaInvoices.service";
import { useCurrency } from "../../context/CurrencyContext";

function PurchaseDashboard() {
  const navigate = useNavigate();
  const { inrRate } = useCurrency();
  const [suppliers, setSuppliers] = useState([]);
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load PI Allocations from localStorage
  const [piAllocations, setPiAllocations] = useState(() => {
    const saved = localStorage.getItem("piAllocations");
    return saved ? JSON.parse(saved) : {};
  });

  // Load purchase INR rate from localStorage (set in PI Allocation page)
  const purchaseRate = parseFloat(localStorage.getItem("purchaseInrRate")) || inrRate || 83;

  // PI Payments state
  const [expandedPI, setExpandedPI] = useState(null);
  const [expandedSupplier, setExpandedSupplier] = useState(null); // For payment history

  // Modal for adding new supplier bill
  const [addSupplierModal, setAddSupplierModal] = useState({ open: false, pi: null });
  const [supplierForm, setSupplierForm] = useState({
    supplier_name: "",
    supplier_id: null,
    bill_amount: "",
  });

  // Modal for adding payment to existing supplier
  const [addPaymentModal, setAddPaymentModal] = useState({ open: false, pi: null, entry: null });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "WIRE_TRANSFER",
    notes: "",
  });

  // Modal for editing bill amount
  const [editBillModal, setEditBillModal] = useState({ open: false, pi: null, entry: null });
  const [editBillAmount, setEditBillAmount] = useState("");

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    confirmColor: "primary",
  });

  // Store PI costs locally (will persist to localStorage)
  // NEW STRUCTURE:
  // {
  //   [piId]: {
  //     entries: [{
  //       id, supplier_id, supplier_name, bill_amount,
  //       payments: [{ id, amount, date, method, notes }]
  //     }],
  //     totalCost, totalPaid
  //   }
  // }
  const [piSupplierCosts, setPiSupplierCosts] = useState(() => {
    const saved = localStorage.getItem("pi_supplier_costs_v2");
    if (saved) {
      return JSON.parse(saved);
    }
    // Migrate from old structure if exists
    const oldData = localStorage.getItem("pi_supplier_costs");
    if (oldData) {
      const oldParsed = JSON.parse(oldData);
      const migrated = {};
      Object.keys(oldParsed).forEach((piId) => {
        const oldEntries = oldParsed[piId]?.entries || [];
        migrated[piId] = {
          entries: oldEntries.map((e) => ({
            id: e.id,
            supplier_id: e.supplier_id,
            supplier_name: e.supplier_name,
            bill_amount: e.purchase_cost || 0,
            payments: e.amount_paid > 0
              ? [{
                  id: Date.now().toString(),
                  amount: e.amount_paid,
                  date: e.payment_date || new Date().toISOString().split("T")[0],
                  method: e.payment_method || "WIRE_TRANSFER",
                  notes: e.notes || "",
                }]
              : [],
          })),
          totalCost: oldParsed[piId]?.totalCost || 0,
          totalPaid: oldParsed[piId]?.totalPaid || 0,
        };
      });
      return migrated;
    }
    return {};
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [suppliersResult, pisResult] = await Promise.all([
        suppliersService.getAll(),
        proformaInvoicesService.getAll({ limit: 500 }),
      ]);

      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data?.suppliers || []);
      }

      if (pisResult.success) {
        const piData = Array.isArray(pisResult.data)
          ? pisResult.data
          : (pisResult.data?.proformaInvoices || []);
        setProformaInvoices(piData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Supplier stats
  const supplierStats = useMemo(() => {
    const active = suppliers.filter((s) => s.status === "ACTIVE").length;
    return { active, total: suppliers.length };
  }, [suppliers]);

  // Simple PI list with manual supplier costs for tracking
  const piListForTracking = useMemo(() => {
    return proformaInvoices.map((pi) => {
      const piId = pi._id;
      const costs = piSupplierCosts[piId] || { entries: [], totalCost: 0, totalPaid: 0 };

      // Calculate totals from entries with payment arrays
      const entries = (costs.entries || []).map((entry) => {
        const totalPaid = (entry.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        return {
          ...entry,
          total_paid: totalPaid,
          balance_due: (entry.bill_amount || 0) - totalPaid,
        };
      });

      const totalCost = entries.reduce((sum, e) => sum + (e.bill_amount || 0), 0);
      const totalPaid = entries.reduce((sum, e) => sum + (e.total_paid || 0), 0);

      return {
        _id: piId,
        pi_number: pi.proforma_number || pi.pi_number || "N/A",
        customer_name: pi.buyer?.name || pi.buyer_name || "N/A",
        pi_date: pi.issue_date || pi.createdAt,
        sell_total: pi.grand_total || pi.total_amount || 0,
        currency: pi.currency || "USD",
        conversion_rate: pi.conversion_rate || 1,
        items: pi.items || [],
        // Manual tracking data
        purchase_cost: totalCost,
        amount_paid: totalPaid,
        balance_due: totalCost - totalPaid,
        profit: (pi.grand_total || pi.total_amount || 0) - totalCost,
        supplier_entries: entries,
      };
    }).sort((a, b) => new Date(b.pi_date) - new Date(a.pi_date));
  }, [proformaInvoices, piSupplierCosts]);

  // Calculate PI-based stats
  const piStats = useMemo(() => {
    const totalSellValue = piListForTracking.reduce((sum, pi) => sum + pi.sell_total, 0);
    const totalPurchaseCost = piListForTracking.reduce((sum, pi) => sum + pi.purchase_cost, 0);
    const totalPaid = piListForTracking.reduce((sum, pi) => sum + pi.amount_paid, 0);
    const totalUnpaid = totalPurchaseCost - totalPaid;
    const totalProfit = totalSellValue - totalPurchaseCost;
    const unpaidCount = piListForTracking.filter((pi) => pi.balance_due > 0).length;

    return { totalSellValue, totalPurchaseCost, totalPaid, totalUnpaid, totalProfit, unpaidCount };
  }, [piListForTracking]);

  // Calculate allocation-based profits per PI
  const allocationProfits = useMemo(() => {
    return proformaInvoices.map((pi) => {
      const piId = pi._id;
      const items = pi.items || [];
      let totalSellingPrice = 0;
      let totalAllocationCost = 0;
      let allocatedItems = 0;
      let totalQty = 0;
      let allocatedQty = 0;
      const supplierBreakdown = {};

      items.forEach((item) => {
        const productId = item._id || item.product_id;
        const key = `${piId}_${productId}`;
        const itemAllocs = piAllocations[key] || [];
        const itemQty = item.quantity || 0;
        const sellingPrice = item.unit_price || 0;

        totalQty += itemQty;
        totalSellingPrice += sellingPrice * itemQty;

        itemAllocs.forEach((alloc) => {
          const qty = parseInt(alloc.quantity) || 0;
          const unitCost = parseFloat(alloc.unit_cost) || 0;
          if (qty > 0 && alloc.supplier_id) {
            allocatedQty += qty;
            totalAllocationCost += unitCost * qty;
            if (qty > 0) allocatedItems++;

            // Track by supplier
            const supplierName = alloc.supplier_name || "Unknown";
            if (!supplierBreakdown[supplierName]) {
              supplierBreakdown[supplierName] = { qty: 0, cost: 0 };
            }
            supplierBreakdown[supplierName].qty += qty;
            supplierBreakdown[supplierName].cost += unitCost * qty;
          }
        });
      });

      const profit = totalSellingPrice - totalAllocationCost;
      const marginPercent = totalSellingPrice > 0 ? ((profit / totalSellingPrice) * 100) : 0;
      const isFullyAllocated = allocatedQty >= totalQty && totalQty > 0;

      return {
        _id: piId,
        pi_number: pi.proforma_number || pi.pi_number || "N/A",
        invoice_number: pi.invoice_number || pi.commercial_invoice_number || "-",
        customer_name: pi.buyer?.name || pi.buyer_name || "N/A",
        location: pi.buyer?.city || pi.shipping_address?.city || pi.buyer?.country || "-",
        pi_date: pi.issue_date || pi.createdAt,
        totalSellingPrice,
        totalAllocationCost,
        profit,
        marginPercent,
        totalQty,
        allocatedQty,
        isFullyAllocated,
        supplierBreakdown,
        currency: pi.currency || "USD",
      };
    })
    .filter((pi) => pi.allocatedQty > 0) // Only show PIs with allocations
    .sort((a, b) => new Date(b.pi_date) - new Date(a.pi_date));
  }, [proformaInvoices, piAllocations]);

  // Allocation stats
  const allocationStats = useMemo(() => {
    const totalProfit = allocationProfits.reduce((sum, pi) => sum + pi.profit, 0);
    const totalSelling = allocationProfits.reduce((sum, pi) => sum + pi.totalSellingPrice, 0);
    const totalCost = allocationProfits.reduce((sum, pi) => sum + pi.totalAllocationCost, 0);
    const fullyAllocatedCount = allocationProfits.filter((pi) => pi.isFullyAllocated).length;
    return { totalProfit, totalSelling, totalCost, fullyAllocatedCount, count: allocationProfits.length };
  }, [allocationProfits]);

  // Save PI costs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("pi_supplier_costs_v2", JSON.stringify(piSupplierCosts));
  }, [piSupplierCosts]);

  // Execute adding supplier (called directly or after confirmation)
  const executeAddSupplier = (piId, billAmount) => {
    const newEntry = {
      id: Date.now().toString(),
      supplier_id: supplierForm.supplier_id,
      supplier_name: supplierForm.supplier_name,
      bill_amount: billAmount,
      payments: [],
      created_at: new Date().toISOString(),
    };

    setPiSupplierCosts((prev) => ({
      ...prev,
      [piId]: {
        entries: [...(prev[piId]?.entries || []), newEntry],
      },
    }));

    toast.success("Supplier added! Now add payments to record transactions.");
    setAddSupplierModal({ open: false, pi: null });
    setSupplierForm({ supplier_name: "", supplier_id: null, bill_amount: "" });
  };

  // Handle adding new supplier with bill amount
  const handleAddSupplier = () => {
    if (!addSupplierModal.pi || !supplierForm.supplier_name || !supplierForm.bill_amount) {
      toast.error("Please select supplier and enter bill amount");
      return;
    }

    const piId = addSupplierModal.pi._id;
    const billAmount = parseFloat(supplierForm.bill_amount) || 0;

    // Check if this supplier already exists for this PI
    const existing = piSupplierCosts[piId] || { entries: [] };
    const existingEntry = existing.entries.find(
      (e) => e.supplier_name === supplierForm.supplier_name || e.supplier_id === supplierForm.supplier_id
    );

    if (existingEntry) {
      toast.warning(`"${supplierForm.supplier_name}" already exists for this PI. Use "Add Payment" to record payments.`);
      return;
    }

    // Check if total cost will exceed sale price (LOSS warning)
    const currentCosts = existing.entries.reduce((sum, e) => sum + (e.bill_amount || 0), 0);
    const salePrice = addSupplierModal.pi.sell_total || 0;
    if (currentCosts + billAmount > salePrice) {
      setConfirmDialog({
        open: true,
        title: "⚠️ LOSS Warning",
        message: `Adding this cost will result in a LOSS!\n\nSale Price: ${formatCurrency(salePrice)}\nCurrent Costs: ${formatCurrency(currentCosts)}\nNew Cost: ${formatCurrency(billAmount)}\nTotal Cost: ${formatCurrency(currentCosts + billAmount)}\nLOSS: ${formatCurrency(currentCosts + billAmount - salePrice)}`,
        confirmText: "Add Anyway",
        confirmColor: "warning",
        onConfirm: () => executeAddSupplier(piId, billAmount),
      });
      return;
    }

    executeAddSupplier(piId, billAmount);
  };

  // Handle adding payment to existing supplier entry
  const handleAddPayment = () => {
    if (!addPaymentModal.pi || !addPaymentModal.entry || !paymentForm.amount) {
      toast.error("Please enter payment amount");
      return;
    }

    const piId = addPaymentModal.pi._id;
    const entryId = addPaymentModal.entry.id;
    const paymentAmount = parseFloat(paymentForm.amount) || 0;

    // Check if payment exceeds remaining due
    const entry = addPaymentModal.entry;
    const currentPaid = (entry.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = (entry.bill_amount || 0) - currentPaid;

    const executePayment = () => {
      const newPayment = {
        id: Date.now().toString(),
        amount: paymentAmount,
        date: paymentForm.payment_date,
        method: paymentForm.payment_method,
        notes: paymentForm.notes,
      };

      setPiSupplierCosts((prev) => {
        const existing = prev[piId] || { entries: [] };
        const updatedEntries = existing.entries.map((e) =>
          e.id === entryId
            ? { ...e, payments: [...(e.payments || []), newPayment] }
            : e
        );
        return { ...prev, [piId]: { entries: updatedEntries } };
      });

      toast.success("Payment recorded!");
      setAddPaymentModal({ open: false, pi: null, entry: null });
      setPaymentForm({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "WIRE_TRANSFER",
        notes: "",
      });
    };

    if (paymentAmount > remaining && remaining > 0) {
      setConfirmDialog({
        open: true,
        title: "⚠️ Overpayment Warning",
        message: `Payment ${formatCurrency(paymentAmount)} exceeds remaining balance ${formatCurrency(remaining)}.\n\nThis will result in overpayment.`,
        confirmText: "Pay Anyway",
        confirmColor: "warning",
        onConfirm: executePayment,
      });
      return;
    }

    executePayment();
  };

  // Handle editing bill amount
  const handleEditBill = () => {
    if (!editBillModal.pi || !editBillModal.entry || !editBillAmount) {
      toast.error("Please enter bill amount");
      return;
    }

    const piId = editBillModal.pi._id;
    const entryId = editBillModal.entry.id;
    const newBillAmount = parseFloat(editBillAmount) || 0;

    setPiSupplierCosts((prev) => {
      const existing = prev[piId] || { entries: [] };
      const updatedEntries = existing.entries.map((e) =>
        e.id === entryId ? { ...e, bill_amount: newBillAmount } : e
      );
      return { ...prev, [piId]: { entries: updatedEntries } };
    });

    toast.success("Bill amount updated!");
    setEditBillModal({ open: false, pi: null, entry: null });
    setEditBillAmount("");
  };

  // Handle deleting a payment
  const handleDeletePayment = (piId, entryId, paymentId) => {
    setPiSupplierCosts((prev) => {
      const existing = prev[piId] || { entries: [] };
      const updatedEntries = existing.entries.map((e) =>
        e.id === entryId
          ? { ...e, payments: (e.payments || []).filter((p) => p.id !== paymentId) }
          : e
      );
      return { ...prev, [piId]: { entries: updatedEntries } };
    });
    toast.success("Payment deleted!");
  };

  // Handle deleting entire supplier entry
  const handleDeleteEntry = (piId, entryId, supplierName) => {
    setConfirmDialog({
      open: true,
      title: "Delete Supplier",
      message: `Are you sure you want to delete "${supplierName || 'this supplier'}" and all its payment records?`,
      confirmText: "Delete",
      confirmColor: "error",
      onConfirm: () => {
        setPiSupplierCosts((prev) => {
          const existing = prev[piId] || { entries: [] };
          const updatedEntries = existing.entries.filter((e) => e.id !== entryId);
          return { ...prev, [piId]: { entries: updatedEntries } };
        });
        toast.success("Supplier entry deleted!");
      },
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Purchase Dashboard
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { borderColor: "#1976d2" },
            }}
            onClick={() => navigate("/admin/suppliers")}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Business color="primary" fontSize="small" />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Active Suppliers
              </Typography>
            </Stack>
            <Typography variant="h4" fontWeight={600} color="primary.main" sx={{ mb: 0.5 }}>
              {supplierStats.active}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {supplierStats.total} total
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="caption" color="info.main" fontWeight={600}>
              TOTAL SALES
            </Typography>
            <Typography variant="h4" fontWeight={600} color="info.main">
              {formatCurrency(piStats.totalSellValue)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px" }}>
              ₹{(piStats.totalSellValue * purchaseRate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {proformaInvoices.length} PIs
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              TOTAL COST
            </Typography>
            <Typography variant="h4" fontWeight={600} color="warning.main">
              {formatCurrency(piStats.totalPurchaseCost)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px" }}>
              ₹{(piStats.totalPurchaseCost * purchaseRate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              supplier bills
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              PAID
            </Typography>
            <Typography variant="h4" fontWeight={600} color="success.main">
              {formatCurrency(piStats.totalPaid)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px" }}>
              ₹{(piStats.totalPaid * purchaseRate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              to suppliers
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              bgcolor: piStats.totalUnpaid > 0 ? "#fff3e0" : "inherit",
            }}
          >
            <Typography variant="caption" color="error.main" fontWeight={600}>
              UNPAID
            </Typography>
            <Typography variant="h4" fontWeight={600} color="error.main">
              {formatCurrency(piStats.totalUnpaid)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px" }}>
              ₹{(piStats.totalUnpaid * purchaseRate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {piStats.unpaidCount} pending
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Allocation Profits Section */}
      {allocationProfits.length > 0 && (
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", bgcolor: "#e8f5e9" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingUp color="success" />
                  <Typography variant="h6" fontWeight={600} color="success.dark">
                    Allocation Profit Summary
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Profit calculated from PI Allocation page • {allocationStats.count} PIs allocated
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Box sx={{ textAlign: "center", px: 2, py: 1, bgcolor: "#fff", borderRadius: 1, border: "1px solid #c8e6c9" }}>
                  <Typography variant="caption" color="text.secondary">Total Sale</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    {formatCurrency(allocationStats.totalSelling)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center", px: 2, py: 1, bgcolor: "#fff", borderRadius: 1, border: "1px solid #c8e6c9" }}>
                  <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                  <Typography variant="h6" fontWeight={600} color="warning.main">
                    {formatCurrency(allocationStats.totalCost)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center", px: 2, py: 1, bgcolor: allocationStats.totalProfit >= 0 ? "#e8f5e9" : "#ffebee", borderRadius: 1, border: `1px solid ${allocationStats.totalProfit >= 0 ? "#a5d6a7" : "#ef9a9a"}` }}>
                  <Typography variant="caption" color={allocationStats.totalProfit >= 0 ? "success.main" : "error.main"}>
                    {allocationStats.totalProfit >= 0 ? "Total Profit" : "Total Loss"}
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color={allocationStats.totalProfit >= 0 ? "success.main" : "error.main"}>
                    {formatCurrency(Math.abs(allocationStats.totalProfit))}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>PI #</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Invoice</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <LocationOn sx={{ fontSize: 14 }} />
                      <span>Location</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Sale ($)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Cost ($)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Cost (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Profit</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Margin</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: "12px", py: 1.5 }}>Allocated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocationProfits.map((pi) => (
                  <TableRow key={pi._id} hover sx={{ "&:hover": { bgcolor: "#f9fbe7" } }}>
                    <TableCell sx={{ fontSize: "12px", py: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {pi.pi_number}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "12px", py: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Receipt sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="body2">{pi.invoice_number}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: "12px", py: 1 }}>
                      <Typography variant="body2">{pi.customer_name}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "12px", py: 1 }}>
                      <Chip
                        icon={<LocationOn sx={{ fontSize: "12px !important" }} />}
                        label={pi.location}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: "11px" }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "12px", py: 1 }}>
                      <Typography variant="body2" fontWeight={500} color="info.main">
                        {formatCurrency(pi.totalSellingPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "12px", py: 1 }}>
                      <Typography variant="body2" fontWeight={500} color="warning.main">
                        {formatCurrency(pi.totalAllocationCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "12px", py: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        ₹{(pi.totalAllocationCost * purchaseRate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "12px", py: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={pi.profit >= 0 ? "success.main" : "error.main"}
                      >
                        {pi.profit >= 0 ? "+" : ""}{formatCurrency(pi.profit)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "12px", py: 1 }}>
                      <Chip
                        label={`${pi.marginPercent.toFixed(0)}%`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "11px",
                          fontWeight: 600,
                          bgcolor: pi.marginPercent >= 20 ? "#e8f5e9" : pi.marginPercent >= 0 ? "#fff8e1" : "#ffebee",
                          color: pi.marginPercent >= 20 ? "#2e7d32" : pi.marginPercent >= 0 ? "#f57f17" : "#c62828",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "12px", py: 1 }}>
                      <Chip
                        label={pi.isFullyAllocated ? "Full" : `${pi.allocatedQty}/${pi.totalQty}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "11px",
                          bgcolor: pi.isFullyAllocated ? "#e8f5e9" : "#fff3e0",
                          color: pi.isFullyAllocated ? "#2e7d32" : "#e65100",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Add Supplier Modal */}
      <Dialog
        open={addSupplierModal.open}
        onClose={() => setAddSupplierModal({ open: false, pi: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
          Add Supplier Bill for {addSupplierModal.pi?.pi_number || "PI"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <Autocomplete
              fullWidth
              options={suppliers}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option?.supplier_name || "";
              }}
              value={suppliers.find((s) => s.supplier_name === supplierForm.supplier_name) || null}
              onChange={(e, newValue) => {
                setSupplierForm({
                  ...supplierForm,
                  supplier_name: newValue?.supplier_name || "",
                  supplier_id: newValue?._id || null,
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Supplier" placeholder="Choose a supplier" required />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option._id}>
                  <Typography variant="body2" fontWeight={500}>
                    {option.supplier_name}
                  </Typography>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
              noOptionsText="No suppliers found"
            />

            <Box>
              <TextField
                fullWidth
                label="Bill Amount"
                type="number"
                value={supplierForm.bill_amount}
                onChange={(e) => setSupplierForm({ ...supplierForm, bill_amount: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                  inputLabel: { shrink: true },
                }}
                required
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Total bill/invoice amount from this supplier
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#e3f2fd", borderColor: "#90caf9" }}>
              <Typography variant="body2" color="primary.main">
                💡 After adding the supplier, use "Add Payment" to record individual payments.
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setAddSupplierModal({ open: false, pi: null })}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddSupplier}
            disabled={!supplierForm.supplier_name || !supplierForm.bill_amount}
            startIcon={<Add />}
          >
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog
        open={addPaymentModal.open}
        onClose={() => setAddPaymentModal({ open: false, pi: null, entry: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
          Add Payment - {addPaymentModal.entry?.supplier_name || "Supplier"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* PI Info with Conversion Rate */}
          {addPaymentModal.pi && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "#f9f9f9" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">PI Number</Typography>
                  <Typography variant="body2" fontWeight={600}>{addPaymentModal.pi.pi_number}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Currency</Typography>
                  <Typography variant="body2" fontWeight={600}>{addPaymentModal.pi.currency || "USD"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Conversion Rate</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    1 {addPaymentModal.pi.currency || "USD"} = ₹{addPaymentModal.pi.conversion_rate || 1}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Supplier Bill Summary */}
          {addPaymentModal.entry && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                bgcolor: addPaymentModal.entry.balance_due > 0 ? "#fff8e1" : "#e8f5e9",
                borderColor: addPaymentModal.entry.balance_due > 0 ? "warning.main" : "success.main",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">Bill Amount</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(addPaymentModal.entry.bill_amount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="success.main">Paid</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">
                    {formatCurrency(addPaymentModal.entry.total_paid || 0)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color={addPaymentModal.entry.balance_due > 0 ? "error.main" : "success.main"}>
                    Due
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color={addPaymentModal.entry.balance_due > 0 ? "error.main" : "success.main"}
                  >
                    {formatCurrency(addPaymentModal.entry.balance_due || 0)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
                inputLabel: { shrink: true },
              }}
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentForm.payment_method}
                label="Payment Method"
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              >
                <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                <MenuItem value="CHECK">Check</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes (optional)"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Transaction ID, reference, etc."
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setAddPaymentModal({ open: false, pi: null, entry: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddPayment}
            disabled={!paymentForm.amount}
            startIcon={<Payment />}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Bill Amount Modal */}
      <Dialog
        open={editBillModal.open}
        onClose={() => setEditBillModal({ open: false, pi: null, entry: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
          Edit Bill Amount - {editBillModal.entry?.supplier_name || "Supplier"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Bill Amount"
            type="number"
            value={editBillAmount}
            onChange={(e) => setEditBillAmount(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
              inputLabel: { shrink: true },
            }}
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setEditBillModal({ open: false, pi: null, entry: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditBill}
            disabled={!editBillAmount}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-line" }}
          >
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.confirmColor || "primary"}
            onClick={() => {
              confirmDialog.onConfirm?.();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
          >
            {confirmDialog.confirmText || "OK"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default PurchaseDashboard;
