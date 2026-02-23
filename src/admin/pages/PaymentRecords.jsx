import { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  IconButton,
  Divider,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Payment,
  Receipt,
  AccountBalance,
  VerifiedUser,
  Image as ImageIcon,
  PictureAsPdf,
  OpenInNew,
  AttachMoney,
  Close,
  Edit,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useCurrency } from "../../context/CurrencyContext";
import paymentRecordsService from "../../services/paymentRecords.service";

function PaymentRecords() {
  const { usdToInr } = useCurrency();
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);

  // Modal states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Collect Payment modal state
  const [showCollectPaymentModal, setShowCollectPaymentModal] = useState(false);
  const [collectPaymentForm, setCollectPaymentForm] = useState({
    recorded_amount: "",
    currency: "USD",
    payment_exchange_rate: "",
    payment_method: "BANK_TRANSFER",
    payment_date: new Date().toISOString().split("T")[0],
    transaction_id: "",
    verification_notes: "",
  });

  // Edit Payment modal state (for editing verified records)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: "",
    recorded_amount: "",
    transaction_id: "",
    payment_method: "BANK_TRANSFER",
    payment_date: "",
    notes: "",
    verification_notes: "",
    payment_exchange_rate: "",
  });

  // Fetch payment records from API
  const fetchPaymentRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentRecordsService.getAll();
      if (result.success) {
        const records = result.data || [];
        setPaymentRecords(Array.isArray(records) ? records : []);
      } else {
        setError(result.error || "Failed to fetch payment records");
        toast.error(result.error || "Failed to fetch payment records");
      }
    } catch (err) {
      console.error("Error fetching payment records:", err);
      setError("Failed to load payment records");
      toast.error("Failed to load payment records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentRecords();
  }, []);

  // Filter by status
  const pendingRecords = paymentRecords.filter((r) => r.status === "PENDING");
  const verifiedRecords = paymentRecords.filter((r) => r.status === "VERIFIED");
  const rejectedRecords = paymentRecords.filter((r) => r.status === "REJECTED");

  // Get current list based on tab
  const getCurrentRecords = () => {
    switch (activeTab) {
      case 0:
        return paymentRecords; // All
      case 1:
        return pendingRecords;
      case 2:
        return verifiedRecords;
      case 3:
        return rejectedRecords;
      default:
        return paymentRecords;
    }
  };

  // Search filter
  const filterBySearch = (list) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (r) =>
        r.proforma_number?.toLowerCase().includes(term) ||
        r.buyer_name?.toLowerCase().includes(term) ||
        r.transaction_id?.toLowerCase().includes(term)
    );
  };

  const filteredRecords = filterBySearch(getCurrentRecords());

  // Pagination
  const paginatedRecords = filteredRecords.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate totals
  const totalPendingAmount = pendingRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalVerifiedAmount = verifiedRecords.reduce((sum, r) => sum + (r.recorded_amount || r.amount || 0), 0);

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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle sx={{ fontSize: "14px !important" }} />;
      case "PENDING":
        return <HourglassEmpty sx={{ fontSize: "14px !important" }} />;
      case "REJECTED":
        return <Cancel sx={{ fontSize: "14px !important" }} />;
      default:
        return null;
    }
  };

  // Handlers
  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // Open Collect Payment modal with pre-filled data from record
  const handleOpenCollectPayment = (record) => {
    setSelectedRecord(record);
    // Get exchange rate from PI if available, otherwise use current rate
    const piExchangeRate = record.proforma_invoice?.exchange_rate || usdToInr;
    setCollectPaymentForm({
      recorded_amount: record.amount?.toString() || "",
      currency: record.currency || "USD",
      payment_exchange_rate: piExchangeRate.toString(), // Use PI's exchange rate
      payment_method: record.payment_method || "BANK_TRANSFER",
      payment_date: record.payment_date
        ? new Date(record.payment_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      transaction_id: record.transaction_id || "",
      verification_notes: "",
    });
    setShowCollectPaymentModal(true);
    // Close view modal if open
    if (showViewModal) {
      setShowViewModal(false);
    }
  };

  const handleCloseCollectPayment = () => {
    setShowCollectPaymentModal(false);
    setSelectedRecord(null);
  };

  // Submit collect payment - verify record and record payment to PI
  const handleSubmitCollectPayment = async () => {
    if (!selectedRecord) return;

    const amount = parseFloat(collectPaymentForm.recorded_amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setProcessing(true);
    try {
      const result = await paymentRecordsService.verify(selectedRecord._id, {
        recorded_amount: amount,
        verification_notes: collectPaymentForm.verification_notes || "Payment verified and recorded by admin",
        payment_method: collectPaymentForm.payment_method,
        payment_date: collectPaymentForm.payment_date,
        transaction_id: collectPaymentForm.transaction_id,
      });

      if (result.success) {
        toast.success(`Payment of $${formatCurrency(amount)} recorded successfully!`);
        fetchPaymentRecords();
        handleCloseCollectPayment();
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
      toast.error("Failed to record payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async (record) => {
    if (!window.confirm("Are you sure you want to reject this payment record?")) {
      return;
    }

    setProcessing(true);
    try {
      const result = await paymentRecordsService.reject(record._id, {
        verification_notes: "Payment rejected by admin",
      });

      if (result.success) {
        toast.success("Payment record rejected");
        fetchPaymentRecords();
      } else {
        toast.error(result.error || "Failed to reject payment");
      }
    } catch (err) {
      console.error("Error rejecting payment:", err);
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  // Open Edit modal for verified/any records
  const handleOpenEditModal = (record) => {
    setSelectedRecord(record);
    setEditForm({
      amount: record.amount?.toString() || "",
      recorded_amount: record.recorded_amount?.toString() || record.amount?.toString() || "",
      transaction_id: record.transaction_id || "",
      payment_method: record.payment_method || "BANK_TRANSFER",
      payment_date: record.payment_date
        ? new Date(record.payment_date).toISOString().split("T")[0]
        : "",
      notes: record.notes || "",
      verification_notes: record.verification_notes || "",
      payment_exchange_rate: usdToInr.toString(),
    });
    setShowEditModal(true);
    // Close view modal if open
    if (showViewModal) {
      setShowViewModal(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedRecord(null);
  };

  // Submit edit - admin can edit any record including verified ones
  const handleSubmitEdit = async () => {
    if (!selectedRecord) return;

    setProcessing(true);
    try {
      const result = await paymentRecordsService.adminUpdate(selectedRecord._id, {
        amount: parseFloat(editForm.amount) || undefined,
        recorded_amount: parseFloat(editForm.recorded_amount) || undefined,
        transaction_id: editForm.transaction_id,
        payment_method: editForm.payment_method,
        payment_date: editForm.payment_date,
        notes: editForm.notes,
        verification_notes: editForm.verification_notes,
        payment_exchange_rate: parseFloat(editForm.payment_exchange_rate) || undefined,
      });

      if (result.success) {
        toast.success("Payment record updated successfully");
        fetchPaymentRecords();
        handleCloseEditModal();
      } else {
        toast.error(result.error || "Failed to update payment record");
      }
    } catch (err) {
      console.error("Error updating payment record:", err);
      toast.error("Failed to update payment record");
    } finally {
      setProcessing(false);
    }
  };

  // Render payment record row
  const renderRecordRow = (record) => {
    return (
      <TableRow
        key={record._id}
        hover
        sx={{ "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" } }}
      >
        {/* PI Number */}
        <TableCell>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {record.proforma_number}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(record.createdAt)}
          </Typography>
        </TableCell>

        {/* Buyer */}
        <TableCell>
          <Typography variant="body2">{record.buyer_name || "-"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {record.buyer_email}
          </Typography>
        </TableCell>

        {/* Amount */}
        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            ${formatCurrency(record.amount)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ₹{formatCurrency(record.amount * usdToInr)}
          </Typography>
        </TableCell>

        {/* Transaction ID */}
        <TableCell>
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {record.transaction_id}
          </Typography>
        </TableCell>

        {/* Payment Method */}
        <TableCell>
          <Chip
            label={record.payment_method?.replace(/_/g, " ")}
            size="small"
            variant="outlined"
          />
        </TableCell>

        {/* Payment Date */}
        <TableCell>
          <Typography variant="body2">
            {formatDate(record.payment_date)}
          </Typography>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Chip
            icon={getStatusIcon(record.status)}
            label={record.status}
            size="small"
            color={getStatusColor(record.status)}
          />
        </TableCell>

        {/* Actions */}
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleViewRecord(record)}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            {record.status === "PENDING" && (
              <>
                <Tooltip title="Collect Payment & Verify">
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<Payment />}
                    onClick={() => handleOpenCollectPayment(record)}
                    disabled={processing}
                    sx={{
                      textTransform: "none",
                      fontSize: "12px",
                      py: 0.5,
                      px: 1.5,
                    }}
                  >
                    Collect
                  </Button>
                </Tooltip>
                <Tooltip title="Reject Payment">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRejectPayment(record)}
                    disabled={processing}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {record.status === "VERIFIED" && (
              <Tooltip title="Edit Payment Record">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleOpenEditModal(record)}
                  disabled={processing}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Payment Records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verify buyer payment submissions and record confirmed payments
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Receipt sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {paymentRecords.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: "warning.lighter" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <HourglassEmpty sx={{ fontSize: 40, color: "warning.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {pendingRecords.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Verification
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Payment sx={{ fontSize: 40, color: "warning.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(totalPendingAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Amount
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AccountBalance sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(totalVerifiedAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified Amount
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
          placeholder="Search by PI number, buyer name, or transaction ID..."
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
      {pendingRecords.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{pendingRecords.length} payment(s)</strong> are waiting for verification. Review and verify payments to update the proforma invoice payment status.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>All</span>
                <Chip label={paymentRecords.length} size="small" color="primary" />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Pending</span>
                <Chip label={pendingRecords.length} size="small" color="warning" />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Verified</span>
                <Chip label={verifiedRecords.length} size="small" color="success" />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Rejected</span>
                <Chip label={rejectedRecords.length} size="small" color="error" />
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {/* Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>PI Number</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Buyer</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Transaction ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Method</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Payment Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Loading payment records...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="error.main">{error}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={fetchPaymentRecords}
                    sx={{ mt: 1 }}
                  >
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ) : paginatedRecords.length > 0 ? (
              paginatedRecords.map(renderRecordRow)
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No payment records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredRecords.length > 0 && (
        <TablePagination
          component="div"
          count={filteredRecords.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* View Record Modal */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Payment Record Details</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    PI Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedRecord.proforma_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedRecord.status)}
                    label={selectedRecord.status}
                    size="small"
                    color={getStatusColor(selectedRecord.status)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Buyer
                  </Typography>
                  <Typography variant="body1">{selectedRecord.buyer_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedRecord.buyer_email}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    ${formatCurrency(selectedRecord.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹{formatCurrency(selectedRecord.amount * usdToInr)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {selectedRecord.transaction_id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">
                    {selectedRecord.payment_method?.replace(/_/g, " ")}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedRecord.payment_date)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Submitted On
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedRecord.createdAt)}
                  </Typography>
                </Grid>
                {selectedRecord.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">{selectedRecord.notes}</Typography>
                  </Grid>
                )}

                {/* Payment Proof Section */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Payment Proof
                  </Typography>
                  {selectedRecord.proof_file || selectedRecord.proof_file_url ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "grey.50",
                      }}
                    >
                      {/* If we have a URL, show the image */}
                      {selectedRecord.proof_file_url ? (
                        <Box>
                          <Box
                            component="img"
                            src={selectedRecord.proof_file_url}
                            alt="Payment Proof"
                            sx={{
                              maxWidth: "100%",
                              maxHeight: 300,
                              objectFit: "contain",
                              borderRadius: 1,
                              mb: 1,
                            }}
                          />
                          <Button
                            size="small"
                            startIcon={<OpenInNew />}
                            onClick={() => window.open(selectedRecord.proof_file_url, "_blank")}
                          >
                            Open Full Image
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <ImageIcon sx={{ fontSize: 60, color: "grey.400", mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Proof file: {selectedRecord.proof_file}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (File upload not yet implemented)
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "warning.lighter",
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
                      <Typography variant="body2" color="warning.main">
                        No payment proof uploaded
                      </Typography>
                    </Paper>
                  )}
                </Grid>

                {selectedRecord.status === "VERIFIED" && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        Verification Details
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Recorded Amount
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        ${formatCurrency(selectedRecord.recorded_amount)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Verified On
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedRecord.verified_at)}
                      </Typography>
                    </Grid>
                    {selectedRecord.verification_notes && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Verification Notes
                        </Typography>
                        <Typography variant="body2">
                          {selectedRecord.verification_notes}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
                {selectedRecord.status === "REJECTED" && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                        Rejection Details
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Rejected On
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedRecord.verified_at)}
                      </Typography>
                    </Grid>
                    {selectedRecord.verification_notes && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Rejection Reason
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {selectedRecord.verification_notes}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewModal(false)}>Close</Button>
          {selectedRecord?.status === "PENDING" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Payment />}
              onClick={() => handleOpenCollectPayment(selectedRecord)}
              disabled={processing}
            >
              Collect Payment
            </Button>
          )}
          {selectedRecord?.status === "VERIFIED" && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Edit />}
              onClick={() => handleOpenEditModal(selectedRecord)}
              disabled={processing}
            >
              Edit Record
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Collect Payment Modal */}
      <Dialog
        open={showCollectPaymentModal}
        onClose={handleCloseCollectPayment}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Payment color="success" />
              <Typography variant="h6">Collect Payment</Typography>
            </Stack>
            <IconButton onClick={handleCloseCollectPayment} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Stack spacing={3}>
              {/* Record Info */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">PI Number</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRecord.proforma_number}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Buyer</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRecord.buyer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedRecord.buyer_email}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Proof Section */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Payment Proof from Buyer
                </Typography>
                {selectedRecord.proof_file_url ? (
                  <Box sx={{ textAlign: "center" }}>
                    <Box
                      component="img"
                      src={selectedRecord.proof_file_url}
                      alt="Payment Proof"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 200,
                        objectFit: "contain",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        mb: 1,
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNew />}
                      onClick={() => window.open(selectedRecord.proof_file_url, "_blank")}
                    >
                      View Full Size
                    </Button>
                  </Box>
                ) : selectedRecord.proof_file ? (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <ImageIcon sx={{ fontSize: 50, color: "grey.400", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      File: {selectedRecord.proof_file}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <ImageIcon sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
                    <Typography variant="body2" color="warning.main">
                      No payment proof uploaded
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Buyer Submitted Details */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "info.lighter" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Buyer Submitted Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Submitted Amount</Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ${formatCurrency(selectedRecord.amount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {selectedRecord.transaction_id}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                    <Typography variant="body2">
                      {selectedRecord.payment_method?.replace(/_/g, " ")}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedRecord.payment_date)}
                    </Typography>
                  </Grid>
                  {selectedRecord.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Notes</Typography>
                      <Typography variant="body2">{selectedRecord.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Payment Collection Form */}
              <Typography variant="subtitle1" fontWeight="bold">
                Record Payment Details
              </Typography>
              <Alert severity="info" sx={{ mb: 1 }}>
                Review the proof above and confirm/adjust the payment details below.
              </Alert>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Amount to Record"
                    type="number"
                    fullWidth
                    value={collectPaymentForm.recorded_amount}
                    onChange={(e) => setCollectPaymentForm({ ...collectPaymentForm, recorded_amount: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {collectPaymentForm.currency === "USD" ? "$" : "₹"}
                          </InputAdornment>
                        ),
                      },
                      htmlInput: { min: 0, step: "0.01" },
                    }}
                    helperText={`Buyer submitted: $${formatCurrency(selectedRecord.amount)}`}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={collectPaymentForm.currency}
                      label="Currency"
                      onChange={(e) => setCollectPaymentForm({ ...collectPaymentForm, currency: e.target.value })}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="INR">INR</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={collectPaymentForm.payment_method}
                      label="Payment Method"
                      onChange={(e) => setCollectPaymentForm({ ...collectPaymentForm, payment_method: e.target.value })}
                    >
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                      <MenuItem value="CHECK">Check</MenuItem>
                      <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Payment Date"
                    type="date"
                    fullWidth
                    value={collectPaymentForm.payment_date}
                    onChange={(e) => setCollectPaymentForm({ ...collectPaymentForm, payment_date: e.target.value })}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Transaction ID / Reference"
                    fullWidth
                    value={collectPaymentForm.transaction_id}
                    onChange={(e) => setCollectPaymentForm({ ...collectPaymentForm, transaction_id: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Verification Notes (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    value={collectPaymentForm.verification_notes}
                    onChange={(e) => setCollectPaymentForm({ ...collectPaymentForm, verification_notes: e.target.value })}
                    placeholder="Add any notes about this payment verification"
                  />
                </Grid>
              </Grid>

              {/* Payment Conversion Info - Using PI's Exchange Rate */}
              <Alert severity="info" icon={<AttachMoney />}>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>PI Exchange Rate:</strong> ₹{collectPaymentForm.payment_exchange_rate}/$1
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      (from Proforma Invoice)
                    </Typography>
                  </Typography>
                  {collectPaymentForm.currency === "INR" && (
                    <Typography variant="body2">
                      INR ₹{parseFloat(collectPaymentForm.recorded_amount || 0).toFixed(2)} = USD ${(parseFloat(collectPaymentForm.recorded_amount || 0) / parseFloat(collectPaymentForm.payment_exchange_rate || usdToInr)).toFixed(2)}
                    </Typography>
                  )}
                  {collectPaymentForm.currency === "USD" && (
                    <Typography variant="body2">
                      USD ${parseFloat(collectPaymentForm.recorded_amount || 0).toFixed(2)} = INR ₹{(parseFloat(collectPaymentForm.recorded_amount || 0) * parseFloat(collectPaymentForm.payment_exchange_rate || usdToInr)).toFixed(2)}
                    </Typography>
                  )}
                </Stack>
              </Alert>

            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseCollectPayment} color="inherit" disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <VerifiedUser />}
            onClick={handleSubmitCollectPayment}
            disabled={processing || !collectPaymentForm.recorded_amount}
          >
            {processing ? "Recording..." : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Payment Record Modal */}
      <Dialog
        open={showEditModal}
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Edit color="warning" />
              <Typography variant="h6">Edit Payment Record</Typography>
            </Stack>
            <IconButton onClick={handleCloseEditModal} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Stack spacing={3}>
              {/* Warning Alert */}
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Editing a verified payment record.</strong> Changes will update the recorded amount in the
                  Proforma Invoice. Use this to correct mistakes only.
                </Typography>
              </Alert>

              {/* Record Info */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">PI Number</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRecord.proforma_number}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Current Status</Typography>
                    <Chip
                      icon={getStatusIcon(selectedRecord.status)}
                      label={selectedRecord.status}
                      size="small"
                      color={getStatusColor(selectedRecord.status)}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Buyer</Typography>
                    <Typography variant="body1">{selectedRecord.buyer_name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Original Recorded Amount</Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ${formatCurrency(selectedRecord.recorded_amount || selectedRecord.amount)}
                    </Typography>
                  </Grid>
                  {selectedRecord.last_edited_at && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last edited: {formatDate(selectedRecord.last_edited_at)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Edit Form */}
              <Typography variant="subtitle1" fontWeight="bold">
                Update Payment Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Submitted Amount (Original)"
                    type="number"
                    fullWidth
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      },
                      htmlInput: { min: 0, step: "0.01" },
                    }}
                    helperText="The amount buyer originally submitted"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Recorded Amount (Verified)"
                    type="number"
                    fullWidth
                    value={editForm.recorded_amount}
                    onChange={(e) => setEditForm({ ...editForm, recorded_amount: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      },
                      htmlInput: { min: 0, step: "0.01" },
                    }}
                    helperText="The actual amount to record (this updates PI)"
                    color="warning"
                    focused
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Exchange Rate (₹/$)"
                    type="number"
                    fullWidth
                    value={editForm.payment_exchange_rate}
                    onChange={(e) => setEditForm({ ...editForm, payment_exchange_rate: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      },
                      htmlInput: { min: 1, step: "0.01" },
                    }}
                    helperText="Exchange rate for INR conversion"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={editForm.payment_method}
                      label="Payment Method"
                      onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                    >
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                      <MenuItem value="CHECK">Check</MenuItem>
                      <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Payment Date"
                    type="date"
                    fullWidth
                    value={editForm.payment_date}
                    onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Transaction ID / Reference"
                    fullWidth
                    value={editForm.transaction_id}
                    onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Notes"
                    fullWidth
                    multiline
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Payment notes"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Verification Notes"
                    fullWidth
                    multiline
                    rows={2}
                    value={editForm.verification_notes}
                    onChange={(e) => setEditForm({ ...editForm, verification_notes: e.target.value })}
                    placeholder="Admin verification notes / reason for edit"
                  />
                </Grid>
              </Grid>

              {/* Amount Change Info */}
              {selectedRecord.status === "VERIFIED" && editForm.recorded_amount && (
                <Alert
                  severity={
                    parseFloat(editForm.recorded_amount) !== (selectedRecord.recorded_amount || selectedRecord.amount)
                      ? "warning"
                      : "info"
                  }
                  icon={<AttachMoney />}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Current recorded:</strong> ${formatCurrency(selectedRecord.recorded_amount || selectedRecord.amount)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>New amount:</strong> ${formatCurrency(parseFloat(editForm.recorded_amount) || 0)}
                    </Typography>
                    {parseFloat(editForm.recorded_amount) !== (selectedRecord.recorded_amount || selectedRecord.amount) && (
                      <Typography variant="body2" color="warning.main" fontWeight="bold">
                        Difference: {parseFloat(editForm.recorded_amount) > (selectedRecord.recorded_amount || selectedRecord.amount) ? "+" : ""}
                        ${formatCurrency(parseFloat(editForm.recorded_amount) - (selectedRecord.recorded_amount || selectedRecord.amount))}
                        {" "}(PI will be adjusted)
                      </Typography>
                    )}
                  </Stack>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditModal} color="inherit" disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <Edit />}
            onClick={handleSubmitEdit}
            disabled={processing}
          >
            {processing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PaymentRecords;
