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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Alert, Collapse } from "@mui/material";
import { toast } from "react-toastify";
import suppliersService from "../../services/suppliers.service";
import proformaInvoicesService from "../../services/proformaInvoices.service";

function PurchaseDashboard() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <Typography variant="h4" fontWeight={600} color="info.main" sx={{ mb: 0.5 }}>
              {formatCurrency(piStats.totalSellValue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {proformaInvoices.length} PIs
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              TOTAL COST
            </Typography>
            <Typography variant="h4" fontWeight={600} color="warning.main" sx={{ mb: 0.5 }}>
              {formatCurrency(piStats.totalPurchaseCost)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              supplier bills
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              PAID
            </Typography>
            <Typography variant="h4" fontWeight={600} color="success.main" sx={{ mb: 0.5 }}>
              {formatCurrency(piStats.totalPaid)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
            <Typography variant="h4" fontWeight={600} color="error.main" sx={{ mb: 0.5 }}>
              {formatCurrency(piStats.totalUnpaid)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {piStats.unpaidCount} pending
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* PI Payments Table */}
      <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", bgcolor: "#f5f5f5" }}>
          <Typography variant="h6" fontWeight={600}>
            Supplier Costs by PI
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Click a PI to add supplier bills. <strong>SALE - COST = PROFIT</strong>
          </Typography>
        </Box>

        {piListForTracking.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Description color="disabled" sx={{ fontSize: 40, mb: 1 }} />
            <Typography color="text.secondary">No Proforma Invoices yet</Typography>
          </Box>
        ) : (
          <Box>
            {piListForTracking.map((pi) => {
              const isExpanded = expandedPI === pi._id;
              const hasEntries = pi.supplier_entries.length > 0;

              return (
                <Box
                  key={pi._id}
                  sx={{
                    borderBottom: "1px solid #e0e0e0",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  {/* PI Header Row */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      cursor: "pointer",
                      bgcolor: isExpanded ? "#f5f5f5" : "transparent",
                      "&:hover": { bgcolor: "#fafafa" },
                    }}
                    onClick={() => setExpandedPI(isExpanded ? null : pi._id)}
                  >
                    <IconButton size="small" sx={{ mr: 1 }}>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>

                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                          {pi.pi_number}
                        </Typography>
                        <Chip label={pi.customer_name} size="small" variant="outlined" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(pi.pi_date)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {pi.items?.length || 0} items • {pi.supplier_entries.length} supplier entries
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ textAlign: "center", px: 1.5, py: 0.5, bgcolor: "#e3f2fd", borderRadius: 1, minWidth: 80 }}>
                        <Typography variant="caption" color="primary.main" fontWeight={500}>
                          SALE
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {formatCurrency(pi.sell_total)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">−</Typography>
                      <Box sx={{ textAlign: "center", px: 1.5, py: 0.5, bgcolor: "#fff3e0", borderRadius: 1, minWidth: 80 }}>
                        <Typography variant="caption" color="warning.dark" fontWeight={500}>
                          COST
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="warning.dark">
                          {formatCurrency(pi.purchase_cost)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">=</Typography>
                      <Box sx={{ textAlign: "center", px: 1.5, py: 0.5, bgcolor: pi.profit >= 0 ? "#e8f5e9" : "#ffebee", borderRadius: 1, minWidth: 80, border: pi.profit < 0 ? "2px solid #f44336" : "none" }}>
                        <Typography variant="caption" color={pi.profit >= 0 ? "success.main" : "error.main"} fontWeight={500}>
                          {pi.profit >= 0 ? "PROFIT" : "⚠️ LOSS"}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={pi.profit >= 0 ? "success.main" : "error.main"}
                        >
                          {formatCurrency(Math.abs(pi.profit))}
                        </Typography>
                      </Box>
                      <Box sx={{ borderLeft: "1px solid #ddd", pl: 1.5, ml: 1 }}>
                        <Stack direction="row" spacing={1.5}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" color="success.main" fontWeight={500}>
                              PAID
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {formatCurrency(pi.amount_paid)}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" color={pi.balance_due > 0 ? "error.main" : "success.main"} fontWeight={500}>
                              DUE
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={pi.balance_due > 0 ? "error.main" : "success.main"}
                            >
                              {formatCurrency(pi.balance_due)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Expanded Details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ px: 3, pb: 2, bgcolor: "#fafafa" }}>
                      {/* LOSS Warning */}
                      {pi.profit < 0 && (
                        <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            ⚠️ LOSS WARNING: Your cost ({formatCurrency(pi.purchase_cost)}) is more than sale ({formatCurrency(pi.sell_total)}).
                            You are losing {formatCurrency(Math.abs(pi.profit))} on this PI!
                          </Typography>
                        </Alert>
                      )}

                      {/* Add Supplier Button */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, mt: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Supplier Bills & Payments
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Add />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddSupplierModal({ open: true, pi });
                          }}
                          sx={{ textTransform: "none" }}
                        >
                          + Add Supplier
                        </Button>
                      </Stack>

                      {!hasEntries ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          No suppliers added. Click "+ Add Supplier" to record a supplier bill.
                        </Alert>
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          {pi.supplier_entries.map((entry) => {
                            const isSupplierExpanded = expandedSupplier === `${pi._id}-${entry.id}`;
                            const paymentCount = (entry.payments || []).length;

                            return (
                              <Paper
                                key={entry.id}
                                variant="outlined"
                                sx={{ mb: 1.5, overflow: "hidden" }}
                              >
                                {/* Supplier Header */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    p: 1.5,
                                    bgcolor: "#f9f9f9",
                                    borderBottom: isSupplierExpanded ? "1px solid #e0e0e0" : "none",
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {entry.supplier_name}
                                    </Typography>
                                  </Box>

                                  <Stack direction="row" spacing={2} alignItems="center">
                                    {/* Bill Amount */}
                                    <Box sx={{ textAlign: "right", minWidth: 90 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        BILL
                                      </Typography>
                                      <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography variant="body2" fontWeight={600}>
                                          {formatCurrency(entry.bill_amount)}
                                        </Typography>
                                        <Tooltip title="Edit bill amount">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setEditBillModal({ open: true, pi, entry });
                                              setEditBillAmount(entry.bill_amount?.toString() || "");
                                            }}
                                            sx={{ p: 0.25 }}
                                          >
                                            <Edit sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    </Box>

                                    {/* Total Paid */}
                                    <Box sx={{ textAlign: "right", minWidth: 80 }}>
                                      <Typography variant="caption" color="success.main">
                                        PAID
                                      </Typography>
                                      <Typography variant="body2" fontWeight={600} color="success.main">
                                        {formatCurrency(entry.total_paid)}
                                      </Typography>
                                    </Box>

                                    {/* Due */}
                                    <Box sx={{ textAlign: "right", minWidth: 80 }}>
                                      <Typography
                                        variant="caption"
                                        color={entry.balance_due > 0 ? "error.main" : "success.main"}
                                      >
                                        DUE
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color={entry.balance_due > 0 ? "error.main" : "success.main"}
                                      >
                                        {formatCurrency(entry.balance_due)}
                                      </Typography>
                                    </Box>

                                    {/* Actions */}
                                    <Stack direction="row" spacing={0.5}>
                                      <Tooltip title="Add payment">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => setAddPaymentModal({ open: true, pi, entry })}
                                        >
                                          <Payment fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title={paymentCount > 0 ? `View ${paymentCount} payment(s)` : "No payments"}>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            setExpandedSupplier(
                                              isSupplierExpanded ? null : `${pi._id}-${entry.id}`
                                            )
                                          }
                                          disabled={paymentCount === 0}
                                        >
                                          <History fontSize="small" />
                                          {paymentCount > 0 && (
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                position: "absolute",
                                                top: -2,
                                                right: -2,
                                                bgcolor: "primary.main",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: 16,
                                                height: 16,
                                                fontSize: 10,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              {paymentCount}
                                            </Typography>
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete supplier">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteEntry(pi._id, entry.id, entry.supplier_name)}
                                        >
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </Stack>
                                </Box>

                                {/* Payment History (Collapsible) */}
                                <Collapse in={isSupplierExpanded}>
                                  <Box sx={{ p: 1.5, bgcolor: "#fff" }}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                                      PAYMENT HISTORY
                                    </Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                          <TableCell sx={{ fontWeight: 600, py: 0.75 }}>Date</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, py: 0.75 }}>Amount</TableCell>
                                          <TableCell sx={{ fontWeight: 600, py: 0.75 }}>Method</TableCell>
                                          <TableCell sx={{ fontWeight: 600, py: 0.75 }}>Notes</TableCell>
                                          <TableCell align="center" sx={{ fontWeight: 600, py: 0.75, width: 40 }}></TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {(entry.payments || []).map((payment) => (
                                          <TableRow key={payment.id} hover>
                                            <TableCell sx={{ py: 0.75 }}>
                                              {formatDate(payment.date)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 0.75 }}>
                                              <Typography variant="body2" fontWeight={500} color="success.main">
                                                {formatCurrency(payment.amount)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 0.75 }}>
                                              <Chip
                                                label={payment.method?.replace("_", " ")}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 22 }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ py: 0.75 }}>
                                              <Typography variant="body2" color="text.secondary">
                                                {payment.notes || "-"}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 0.75 }}>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeletePayment(pi._id, entry.id, payment.id)}
                                                sx={{ p: 0.25 }}
                                              >
                                                <Delete sx={{ fontSize: 16 }} />
                                              </IconButton>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </Paper>
                            );
                          })}
                        </Box>
                      )}

                      {/* PI Items */}
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                        PI Items ({pi.items?.length || 0})
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                              <TableCell sx={{ fontWeight: 600 }}>Part #</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>
                                Qty
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                Unit Price
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                Total
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(pi.items || []).map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={500} color="primary.main">
                                    {item.part_number}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {item.product_name || item.description}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">{item.quantity}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {formatCurrency(item.unit_price)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={500}>
                                    {formatCurrency(item.total || item.quantity * item.unit_price)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

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
