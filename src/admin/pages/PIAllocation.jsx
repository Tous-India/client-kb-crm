import { useState, useEffect, useMemo, memo } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Snackbar,
  Chip,
} from "@mui/material";
import {
  Search,
  ArrowBack,
  Download,
  Save,
  CheckCircle,
} from "@mui/icons-material";
import { CircularProgress, Alert } from "@mui/material";
import suppliersService from "../../services/suppliers.service";
import piAllocationsService from "../../services/piAllocations.service";
import proformaInvoicesService from "../../services/proformaInvoices.service";
import { useCurrency } from "../../context/CurrencyContext";

// Payment options for supplier allocation
const paymentOptions = [
  { value: "ADVANCE", label: "Adv" },
  { value: "COD", label: "COD" },
  { value: "CREDIT_30", label: "30D" },
  { value: "CREDIT_60", label: "60D" },
  { value: "CREDIT_90", label: "90D" },
];

// Compact supplier selection component - moved outside to prevent re-creation on each render
const SupplierSelect = memo(({
  piId,
  productId,
  slot,
  maxQty,
  disabled,
  sellingPrice,
  alloc,
  remaining,
  activeSuppliers,
  updateAllocation,
  inrRate
}) => {
  const currentQty = parseInt(alloc.quantity) || 0;
  const maxAllowed = remaining + currentQty;
  const selectedSupplier = activeSuppliers.find((s) => s.supplier_id === alloc.supplier_id);

  // Calculate profit/loss
  const unitCost = parseFloat(alloc.unit_cost) || 0;
  const qty = parseInt(alloc.quantity) || 0;
  const totalCost = unitCost * qty;
  const totalSelling = (sellingPrice || 0) * qty;
  const profitLoss = totalSelling - totalCost;
  const marginPercent = totalSelling > 0 ? ((profitLoss / totalSelling) * 100).toFixed(0) : 0;
  const hasData = alloc.supplier_id && qty > 0 && unitCost > 0;

  // INR conversion
  const totalCostInr = totalCost * (inrRate || 83);

  return (
    <Box
      sx={{
        p: 0.5,
        borderRadius: 1,
        bgcolor: hasData ? (profitLoss >= 0 ? "#f0fdf4" : "#fef2f2") : "#fff",
        border: "1px solid",
        borderColor: hasData ? (profitLoss >= 0 ? "#bbf7d0" : "#fecaca") : "#e5e7eb",
        minWidth: 128,
      }}
    >
      {/* Supplier Dropdown */}
      <Autocomplete
        size="small"
        options={activeSuppliers}
        getOptionLabel={(opt) => opt.supplier_name || ""}
        value={selectedSupplier || null}
        onChange={(e, val) => updateAllocation(piId, productId, slot, "supplier_id", val?.supplier_id || "")}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Supplier"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "12px",
                minHeight: 28,
                bgcolor: "white",
                "& fieldset": { borderColor: "#e5e7eb" }
              },
              "& input": { py: "2px !important", px: "6px !important" }
            }}
          />
        )}
        renderOption={(props, opt) => (
          <Box component="li" {...props} key={opt.supplier_id} sx={{ py: 0.5 }}>
            <Typography sx={{ fontSize: "12px" }}>{opt.supplier_name}</Typography>
          </Box>
        )}
        sx={{ mb: 0.5 }}
      />

      {/* Cost, Qty, Payment Row */}
      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="space-between">
        <TextField
          size="small"
          type="number"
          placeholder="$"
          value={alloc.unit_cost || ""}
          onChange={(e) => updateAllocation(piId, productId, slot, "unit_cost", e.target.value)}
          disabled={disabled || !alloc.supplier_id}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              bgcolor: "white",
              minHeight: 26,
              "& fieldset": { borderColor: "#e5e7eb" }
            },
            "& input": { py: "2px", px: "4px", fontSize: "12px", textAlign: "center" }
          }}
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        />
        <TextField
          size="small"
          type="number"
          placeholder="Q"
          value={alloc.quantity || ""}
          onChange={(e) => {
            const val = Math.min(parseInt(e.target.value) || 0, maxAllowed);
            updateAllocation(piId, productId, slot, "quantity", val || "");
          }}
          disabled={disabled || !alloc.supplier_id}
          sx={{
            width: 36,
            "& .MuiOutlinedInput-root": {
              bgcolor: "white",
              minHeight: 26,
              "& fieldset": { borderColor: "#e5e7eb" }
            },
            "& input": { py: "2px", px: "4px", fontSize: "12px", textAlign: "center" }
          }}
          slotProps={{ htmlInput: { min: 0, max: maxAllowed } }}
        />
        <FormControl size="small" sx={{ minWidth: 44 }}>
          <Select
            value={alloc.payment_term || ""}
            onChange={(e) => updateAllocation(piId, productId, slot, "payment_term", e.target.value)}
            disabled={disabled || !alloc.supplier_id}
            displayEmpty
            sx={{
              fontSize: "12px",
              bgcolor: "white",
              minHeight: 26,
              "& .MuiSelect-select": { py: "2px", px: "4px" },
              "& fieldset": { borderColor: "#e5e7eb" }
            }}
          >
            <MenuItem value="" sx={{ fontSize: "12px" }}>-</MenuItem>
            {paymentOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "12px" }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Profit/Loss Summary - Only show when data exists */}
      {hasData && (
        <Stack sx={{ mt: 0.5, pt: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>
              ${totalCost.toFixed(2)}
            </Typography>
            <Typography sx={{
              fontSize: "12px",
              fontWeight: 700,
              color: profitLoss >= 0 ? "#16a34a" : "#dc2626"
            }}>
              {profitLoss >= 0 ? "+" : ""}{marginPercent}%
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>
            ₹{totalCostInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </Typography>
        </Stack>
      )}
    </Box>
  );
});

function PIAllocation() {
  const { inrRate } = useCurrency();
  const [pis, setPis] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state - null = PI list, PI object = item allocation view
  const [selectedPI, setSelectedPI] = useState(null);

  // Allocations state
  const [allocations, setAllocations] = useState({});

  // Purchase conversion rate (separate from sales rate)
  const [purchaseRate, setPurchaseRate] = useState(() => {
    const saved = localStorage.getItem("purchaseInrRate");
    return saved ? parseFloat(saved) : (inrRate || 83);
  });

  // Saving states
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Track saved PIs (to show checkmark)
  const [savedPIs, setSavedPIs] = useState(new Set());

  // Save purchase rate to localStorage
  useEffect(() => {
    localStorage.setItem("purchaseInrRate", purchaseRate.toString());
  }, [purchaseRate]);

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    try {
      const result = await suppliersService.getAll();
      if (result.success) {
        setSuppliers(result.data?.suppliers || []);
      } else {
        console.error("Failed to fetch suppliers:", result.error);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  // Fetch proforma invoices from API
  const fetchProformaInvoices = async () => {
    try {
      // Use getAll instead of getForAllocation to get all PIs
      const result = await proformaInvoicesService.getAll({ limit: 500 });
      if (result.success) {
        // API returns array directly in result.data
        const piData = Array.isArray(result.data) ? result.data : (result.data?.proformaInvoices || []);
        setPis(piData);
      } else {
        console.error("Failed to fetch proforma invoices:", result.error);
        setError("Failed to load proforma invoices");
      }
    } catch (err) {
      console.error("Error fetching proforma invoices:", err);
      setError("Failed to load proforma invoices");
    }
  };

  // Load existing allocations from API
  const loadAllocationsFromAPI = async () => {
    try {
      const result = await piAllocationsService.getAll();
      if (result.success && result.data?.allocations) {
        // Convert API format to local format
        const apiAllocations = {};
        result.data.allocations.forEach((alloc) => {
          const key = `${alloc.proforma_invoice?._id || alloc.proforma_invoice}_${alloc.product_id || alloc.item_index}`;
          if (!apiAllocations[key]) {
            apiAllocations[key] = [{}, {}, {}];
          }
          // Find empty slot or add to existing
          const slotIndex = apiAllocations[key].findIndex(s => !s.supplier_id);
          if (slotIndex !== -1) {
            apiAllocations[key][slotIndex] = {
              supplier_id: alloc.supplier_id || alloc.supplier?.supplier_id,
              supplier_name: alloc.supplier_name || alloc.supplier?.supplier_name,
              quantity: alloc.quantity_allocated,
              _id: alloc._id,
            };
          }
        });
        return apiAllocations;
      }
    } catch (err) {
      console.error("Error loading allocations from API:", err);
    }
    return {};
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch suppliers and proforma invoices from API in parallel
        await Promise.all([
          fetchSuppliers(),
          fetchProformaInvoices(),
        ]);

        // Load saved allocations from localStorage first (for UI responsiveness)
        const saved = localStorage.getItem("piAllocations");
        if (saved) setAllocations(JSON.parse(saved));

        // Then try to load from API and merge
        const apiAllocations = await loadAllocationsFromAPI();
        if (Object.keys(apiAllocations).length > 0) {
          setAllocations(prev => ({ ...prev, ...apiAllocations }));
        }
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (Object.keys(allocations).length > 0) {
      localStorage.setItem("piAllocations", JSON.stringify(allocations));
    }
  }, [allocations]);

  // Active suppliers only
  const activeSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.status === "ACTIVE");
  }, [suppliers]);

  // Filter PIs
  const filteredPIs = useMemo(() => {
    return pis.filter((pi) => {
      const customerName = pi.buyer?.name || pi.buyer_name || "";
      const piNumber = pi.proforma_number || pi.performa_invoice_number || "";

      const matchesSearch =
        !searchQuery ||
        piNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        pi.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [pis, searchQuery, statusFilter]);

  // Get allocation for a specific item and slot (1, 2, or 3)
  const getAllocation = (piId, productId, slot) => {
    const key = `${piId}_${productId}`;
    const itemAllocs = allocations[key] || [];
    return itemAllocs[slot - 1] || { supplier_id: "", quantity: "", payment_term: "", unit_cost: "" };
  };

  // Update allocation
  const updateAllocation = (piId, productId, slot, field, value) => {
    const key = `${piId}_${productId}`;

    setAllocations((prev) => {
      const itemAllocs = [...(prev[key] || [{}, {}, {}, {}])];

      // Ensure array has 4 slots
      while (itemAllocs.length < 4) {
        itemAllocs.push({ supplier_id: "", quantity: "", payment_term: "", unit_cost: "" });
      }

      if (field === "supplier_id") {
        const supplier = suppliers.find((s) => s.supplier_id === value);
        itemAllocs[slot - 1] = {
          ...itemAllocs[slot - 1],
          supplier_id: value,
          supplier_name: supplier?.supplier_name || "",
        };
      } else {
        itemAllocs[slot - 1] = {
          ...itemAllocs[slot - 1],
          [field]: value,
        };
      }

      return { ...prev, [key]: itemAllocs };
    });
  };

  // Calculate totals for an item
  const getItemTotals = (piId, productId, totalQty) => {
    const key = `${piId}_${productId}`;
    const itemAllocs = allocations[key] || [];
    const allocated = itemAllocs.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0);
    return { allocated, remaining: totalQty - allocated };
  };

  // Get PI allocation status
  const getPIAllocationStatus = (pi) => {
    if (!pi.items?.length) return "none";

    let totalQty = 0;
    let allocatedQty = 0;

    const piId = pi._id || pi.performa_invoice_id;
    pi.items.forEach((item) => {
      const productId = item.product_id || item._id || `item_${pi.items.indexOf(item)}`;
      const { allocated } = getItemTotals(piId, productId, item.quantity);
      totalQty += item.quantity;
      allocatedQty += Math.min(allocated, item.quantity);
    });

    if (allocatedQty === 0) return "none";
    if (allocatedQty >= totalQty) return "complete";
    return "partial";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}`;
  };

  // Get supplier details
  const getSupplier = (supplierId) => {
    return suppliers.find((s) => s.supplier_id === supplierId);
  };

  // Get all suppliers with allocations for current PI
  const getSuppliersWithAllocations = () => {
    if (!selectedPI) return [];

    const supplierMap = new Map();
    const piId = selectedPI._id || selectedPI.performa_invoice_id;

    selectedPI.items?.forEach((item, idx) => {
      const productId = item.product_id || item._id || `item_${idx}`;
      const key = `${piId}_${productId}`;
      const itemAllocs = allocations[key] || [];

      itemAllocs.forEach((alloc) => {
        if (alloc.supplier_id && alloc.quantity) {
          if (!supplierMap.has(alloc.supplier_id)) {
            const supplier = getSupplier(alloc.supplier_id);
            supplierMap.set(alloc.supplier_id, {
              supplier,
              items: [],
              totalQty: 0,
            });
          }
          const supplierData = supplierMap.get(alloc.supplier_id);
          supplierData.items.push({
            part_number: item.part_number,
            product_name: item.product_name,
            quantity: parseInt(alloc.quantity) || 0,
            unit_cost: item.unit_price || 0,
          });
          supplierData.totalQty += parseInt(alloc.quantity) || 0;
        }
      });
    });

    return Array.from(supplierMap.values());
  };

  // Save allocations to backend
  const saveAllocationsToBackend = async () => {
    if (!selectedPI) return;

    setSaving(true);
    try {
      const allocationsToSave = [];
      const piId = selectedPI._id || selectedPI.performa_invoice_id;

      selectedPI.items?.forEach((item, itemIndex) => {
        const productId = item.product_id || item._id || `item_${itemIndex}`;
        const key = `${piId}_${productId}`;
        const itemAllocs = allocations[key] || [];

        itemAllocs.forEach((alloc, slotIndex) => {
          if (alloc.supplier_id && alloc.quantity && parseInt(alloc.quantity) > 0) {
            // Find supplier MongoDB _id from supplier_id string
            const supplier = suppliers.find(s => s.supplier_id === alloc.supplier_id);

            allocationsToSave.push({
              proforma_invoice: selectedPI._id,
              supplier: supplier?._id,
              supplier_id: alloc.supplier_id,
              supplier_name: alloc.supplier_name || supplier?.supplier_name,
              item_index: itemIndex,
              product_id: productId,
              part_number: item.part_number,
              product_name: item.product_name,
              quantity_total: item.quantity,
              quantity_allocated: parseInt(alloc.quantity),
              unit_cost: item.unit_price || 0,
              total_cost: (item.unit_price || 0) * parseInt(alloc.quantity),
              status: "ALLOCATED",
            });
          }
        });
      });

      if (allocationsToSave.length === 0) {
        setSnackbar({ open: true, message: "No allocations to save", severity: "warning" });
        return;
      }

      const result = await piAllocationsService.bulkSave(allocationsToSave);

      if (result.success) {
        setSnackbar({ open: true, message: `Saved ${allocationsToSave.length} allocations successfully!`, severity: "success" });
        setSavedPIs(prev => new Set([...prev, piId]));
      } else {
        setSnackbar({ open: true, message: result.error || "Failed to save allocations", severity: "error" });
      }
    } catch (err) {
      console.error("Error saving allocations:", err);
      setSnackbar({ open: true, message: "Failed to save allocations", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF for a supplier
  const generateSupplierPDF = (supplierData) => {
    const { supplier, items, totalQty } = supplierData;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order - ${supplier?.supplier_name || "Supplier"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1976d2; }
          .company { }
          .company h1 { font-size: 24px; color: #1976d2; margin-bottom: 4px; }
          .company p { font-size: 12px; color: #666; }
          .doc-info { text-align: right; }
          .doc-info h2 { font-size: 18px; color: #333; margin-bottom: 8px; }
          .doc-info p { font-size: 12px; color: #666; margin-bottom: 2px; }

          .parties { display: flex; gap: 40px; margin-bottom: 30px; }
          .party { flex: 1; }
          .party-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .party h3 { font-size: 16px; color: #333; margin-bottom: 4px; }
          .party p { font-size: 13px; color: #666; line-height: 1.5; }

          .reference { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
          .reference-row { display: flex; gap: 40px; }
          .reference-item { }
          .reference-item label { font-size: 11px; color: #999; text-transform: uppercase; display: block; margin-bottom: 4px; }
          .reference-item span { font-size: 14px; font-weight: 600; color: #333; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f5f5f5; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #555; border-bottom: 2px solid #e0e0e0; text-transform: uppercase; }
          th:last-child { text-align: right; }
          td { padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
          td:last-child { text-align: right; font-weight: 600; }
          tr:hover { background: #fafafa; }
          .part-number { color: #1976d2; font-weight: 600; }

          .summary { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .summary-box { background: #f8f9fa; padding: 16px 24px; border-radius: 8px; min-width: 200px; }
          .summary-row { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 8px; }
          .summary-row:last-child { margin-bottom: 0; padding-top: 8px; border-top: 1px solid #e0e0e0; }
          .summary-row label { font-size: 13px; color: #666; }
          .summary-row span { font-size: 14px; font-weight: 600; color: #333; }
          .summary-row.total span { font-size: 18px; color: #1976d2; }

          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
          .footer p { font-size: 11px; color: #999; text-align: center; }

          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>KB Enterprises</h1>
            <p>Aviation Parts & Supplies</p>
          </div>
          <div class="doc-info">
            <h2>Purchase Order</h2>
            <p>Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            <p>Ref: ${piNumber}</p>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <div class="party-label">Supplier</div>
            <h3>${supplier?.supplier_name || "-"}</h3>
            <p>${supplier?.contact?.primary_name || ""}</p>
            <p>${supplier?.contact?.email || ""}</p>
            <p>${supplier?.contact?.phone || ""}</p>
            <p>${supplier?.address?.street || ""}</p>
            <p>${supplier?.address?.city || ""}${supplier?.address?.state ? ", " + supplier.address.state : ""} ${supplier?.address?.zip || ""}</p>
            <p>${supplier?.address?.country || ""}</p>
          </div>
          <div class="party">
            <div class="party-label">Ship To / Customer</div>
            <h3>${customerName}</h3>
            <p>PI: ${piNumber}</p>
          </div>
        </div>

        <div class="reference">
          <div class="reference-row">
            <div class="reference-item">
              <label>PI Number</label>
              <span>${piNumber}</span>
            </div>
            <div class="reference-item">
              <label>Customer</label>
              <span>${customerName}</span>
            </div>
            <div class="reference-item">
              <label>Total Items</label>
              <span>${items.length}</span>
            </div>
            <div class="reference-item">
              <label>Total Quantity</label>
              <span>${totalQty}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Part Number</th>
              <th>Product Name</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="part-number">${item.part_number}</td>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <label>Total Items</label>
              <span>${items.length}</span>
            </div>
            <div class="summary-row total">
              <label>Total Quantity</label>
              <span>${totalQty}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()} | KB Enterprises - Purchase Order</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PI List View
  if (!selectedPI) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          PI Allocation
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <TextField
              size="small"
              placeholder="Search PI#, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 250 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {filteredPIs.length} PIs
            </Typography>
          </Stack>
        </Paper>

        {/* PI Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>PI Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Items</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Allocation</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "text.secondary", borderBottom: "2px solid #e0e0e0" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPIs.map((pi) => {
                const allocStatus = getPIAllocationStatus(pi);
                const piId = pi._id || pi.performa_invoice_id;
                const piNumber = pi.proforma_number || pi.performa_invoice_number;
                const customerName = pi.buyer?.name || pi.buyer_name || "-";
                const piDate = pi.issue_date || pi.createdAt;
                const totalAmount = pi.grand_total || pi.total_amount || 0;

                return (
                  <TableRow
                    key={piId}
                    hover
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#fafafa" } }}
                    onClick={() => setSelectedPI(pi)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {piNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{customerName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDate(piDate)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{pi.items?.length || 0}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(totalAmount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color={pi.status === "APPROVED" ? "success.main" : "warning.main"}
                      >
                        {pi.status || "PENDING"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color={
                          allocStatus === "complete" ? "success.main" :
                          allocStatus === "partial" ? "warning.main" : "error.main"
                        }
                      >
                        {allocStatus === "complete" ? "Complete" : allocStatus === "partial" ? "Partial" : "Pending"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="text"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPI(pi);
                        }}
                      >
                        Allocate
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPIs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No PIs found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </>
        )}
      </Box>
    );
  }

  // Get suppliers count for button label
  const suppliersWithAllocs = getSuppliersWithAllocations();

  // Helper to get PI details
  const piId = selectedPI._id || selectedPI.performa_invoice_id;
  const piNumber = selectedPI.proforma_number || selectedPI.performa_invoice_number;
  const customerName = selectedPI.buyer?.name || selectedPI.buyer_name || "-";
  const piDate = selectedPI.issue_date || selectedPI.createdAt;

  // Item Allocation View - Full Page Table
  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, border: "1px solid #e5e7eb", borderRadius: 1.5, bgcolor: "#f8fafc" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={() => setSelectedPI(null)} size="small" sx={{ bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
            <ArrowBack sx={{ fontSize: 18 }} />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                {piNumber}
              </Typography>
              <Chip
                label={selectedPI.status}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "10px",
                  fontWeight: 600,
                  bgcolor: selectedPI.status === "APPROVED" ? "#dcfce7" : "#fef3c7",
                  color: selectedPI.status === "APPROVED" ? "#16a34a" : "#d97706",
                  "& .MuiChip-label": { px: 1 }
                }}
              />
              {savedPIs.has(piId) && (
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 12 }} />}
                  label="Saved"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "10px",
                    fontWeight: 600,
                    bgcolor: "#dcfce7",
                    color: "#16a34a",
                    "& .MuiChip-label": { px: 0.5 },
                    "& .MuiChip-icon": { ml: 0.5 }
                  }}
                />
              )}
            </Stack>
            <Typography sx={{ fontSize: "11px", color: "#64748b", mt: 0.25 }}>
              {customerName} &bull; {formatDate(piDate)} &bull; {selectedPI.items?.length} items
            </Typography>
          </Box>
          {/* Purchase INR Rate Input */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "#fff", border: "1px solid #e2e8f0", borderRadius: 1, px: 1, py: 0.5 }}>
            <Typography sx={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}>₹/$:</Typography>
            <TextField
              size="small"
              type="number"
              value={purchaseRate}
              onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 83)}
              sx={{
                width: 60,
                "& .MuiOutlinedInput-root": {
                  fontSize: "12px",
                  minHeight: 28,
                  "& fieldset": { borderColor: "#e5e7eb" }
                },
                "& input": { py: "4px", px: "6px", textAlign: "center" }
              }}
              slotProps={{ htmlInput: { min: 1, step: 0.01 } }}
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save sx={{ fontSize: 16 }} />}
            onClick={saveAllocationsToBackend}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              py: 0.75,
              px: 2,
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
              boxShadow: "none"
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </Paper>

      {/* Allocation Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5, overflow: "auto" }}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#fff" }}>
              <TableCell sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 25, px: 1 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 90, px: 1 }}>Part No.</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 120, px: 1 }}>Product</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 40, px: 0.5 }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 50, px: 1 }}>Sell $</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", minWidth: 140, px: 0.5 }}>Supplier 1</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", minWidth: 140, px: 0.5 }}>Supplier 2</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", minWidth: 140, px: 0.5 }}>Supplier 3</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", minWidth: 140, px: 0.5 }}>Supplier 4</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 40, px: 0.5 }}>Done</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "12px", py: 1.25, borderBottom: "1px solid #e5e7eb", width: 40, px: 0.5 }}>Left</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedPI.items?.map((item, idx) => {
              const productId = item.product_id || item._id || `item_${idx}`;
              const { allocated, remaining } = getItemTotals(
                piId,
                productId,
                item.quantity
              );
              const isComplete = remaining === 0;

              return (
                <TableRow
                  key={productId}
                  sx={{
                    bgcolor: "#fff",
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                >
                  <TableCell sx={{ py: 1.5, px: 1, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ fontSize: "12px", color: "#94a3b8" }}>{idx + 1}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 1, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1976d2" }}>
                      {item.part_number || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 1, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ fontSize: "12px", color: "#334155", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.product_name}>
                      {item.product_name || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <Box sx={{
                      display: "inline-flex",
                      bgcolor: "#e0f2fe",
                      borderRadius: 1.5,
                      px: 0.75,
                      py: 0.25,
                      minWidth: 24
                    }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#0369a1" }}>{item.quantity}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.5, px: 1, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#059669" }}>
                      ${(item.unit_price || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <SupplierSelect
                      piId={piId}
                      productId={productId}
                      slot={1}
                      maxQty={item.quantity}
                      sellingPrice={item.unit_price}
                      alloc={getAllocation(piId, productId, 1)}
                      remaining={remaining}
                      activeSuppliers={activeSuppliers}
                      updateAllocation={updateAllocation}
                      inrRate={purchaseRate}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <SupplierSelect
                      piId={piId}
                      productId={productId}
                      slot={2}
                      maxQty={item.quantity}
                      sellingPrice={item.unit_price}
                      alloc={getAllocation(piId, productId, 2)}
                      remaining={remaining}
                      activeSuppliers={activeSuppliers}
                      updateAllocation={updateAllocation}
                      inrRate={purchaseRate}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <SupplierSelect
                      piId={piId}
                      productId={productId}
                      slot={3}
                      maxQty={item.quantity}
                      sellingPrice={item.unit_price}
                      alloc={getAllocation(piId, productId, 3)}
                      remaining={remaining}
                      activeSuppliers={activeSuppliers}
                      updateAllocation={updateAllocation}
                      inrRate={purchaseRate}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <SupplierSelect
                      piId={piId}
                      productId={productId}
                      slot={4}
                      maxQty={item.quantity}
                      sellingPrice={item.unit_price}
                      alloc={getAllocation(piId, productId, 4)}
                      remaining={remaining}
                      activeSuppliers={activeSuppliers}
                      updateAllocation={updateAllocation}
                      inrRate={purchaseRate}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isComplete ? "#16a34a" : allocated > 0 ? "#d97706" : "#94a3b8"
                    }}>
                      {allocated}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5, px: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: remaining > 0 ? "#dc2626" : "#16a34a"
                    }}>
                      {remaining}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      <Paper elevation={0} sx={{ p: 1.5, mt: 1.5, border: "1px solid #e5e7eb", borderRadius: 1.5, bgcolor: "#f8fafc" }}>
        <Stack direction="row" spacing={3} justifyContent="flex-end" alignItems="center">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontSize: "11px", color: "#64748b" }}>Items:</Typography>
            <Box sx={{ bgcolor: "#e2e8f0", borderRadius: 1, px: 1, py: 0.25 }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                {selectedPI.items?.length || 0}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontSize: "11px", color: "#64748b" }}>Total Qty:</Typography>
            <Box sx={{ bgcolor: "#e2e8f0", borderRadius: 1, px: 1, py: 0.25 }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                {selectedPI.items?.reduce((sum, i) => sum + i.quantity, 0) || 0}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontSize: "11px", color: "#64748b" }}>Allocated:</Typography>
            <Box sx={{ bgcolor: "#dcfce7", borderRadius: 1, px: 1, py: 0.25 }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>
                {selectedPI.items?.filter((item, idx) => {
                  const productId = item.product_id || item._id || `item_${idx}`;
                  const { remaining } = getItemTotals(piId, productId, item.quantity);
                  return remaining === 0;
                }).length || 0}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontSize: "11px", color: "#64748b" }}>Pending:</Typography>
            <Box sx={{ bgcolor: "#fee2e2", borderRadius: 1, px: 1, py: 0.25 }}>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#dc2626" }}>
                {selectedPI.items?.filter((item, idx) => {
                  const productId = item.product_id || item._id || `item_${idx}`;
                  const { remaining } = getItemTotals(piId, productId, item.quantity);
                  return remaining > 0;
                }).length || 0}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* Supplier Download Options - Shows after allocation */}
      {suppliersWithAllocs.length > 0 && (
        <Paper elevation={0} sx={{ p: 1.5, mt: 1.5, border: "1px solid #e5e7eb", borderRadius: 1.5, bgcolor: "#fff" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
              Download PO:
            </Typography>
            {suppliersWithAllocs.map((supplierData) => (
              <Button
                key={supplierData.supplier?.supplier_id}
                variant="outlined"
                size="small"
                startIcon={<Download sx={{ fontSize: 14 }} />}
                onClick={() => generateSupplierPDF(supplierData)}
                sx={{
                  textTransform: "none",
                  py: 0.5,
                  px: 1.25,
                  borderColor: "#cbd5e1",
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: 500,
                  minHeight: 28,
                  "&:hover": {
                    borderColor: "#1976d2",
                    bgcolor: "#f0f9ff",
                    color: "#1976d2"
                  }
                }}
              >
                {supplierData.supplier?.supplier_name} ({supplierData.totalQty})
              </Button>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PIAllocation;
