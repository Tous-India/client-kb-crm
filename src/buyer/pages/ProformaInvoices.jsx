import { useState, useEffect, useRef } from "react";
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
  LinearProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Visibility,
  Print,
  PictureAsPdf,
  Receipt,
  CheckCircle,
  HourglassEmpty,
  AttachMoney,
  Cancel,
  Schedule,
  Payment,
  CloudUpload,
  Delete,
  Send,
  Close,
  OpenInNew,
  Image as ImageIcon,
  VerifiedUser,
  Edit as EditIcon,
  Phone,
  Email as EmailIcon,
  Person,
  AdminPanelSettings,
  MoreHoriz,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import PerformaInvoicePrintPreview from "../../admin/components/PerformaInvoicePrintPreview";
import proformaInvoicesService from "../../services/proformaInvoices.service";
import paymentRecordsService from "../../services/paymentRecords.service";

function ProformaInvoices() {
  const { user } = useAuth();
  const { usdToInr } = useCurrency();
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);

  // Modal states
  const [selectedPI, setSelectedPI] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Payment proof modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK_TRANSFER",
    notes: "",
    proofFile: null,
    proofPreview: null,
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Pending payment records for each PI
  const [pendingPayments, setPendingPayments] = useState({});

  // Payment records for the selected PI (for View modal)
  const [piPaymentRecords, setPiPaymentRecords] = useState([]);
  const [loadingPaymentRecords, setLoadingPaymentRecords] = useState(false);

  // Edit payment record modal state
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
  const [editRecordForm, setEditRecordForm] = useState({
    amount: "",
    transactionId: "",
    paymentDate: "",
    paymentMethod: "BANK_TRANSFER",
    notes: "",
    proofFile: null,
    proofPreview: null,
  });
  const [updatingRecord, setUpdatingRecord] = useState(false);
  const editRecordFileInputRef = useRef(null);

  // Print ref
  const printRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch buyer's proforma invoices from API
  const fetchProformaInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch PIs and pending payments in parallel
      const [piResult, paymentResult] = await Promise.all([
        proformaInvoicesService.getMyProformas(),
        paymentRecordsService.getMyRecords({ status: "PENDING" }),
      ]);

      if (piResult.success) {
        // API returns data in different formats, handle both
        const piData = piResult.data?.proformaInvoices || piResult.data || [];
        setProformaInvoices(Array.isArray(piData) ? piData : []);
      } else {
        setError(piResult.error || "Failed to fetch proforma invoices");
        toast.error(piResult.error || "Failed to fetch proforma invoices");
      }

      // Build a map of pending payments by PI ID
      if (paymentResult.success) {
        const payments = paymentResult.data || [];
        const pendingMap = {};
        payments.forEach((p) => {
          const piId = p.proforma_invoice?._id || p.proforma_invoice;
          if (!pendingMap[piId]) pendingMap[piId] = [];
          pendingMap[piId].push(p);
        });
        setPendingPayments(pendingMap);
      }
    } catch (err) {
      console.error("Error fetching proforma invoices:", err);
      setError("Failed to load proforma invoices");
      toast.error("Failed to load proforma invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProformaInvoices();
  }, []);

  // Helper to calculate payment percentage
  const calcPaymentPercentage = (pi) => {
    if (!pi.total_amount) return 0;
    return Math.min(100, ((pi.payment_received || 0) / pi.total_amount) * 100);
  };

  // Filter by payment status - using payment_status field from database
  const unpaidPIs = proformaInvoices.filter((pi) =>
    pi.payment_status === "UNPAID" || calcPaymentPercentage(pi) === 0
  );
  const paidPIs = proformaInvoices.filter((pi) =>
    pi.payment_status === "PAID" || calcPaymentPercentage(pi) >= 100
  );
  const partialPIs = proformaInvoices.filter((pi) =>
    pi.payment_status === "PARTIAL" || (calcPaymentPercentage(pi) > 0 && calcPaymentPercentage(pi) < 100)
  );

  // Get current list based on tab (All, Unpaid, Partial, Paid)
  const getCurrentPIs = () => {
    switch (activeTab) {
      case 0:
        return proformaInvoices; // All PIs
      case 1:
        return unpaidPIs;
      case 2:
        return partialPIs;
      case 3:
        return paidPIs;
      default:
        return proformaInvoices;
    }
  };

  // Search filter - using correct field names from database
  const filterBySearch = (piList) => {
    if (!searchTerm) return piList;
    const term = searchTerm.toLowerCase();
    return piList.filter(
      (pi) =>
        pi.proforma_number?.toLowerCase().includes(term) ||
        pi.quote_number?.toLowerCase().includes(term) ||
        pi.buyer_name?.toLowerCase().includes(term) ||
        pi.items?.some((item) => item.part_number?.toLowerCase().includes(term))
    );
  };

  const filteredPIs = filterBySearch(getCurrentPIs());

  // Pagination
  const paginatedPIs = filteredPIs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate totals
  const totalAmount = proformaInvoices.reduce((sum, pi) => sum + (pi.total_amount || 0), 0);
  const totalPaid = proformaInvoices.reduce((sum, pi) => sum + (pi.payment_received || 0), 0);
  const totalBalance = totalAmount - totalPaid;

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
      case "APPROVED":
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
      case "APPROVED":
        return <CheckCircle sx={{ fontSize: "14px !important" }} />;
      case "PENDING":
        return <HourglassEmpty sx={{ fontSize: "14px !important" }} />;
      case "REJECTED":
        return <Cancel sx={{ fontSize: "14px !important" }} />;
      default:
        return null;
    }
  };

  // Calculate payment percentage
  const getPaymentPercentage = (pi) => {
    if (!pi.total_amount) return 0;
    return Math.min(100, ((pi.payment_received || 0) / pi.total_amount) * 100);
  };

  // Get payment status
  const getPaymentStatus = (pi) => {
    const percentage = getPaymentPercentage(pi);
    if (percentage >= 100) return { label: "Paid", color: "success" };
    if (percentage > 0) return { label: "Partial", color: "warning" };
    return { label: "Unpaid", color: "error" };
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

  const handleViewPI = async (pi) => {
    setSelectedPI(pi);
    setShowViewModal(true);
    setPiPaymentRecords([]);
    setLoadingPaymentRecords(true);

    // Fetch payment records for this PI
    try {
      const result = await paymentRecordsService.getByProformaInvoice(pi._id);
      if (result.success) {
        setPiPaymentRecords(result.data?.records || []);
      }
    } catch (err) {
      console.error("Error fetching payment records:", err);
    } finally {
      setLoadingPaymentRecords(false);
    }
  };

  const handlePreviewPI = (pi) => {
    setSelectedPI(pi);
    setShowPrintPreview(true);
  };

  // Payment modal handlers
  const handleOpenPaymentModal = (pi) => {
    setSelectedPI(pi);
    const balanceDue = (pi.total_amount || 0) - (pi.payment_received || 0);
    setPaymentForm({
      amount: balanceDue.toFixed(2),
      transactionId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "BANK_TRANSFER",
      notes: "",
      proofFile: null,
      proofPreview: null,
    });
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPI(null);
    setPaymentForm({
      amount: "",
      transactionId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "BANK_TRANSFER",
      notes: "",
      proofFile: null,
      proofPreview: null,
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload an image (JPG, PNG, GIF, WebP) or PDF file.");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB.");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPaymentForm((prev) => ({
        ...prev,
        proofFile: file,
        proofPreview: previewUrl,
      }));
    }
  };

  const handleRemoveFile = () => {
    if (paymentForm.proofPreview) {
      URL.revokeObjectURL(paymentForm.proofPreview);
    }
    setPaymentForm((prev) => ({
      ...prev,
      proofFile: null,
      proofPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitPayment = async () => {
    // Validate form
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    if (!paymentForm.transactionId) {
      toast.error("Please enter the transaction reference/ID.");
      return;
    }
    if (!paymentForm.proofFile) {
      toast.error("Please upload payment proof (screenshot or receipt).");
      return;
    }

    setSubmittingPayment(true);

    try {
      // Create FormData for multipart/form-data upload (file + fields)
      const formData = new FormData();
      formData.append("proforma_invoice_id", selectedPI._id);
      formData.append("proforma_number", selectedPI.proforma_number);
      formData.append("amount", parseFloat(paymentForm.amount));
      formData.append("currency", "USD");
      formData.append("transaction_id", paymentForm.transactionId);
      formData.append("payment_method", paymentForm.paymentMethod);
      formData.append("payment_date", paymentForm.paymentDate);
      if (paymentForm.notes) {
        formData.append("notes", paymentForm.notes);
      }
      // Append the actual file for Cloudinary upload
      formData.append("proof_file", paymentForm.proofFile);

      const result = await paymentRecordsService.create(formData);

      if (result.success) {
        toast.success(
          `Payment recorded successfully! Amount: $${paymentForm.amount}\n\nWaiting for admin verification.`
        );
        // Refresh the list to show pending status
        fetchProformaInvoices();
      } else {
        toast.error(result.error || "Failed to submit payment record");
      }
    } catch (err) {
      console.error("Error submitting payment record:", err);
      toast.error("Failed to submit payment. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }

    handleClosePaymentModal();
  };

  // Edit payment record modal handlers
  const handleOpenEditRecordModal = (record) => {
    setSelectedPaymentRecord(record);
    setEditRecordForm({
      amount: record.amount?.toString() || "",
      transactionId: record.transaction_id || "",
      paymentDate: record.payment_date ? new Date(record.payment_date).toISOString().split("T")[0] : "",
      paymentMethod: record.payment_method || "BANK_TRANSFER",
      notes: record.notes || "",
      proofFile: null,
      proofPreview: null,
    });
    setShowEditRecordModal(true);
  };

  const handleCloseEditRecordModal = () => {
    setShowEditRecordModal(false);
    setSelectedPaymentRecord(null);
    if (editRecordForm.proofPreview) {
      URL.revokeObjectURL(editRecordForm.proofPreview);
    }
    setEditRecordForm({
      amount: "",
      transactionId: "",
      paymentDate: "",
      paymentMethod: "BANK_TRANSFER",
      notes: "",
      proofFile: null,
      proofPreview: null,
    });
  };

  const handleEditRecordFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image (JPG, PNG, GIF, WebP) or PDF file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB.");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setEditRecordForm((prev) => ({
        ...prev,
        proofFile: file,
        proofPreview: previewUrl,
      }));
    }
  };

  const handleSubmitEditRecord = async () => {
    // Validate
    if (!editRecordForm.amount || parseFloat(editRecordForm.amount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    if (!editRecordForm.transactionId) {
      toast.error("Please enter the transaction reference/ID.");
      return;
    }

    setUpdatingRecord(true);
    try {
      const updateData = {
        amount: parseFloat(editRecordForm.amount),
        transaction_id: editRecordForm.transactionId,
        payment_method: editRecordForm.paymentMethod,
        payment_date: editRecordForm.paymentDate,
        notes: editRecordForm.notes,
      };

      const result = await paymentRecordsService.update(
        selectedPaymentRecord._id,
        updateData,
        editRecordForm.proofFile
      );

      if (result.success) {
        toast.success("Payment record updated successfully!");
        // Refresh the payment records
        const refreshResult = await paymentRecordsService.getByProformaInvoice(selectedPI._id);
        if (refreshResult.success) {
          setPiPaymentRecords(refreshResult.data?.records || []);
        }
        // Also refresh pending payments
        fetchProformaInvoices();
        handleCloseEditRecordModal();
      } else {
        toast.error(result.error || "Failed to update payment record");
      }
    } catch (err) {
      console.error("Error updating payment record:", err);
      toast.error("Failed to update payment record. Please try again.");
    } finally {
      setUpdatingRecord(false);
    }
  };

  // Check if PI has pending payment records
  const hasPendingPayment = (piId) => {
    return pendingPayments[piId] && pendingPayments[piId].length > 0;
  };

  // Get collection source info for display
  const getCollectionSourceInfo = (source) => {
    switch (source) {
      case "EMAIL":
        return { label: "Via Email", icon: <EmailIcon sx={{ fontSize: 14 }} />, color: "info" };
      case "PHONE_CALL":
        return { label: "Via Phone Call", icon: <Phone sx={{ fontSize: 14 }} />, color: "info" };
      case "IN_PERSON":
        return { label: "In Person", icon: <Person sx={{ fontSize: 14 }} />, color: "info" };
      case "ADMIN_DIRECT":
        return { label: "Admin Entry", icon: <AdminPanelSettings sx={{ fontSize: 14 }} />, color: "secondary" };
      case "OTHER":
        return { label: "Other Source", icon: <MoreHoriz sx={{ fontSize: 14 }} />, color: "default" };
      default:
        return null; // BUYER_PORTAL - no special indicator needed
    }
  };

  // Get pending payment amount for a PI
  const getPendingPaymentAmount = (piId) => {
    if (!pendingPayments[piId]) return 0;
    return pendingPayments[piId].reduce((sum, p) => sum + (p.amount || 0), 0);
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
            <title>Proforma Invoice - ${selectedPI?.performa_invoice_number}</title>
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
            <title>Proforma Invoice - ${selectedPI?.performa_invoice_number}</title>
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

  // Render PI row - using correct field names from database
  const renderPIRow = (pi) => {
    const paymentStatus = getPaymentStatus(pi);
    const paymentPercentage = getPaymentPercentage(pi);
    // Not expired if: approved/sent, or any payment received (partial or full)
    const isExpired = pi.valid_until && new Date(pi.valid_until) < new Date() &&
      !["APPROVED", "SENT"].includes(pi.status) && paymentPercentage === 0;

    // Check if this PI has pending payment awaiting verification
    const isPendingVerification = hasPendingPayment(pi._id);
    const pendingAmount = getPendingPaymentAmount(pi._id);

    // Can record payment if: not fully paid, not expired, not rejected, and no pending verification
    const canRecordPayment = paymentPercentage < 100 && !isExpired &&
      pi.status !== "REJECTED" && !isPendingVerification;

    return (
      <TableRow
        key={pi._id}
        hover
        sx={{ "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" } }}
      >
        {/* PI Number & Date */}
        <TableCell>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {pi.proforma_number}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(pi.issue_date || pi.createdAt)}
          </Typography>
        </TableCell>

        {/* Quotation Reference */}
        <TableCell>
          <Typography variant="body2">{pi.quote_number || "-"}</Typography>
        </TableCell>

        {/* Items */}
        <TableCell>
          <Typography variant="body2">
            {pi.items?.length || 0} item{(pi.items?.length || 0) !== 1 ? "s" : ""}
          </Typography>
        </TableCell>

        {/* Amount */}
        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            ${formatCurrency(pi.total_amount)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ₹{formatCurrency(pi.total_amount * (pi.exchange_rate || usdToInr))}
          </Typography>
        </TableCell>

        {/* Payment Progress */}
        <TableCell>
          <Box sx={{ width: 140 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Chip
                label={paymentStatus.label}
                size="small"
                color={paymentStatus.color}
                variant="outlined"
              />
              <Typography variant="caption">{paymentPercentage.toFixed(0)}%</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={paymentPercentage}
              color={paymentStatus.color}
              sx={{ height: 6, borderRadius: 3 }}
            />
            {/* Show pending verification indicator - only if not fully paid */}
            {isPendingVerification && paymentPercentage < 100 && (
              <Chip
                label={`$${formatCurrency(pendingAmount)} pending`}
                size="small"
                color="warning"
                sx={{ mt: 0.5, fontSize: "10px", height: 18 }}
              />
            )}
          </Box>
        </TableCell>

        {/* Valid Until */}
        <TableCell>
          <Typography
            variant="body2"
            color={isExpired || pi.status === "REJECTED" ? "error.main" : "text.primary"}
          >
            {pi.valid_until ? formatDate(pi.valid_until) : "-"}
          </Typography>
          {isExpired && (
            <Typography variant="caption" color="error.main">
              Expired
            </Typography>
          )}
          {pi.status === "REJECTED" && (
            <Typography variant="caption" color="error.main">
              Rejected
            </Typography>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleViewPI(pi)}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print / PDF">
              <IconButton
                size="small"
                color="default"
                onClick={() => handlePreviewPI(pi)}
              >
                <Print fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* Show waiting for verification or Record Payment button */}
            {isPendingVerification ? (
              <Chip
                icon={<HourglassEmpty sx={{ fontSize: "14px !important" }} />}
                label="Awaiting Verification"
                size="small"
                color="warning"
                sx={{ ml: 1, fontSize: "11px" }}
              />
            ) : canRecordPayment ? (
              <Tooltip title="Record Payment for Admin Verification">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<Payment />}
                  onClick={() => handleOpenPaymentModal(pi)}
                  sx={{
                    ml: 1,
                    textTransform: "none",
                    fontSize: "11px",
                    py: 0.5,
                    px: 1,
                  }}
                >
                  Record Payment
                </Button>
              </Tooltip>
            ) : null}
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
          Proforma Invoices
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage your proforma invoices
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
                    {proformaInvoices.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total PIs
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
                <AttachMoney sx={{ fontSize: 40, color: "info.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(totalAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
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
                <Payment sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(totalPaid)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid
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
                <Schedule sx={{ fontSize: 40, color: "warning.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(totalBalance)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Balance Due
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
          placeholder="Search by PI number, quotation ID, or part number..."
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
          <strong>Note:</strong> Proforma Invoices are preliminary invoices generated from approved quotations. Once approved and paid, they will be converted to final invoices for dispatch.
        </Typography>
      </Alert>

      {/* Tabs - Filter by payment status */}
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
                <Chip label={proformaInvoices.length} size="small" color="primary" />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Unpaid</span>
                <Chip label={unpaidPIs.length} size="small" color="error" />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Partial</span>
                <Chip label={partialPIs.length} size="small" color="warning" />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Paid</span>
                <Chip label={paidPIs.length} size="small" color="success" />
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {/* PI Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>PI Number</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Quotation</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Valid Until</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Loading proforma invoices...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="error.main">{error}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={fetchProformaInvoices}
                    sx={{ mt: 1 }}
                  >
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ) : paginatedPIs.length > 0 ? (
              paginatedPIs.map(renderPIRow)
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No proforma invoices found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredPIs.length > 0 && (
        <TablePagination
          component="div"
          count={filteredPIs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* View PI Modal */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Proforma Invoice Details</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => {
                  setShowViewModal(false);
                  handlePreviewPI(selectedPI);
                }}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<PictureAsPdf />}
                onClick={() => {
                  setShowViewModal(false);
                  handlePreviewPI(selectedPI);
                }}
              >
                PDF
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPI && (
            <Box>
              {/* PI Header Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    PI Number
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedPI.proforma_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issue Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPI.issue_date || selectedPI.createdAt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quotation Reference
                  </Typography>
                  <Typography variant="body1">{selectedPI.quote_number || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Valid Until
                  </Typography>
                  <Typography variant="body1">
                    {selectedPI.valid_until ? formatDate(selectedPI.valid_until) : "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedPI.status)}
                    label={selectedPI.status}
                    size="small"
                    color={getStatusColor(selectedPI.status)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Status
                  </Typography>
                  <Chip
                    label={getPaymentStatus(selectedPI).label}
                    size="small"
                    color={getPaymentStatus(selectedPI).color}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Exchange Rate
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    1 USD = ₹{selectedPI.exchange_rate || usdToInr}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Items Table */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Part Number</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Unit Price
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPI.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.part_number}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ${formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell align="right">
                          ${formatCurrency(item.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ width: 320 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Subtotal:</Typography>
                      <Typography>${formatCurrency(selectedPI.subtotal)}</Typography>
                    </Stack>
                    {(selectedPI.logistic_charges > 0) && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Logistic Charges:</Typography>
                        <Typography>${formatCurrency(selectedPI.logistic_charges)}</Typography>
                      </Stack>
                    )}
                    {(selectedPI.custom_duty > 0) && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Custom Duty:</Typography>
                        <Typography>${formatCurrency(selectedPI.custom_duty)}</Typography>
                      </Stack>
                    )}
                    {(selectedPI.bank_charges > 0) && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Bank Charges:</Typography>
                        <Typography>${formatCurrency(selectedPI.bank_charges)}</Typography>
                      </Stack>
                    )}
                    {(selectedPI.other_charges > 0) && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Other Charges:</Typography>
                        <Typography>${formatCurrency(selectedPI.other_charges)}</Typography>
                      </Stack>
                    )}
                    {(selectedPI.tax > 0) && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Tax:</Typography>
                        <Typography>${formatCurrency(selectedPI.tax)}</Typography>
                      </Stack>
                    )}
                    {(selectedPI.shipping > 0) && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Shipping:</Typography>
                        <Typography>${formatCurrency(selectedPI.shipping)}</Typography>
                      </Stack>
                    )}
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight="bold">Total:</Typography>
                      <Typography fontWeight="bold">
                        ${formatCurrency(selectedPI.total_amount)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Amount in INR:</Typography>
                      <Typography color="text.secondary">
                        ₹{formatCurrency(selectedPI.total_amount * (selectedPI.exchange_rate || usdToInr))}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="success.main">Paid:</Typography>
                      <Typography color="success.main">
                        ${formatCurrency(selectedPI.payment_received)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="warning.main" fontWeight="bold">
                        Balance:
                      </Typography>
                      <Typography color="warning.main" fontWeight="bold">
                        ${formatCurrency(
                          (selectedPI.total_amount || 0) - (selectedPI.payment_received || 0)
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Box>

              {/* Payment Records Section */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Payment Records
              </Typography>
              {loadingPaymentRecords ? (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading payment records...
                  </Typography>
                </Box>
              ) : piPaymentRecords.length > 0 ? (
                <Stack spacing={2}>
                  {piPaymentRecords.map((record) => {
                    const collectionSourceInfo = getCollectionSourceInfo(record.collection_source);
                    const isAdminCollected = record.collection_source && record.collection_source !== "BUYER_PORTAL";

                    return (
                    <Paper
                      key={record._id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: record.status === "VERIFIED" ? "success.lighter" :
                                 record.status === "REJECTED" ? "error.lighter" : "warning.lighter",
                        borderColor: record.status === "VERIFIED" ? "success.light" :
                                     record.status === "REJECTED" ? "error.light" : "warning.light",
                      }}
                    >
                      {/* Admin Collected Badge */}
                      {isAdminCollected && (
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
                            label={`Collected by Admin ${collectionSourceInfo ? `(${collectionSourceInfo.label})` : ""}`}
                            size="small"
                            color="secondary"
                            variant="filled"
                            sx={{ fontWeight: "medium" }}
                          />
                          {record.collected_by_name && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              by {record.collected_by_name}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Grid container spacing={2}>
                        {/* Payment Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip
                                icon={
                                  record.status === "VERIFIED" ? <CheckCircle sx={{ fontSize: 14 }} /> :
                                  record.status === "REJECTED" ? <Cancel sx={{ fontSize: 14 }} /> :
                                  <HourglassEmpty sx={{ fontSize: 14 }} />
                                }
                                label={record.status}
                                size="small"
                                color={
                                  record.status === "VERIFIED" ? "success" :
                                  record.status === "REJECTED" ? "error" : "warning"
                                }
                              />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(record.createdAt)}
                              </Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight="bold" color="success.main">
                              ${formatCurrency(record.status === "VERIFIED" ? record.recorded_amount || record.amount : record.amount)}
                            </Typography>
                            {record.transaction_id && (
                              <Typography variant="body2">
                                <strong>Transaction ID:</strong> {record.transaction_id}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              <strong>Method:</strong> {record.payment_method?.replace(/_/g, " ")}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Payment Date:</strong> {formatDate(record.payment_date)}
                            </Typography>
                            {record.notes && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Notes:</strong> {record.notes}
                              </Typography>
                            )}
                            {record.status === "VERIFIED" && record.verification_notes && (
                              <Alert severity="success" sx={{ mt: 1 }}>
                                <Typography variant="caption">
                                  <strong>Admin Notes:</strong> {record.verification_notes}
                                </Typography>
                              </Alert>
                            )}
                            {record.status === "REJECTED" && record.verification_notes && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                <Typography variant="caption">
                                  <strong>Rejection Reason:</strong> {record.verification_notes}
                                </Typography>
                              </Alert>
                            )}
                          </Stack>
                        </Grid>

                        {/* Payment Proof Image */}
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Payment Proof
                          </Typography>
                          {record.proof_file_url ? (
                            <Box sx={{ textAlign: "center" }}>
                              <Box
                                component="img"
                                src={record.proof_file_url}
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
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<OpenInNew />}
                                  onClick={() => window.open(record.proof_file_url, "_blank")}
                                >
                                  View Full Size
                                </Button>
                                {record.status === "PENDING" && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleOpenEditRecordModal(record)}
                                  >
                                    Edit Record
                                  </Button>
                                )}
                              </Stack>
                            </Box>
                          ) : record.proof_file ? (
                            <Box sx={{ textAlign: "center", py: 2 }}>
                              <ImageIcon sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                File: {record.proof_file}
                              </Typography>
                              {record.status === "PENDING" && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleOpenEditRecordModal(record)}
                                  sx={{ mt: 1 }}
                                >
                                  Edit Record
                                </Button>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ textAlign: "center", py: 2 }}>
                              <ImageIcon sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                No proof uploaded
                              </Typography>
                              {record.status === "PENDING" && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleOpenEditRecordModal(record)}
                                  sx={{ mt: 1 }}
                                >
                                  Edit Record
                                </Button>
                              )}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}
                >
                  <Payment sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
                  <Typography color="text.secondary">
                    No payment records yet
                  </Typography>
                </Paper>
              )}

              {/* Payment Terms */}
              {selectedPI.payment_terms && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment Terms
                  </Typography>
                  <Typography variant="body2">{selectedPI.payment_terms}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewModal(false)}>Close</Button>
          {selectedPI &&
            getPaymentPercentage(selectedPI) < 100 &&
            selectedPI.status !== "REJECTED" && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Payment />}
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenPaymentModal(selectedPI);
                }}
              >
                Record Payment
              </Button>
            )}
        </DialogActions>
      </Dialog>

      {/* Payment Proof Upload Modal */}
      <Dialog
        open={showPaymentModal}
        onClose={handleClosePaymentModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Payment color="success" />
              <Typography variant="h6">Record Payment</Typography>
            </Stack>
            <IconButton onClick={handleClosePaymentModal} size="small">
              <Close />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            An email notification will be sent to admin for verification
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPI && (
            <Box>
              {/* PI Summary */}
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "primary.lighter",
                  border: "1px solid",
                  borderColor: "primary.light",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Proforma Invoice
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedPI.proforma_number}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      Balance Due
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      ${formatCurrency(
                        (selectedPI.total_amount || 0) - (selectedPI.payment_received || 0)
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Alert severity="info" sx={{ mb: 3 }}>
                Upload proof of payment (bank transfer screenshot, receipt, etc.) along with transaction details. Admin will verify and update your payment status.
              </Alert>

              {/* Payment Form */}
              <Stack spacing={3}>
                <TextField
                  label="Payment Amount (USD)"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  fullWidth
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    },
                    htmlInput: { min: 0, step: "0.01" },
                  }}
                />

                <TextField
                  label="Transaction Reference / ID"
                  value={paymentForm.transactionId}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))
                  }
                  fullWidth
                  required
                  placeholder="e.g., WIRE-20260212-001, TXN123456789"
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Payment Date"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                    fullWidth
                    required
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentForm.paymentMethod}
                      label="Payment Method"
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                      }
                    >
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                      <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                      <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CHECK">Check</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <TextField
                  label="Notes (Optional)"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Any additional information about the payment..."
                />

                {/* File Upload */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                    Payment Proof *
                  </Typography>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    id="payment-proof-upload"
                  />

                  {!paymentForm.proofFile ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        bgcolor: "grey.50",
                        border: "2px dashed",
                        borderColor: "grey.300",
                        "&:hover": {
                          bgcolor: "grey.100",
                          borderColor: "primary.main",
                        },
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Click to upload payment proof
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Screenshot, Receipt - JPG, PNG, PDF - Max 5MB)
                      </Typography>
                    </Paper>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, bgcolor: "success.lighter", borderColor: "success.light" }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {paymentForm.proofFile.type.startsWith("image/") ? (
                            <Box
                              component="img"
                              src={paymentForm.proofPreview}
                              alt="Payment proof preview"
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "error.light",
                                borderRadius: 1,
                              }}
                            >
                              <PictureAsPdf sx={{ color: "white", fontSize: 32 }} />
                            </Box>
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {paymentForm.proofFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(paymentForm.proofFile.size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        </Stack>
                        <Tooltip title="Remove file">
                          <IconButton
                            color="error"
                            onClick={handleRemoveFile}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  )}
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePaymentModal} color="inherit" disabled={submittingPayment}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={submittingPayment ? <CircularProgress size={16} color="inherit" /> : <Send />}
            onClick={handleSubmitPayment}
            disabled={
              submittingPayment ||
              !paymentForm.amount ||
              !paymentForm.transactionId ||
              !paymentForm.proofFile
            }
          >
            {submittingPayment ? "Submitting..." : "Record & Email"}
          </Button>
        </DialogActions>
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
            <Typography variant="h6">Proforma Invoice Preview</Typography>
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
            <PerformaInvoicePrintPreview
              ref={printRef}
              performaInvoice={selectedPI}
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrintPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Payment Record Modal */}
      <Dialog
        open={showEditRecordModal}
        onClose={handleCloseEditRecordModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <EditIcon color="primary" />
              <Typography variant="h6">Edit Payment Record</Typography>
            </Stack>
            <IconButton onClick={handleCloseEditRecordModal} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPaymentRecord && (
            <Box>
              {/* Record Status */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "warning.lighter",
                  borderColor: "warning.light",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Payment Record Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You can edit this record until admin verifies it
                    </Typography>
                  </Box>
                  <Chip
                    icon={<HourglassEmpty sx={{ fontSize: 14 }} />}
                    label="PENDING"
                    size="small"
                    color="warning"
                  />
                </Stack>
              </Paper>

              {/* Edit Form */}
              <Stack spacing={3}>
                <TextField
                  label="Payment Amount (USD)"
                  type="number"
                  value={editRecordForm.amount}
                  onChange={(e) =>
                    setEditRecordForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  fullWidth
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    },
                    htmlInput: { min: 0, step: "0.01" },
                  }}
                />

                <TextField
                  label="Transaction Reference / ID"
                  value={editRecordForm.transactionId}
                  onChange={(e) =>
                    setEditRecordForm((prev) => ({ ...prev, transactionId: e.target.value }))
                  }
                  fullWidth
                  required
                  placeholder="e.g., WIRE-20260212-001, TXN123456789"
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Payment Date"
                    type="date"
                    value={editRecordForm.paymentDate}
                    onChange={(e) =>
                      setEditRecordForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                    fullWidth
                    required
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={editRecordForm.paymentMethod}
                      label="Payment Method"
                      onChange={(e) =>
                        setEditRecordForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                      }
                    >
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                      <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                      <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CHECK">Check</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <TextField
                  label="Notes (Optional)"
                  value={editRecordForm.notes}
                  onChange={(e) =>
                    setEditRecordForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Any additional information about the payment..."
                />

                {/* Current Proof (if exists) */}
                {selectedPaymentRecord.proof_file_url && !editRecordForm.proofFile && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Proof
                    </Typography>
                    <Box sx={{ textAlign: "center" }}>
                      <Box
                        component="img"
                        src={selectedPaymentRecord.proof_file_url}
                        alt="Current Proof"
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 150,
                          objectFit: "contain",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        Upload a new file below to replace this proof
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* New Proof Upload */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {selectedPaymentRecord.proof_file_url ? "Replace Proof (Optional)" : "Upload Proof"}
                  </Typography>
                  <input
                    type="file"
                    ref={editRecordFileInputRef}
                    onChange={handleEditRecordFileSelect}
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                  />

                  {!editRecordForm.proofFile ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        bgcolor: "grey.50",
                        border: "2px dashed",
                        borderColor: "grey.300",
                        "&:hover": {
                          bgcolor: "grey.100",
                          borderColor: "primary.main",
                        },
                      }}
                      onClick={() => editRecordFileInputRef.current?.click()}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Click to select new payment proof
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Screenshot, Receipt - JPG, PNG, PDF - Max 5MB)
                      </Typography>
                    </Paper>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, bgcolor: "success.lighter", borderColor: "success.light" }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {editRecordForm.proofFile.type.startsWith("image/") ? (
                            <Box
                              component="img"
                              src={editRecordForm.proofPreview}
                              alt="New proof preview"
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "error.light",
                                borderRadius: 1,
                              }}
                            >
                              <PictureAsPdf sx={{ color: "white", fontSize: 32 }} />
                            </Box>
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {editRecordForm.proofFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(editRecordForm.proofFile.size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        </Stack>
                        <Tooltip title="Remove file">
                          <IconButton
                            color="error"
                            onClick={() => {
                              if (editRecordForm.proofPreview) URL.revokeObjectURL(editRecordForm.proofPreview);
                              setEditRecordForm((prev) => ({ ...prev, proofFile: null, proofPreview: null }));
                            }}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  )}
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditRecordModal} color="inherit" disabled={updatingRecord}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={updatingRecord ? <CircularProgress size={16} color="inherit" /> : <Send />}
            onClick={handleSubmitEditRecord}
            disabled={
              updatingRecord ||
              !editRecordForm.amount ||
              !editRecordForm.transactionId
            }
          >
            {updatingRecord ? "Updating..." : "Update Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProformaInvoices;
