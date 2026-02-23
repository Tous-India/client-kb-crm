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
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add,
  Edit,
  Search,
  Business,
  Email,
  Phone,
  LocationOn,
  CheckCircle,
  Cancel,
  Visibility,
  Close,
  Person,
  AccountBalance,
  Assessment,
  ShoppingCart,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import suppliersService from "../../services/suppliers.service";
import supplierOrdersService from "../../services/supplierOrders.service";
import { showSuccess, showError } from "../../utils/toast";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function Suppliers() {
  const { usdToInr } = useCurrency();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);

  // Form state
  const [supplierForm, setSupplierForm] = useState({
    supplier_code: "",
    supplier_name: "",
    status: "ACTIVE",
    contact: {
      primary_name: "",
      email: "",
      phone: "",
      secondary_email: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
    business_info: {
      tax_id: "",
      gstin: "",
      pan: "",
      registration_no: "",
    },
    bank_details: {
      bank_name: "",
      account_name: "",
      account_number: "",
      ifsc_code: "",
      swift_code: "",
      branch: "",
    },
  });

  // Pagination and filter state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("supplier_code");
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const result = await suppliersService.getAll();
      if (result.success) {
        setSuppliers(result.data?.suppliers || []);
      } else {
        showError(result.error || "Failed to fetch suppliers");
      }
    } catch (err) {
      showError("Failed to fetch suppliers");
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplier orders from API
  const fetchSupplierOrders = async () => {
    try {
      const result = await supplierOrdersService.getAll();
      if (result.success) {
        setSupplierOrders(result.data?.supplierOrders || []);
      } else {
        console.error("Failed to fetch supplier orders:", result.error);
      }
    } catch (err) {
      console.error("Error fetching supplier orders:", err);
    }
  };

  useEffect(() => {
    // Fetch suppliers and supplier orders in parallel
    const loadData = async () => {
      await Promise.all([
        fetchSuppliers(),
        fetchSupplierOrders(),
      ]);
    };
    loadData();
  }, []);

  // Filter and sort suppliers
  const filteredSuppliers = suppliers
    .filter((supplier) => {
      const matchesSearch =
        supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const paginatedSuppliers = filteredSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get supplier's orders
  const getSupplierOrders = (supplierId) => {
    return supplierOrders.filter((order) => order.supplier_id === supplierId);
  };

  // Reset form
  const resetForm = () => {
    setSupplierForm({
      supplier_code: "",
      supplier_name: "",
      supplier_type: "MANUFACTURER",
      status: "ACTIVE",
      contact: {
        primary_name: "",
        email: "",
        phone: "",
        secondary_email: "",
      },
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
      business_info: {
        tax_id: "",
        gstin: "",
        pan: "",
        registration_no: "",
      },
      bank_details: {
        bank_name: "",
        account_name: "",
        account_number: "",
        ifsc_code: "",
        swift_code: "",
        branch: "",
      },
      terms: {
        payment_terms: "Net 30",
        currency: "USD",
        credit_limit: 0,
        delivery_terms: "FOB Origin",
        lead_time_days: 14,
        minimum_order: 0,
      },
      notes: "",
    });
  };

  // Handle Add
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Handle Edit
  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      supplier_code: supplier.supplier_code || "",
      supplier_name: supplier.supplier_name || "",
      supplier_type: supplier.supplier_type || "MANUFACTURER",
      status: supplier.status || "ACTIVE",
      contact: {
        primary_name: supplier.contact?.primary_name || "",
        email: supplier.contact?.email || "",
        phone: supplier.contact?.phone || "",
        secondary_email: supplier.contact?.secondary_email || "",
      },
      address: {
        street: supplier.address?.street || "",
        city: supplier.address?.city || "",
        state: supplier.address?.state || "",
        zip: supplier.address?.zip || "",
        country: supplier.address?.country || "USA",
      },
      business_info: {
        tax_id: supplier.business_info?.tax_id || "",
        gstin: supplier.business_info?.gstin || "",
        pan: supplier.business_info?.pan || "",
        registration_no: supplier.business_info?.registration_no || "",
      },
      bank_details: {
        bank_name: supplier.bank_details?.bank_name || "",
        account_name: supplier.bank_details?.account_name || "",
        account_number: supplier.bank_details?.account_number || "",
        ifsc_code: supplier.bank_details?.ifsc_code || "",
        swift_code: supplier.bank_details?.swift_code || "",
        branch: supplier.bank_details?.branch || "",
      },
      terms: {
        payment_terms: supplier.terms?.payment_terms || "Net 30",
        currency: supplier.terms?.currency || "USD",
        credit_limit: supplier.terms?.credit_limit || 0,
        delivery_terms: supplier.terms?.delivery_terms || "FOB Origin",
        lead_time_days: supplier.terms?.lead_time_days || 14,
        minimum_order: supplier.terms?.minimum_order || 0,
      },
      notes: supplier.notes || "",
    });
    setShowEditModal(true);
  };

  // Handle View Details
  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setDetailsTab(0);
    setShowDetailsModal(true);
  };

  // Handle Save (Add/Edit)
  const handleSave = async (isEdit = false) => {
    setSaving(true);
    try {
      if (isEdit && selectedSupplier) {
        // Update existing supplier via API
        const result = await suppliersService.update(
          selectedSupplier.supplier_id || selectedSupplier._id,
          supplierForm
        );
        if (result.success) {
          // Refresh suppliers list
          await fetchSuppliers();
          setShowEditModal(false);
          showSuccess("Supplier updated successfully");
        } else {
          showError(result.error || "Failed to update supplier");
        }
      } else {
        // Add new supplier via API
        const result = await suppliersService.create(supplierForm);
        if (result.success) {
          // Refresh suppliers list
          await fetchSuppliers();
          setShowAddModal(false);
          showSuccess("Supplier created successfully");
        } else {
          showError(result.error || "Failed to create supplier");
        }
      }
      resetForm();
    } catch (err) {
      showError("Failed to save supplier");
      console.error("Error saving supplier:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (supplier) => {
    const newStatus = supplier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const result = await suppliersService.updateStatus(
        supplier.supplier_id || supplier._id,
        newStatus
      );
      if (result.success) {
        // Refresh suppliers list
        await fetchSuppliers();
        showSuccess(`Supplier ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
      } else {
        showError(result.error || "Failed to update status");
      }
    } catch (err) {
      showError("Failed to update supplier status");
      console.error("Error updating status:", err);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
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

  // Supplier Form Component
  const SupplierFormContent = () => (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
        Basic Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Supplier Code"
            value={supplierForm.supplier_code}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, supplier_code: e.target.value })
            }
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Supplier Name"
            value={supplierForm.supplier_name}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, supplier_name: e.target.value })
            }
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={supplierForm.status}
              label="Status"
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, status: e.target.value })
              }
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
        Contact Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Contact Person"
            value={supplierForm.contact.primary_name}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                contact: { ...supplierForm.contact, primary_name: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Phone"
            value={supplierForm.contact.phone}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                contact: { ...supplierForm.contact, phone: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Primary Email"
            type="email"
            value={supplierForm.contact.email}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                contact: { ...supplierForm.contact, email: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Secondary Email"
            type="email"
            value={supplierForm.contact.secondary_email}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                contact: { ...supplierForm.contact, secondary_email: e.target.value },
              })
            }
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
        Address
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <TextField
            fullWidth
            size="small"
            label="Street Address"
            value={supplierForm.address.street}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                address: { ...supplierForm.address, street: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="City"
            value={supplierForm.address.city}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                address: { ...supplierForm.address, city: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="State"
            value={supplierForm.address.state}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                address: { ...supplierForm.address, state: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="ZIP Code"
            value={supplierForm.address.zip}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                address: { ...supplierForm.address, zip: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Country"
            value={supplierForm.address.country}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                address: { ...supplierForm.address, country: e.target.value },
              })
            }
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
        Business Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Tax ID"
            value={supplierForm.business_info.tax_id}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                business_info: { ...supplierForm.business_info, tax_id: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="GSTIN"
            value={supplierForm.business_info.gstin}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                business_info: { ...supplierForm.business_info, gstin: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="PAN"
            value={supplierForm.business_info.pan}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                business_info: { ...supplierForm.business_info, pan: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Registration No"
            value={supplierForm.business_info.registration_no}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                business_info: {
                  ...supplierForm.business_info,
                  registration_no: e.target.value,
                },
              })
            }
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
        Bank Details
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Bank Name"
            value={supplierForm.bank_details.bank_name}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                bank_details: { ...supplierForm.bank_details, bank_name: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Account Name"
            value={supplierForm.bank_details.account_name}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                bank_details: {
                  ...supplierForm.bank_details,
                  account_name: e.target.value,
                },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Account Number"
            value={supplierForm.bank_details.account_number}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                bank_details: {
                  ...supplierForm.bank_details,
                  account_number: e.target.value,
                },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Branch"
            value={supplierForm.bank_details.branch}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                bank_details: { ...supplierForm.bank_details, branch: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="IFSC Code"
            value={supplierForm.bank_details.ifsc_code}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                bank_details: { ...supplierForm.bank_details, ifsc_code: e.target.value },
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="SWIFT Code"
            value={supplierForm.bank_details.swift_code}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                bank_details: { ...supplierForm.bank_details, swift_code: e.target.value },
              })
            }
          />
        </Grid>
      </Grid>
    </Box>
  );

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
              Suppliers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your supplier database and vendor relationships
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{ bgcolor: "#1976d2" }}
          >
            Add Supplier
          </Button>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#e3f2fd", height: "100%" }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {suppliers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Suppliers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#e8f5e9", height: "100%" }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {suppliers.filter((s) => s.status === "ACTIVE").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Suppliers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#fff3e0", height: "100%" }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {supplierOrders.filter((o) => o.status === "ORDERED").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Orders
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "#fce4ec", height: "100%" }}>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              $
              {formatCurrency(
                supplierOrders
                  .filter((o) => o.status !== "CANCELLED")
                  .reduce((sum, o) => sum + (o.balance_due || 0), 0)
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Outstanding Balance
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {filteredSuppliers.length} supplier(s) found
          </Typography>
        </Stack>
      </Paper>

      {/* Suppliers Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "supplier_code"}
                    direction={sortOrder}
                    onClick={() => {
                      setSortBy("supplier_code");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Code
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "supplier_name"}
                    direction={sortOrder}
                    onClick={() => {
                      setSortBy("supplier_name");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Loading suppliers...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((supplier) => (
                  <TableRow key={supplier.supplier_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {supplier.supplier_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {supplier.supplier_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {supplier.address?.city}, {supplier.address?.country}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Person sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography variant="caption">
                            {supplier.contact?.primary_name || "-"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Email sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography variant="caption">
                            {supplier.contact?.email || "-"}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={supplier.status}
                        size="small"
                        color={supplier.status === "ACTIVE" ? "success" : "default"}
                        icon={
                          supplier.status === "ACTIVE" ? (
                            <CheckCircle sx={{ fontSize: 14 }} />
                          ) : (
                            <Cancel sx={{ fontSize: 14 }} />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(supplier)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(supplier)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            supplier.status === "ACTIVE" ? "Deactivate" : "Activate"
                          }
                        >
                          <IconButton
                            size="small"
                            color={supplier.status === "ACTIVE" ? "error" : "success"}
                            onClick={() => handleToggleStatus(supplier)}
                          >
                            {supplier.status === "ACTIVE" ? (
                              <Cancel fontSize="small" />
                            ) : (
                              <CheckCircle fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No suppliers found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredSuppliers.length}
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

      {/* Add Supplier Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add New Supplier</Typography>
            <IconButton onClick={() => setShowAddModal(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <SupplierFormContent />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleSave(false)}
            disabled={!supplierForm.supplier_code || !supplierForm.supplier_name || saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Add Supplier"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Supplier</Typography>
            <IconButton onClick={() => setShowEditModal(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <SupplierFormContent />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleSave(true)}
            disabled={!supplierForm.supplier_code || !supplierForm.supplier_name || saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

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
                {selectedSupplier?.supplier_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedSupplier?.supplier_code}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={selectedSupplier?.status}
                size="small"
                color={selectedSupplier?.status === "ACTIVE" ? "success" : "default"}
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
            <Tab icon={<Business />} iconPosition="start" label="Info" />
            <Tab icon={<AccountBalance />} iconPosition="start" label="Bank" />
            <Tab icon={<ShoppingCart />} iconPosition="start" label="Orders" />
            <Tab icon={<Assessment />} iconPosition="start" label="Performance" />
          </Tabs>

          {/* Info Tab */}
          <TabPanel value={detailsTab} index={0}>
            <Grid container spacing={2}>
              {/* Contact Information */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Contact Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, height: "calc(100% - 28px)" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Person color="action" sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {selectedSupplier?.contact?.primary_name || "-"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Email color="action" sx={{ fontSize: 18 }} />
                      <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                        {selectedSupplier?.contact?.email || "-"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Phone color="action" sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {selectedSupplier?.contact?.phone || "-"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <LocationOn color="action" sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {selectedSupplier?.address?.street}, {selectedSupplier?.address?.city}, {selectedSupplier?.address?.state} {selectedSupplier?.address?.zip}, {selectedSupplier?.address?.country}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>

              {/* Business Information */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Business Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, height: "calc(100% - 28px)" }}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Tax ID
                      </Typography>
                      <Typography variant="body2">
                        {selectedSupplier?.business_info?.tax_id || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        GSTIN
                      </Typography>
                      <Typography variant="body2">
                        {selectedSupplier?.business_info?.gstin || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        PAN
                      </Typography>
                      <Typography variant="body2">
                        {selectedSupplier?.business_info?.pan || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Registration
                      </Typography>
                      <Typography variant="body2">
                        {selectedSupplier?.business_info?.registration_no || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Bank Tab */}
          <TabPanel value={detailsTab} index={1}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Bank Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSupplier?.bank_details?.bank_name || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Account Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSupplier?.bank_details?.account_name || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Account Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSupplier?.bank_details?.account_number || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Branch
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSupplier?.bank_details?.branch || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    IFSC Code
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSupplier?.bank_details?.ifsc_code || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    SWIFT Code
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedSupplier?.bank_details?.swift_code || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Orders Tab */}
          <TabPanel value={detailsTab} index={2}>
            {selectedSupplier && (
              <>
                {getSupplierOrders(selectedSupplier.supplier_id).length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>SPO #</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }} align="right">
                            Total
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }} align="center">
                            Status
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }} align="center">
                            Payment
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getSupplierOrders(selectedSupplier.supplier_id).map(
                          (order) => (
                            <TableRow key={order.spo_id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {order.spo_number}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(order.order_date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {order.items?.length || 0} items
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  ${formatCurrency(order.total_amount)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={order.status}
                                  size="small"
                                  color={
                                    order.status === "RECEIVED"
                                      ? "success"
                                      : order.status === "ORDERED"
                                      ? "primary"
                                      : order.status === "DRAFT"
                                      ? "default"
                                      : "warning"
                                  }
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={order.payment_status}
                                  size="small"
                                  variant="outlined"
                                  color={
                                    order.payment_status === "PAID"
                                      ? "success"
                                      : order.payment_status === "PARTIAL"
                                      ? "warning"
                                      : "error"
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No orders found for this supplier</Alert>
                )}
              </>
            )}
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel value={detailsTab} index={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd", borderRadius: 2 }}
                >
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {selectedSupplier?.performance?.total_orders || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9", borderRadius: 2 }}
                >
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    ${formatCurrency(selectedSupplier?.performance?.total_value || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0", borderRadius: 2 }}
                >
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {selectedSupplier?.performance?.on_time_delivery_rate || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    On-Time Rate
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  sx={{ p: 2, textAlign: "center", bgcolor: "#fce4ec", borderRadius: 2 }}
                >
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {selectedSupplier?.performance?.quality_rating || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quality Rating
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Order Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(selectedSupplier?.performance?.last_order_date)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowDetailsModal(false);
              handleEdit(selectedSupplier);
            }}
          >
            Edit Supplier
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Suppliers;
