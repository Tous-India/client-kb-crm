import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  IconButton,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Visibility,
  Print,
  PictureAsPdf,
  Receipt,
  CheckCircle,
  AttachMoney,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import { useNotificationCounts } from "../../context/NotificationCountsContext";
import { invoicesService } from "../../services";
import InvoicePrintPreview from "../../admin/components/InvoicePrintPreview";

function Invoices() {
  const { usdToInr } = useCurrency();
  const { markAsViewed, refreshCounts } = useNotificationCounts();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Print ref
  const printRef = useRef(null);

  // Fetch invoices from database
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoicesService.getMyInvoices();
      if (result.success) {
        const processedInvoices = (result.data || []).map((invoice) => ({
          ...invoice,
          dispatch_status: invoice.dispatch_status || "DISPATCHED",
          tracking_number: invoice.tracking_number || invoice.dispatch_info?.tracking_number || "",
        }));
        setInvoices(processedInvoices);
      } else {
        setError(result.error || "Failed to fetch invoices");
      }
    } catch (err) {
      console.error("[Invoices] Error fetching invoices:", err);
      setError(err.message || "An error occurred while fetching invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load invoices and mark as viewed
  useEffect(() => {
    fetchInvoices();
    // Mark invoices as viewed when page loads
    markAsViewed("invoices");
  }, [fetchInvoices, markAsViewed]);

  // Get current list based on tab (all invoices are PAID since invoices are generated after payment)
  const getCurrentInvoices = () => {
    return invoices;
  };

  // Search filter
  const filterBySearch = (invList) => {
    if (!searchTerm) return invList;
    const term = searchTerm.toLowerCase();
    return invList.filter(
      (inv) =>
        inv.invoice_number?.toLowerCase().includes(term) ||
        inv.order_id?.toLowerCase().includes(term) ||
        inv.items?.some((item) => item.part_number?.toLowerCase().includes(term))
    );
  };

  const filteredInvoices = filterBySearch(getCurrentInvoices());

  // Pagination
  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate totals (all invoices are PAID)
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get invoice type label
  const getInvoiceTypeLabel = (type) => {
    switch (type) {
      case "REIMBURSEMENT":
        return "Reimbursement";
      case "BILL_OF_SUPPLY":
        return "Bill of Supply";
      case "TAX_INVOICE":
      default:
        return "Tax Invoice";
    }
  };

  // Get invoice type color
  const getInvoiceTypeColor = (type) => {
    switch (type) {
      case "REIMBURSEMENT":
        return "warning";
      case "BILL_OF_SUPPLY":
        return "info";
      case "TAX_INVOICE":
      default:
        return "success";
    }
  };

  // Handlers
  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handlePreviewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPrintPreview(true);
  };

  // Print action
  const handlePrintAction = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open("", "_blank");
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
                background: #fff;
              }
              @page { size: A4; margin: 0; }
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

  // Download PDF action
  const handleDownloadPDF = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open("", "_blank");
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
                background: #fff;
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
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Render invoice row
  const renderInvoiceRow = (invoice) => (
    <TableRow
      key={invoice.invoice_id}
      hover
      sx={{ "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" } }}
    >
      {/* Invoice Number & Date */}
      <TableCell>
        <Typography variant="body2" fontWeight="bold" color="primary.main">
          {invoice.invoice_number}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(invoice.invoice_date)}
        </Typography>
      </TableCell>

      {/* Type */}
      <TableCell>
        <Chip
          label={getInvoiceTypeLabel(invoice.invoice_type)}
          size="small"
          color={getInvoiceTypeColor(invoice.invoice_type)}
          variant="outlined"
        />
      </TableCell>

      {/* Items */}
      <TableCell>
        <Typography variant="body2">
          {invoice.items?.length || 0} item{(invoice.items?.length || 0) !== 1 ? "s" : ""}
        </Typography>
      </TableCell>

      {/* Amount */}
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          ${formatCurrency(invoice.total_amount)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ₹{formatCurrency(invoice.total_amount * (invoice.exchange_rate || usdToInr))}
        </Typography>
      </TableCell>

      {/* Payment Date */}
      <TableCell>
        <Typography variant="body2">{formatDate(invoice.payment_date)}</Typography>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <Tooltip title="View Details">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleViewInvoice(invoice)}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and download your payment invoices
          </Typography>
        </Box>
        <Tooltip title="Refresh invoices">
          <IconButton
            onClick={fetchInvoices}
            disabled={loading}
            color="primary"
          >
            <RefreshIcon sx={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Receipt sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {invoices.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoices
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AttachMoney sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(totalAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount Paid
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by invoice number, order ID, or part number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 400 }}
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
      </Paper>

      {/* Information Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Invoices are generated after payment is received. Search by invoice number, order ID, or part number to quickly find your invoices.
        </Typography>
      </Alert>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Payment Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading invoices...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedInvoices.length > 0 ? (
              paginatedInvoices.map(renderInvoiceRow)
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Receipt sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
                  <Typography color="text.secondary">
                    {searchTerm ? "No invoices found matching your criteria" : "No invoices yet"}
                  </Typography>
                  {!searchTerm && (
                    <Typography variant="caption" color="text.secondary">
                      Invoices will appear here once your orders are dispatched
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <TablePagination
          component="div"
          count={filteredInvoices.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* View Invoice Modal - Professional Design */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              maxHeight: "90vh",
            },
          },
        }}
      >
        {selectedInvoice && (
          <>
            {/* Header */}
            <DialogTitle sx={{ pb: 1, borderBottom: "1px solid #e5e7eb" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Invoice Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInvoice.invoice_number}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Print />}
                    onClick={() => {
                      setShowViewModal(false);
                      handlePreviewInvoice(selectedInvoice);
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    Print
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PictureAsPdf />}
                    onClick={() => {
                      setShowViewModal(false);
                      handlePreviewInvoice(selectedInvoice);
                    }}
                    sx={{ textTransform: "none", bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
                  >
                    PDF
                  </Button>
                </Stack>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              {/* Invoice Info Section */}
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedInvoice.invoice_number}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Invoice Date
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(selectedInvoice.invoice_date || selectedInvoice.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Invoice Type
                    </Typography>
                    <Chip
                      label={getInvoiceTypeLabel(selectedInvoice.invoice_type)}
                      size="small"
                      color={getInvoiceTypeColor(selectedInvoice.invoice_type)}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 14 }} />}
                      label={selectedInvoice.status || "PAID"}
                      size="small"
                      color="success"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      PI Number
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedInvoice.pi_number || selectedInvoice.proforma_invoice_number || "-"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Payment Date
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(selectedInvoice.payment_date || selectedInvoice.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Exchange Rate
                    </Typography>
                    <Typography variant="body1" fontWeight={500} color="primary">
                      1 USD = ₹{selectedInvoice.exchange_rate || usdToInr}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Total Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={700} color="success.main">
                      ${formatCurrency(selectedInvoice.total_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Items Table */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Invoice Items ({selectedInvoice.items?.length || 0})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Part Number</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Description</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, py: 1.5 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <TableRow key={idx} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              color: "#1e40af",
                              bgcolor: "#eff6ff",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              display: "inline-block",
                              fontWeight: 500,
                            }}
                          >
                            {item.part_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.product_name}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>{item.quantity}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">${formatCurrency(item.unit_price)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(item.unit_price * (selectedInvoice.exchange_rate || usdToInr))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${formatCurrency(item.total_price || item.unit_price * item.quantity)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency((item.total_price || item.unit_price * item.quantity) * (selectedInvoice.exchange_rate || usdToInr))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals Section */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Paper variant="outlined" sx={{ width: 320, borderRadius: 2, overflow: "hidden" }}>
                  <Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.25, borderBottom: "1px solid #e5e7eb" }}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        ${formatCurrency(selectedInvoice.subtotal || selectedInvoice.total_amount)}
                      </Typography>
                    </Stack>
                    {selectedInvoice.tax > 0 && (
                      <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.25, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography variant="body2" color="text.secondary">Tax</Typography>
                        <Typography variant="body2" fontWeight={500}>${formatCurrency(selectedInvoice.tax)}</Typography>
                      </Stack>
                    )}
                    {selectedInvoice.shipping > 0 && (
                      <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.25, borderBottom: "1px solid #e5e7eb" }}>
                        <Typography variant="body2" color="text.secondary">Shipping</Typography>
                        <Typography variant="body2" fontWeight={500}>${formatCurrency(selectedInvoice.shipping)}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.5, bgcolor: "#f0fdf4" }}>
                      <Typography variant="body1" fontWeight={600}>Total (USD)</Typography>
                      <Typography variant="body1" fontWeight={700} color="success.main">
                        ${formatCurrency(selectedInvoice.total_amount)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.25, bgcolor: "#f9fafb" }}>
                      <Typography variant="body2" color="text.secondary">Total (INR)</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        ₹{formatCurrency(selectedInvoice.total_amount * (selectedInvoice.exchange_rate || usdToInr))}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e5e7eb" }}>
              <Button onClick={() => setShowViewModal(false)} sx={{ textTransform: "none" }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Print Preview Modal */}
      <Dialog
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Invoice Preview</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handlePrintAction}
              >
                Print
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<PictureAsPdf />}
                onClick={handleDownloadPDF}
              >
                Save as PDF
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            bgcolor: "#f5f5f5",
            display: "flex",
            justifyContent: "center",
            py: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              transform: "scale(0.85)",
              transformOrigin: "top center",
            }}
          >
            <InvoicePrintPreview ref={printRef} invoice={selectedInvoice} />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrintPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Invoices;
