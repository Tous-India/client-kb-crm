import { useRef } from "react";
import {
  Container,
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
  Paper,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  LinearProgress,
  Autocomplete,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Search,
  Print,
  PictureAsPdf,
  LocalShipping,
  CheckCircle,
  HourglassEmpty,
  Receipt as ReceiptIcon,
  Settings,
  SkipNext,
  BookmarkAdd,
  Delete,
  Info,
  Refresh,
  Cancel,
  Visibility,
  Email,
  Edit,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import { useInvoices } from "../../hooks/useInvoices";
import useInvoicesStore from "../../stores/useInvoicesStore";
import invoiceSettingsData from "../../mock/invoiceSettings.json";
import InvoicePrintPreview from "../components/InvoicePrintPreview";
import SendEmailModal from "../components/SendEmailModal";
import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../services/api/client";
import ENDPOINTS from "../../services/api/endpoints";

function Invoices() {
  const { usdToInr } = useCurrency();
  const printRef = useRef(null);

  // React Query - fetch invoices
  const { data: invoices = [], isLoading, isError, error, refetch } = useInvoices();

  // Zustand store - UI state
  const {
    searchTerm,
    filterStatus,
    filterDispatchStatus,
    filterCustomer,
    filterType,
    selectedInvoice,
    isDetailModalOpen,
    isSeriesModalOpen,
    seriesTabValue,
    setSearchTerm,
    setFilterStatus,
    setFilterDispatchStatus,
    setFilterCustomer,
    setFilterType,
    openDetailModal,
    closeDetailModal,
    openSeriesModal,
    closeSeriesModal,
    setSeriesTabValue,
    getFilteredInvoices,
    getUniqueCustomers,
    getStats,
  } = useInvoicesStore();

  // Local state for series management (not in store as it's form-specific)
  const [invoiceSettings, setInvoiceSettings] = useState(invoiceSettingsData);
  const [skipNumber, setSkipNumber] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [reserveNumber, setReserveNumber] = useState("");
  const [reserveFor, setReserveFor] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState(null);
  const [buyerCurrentEmail, setBuyerCurrentEmail] = useState(null);

  // Edit invoice title modal state
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editInvoiceTitle, setEditInvoiceTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const invoiceTitleOptions = ['INVOICE', 'TAX INVOICE'];

  // Get computed values from store
  const filteredInvoices = getFilteredInvoices(invoices);
  const uniqueCustomers = getUniqueCustomers(invoices);
  const stats = getStats(invoices);

  // Invoice Series Management Handlers
  const handleSkipNumber = () => {
    if (!skipNumber || !skipReason) return;
    const num = parseInt(skipNumber);
    if (isNaN(num) || num <= invoiceSettings.invoiceSeries.last_invoice_number) {
      alert("Invalid number. Must be greater than the last used invoice number.");
      return;
    }
    if (invoiceSettings.skippedNumbers.some(s => s.number === num) ||
        invoiceSettings.reservedNumbers.some(r => r.number === num)) {
      alert("This number is already skipped or reserved.");
      return;
    }
    const newSkipped = {
      number: num,
      skipped_date: new Date().toISOString(),
      reason: skipReason,
      skipped_by: "admin"
    };
    setInvoiceSettings(prev => ({
      ...prev,
      skippedNumbers: [...prev.skippedNumbers, newSkipped],
      seriesHistory: [...prev.seriesHistory, {
        action: "SKIPPED",
        number: num,
        date: new Date().toISOString(),
        reason: skipReason
      }]
    }));
    setSkipNumber("");
    setSkipReason("");
  };

  const handleReserveNumber = () => {
    if (!reserveNumber || !reserveFor) return;
    const num = parseInt(reserveNumber);
    if (isNaN(num) || num <= invoiceSettings.invoiceSeries.last_invoice_number) {
      alert("Invalid number. Must be greater than the last used invoice number.");
      return;
    }
    if (invoiceSettings.skippedNumbers.some(s => s.number === num) ||
        invoiceSettings.reservedNumbers.some(r => r.number === num)) {
      alert("This number is already skipped or reserved.");
      return;
    }
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const newReserved = {
      number: num,
      reserved_date: new Date().toISOString(),
      reserved_for: reserveFor,
      reserved_by: "admin",
      notes: reserveNotes,
      expires_at: expiryDate.toISOString()
    };
    setInvoiceSettings(prev => ({
      ...prev,
      reservedNumbers: [...prev.reservedNumbers, newReserved],
      seriesHistory: [...prev.seriesHistory, {
        action: "RESERVED",
        number: num,
        date: new Date().toISOString(),
        reserved_for: reserveFor
      }]
    }));
    setReserveNumber("");
    setReserveFor("");
    setReserveNotes("");
  };

  const handleReleaseReserved = (number) => {
    setInvoiceSettings(prev => ({
      ...prev,
      reservedNumbers: prev.reservedNumbers.filter(r => r.number !== number),
      seriesHistory: [...prev.seriesHistory, {
        action: "RELEASED",
        number: number,
        date: new Date().toISOString()
      }]
    }));
  };

  const getInvoiceTypeLabel = (type) => {
    const typeInfo = invoiceSettings.invoiceTypes?.find(t => t.type === type);
    return typeInfo?.label || type || 'Tax Invoice';
  };

  const getInvoiceTypeColor = (type) => {
    switch (type) {
      case 'REIMBURSEMENT': return 'warning';
      case 'BILL_OF_SUPPLY': return 'info';
      case 'TAX_INVOICE':
      default: return 'success';
    }
  };

  // Handle saving invoice title
  const handleSaveInvoiceTitle = async () => {
    if (!editingInvoice || !editInvoiceTitle.trim()) return;

    setSavingTitle(true);
    try {
      await apiClient.put(ENDPOINTS.INVOICES.UPDATE(editingInvoice._id), {
        invoice_title: editInvoiceTitle.trim()
      });
      toast.success("Invoice title updated successfully");
      refetch(); // Refresh the invoices list
      setShowEditTitleModal(false);
      setEditingInvoice(null);
      setEditInvoiceTitle("");
    } catch (err) {
      console.error('[Invoices] Error updating invoice title:', err);
      toast.error(err.response?.data?.message || "Failed to update invoice title");
    } finally {
      setSavingTitle(false);
    }
  };

  const handlePrintAction = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${selectedInvoice?.invoice_number}</title>
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

  const handleDownloadPDF = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${selectedInvoice?.invoice_number}</title>
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

  return (
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className="p-0!">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <h1 className="text-2xl font-bold text-[#0b0c1a] mb-2">
                Invoices Management
              </h1>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: "13px", mb: 1 }}
              >
                Track dispatch-generated invoices and delivery status for paid
                orders
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh invoices">
                <IconButton
                  onClick={() => refetch()}
                  disabled={isLoading}
                  color="primary"
                >
                  {isLoading ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={openSeriesModal}
                sx={{ fontSize: "13px" }}
              >
                Manage Series
              </Button>
            </Stack>
          </Box>

          {/* Workflow Info Alert */}
          <Alert
            severity="info"
            sx={{ mt: 2, fontSize: "13px" }}
            icon={<LocalShipping />}
          >
            <strong>Workflow:</strong> Invoices are automatically generated when
            products are dispatched from Performa Invoices. All invoices listed
            here have been dispatched with tracking information.
          </Alert>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "11px" }}
                  >
                    Total Invoices
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ fontSize: "20px" }}
                  >
                    {stats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card sx={{ bgcolor: "success.50" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontSize: "11px" }}
                      >
                        Paid Invoices
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color="success.main"
                        sx={{ fontSize: "20px" }}
                      >
                        {stats.paid}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card sx={{ bgcolor: "error.50" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HourglassEmpty
                      sx={{ color: "error.main", fontSize: 20 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontSize: "11px" }}
                      >
                        Unpaid Invoices
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color="error.main"
                        sx={{ fontSize: "20px" }}
                      >
                        {stats.unpaid}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card sx={{ bgcolor: "info.50" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalShipping sx={{ color: "info.main", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontSize: "11px" }}
                      >
                        Shipped
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color="info.main"
                        sx={{ fontSize: "20px" }}
                      >
                        {stats.dispatched}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card sx={{ bgcolor: "warning.50" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptIcon sx={{ color: "warning.main", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontSize: "11px" }}
                      >
                        In Transit
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color="warning.main"
                        sx={{ fontSize: "20px" }}
                      >
                        {stats.pendingDispatch}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card sx={{ bgcolor: "success.50" }}>
                <CardContent>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "11px" }}
                  >
                    Total Revenue
                  </Typography>
                  <Stack spacing={0}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="success.main"
                      sx={{ fontSize: "18px" }}
                    >
                      ${stats.totalRevenue.toFixed(2)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "11px" }}
                    >
                      ₹{(stats.totalRevenue * usdToInr).toFixed(2)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
            <TextField
              placeholder="Search by invoice, PI number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 250, "& input": { fontSize: "13px" } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
              sx={{ minWidth: 130, "& select": { fontSize: "13px" } }}
              slotProps={{
                select: {
                  native: true,
                },
              }}
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="CANCELLED">Cancelled</option>
            </TextField>
            <TextField
              select
              value={filterDispatchStatus}
              onChange={(e) => setFilterDispatchStatus(e.target.value)}
              size="small"
              sx={{ minWidth: 150, "& select": { fontSize: "13px" } }}
              slotProps={{
                select: {
                  native: true,
                },
              }}
            >
              <option value="ALL">All Shipments</option>
              <option value="DISPATCHED">Shipped</option>
              <option value="PENDING">In Transit</option>
            </TextField>
            <TextField
              select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              size="small"
              sx={{ minWidth: 180, "& select": { fontSize: "13px" } }}
              slotProps={{
                select: {
                  native: true,
                },
              }}
            >
              <option value="ALL">All Customers</option>
              {uniqueCustomers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </TextField>
            <TextField
              select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              size="small"
              sx={{ minWidth: 160, "& select": { fontSize: "13px" } }}
              slotProps={{
                select: {
                  native: true,
                },
              }}
            >
              <option value="ALL">All Types</option>
              <option value="TAX_INVOICE">Tax Invoice</option>
              <option value="REIMBURSEMENT">Reimbursement</option>
              <option value="BILL_OF_SUPPLY">Bill of Supply</option>
            </TextField>
          </Stack>
        </Paper>

        {/* Invoices Table */}
        <TableContainer component={Paper}>
          {isLoading && <LinearProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>Invoice #</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>Date</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>Type</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>PI Number</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: "13px" }}>Customer</strong>
                </TableCell>
                <TableCell align="right">
                  <strong style={{ fontSize: "13px" }}>Total Amount</strong>
                </TableCell>
                <TableCell align="center">
                  <strong style={{ fontSize: "13px" }}>Status</strong>
                </TableCell>
                <TableCell align="center">
                  <strong style={{ fontSize: "13px" }}>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading invoices...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="error" sx={{ fontSize: "13px" }}>
                      {error?.message || 'Failed to load invoices'}
                      <Button size="small" onClick={() => refetch()} sx={{ ml: 2 }}>
                        Retry
                      </Button>
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info" sx={{ fontSize: "13px" }}>
                      No invoices found matching your criteria.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const isOverdue =
                    invoice.status === "UNPAID" &&
                    new Date(invoice.due_date) < new Date();

                  // Get status color and label
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'PAID': return 'success';
                      case 'PARTIAL': return 'warning';
                      case 'UNPAID': return 'error';
                      case 'CANCELLED': return 'default';
                      default: return 'default';
                    }
                  };

                  // Format date
                  const formatDate = (dateStr) => {
                    if (!dateStr) return '-';
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });
                  };

                  // Get customer name
                  const customerName = invoice.buyer_name || invoice.customer_name || invoice.customer_id || '-';

                  return (
                    <TableRow
                      key={invoice._id || invoice.invoice_id}
                      sx={{
                        bgcolor: isOverdue ? "error.50" : "inherit",
                        "&:hover": {
                          bgcolor: isOverdue ? "error.100" : "action.hover",
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ fontSize: "13px" }}
                        >
                          {invoice.invoice_number}
                        </Typography>
                        {invoice.series_number && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "10px" }}
                          >
                            #{invoice.series_number}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "12px" }}>
                          {formatDate(invoice.invoice_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getInvoiceTypeLabel(invoice.invoice_type)}
                          size="small"
                          color={getInvoiceTypeColor(invoice.invoice_type)}
                          sx={{ fontSize: "10px" }}
                        />
                      </TableCell>
                      <TableCell>
                        {invoice.pi_number || invoice.proforma_invoice_number ? (
                          <Chip
                            label={invoice.pi_number || invoice.proforma_invoice_number}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: "11px" }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "13px" }}>
                          {customerName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ fontSize: "13px" }}
                          >
                            ${(invoice.total_amount || 0).toFixed(2)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "11px" }}
                          >
                            ₹{((invoice.total_amount || 0) * (invoice.exchange_rate || usdToInr)).toFixed(2)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={invoice.status || 'UNPAID'}
                          size="small"
                          color={getStatusColor(invoice.status)}
                          sx={{ fontSize: "10px", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          <Tooltip title="Preview Invoice">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openDetailModal(invoice)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Invoice Title">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => {
                                setEditingInvoice(invoice);
                                setEditInvoiceTitle(invoice.invoice_title || 'TAX INVOICE');
                                setShowEditTitleModal(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Email">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={async () => {
                                setEmailInvoice(invoice);
                                setBuyerCurrentEmail(null);
                                // Fetch buyer's current email
                                try {
                                  const buyerId = invoice.buyer?._id || invoice.buyer || invoice.customer_id;
                                  if (buyerId) {
                                    const response = await apiClient.get(ENDPOINTS.USERS.GET(buyerId));
                                    if (response.data?.data?.email) {
                                      setBuyerCurrentEmail(response.data.data.email);
                                    }
                                  }
                                } catch (err) {
                                  console.warn('[Invoices] Could not fetch buyer current email:', err.message);
                                }
                                setShowEmailModal(true);
                              }}
                            >
                              <Email fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Invoice Detail Dialog */}
        <Dialog
          open={isDetailModalOpen}
          onClose={closeDetailModal}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '95vh',
              m: 1
            }
          }}
        >
          <DialogTitle sx={{ py: 1.5, px: 3, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ fontSize: "18px" }}
                >
                  Invoice Preview
                </Typography>
                {selectedInvoice && (
                  <Chip
                    label={selectedInvoice.invoice_number}
                    color="primary"
                    size="small"
                    sx={{ fontSize: '12px', fontWeight: 600 }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Print Invoice">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Print />}
                    onClick={handlePrintAction}
                    sx={{ fontSize: "12px" }}
                  >
                    Print
                  </Button>
                </Tooltip>
                <Tooltip title="Download as PDF">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<PictureAsPdf />}
                    onClick={handleDownloadPDF}
                    sx={{ fontSize: "12px" }}
                  >
                    PDF
                  </Button>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton
                    size="small"
                    onClick={closeDetailModal}
                    sx={{ ml: 1 }}
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{
              p: 2,
              bgcolor: '#e8e8e8',
              display: 'flex',
              justifyContent: 'center',
              overflowY: 'auto'
            }}
          >
            {selectedInvoice && (
              <InvoicePrintPreview
                ref={printRef}
                invoice={selectedInvoice}
                globalRate={usdToInr}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Series Management Modal */}
        <Dialog
          open={isSeriesModalOpen}
          onClose={closeSeriesModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={2} alignItems="center">
              <Settings color="primary" />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "18px" }}>
                Invoice Series Management
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {/* Current Series Info */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Current Series Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Format</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {invoiceSettings.invoiceSeries.format}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Current Year</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {invoiceSettings.invoiceSeries.current_year}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Last Used</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    #{invoiceSettings.invoiceSeries.last_invoice_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Next Available</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    #{invoiceSettings.invoiceSeries.next_invoice_number}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Tabs for Skip/Reserve */}
            <Tabs
              value={seriesTabValue}
              onChange={(e, newValue) => setSeriesTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label={`Skipped (${invoiceSettings.skippedNumbers.length})`} sx={{ fontSize: "13px" }} />
              <Tab label={`Reserved (${invoiceSettings.reservedNumbers.length})`} sx={{ fontSize: "13px" }} />
              <Tab label="History" sx={{ fontSize: "13px" }} />
            </Tabs>

            {/* Skip Numbers Tab */}
            {seriesTabValue === 0 && (
              <Box>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    label="Invoice Number to Skip"
                    value={skipNumber}
                    onChange={(e) => setSkipNumber(e.target.value)}
                    size="small"
                    type="number"
                    sx={{ width: 180, "& input": { fontSize: "13px" } }}
                    placeholder={`> ${invoiceSettings.invoiceSeries.last_invoice_number}`}
                  />
                  <TextField
                    label="Reason"
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    size="small"
                    sx={{ flex: 1, "& input": { fontSize: "13px" } }}
                    placeholder="Why is this number being skipped?"
                  />
                  <Button
                    variant="contained"
                    startIcon={<SkipNext />}
                    onClick={handleSkipNumber}
                    disabled={!skipNumber || !skipReason}
                    sx={{ fontSize: "13px" }}
                  >
                    Skip
                  </Button>
                </Stack>

                {invoiceSettings.skippedNumbers.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: "13px" }}>
                    No skipped invoice numbers.
                  </Alert>
                ) : (
                  <List dense>
                    {invoiceSettings.skippedNumbers.map((skip) => (
                      <ListItem key={skip.number} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`#${skip.number}`} size="small" color="error" />
                              <Typography variant="body2" sx={{ fontSize: "13px" }}>
                                {skip.reason}
                              </Typography>
                            </Stack>
                          }
                          secondary={`Skipped on ${new Date(skip.skipped_date).toLocaleDateString()} by ${skip.skipped_by}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Reserved Numbers Tab */}
            {seriesTabValue === 1 && (
              <Box>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    label="Invoice Number to Reserve"
                    value={reserveNumber}
                    onChange={(e) => setReserveNumber(e.target.value)}
                    size="small"
                    type="number"
                    sx={{ width: 180, "& input": { fontSize: "13px" } }}
                    placeholder={`> ${invoiceSettings.invoiceSeries.last_invoice_number}`}
                  />
                  <TextField
                    label="Reserved For"
                    value={reserveFor}
                    onChange={(e) => setReserveFor(e.target.value)}
                    size="small"
                    sx={{ width: 150, "& input": { fontSize: "13px" } }}
                    placeholder="Customer/Project"
                  />
                  <TextField
                    label="Notes"
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    size="small"
                    sx={{ flex: 1, "& input": { fontSize: "13px" } }}
                    placeholder="Optional notes"
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<BookmarkAdd />}
                    onClick={handleReserveNumber}
                    disabled={!reserveNumber || !reserveFor}
                    sx={{ fontSize: "13px" }}
                  >
                    Reserve
                  </Button>
                </Stack>

                {invoiceSettings.reservedNumbers.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: "13px" }}>
                    No reserved invoice numbers.
                  </Alert>
                ) : (
                  <List dense>
                    {invoiceSettings.reservedNumbers.map((reserve) => (
                      <ListItem key={reserve.number} sx={{ bgcolor: 'warning.50', mb: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`#${reserve.number}`} size="small" color="warning" />
                              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "13px" }}>
                                Reserved for: {reserve.reserved_for}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0}>
                              <Typography variant="caption">
                                Reserved on {new Date(reserve.reserved_date).toLocaleDateString()} | Expires: {new Date(reserve.expires_at).toLocaleDateString()}
                              </Typography>
                              {reserve.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  {reserve.notes}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Release this reserved number">
                            <IconButton
                              edge="end"
                              size="small"
                              color="error"
                              onClick={() => handleReleaseReserved(reserve.number)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* History Tab */}
            {seriesTabValue === 2 && (
              <Box>
                {invoiceSettings.seriesHistory.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: "13px" }}>
                    No series history available.
                  </Alert>
                ) : (
                  <List dense>
                    {[...invoiceSettings.seriesHistory].reverse().map((entry, idx) => (
                      <ListItem key={idx} sx={{ borderLeft: 3, borderColor: entry.action === 'CREATED' ? 'success.main' : entry.action === 'SKIPPED' ? 'error.main' : entry.action === 'RESERVED' ? 'warning.main' : 'info.main', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={entry.action}
                                size="small"
                                color={entry.action === 'CREATED' ? 'success' : entry.action === 'SKIPPED' ? 'error' : entry.action === 'RESERVED' ? 'warning' : 'info'}
                                sx={{ fontSize: "10px" }}
                              />
                              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "13px" }}>
                                #{entry.number}
                              </Typography>
                              {entry.invoice_id && (
                                <Typography variant="caption" color="text.secondary">
                                  ({entry.invoice_id})
                                </Typography>
                              )}
                            </Stack>
                          }
                          secondary={
                            <Stack direction="row" spacing={2}>
                              <Typography variant="caption">
                                {new Date(entry.date).toLocaleString()}
                              </Typography>
                              {entry.reason && (
                                <Typography variant="caption" color="text.secondary">
                                  Reason: {entry.reason}
                                </Typography>
                              )}
                              {entry.reserved_for && (
                                <Typography variant="caption" color="text.secondary">
                                  For: {entry.reserved_for}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Info Alert */}
            <Alert severity="info" icon={<Info />} sx={{ mt: 2, fontSize: "12px" }}>
              <strong>Note:</strong> Skipped numbers cannot be used for future invoices. Reserved numbers are held for specific customers/projects and can be released if not used.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeSeriesModal} sx={{ fontSize: "13px" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Invoice Title Modal */}
        <Dialog
          open={showEditTitleModal}
          onClose={() => {
            setShowEditTitleModal(false);
            setEditingInvoice(null);
            setEditInvoiceTitle("");
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Edit color="primary" />
              <Typography variant="h6" sx={{ fontSize: '16px' }}>Edit Invoice Title</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '12px' }}>
              Invoice: <strong>{editingInvoice?.invoice_number}</strong>
            </Typography>
            <Autocomplete
              freeSolo
              options={invoiceTitleOptions}
              value={editInvoiceTitle}
              onChange={(e, newValue) => setEditInvoiceTitle(newValue || '')}
              onInputChange={(e, newValue) => setEditInvoiceTitle(newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invoice Title"
                  placeholder="Select or type title"
                  fullWidth
                  size="small"
                  helperText="Choose from list or type a custom title"
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setShowEditTitleModal(false);
                setEditingInvoice(null);
                setEditInvoiceTitle("");
              }}
              disabled={savingTitle}
              sx={{ fontSize: '13px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveInvoiceTitle}
              disabled={savingTitle || !editInvoiceTitle.trim()}
              sx={{ fontSize: '13px' }}
            >
              {savingTitle ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Send Email Modal */}
        <SendEmailModal
          open={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setEmailInvoice(null);
            setBuyerCurrentEmail(null);
          }}
          documentType="invoice"
          document={emailInvoice}
          buyerCurrentEmail={buyerCurrentEmail}
          onSuccess={() => {
            refetch();
            toast.success("Invoice email sent successfully!");
          }}
        />
    </Container>
  );
}

export default Invoices;
