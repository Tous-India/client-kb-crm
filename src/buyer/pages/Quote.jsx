import { useState, useEffect, useRef, useCallback } from "react";
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
  Divider,
  Stack,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Description,
  CheckCircle,
  Cancel,
  Warning,
  Visibility,
  Print,
  Email,
  ThumbUp,
  ThumbDown,
  Schedule,
  Lock,
  Search,
  AccessTime,
  Receipt,
  AttachMoney,
  LocalShipping,
  History,
  NewReleases,
  Refresh,
  LocationOn,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import QuotationPrintPreview from "../../admin/components/QuotationPrintPreview";
import SendInquiryModal from "../components/SendInquiryModal";
import { quotationsService } from "../../services";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import { ENDPOINTS } from "../../services/api/endpoints";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`buyer-quote-tabpanel-${index}`}
      aria-labelledby={`buyer-quote-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Quote() {
  const { usdToInr } = useCurrency();
  const { user, refreshUser } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryQuote, setInquiryQuote] = useState(null);
  const printRef = useRef(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [receivedPage, setReceivedPage] = useState(0);
  const [receivedRowsPerPage, setReceivedRowsPerPage] = useState(10);
  const [acceptedPage, setAcceptedPage] = useState(0);
  const [acceptedRowsPerPage, setAcceptedRowsPerPage] = useState(10);
  const [rejectedPage, setRejectedPage] = useState(0);
  const [rejectedRowsPerPage, setRejectedRowsPerPage] = useState(10);
  const [expiredPage, setExpiredPage] = useState(0);
  const [expiredRowsPerPage, setExpiredRowsPerPage] = useState(10);

  // Fetch quotations from API
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await quotationsService.getMyQuotations();
      if (result.success) {
        setQuotations(result.data || []);
      } else {
        setError(result.error || "Failed to fetch quotations");
        toast.error(result.error || "Failed to fetch quotations");
      }
    } catch (err) {
      console.error("[Quote] Error fetching quotations:", err);
      setError(err.message || "Failed to fetch quotations");
      toast.error(err.message || "Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Get quote status
  const getQuoteStatus = (quote) => {
    const now = new Date();
    const expiryDate = quote.expiry_date ? new Date(quote.expiry_date) : null;

    if (quote.status === "ACCEPTED") return "ACCEPTED";
    if (quote.status === "REJECTED") return "REJECTED";
    if (quote.status === "CONVERTED") return "CONVERTED";
    if (expiryDate && expiryDate < now && quote.status !== "ACCEPTED" && quote.status !== "REJECTED") return "EXPIRED";
    if (quote.status === "SENT") return "PENDING"; // SENT status from API means pending buyer response
    return quote.status || "PENDING";
  };

  // Filter quotations for each tab
  // Received: PENDING (not yet responded, not expired)
  const receivedQuotations = quotations.filter((q) => {
    const status = getQuoteStatus(q);
    return status === "PENDING";
  });

  // Accepted: Buyer accepted (includes converted)
  const acceptedQuotations = quotations.filter((q) => q.status === "ACCEPTED");

  // Rejected: Buyer rejected
  const rejectedQuotations = quotations.filter((q) => q.status === "REJECTED");

  // Expired: Quotations that expired without response
  const expiredQuotations = quotations.filter((q) => {
    const status = getQuoteStatus(q);
    return status === "EXPIRED";
  });

  // Search filter
  const filterBySearch = (quotes) => {
    if (!searchTerm) return quotes;
    const term = searchTerm.toLowerCase();
    return quotes.filter(
      (q) =>
        q.quote_number?.toLowerCase().includes(term) ||
        q.buyer_name?.toLowerCase().includes(term) ||
        q.items?.some((item) => item.product_name?.toLowerCase().includes(term))
    );
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // View quote details
  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  // Preview/Print quote
  const handlePreviewQuote = (quote) => {
    setSelectedQuote(quote);
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
            <title>Quotation - ${selectedQuote?.quote_number}</title>
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

  // Email quote - Opens inquiry modal to send via CRM
  const handleEmailQuote = (quote) => {
    setInquiryQuote(quote);
    setShowInquiryModal(true);
  };

  // Accept quotation
  const handleAcceptQuote = (quote) => {
    setSelectedQuote(quote);
    // Pre-fill shipping address from user profile
    const userAddress = user?.address || {};
    setShippingAddress({
      street: userAddress.street || "",
      city: userAddress.city || "",
      state: userAddress.state || "",
      zip: userAddress.zip || "",
      country: userAddress.country || "",
    });
    setShowAcceptModal(true);
  };

  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    // Validate shipping address - at least street and city required
    if (!shippingAddress.street || !shippingAddress.city) {
      toast.error("Please provide at least street address and city");
      return;
    }

    setActionLoading(true);
    try {
      // Step 1: Update user profile with address (single source of truth)
      await apiClient.put(ENDPOINTS.USERS.UPDATE_PROFILE, {
        address: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
        },
      });
      // Refresh user data in context
      await refreshUser();

      // Step 2: Accept quotation (backend will use address from user profile)
      const result = await quotationsService.accept(selectedQuote._id, {});

      if (result.success) {
        // Update local state
        setQuotations(
          quotations.map((q) =>
            q._id === selectedQuote._id
              ? {
                  ...q,
                  status: "ACCEPTED",
                  accepted_at: new Date().toISOString(),
                }
              : q
          )
        );

        setShowAcceptModal(false);
        setSelectedQuote(null);
        setShippingAddress({ street: "", city: "", state: "", zip: "", country: "" });
        toast.success(
          `Quotation ${selectedQuote.quote_number} accepted! The seller has been notified.`
        );
      } else {
        toast.error(result.error || "Failed to accept quotation");
      }
    } catch (err) {
      console.error("[Quote] Error accepting quotation:", err);
      toast.error(err.message || "Failed to accept quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject quotation
  const handleRejectQuote = (quote) => {
    setSelectedQuote(quote);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmRejectQuote = async () => {
    if (!selectedQuote) return;

    setActionLoading(true);
    try {
      const result = await quotationsService.reject(selectedQuote._id, rejectReason || "No reason provided");
      if (result.success) {
        // Update local state
        setQuotations(
          quotations.map((q) =>
            q._id === selectedQuote._id
              ? {
                  ...q,
                  status: "REJECTED",
                  rejected_at: new Date().toISOString(),
                  rejection_reason: rejectReason || "No reason provided",
                }
              : q
          )
        );
        setShowRejectModal(false);
        setSelectedQuote(null);
        setRejectReason("");
        toast.success(
          `Quotation ${selectedQuote.quote_number} rejected. The seller has been notified.`
        );
      } else {
        toast.error(result.error || "Failed to reject quotation");
      }
    } catch (err) {
      console.error("[Quote] Error rejecting quotation:", err);
      toast.error(err.message || "Failed to reject quotation");
    } finally {
      setActionLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Render quotation row
  const renderQuotationRow = (quote, tabType) => {
    const status = getQuoteStatus(quote);
    const daysUntilExpiry = getDaysUntilExpiry(quote.expiry_date);
    const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry <= 0;

    return (
      <TableRow
        key={quote._id || quote.quote_id}
        hover
        sx={{
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.02)",
          },
        }}
      >
        {/* Quote Number & Date */}
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              {quote.quote_number}
            </Typography>
            {(quote.revision_number || 1) > 1 && (
              <Tooltip title={`This is revision ${quote.revision_number} - Seller updated the quotation`}>
                <Chip
                  icon={<NewReleases sx={{ fontSize: "12px !important" }} />}
                  label={`Rev ${quote.revision_number}`}
                  size="small"
                  color="info"
                  sx={{ fontSize: "9px", height: "18px" }}
                />
              </Tooltip>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {formatDate(quote.quote_date)}
          </Typography>
          {quote.last_sent_date && (
            <Typography variant="caption" display="block" color="primary.main" sx={{ fontSize: "10px" }}>
              Updated: {formatDate(quote.last_sent_date)}
            </Typography>
          )}
        </TableCell>

        {/* Status / Validity Column */}
        <TableCell>
          {tabType === "received" && (
            <Box>
              <Typography
                variant="body2"
                fontWeight="medium"
                color={
                  isExpired
                    ? "error.main"
                    : isExpiringSoon
                    ? "warning.main"
                    : "text.primary"
                }
              >
                {formatDate(quote.expiry_date)}
              </Typography>
              {!isExpired && (
                <Chip
                  icon={<AccessTime sx={{ fontSize: "14px !important" }} />}
                  label={`${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} left`}
                  size="small"
                  color={isExpiringSoon ? "warning" : "default"}
                  variant="outlined"
                  sx={{ fontSize: "11px", height: "22px", mt: 0.5 }}
                />
              )}
              {isExpired && (
                <Chip
                  icon={<Warning sx={{ fontSize: "14px !important" }} />}
                  label="Expired"
                  size="small"
                  color="error"
                  sx={{ fontSize: "11px", height: "22px", mt: 0.5 }}
                />
              )}
            </Box>
          )}
          {tabType === "accepted" && (
            <Box>
              <Chip
                icon={<CheckCircle sx={{ fontSize: "14px !important" }} />}
                label="Accepted"
                size="small"
                color="success"
                sx={{ fontSize: "11px", height: "22px" }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatDate(quote.accepted_at || quote.accepted_date)}
              </Typography>
              {quote.converted_to_pi && (
                <Chip
                  icon={<Receipt sx={{ fontSize: "14px !important" }} />}
                  label={`PI: ${quote.pi_number}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: "10px", height: "20px", mt: 0.5 }}
                />
              )}
            </Box>
          )}
          {tabType === "rejected" && (
            <Box>
              <Chip
                icon={<Cancel sx={{ fontSize: "14px !important" }} />}
                label={quote.admin_rejected ? "Seller Rejected" : "Rejected"}
                size="small"
                color="error"
                sx={{ fontSize: "11px", height: "22px" }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatDate(quote.rejected_at || quote.rejected_date)}
              </Typography>
              {quote.admin_rejected && (
                <Typography variant="caption" display="block" color="warning.main" sx={{ fontSize: "10px" }}>
                  (By Seller)
                </Typography>
              )}
            </Box>
          )}
          {tabType === "expired" && (
            <Box>
              <Chip
                icon={<Warning sx={{ fontSize: "14px !important" }} />}
                label="Expired"
                size="small"
                color="warning"
                sx={{ fontSize: "11px", height: "22px" }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatDate(quote.expiry_date)}
              </Typography>
            </Box>
          )}
        </TableCell>

        {/* Items */}
        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            {quote.items?.length || 0} item{(quote.items?.length || 0) !== 1 ? "s" : ""}
          </Typography>
          <Typography
            variant="caption"
            color="primary.main"
            sx={{
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": { color: "primary.dark" }
            }}
            onClick={() => handleViewDetails(quote)}
          >
            View details
          </Typography>
        </TableCell>

        {/* Amount */}
        <TableCell align="right">
          <Typography
            variant="body2"
            fontWeight="bold"
            color="success.main"
            sx={{ fontSize: "14px" }}
          >
            ${quote.total_amount?.toFixed(2) || "0.00"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "11px" }}
          >
            ₹{((quote.total_amount || 0) * (quote.exchange_rate || usdToInr)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell align="center">
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="View Document">
              <IconButton
                color="info"
                onClick={() => handlePreviewQuote(quote)}
                size="small"
                sx={{
                  bgcolor: "info.lighter",
                  "&:hover": { bgcolor: "info.light" }
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print / PDF">
              <IconButton
                color="secondary"
                onClick={() => handlePreviewQuote(quote)}
                size="small"
                sx={{
                  bgcolor: "secondary.lighter",
                  "&:hover": { bgcolor: "secondary.light" }
                }}
              >
                <Print fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Email Inquiry">
              <IconButton
                color="primary"
                onClick={() => handleEmailQuote(quote)}
                size="small"
                sx={{
                  bgcolor: "primary.lighter",
                  "&:hover": { bgcolor: "primary.light" }
                }}
              >
                <Email fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Accept/Reject buttons for received tab */}
          {tabType === "received" && !isExpired && (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              sx={{ mt: 1.5 }}
            >
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ThumbUp fontSize="small" />}
                onClick={() => handleAcceptQuote(quote)}
                sx={{
                  fontSize: "11px",
                  px: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                  boxShadow: 1,
                }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<ThumbDown fontSize="small" />}
                onClick={() => handleRejectQuote(quote)}
                sx={{
                  fontSize: "11px",
                  px: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                Reject
              </Button>
            </Stack>
          )}

          {/* Show rejection reason for rejected quotes */}
          {tabType === "rejected" && quote.rejection_reason && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 1,
                fontStyle: "italic",
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={quote.rejection_reason}
            >
              "{quote.rejection_reason}"
            </Typography>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Paginated data with search
  const paginatedReceivedQuotations = filterBySearch(receivedQuotations).slice(
    receivedPage * receivedRowsPerPage,
    receivedPage * receivedRowsPerPage + receivedRowsPerPage
  );
  const paginatedAcceptedQuotations = filterBySearch(acceptedQuotations).slice(
    acceptedPage * acceptedRowsPerPage,
    acceptedPage * acceptedRowsPerPage + acceptedRowsPerPage
  );
  const paginatedRejectedQuotations = filterBySearch(rejectedQuotations).slice(
    rejectedPage * rejectedRowsPerPage,
    rejectedPage * rejectedRowsPerPage + rejectedRowsPerPage
  );
  const paginatedExpiredQuotations = filterBySearch(expiredQuotations).slice(
    expiredPage * expiredRowsPerPage,
    expiredPage * expiredRowsPerPage + expiredRowsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto mt-0 mb-8 px-4">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b0c1a] mb-1">My Quotations</h1>
            <p className="text-gray-600 text-sm">
              Review, accept or reject quotations from KB Enterprises
            </p>
          </div>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={fetchQuotations}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && quotations.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by quote number, product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            bgcolor: "grey.50",
            "& .MuiTab-root": {
              fontWeight: "bold",
              fontSize: "13px",
              py: 1.5,
            },
            "& .Mui-selected": {
              bgcolor: "white",
            },
          }}
        >
          <Tab
            icon={<Schedule />}
            iconPosition="start"
            label={`Pending (${receivedQuotations.length})`}
            sx={{ color: activeTab === 0 ? "primary.main" : "inherit" }}
          />
          <Tab
            icon={<CheckCircle />}
            iconPosition="start"
            label={`Accepted (${acceptedQuotations.length})`}
            sx={{ color: activeTab === 1 ? "success.main" : "inherit" }}
          />
          <Tab
            icon={<Cancel />}
            iconPosition="start"
            label={`Rejected (${rejectedQuotations.length})`}
            sx={{ color: activeTab === 2 ? "error.main" : "inherit" }}
          />
          <Tab
            icon={<Warning />}
            iconPosition="start"
            label={`Expired (${expiredQuotations.length})`}
            sx={{ color: activeTab === 3 ? "warning.main" : "inherit" }}
          />
        </Tabs>
      </Paper>

      {/* Pending Tab */}
      <TabPanel value={activeTab} index={0}>
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<Schedule />}
        >
          <strong>Pending Quotations:</strong> Review and respond to these quotations.
          Accept to proceed with your order or Reject if not interested.
        </Alert>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Quote #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Valid Until</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReceivedQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Schedule sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No pending quotations to review
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReceivedQuotations.map((quote) =>
                  renderQuotationRow(quote, "received")
                )
              )}
            </TableBody>
          </Table>
          {filterBySearch(receivedQuotations).length > 0 && (
            <TablePagination
              component="div"
              count={filterBySearch(receivedQuotations).length}
              page={receivedPage}
              onPageChange={(e, newPage) => setReceivedPage(newPage)}
              rowsPerPage={receivedRowsPerPage}
              onRowsPerPageChange={(e) => {
                setReceivedRowsPerPage(parseInt(e.target.value, 10));
                setReceivedPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </TableContainer>
      </TabPanel>

      {/* Accepted Tab */}
      <TabPanel value={activeTab} index={1}>
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<CheckCircle />}
        >
          <strong>Accepted Quotations:</strong> These quotations have been accepted.
          The seller will process your Proforma Invoice.
        </Alert>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Quote #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAcceptedQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <CheckCircle sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No accepted quotations yet
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAcceptedQuotations.map((quote) =>
                  renderQuotationRow(quote, "accepted")
                )
              )}
            </TableBody>
          </Table>
          {filterBySearch(acceptedQuotations).length > 0 && (
            <TablePagination
              component="div"
              count={filterBySearch(acceptedQuotations).length}
              page={acceptedPage}
              onPageChange={(e, newPage) => setAcceptedPage(newPage)}
              rowsPerPage={acceptedRowsPerPage}
              onRowsPerPageChange={(e) => {
                setAcceptedRowsPerPage(parseInt(e.target.value, 10));
                setAcceptedPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </TableContainer>
      </TabPanel>

      {/* Rejected Tab */}
      <TabPanel value={activeTab} index={2}>
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<Cancel />}
        >
          <strong>Rejected Quotations:</strong> These quotations were rejected.
          Contact the seller if you wish to request a revised quote.
        </Alert>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Quote #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRejectedQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Cancel sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No rejected quotations
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRejectedQuotations.map((quote) =>
                  renderQuotationRow(quote, "rejected")
                )
              )}
            </TableBody>
          </Table>
          {filterBySearch(rejectedQuotations).length > 0 && (
            <TablePagination
              component="div"
              count={filterBySearch(rejectedQuotations).length}
              page={rejectedPage}
              onPageChange={(e, newPage) => setRejectedPage(newPage)}
              rowsPerPage={rejectedRowsPerPage}
              onRowsPerPageChange={(e) => {
                setRejectedRowsPerPage(parseInt(e.target.value, 10));
                setRejectedPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </TableContainer>
      </TabPanel>

      {/* Expired Tab */}
      <TabPanel value={activeTab} index={3}>
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<Warning />}
        >
          <strong>Expired Quotations:</strong> These quotations have expired without a response.
          Contact the seller to request a renewed quotation.
        </Alert>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Quote #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedExpiredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Warning sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        No expired quotations
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpiredQuotations.map((quote) =>
                  renderQuotationRow(quote, "expired")
                )
              )}
            </TableBody>
          </Table>
          {filterBySearch(expiredQuotations).length > 0 && (
            <TablePagination
              component="div"
              count={filterBySearch(expiredQuotations).length}
              page={expiredPage}
              onPageChange={(e, newPage) => setExpiredPage(newPage)}
              rowsPerPage={expiredRowsPerPage}
              onRowsPerPageChange={(e) => {
                setExpiredRowsPerPage(parseInt(e.target.value, 10));
                setExpiredPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </TableContainer>
      </TabPanel>

      {/* View Details Dialog */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Description color="primary" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Quotation Details - {selectedQuote?.quote_number}
                </Typography>
                {(selectedQuote?.revision_number || 1) > 1 && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <NewReleases color="info" sx={{ fontSize: 14 }} />
                    <Typography variant="caption" color="info.main">
                      This is revision {selectedQuote?.revision_number} - Updated by seller
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
            {(selectedQuote?.revision_number || 1) > 1 && (
              <Chip
                label={`Revision ${selectedQuote?.revision_number}`}
                color="info"
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedQuote && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    Quote Date
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatDate(selectedQuote.quote_date)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getQuoteStatus(selectedQuote)}
                      color={
                        getQuoteStatus(selectedQuote) === "ACCEPTED"
                          ? "success"
                          : getQuoteStatus(selectedQuote) === "REJECTED"
                          ? "error"
                          : getQuoteStatus(selectedQuote) === "EXPIRED"
                          ? "warning"
                          : "primary"
                      }
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    Valid Until
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatDate(selectedQuote.expiry_date)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">
                    Exchange Rate
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    1 USD = ₹{selectedQuote.exchange_rate || usdToInr}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Items ({selectedQuote.items?.length || 0})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuote.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.product_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.part_number}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ${item.unit_price?.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "medium" }}>
                          ${item.total_price?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
                {/* Terms & Conditions on Left */}
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Terms & Conditions
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                    {selectedQuote.terms_and_conditions || (
                      <>
                        • Prices are valid for 30 days from quote date<br />
                        • Payment terms: As per agreement<br />
                        • Delivery: Subject to stock availability<br />
                        • All prices are in USD<br />
                        • Taxes extra as applicable
                      </>
                    )}
                  </Typography>
                </Box>

                {/* Grand Total on Right */}
                <Box
                  sx={{
                    minWidth: 200,
                    p: 2,
                    bgcolor: "success.lighter",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "success.light",
                    textAlign: "right"
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Grand Total
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    ${selectedQuote.total_amount?.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₹{((selectedQuote.total_amount || 0) * (selectedQuote.exchange_rate || usdToInr)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button onClick={() => setShowViewModal(false)} variant="outlined">
            Close
          </Button>
          {selectedQuote && getQuoteStatus(selectedQuote) === "PENDING" && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ThumbUp />}
                onClick={() => {
                  setShowViewModal(false);
                  handleAcceptQuote(selectedQuote);
                }}
              >
                Accept Quote
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ThumbDown />}
                onClick={() => {
                  setShowViewModal(false);
                  handleRejectQuote(selectedQuote);
                }}
              >
                Reject Quote
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Accept Confirmation Dialog */}
      <Dialog
        open={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "success.lighter", borderBottom: "1px solid", borderColor: "success.light" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircle color="success" />
            <Typography variant="h6" fontWeight="bold" color="success.main">
              Accept Quotation?
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
            By accepting this quotation, you agree to the terms and pricing.
            The seller will be notified and will proceed with creating your
            Proforma Invoice.
          </Alert>
          {selectedQuote && (
            <Box>
              {/* Quotation Header */}
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider"
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {selectedQuote.quote_number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valid until: {formatDate(selectedQuote.expiry_date)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<AttachMoney fontSize="small" />}
                    label={`1 USD = ₹${(selectedQuote.exchange_rate || usdToInr).toFixed(2)}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </Paper>

              {/* Items Table */}
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Products ({selectedQuote.items?.length || 0} items)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.100" }}>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Unit Price (USD)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Unit Price (INR)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>Total (USD)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuote.items?.map((item, index) => {
                      const exchangeRate = selectedQuote.exchange_rate || usdToInr;
                      return (
                        <TableRow key={index} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.product_name}
                            </Typography>
                            {item.part_number && (
                              <Typography variant="caption" color="text.secondary">
                                {item.part_number}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.quantity}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            ${(item.unit_price || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{((item.unit_price || 0) * exchangeRate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${(item.total_price || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pricing Summary */}
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "success.lighter",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "success.light"
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Exchange Rate:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      1 USD = ₹{(selectedQuote.exchange_rate || usdToInr).toFixed(2)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight={600}>
                      Grand Total:
                    </Typography>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        ${(selectedQuote.total_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ≈ ₹{((selectedQuote.total_amount || 0) * (selectedQuote.exchange_rate || usdToInr)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              {/* Shipping Address Form */}
              <Paper
                sx={{
                  p: 2,
                  mt: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: shippingAddress.street && shippingAddress.city ? "success.light" : "primary.light",
                  bgcolor: shippingAddress.street && shippingAddress.city ? "success.lighter" : "primary.lighter"
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <LocalShipping color={shippingAddress.street && shippingAddress.city ? "success" : "primary"} />
                  <Typography variant="subtitle1" fontWeight="bold" color={shippingAddress.street && shippingAddress.city ? "success.main" : "primary.main"}>
                    Shipping Address
                  </Typography>
                  {shippingAddress.street && shippingAddress.city ? (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                      label="From Profile"
                      size="small"
                      color="success"
                      sx={{ fontSize: '11px', height: '22px' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      (Required)
                    </Typography>
                  )}
                </Stack>
                {shippingAddress.street && shippingAddress.city && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 1, py: 0.5 }}>
                    Address synced from your profile. You can edit if needed.
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Street Address *"
                      placeholder="Enter your street address"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="City *"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="State / Province"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="ZIP / Postal Code"
                      placeholder="ZIP Code"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Country"
                      placeholder="Country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      sx={{ bgcolor: "white", borderRadius: 1 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button onClick={() => setShowAcceptModal(false)} variant="outlined" disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmAcceptQuote}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ThumbUp />}
            sx={{ px: 3 }}
            disabled={actionLoading}
          >
            {actionLoading ? "Processing..." : "Confirm Accept"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "error.lighter", borderBottom: "1px solid", borderColor: "error.light" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Cancel color="error" />
            <Typography variant="h6" fontWeight="bold" color="error.main">
              Reject Quotation?
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 1 }}>
            Please provide a reason for rejection. This helps the seller improve
            their offerings and may lead to a revised quotation.
          </Alert>
          {selectedQuote && (
            <Paper
              sx={{
                p: 2,
                bgcolor: "grey.50",
                borderRadius: 2,
                mb: 3,
                border: "1px solid",
                borderColor: "divider"
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedQuote.quote_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedQuote.items?.length} item{selectedQuote.items?.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  ${selectedQuote.total_amount?.toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            placeholder="e.g., Price too high, Found alternative supplier, Budget constraints, Need different specifications..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button onClick={() => setShowRejectModal(false)} variant="outlined" disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmRejectQuote}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ThumbDown />}
            sx={{ px: 3 }}
            disabled={actionLoading}
          >
            {actionLoading ? "Processing..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "grey.100", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Description color="warning" />
              <Typography variant="h6" fontWeight="bold">
                Quotation Preview - {selectedQuote?.quote_number}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrintAction}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Print / Save PDF
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 2,
            bgcolor: "#e8e8e8",
            display: "flex",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          {selectedQuote && (
            <QuotationPrintPreview
              ref={printRef}
              quotation={selectedQuote}
              globalRate={selectedQuote.exchange_rate || usdToInr}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button onClick={() => setShowPrintPreview(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Inquiry Modal - Sends email via CRM */}
      <SendInquiryModal
        open={showInquiryModal}
        onClose={() => {
          setShowInquiryModal(false);
          setInquiryQuote(null);
        }}
        quotation={inquiryQuote}
        onSuccess={() => {
          setShowInquiryModal(false);
          setInquiryQuote(null);
        }}
      />
    </div>
  );
}

export default Quote;
