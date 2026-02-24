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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
  TablePagination,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from "@mui/material";
import {
  Description,
  CheckCircle,
  Cancel,
  Visibility,
  Print,
  Search,
  Refresh,
  Send,
  HourglassEmpty,
  SwapHoriz,
  Email,
  Person,
  Add,
  ArrowBack,
  ArrowForward,
  Receipt,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import QuotationPrintPreview from "../components/QuotationPrintPreview";
import SendEmailModal from "../components/SendEmailModal";
import { quotationsService, ordersService, productsService, proformaInvoicesService } from "../../services";
import { useCurrency } from "../../context/CurrencyContext";
import apiClient from "../../services/api/client";
import ENDPOINTS from "../../services/api/endpoints";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quotations-tabpanel-${index}`}
      aria-labelledby={`quotations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function Quotations() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usdToInr } = useCurrency();
  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPIModal, setShowPIModal] = useState(false);
  const [piQuote, setPiQuote] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailQuote, setEmailQuote] = useState(null);
  const [buyerCurrentEmail, setBuyerCurrentEmail] = useState(null);
  const printRef = useRef(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [piLoading, setPiLoading] = useState(false);

  // PI Form state
  const [piForm, setPiForm] = useState({
    piNumber: "",
    piDate: new Date().toISOString().split("T")[0],
    exchangeRate: 83.5,
    validityDays: 30,
    paymentTerms: "100% Advance",
    deliveryTerms: "Ex-Works",
    items: [],
    logisticCharges: 0,
    customDuty: 0,
    bankCharges: 0,
    otherCharges: 0,
    notes: "",
  });

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Create quotation state
  const [orderToConvert, setOrderToConvert] = useState(null);
  const [createStep, setCreateStep] = useState(0);
  const [quoteForm, setQuoteForm] = useState({
    expiryDays: 20,
    exchangeRate: 83.5,
    priceAdjustments: [],
    quantities: [],
    logisticCharges: 0,
    customDuty: 0,
    debetNote: 0,
    bankCharges: 0,
    adminNotes: "",
  });

  // Pagination states for each tab
  const [sentPage, setSentPage] = useState(0);
  const [sentRowsPerPage, setSentRowsPerPage] = useState(10);
  const [acceptedPage, setAcceptedPage] = useState(0);
  const [acceptedRowsPerPage, setAcceptedRowsPerPage] = useState(10);
  const [rejectedPage, setRejectedPage] = useState(0);
  const [rejectedRowsPerPage, setRejectedRowsPerPage] = useState(10);
  const [expiredPage, setExpiredPage] = useState(0);
  const [expiredRowsPerPage, setExpiredRowsPerPage] = useState(10);
  const [convertedPage, setConvertedPage] = useState(0);
  const [convertedRowsPerPage, setConvertedRowsPerPage] = useState(10);

  // Check if we came from PurchaseOrders with an order to convert
  useEffect(() => {
    if (location.state?.orderToConvert) {
      const order = location.state.orderToConvert;
      setOrderToConvert(order);
      initializeQuoteForm(order);
      setShowCreateModal(true);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize quote form from order
  const initializeQuoteForm = async (order) => {
    const currentRate = usdToInr || 83.5;

    // Fetch product prices from database
    let productPrices = {};
    const productIds = order.items?.map((item) => item.product_id).filter(Boolean) || [];

    if (productIds.length > 0) {
      try {
        const result = await productsService.getAll();
        if (result.success && result.data?.products) {
          result.data.products.forEach((product) => {
            if (product.product_id && product.your_price) {
              productPrices[product.product_id] = product.your_price;
            }
          });
        }
      } catch (error) {
        console.error("Error fetching product prices:", error);
      }
    }

    setQuoteForm({
      expiryDays: 20,
      exchangeRate: currentRate,
      priceAdjustments: (order.items || []).map((item) => {
        const unitPrice =
          productPrices[item.product_id] ||
          item.requested_unit_price ||
          item.unit_price ||
          0;
        return {
          product_id: item.product_id,
          original_price_usd: unitPrice,
          adjusted_price_usd: unitPrice,
          adjusted_price_inr: unitPrice * currentRate,
          adjustment_percentage: 0,
        };
      }),
      quantities: (order.items || []).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      logisticCharges: 0,
      customDuty: 0,
      debetNote: 0,
      bankCharges: 0,
      adminNotes: "",
    });
  };

  // Fetch quotations from API
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await quotationsService.getAll();
      if (result.success) {
        setQuotations(result.data || []);
      } else {
        setError(result.error || "Failed to fetch quotations");
        toast.error(result.error || "Failed to fetch quotations");
      }
    } catch (err) {
      console.error("[Quotations] Error fetching:", err);
      setError(err.message || "Failed to fetch quotations");
      toast.error(err.message || "Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Price adjustment handlers
  const handlePriceAdjustmentUSD = (productId, newPrice) => {
    const priceUSD = parseFloat(newPrice) || 0;
    setQuoteForm((prev) => ({
      ...prev,
      priceAdjustments: prev.priceAdjustments.map((adj) =>
        adj.product_id === productId
          ? {
              ...adj,
              adjusted_price_usd: priceUSD,
              adjusted_price_inr: priceUSD * prev.exchangeRate,
              adjustment_percentage: adj.original_price_usd
                ? (((priceUSD - adj.original_price_usd) / adj.original_price_usd) * 100).toFixed(2)
                : 0,
            }
          : adj
      ),
    }));
  };

  const handlePriceAdjustmentINR = (productId, newPrice) => {
    const priceINR = parseFloat(newPrice) || 0;
    setQuoteForm((prev) => {
      const priceUSD = priceINR / prev.exchangeRate;
      return {
        ...prev,
        priceAdjustments: prev.priceAdjustments.map((adj) =>
          adj.product_id === productId
            ? {
                ...adj,
                adjusted_price_usd: priceUSD,
                adjusted_price_inr: priceINR,
                adjustment_percentage: adj.original_price_usd
                  ? (((priceUSD - adj.original_price_usd) / adj.original_price_usd) * 100).toFixed(2)
                  : 0,
              }
            : adj
        ),
      };
    });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setQuoteForm((prev) => ({
      ...prev,
      quantities: prev.quantities.map((q) =>
        q.product_id === productId ? { ...q, quantity: parseInt(newQuantity) || 1 } : q
      ),
    }));
  };

  const handleExchangeRateChange = (newRate) => {
    const rate = parseFloat(newRate) || 83.5;
    setQuoteForm((prev) => ({
      ...prev,
      exchangeRate: rate,
      priceAdjustments: prev.priceAdjustments.map((adj) => ({
        ...adj,
        adjusted_price_inr: adj.adjusted_price_usd * rate,
      })),
    }));
  };

  // Calculate totals
  const calculateQuoteTotals = () => {
    let subtotal = 0;
    quoteForm.priceAdjustments.forEach((adj) => {
      const quantity = quoteForm.quantities.find((q) => q.product_id === adj.product_id);
      subtotal += adj.adjusted_price_usd * (quantity?.quantity || 1);
    });
    const additionalCharges =
      quoteForm.logisticCharges + quoteForm.customDuty + quoteForm.debetNote + quoteForm.bankCharges;
    return { subtotal, additionalCharges, total: subtotal + additionalCharges };
  };

  // Submit quotation
  const handleSubmitQuote = async () => {
    if (!orderToConvert) return;

    setCreateLoading(true);
    const totals = calculateQuoteTotals();

    const quotationData = {
      exchange_rate: quoteForm.exchangeRate,
      expiry_days: quoteForm.expiryDays,
      items: orderToConvert.items.map((item) => {
        const adjustment = quoteForm.priceAdjustments.find((a) => a.product_id === item.product_id);
        const quantityInfo = quoteForm.quantities.find((q) => q.product_id === item.product_id);
        const unit_price = adjustment?.adjusted_price_usd || 0;
        const quantity = quantityInfo?.quantity || item.quantity;
        return {
          product_id: item.product_id,
          part_number: item.part_number,
          product_name: item.product_name,
          quantity,
          unit_price,
          total_price: unit_price * quantity,
        };
      }),
      subtotal: totals.subtotal,
      total_amount: totals.total,
      logistic_charges: quoteForm.logisticCharges,
      custom_duty: quoteForm.customDuty,
      debet_note: quoteForm.debetNote,
      bank_charges: quoteForm.bankCharges,
      admin_notes: quoteForm.adminNotes,
    };

    try {
      const result = await ordersService.convertToQuotation(orderToConvert._id, quotationData);

      if (result.success) {
        toast.success(`Quotation ${result.data.quotation?.quote_number || ""} created successfully!`);
        setShowCreateModal(false);
        setOrderToConvert(null);
        setCreateStep(0);
        fetchQuotations();
      } else {
        toast.error(result.error || "Failed to create quotation");
      }
    } catch (err) {
      console.error("[Quotations] Error creating quotation:", err);
      toast.error(err.message || "Failed to create quotation");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open PI generation modal
  const handleGeneratePI = (quote) => {
    setPiQuote(quote);
    const piNumber = `PI-${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    setPiForm({
      piNumber,
      piDate: new Date().toISOString().split("T")[0],
      exchangeRate: quote.exchange_rate || usdToInr || 83.5,
      validityDays: 30,
      paymentTerms: "100% Advance",
      deliveryTerms: "Ex-Works",
      items: (quote.items || []).map((item) => ({
        product_id: item.product_id,
        part_number: item.part_number,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price_usd: item.unit_price || 0,
        unit_price_inr: (item.unit_price || 0) * (quote.exchange_rate || usdToInr || 83.5),
      })),
      logisticCharges: quote.logistic_charges || 0,
      customDuty: quote.custom_duty || 0,
      bankCharges: quote.bank_charges || 0,
      otherCharges: 0,
      notes: "",
    });
    setShowPIModal(true);
  };

  // Handle PI item price change (USD)
  const handlePIItemPriceUSD = (index, value) => {
    const priceUSD = parseFloat(value) || 0;
    setPiForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index
          ? { ...item, unit_price_usd: priceUSD, unit_price_inr: priceUSD * prev.exchangeRate }
          : item
      ),
    }));
  };

  // Handle PI item price change (INR)
  const handlePIItemPriceINR = (index, value) => {
    const priceINR = parseFloat(value) || 0;
    setPiForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index
          ? { ...item, unit_price_inr: priceINR, unit_price_usd: priceINR / prev.exchangeRate }
          : item
      ),
    }));
  };

  // Handle PI item quantity change
  const handlePIItemQuantity = (index, value) => {
    const qty = parseInt(value) || 1;
    setPiForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, quantity: qty } : item)),
    }));
  };

  // Handle PI exchange rate change
  const handlePIExchangeRateChange = (value) => {
    const rate = parseFloat(value) || 83.5;
    setPiForm((prev) => ({
      ...prev,
      exchangeRate: rate,
      items: prev.items.map((item) => ({
        ...item,
        unit_price_inr: item.unit_price_usd * rate,
      })),
    }));
  };

  // Calculate PI totals
  const calculatePITotals = () => {
    let subtotal = 0;
    piForm.items.forEach((item) => {
      subtotal += item.unit_price_usd * item.quantity;
    });
    const additionalCharges = piForm.logisticCharges + piForm.customDuty + piForm.bankCharges + piForm.otherCharges;
    return { subtotal, additionalCharges, total: subtotal + additionalCharges };
  };

  // Submit PI
  const handleSubmitPI = async () => {
    if (!piQuote) return;

    setPiLoading(true);
    const totals = calculatePITotals();

    const piData = {
      quotation_id: piQuote._id,
      quote_number: piQuote.quote_number,
      buyer: piQuote.buyer?._id || piQuote.buyer,
      customer_name: piQuote.customer_name || piQuote.buyer_name,
      customer_email: piQuote.customer_email,
      exchange_rate: piForm.exchangeRate,
      validity_days: piForm.validityDays,
      payment_terms: piForm.paymentTerms,
      delivery_terms: piForm.deliveryTerms,
      items: piForm.items.map((item) => ({
        product_id: item.product_id,
        part_number: item.part_number,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price_usd,
        total_price: item.unit_price_usd * item.quantity,
      })),
      subtotal: totals.subtotal,
      logistic_charges: piForm.logisticCharges,
      custom_duty: piForm.customDuty,
      bank_charges: piForm.bankCharges,
      other_charges: piForm.otherCharges,
      total_amount: totals.total,
      notes: piForm.notes,
      status: "SENT",
    };

    try {
      const result = await proformaInvoicesService.create(piData);

      if (result.success) {
        const piNumber = result.data?.proforma?.proforma_number || piForm.piNumber;
        toast.success(`Proforma Invoice ${piNumber} generated successfully!`);
        setShowPIModal(false);
        setPiQuote(null);
        fetchQuotations();
      } else {
        toast.error(result.error || "Failed to generate PI");
      }
    } catch (err) {
      console.error("[Quotations] Error generating PI:", err);
      toast.error(err.message || "Failed to generate PI");
    } finally {
      setPiLoading(false);
    }
  };

  // Get quote status with expiry check
  const getQuoteStatus = (quote) => {
    const now = new Date();
    const expiryDate = quote.expiry_date ? new Date(quote.expiry_date) : null;

    if (quote.status === "ACCEPTED") return "ACCEPTED";
    if (quote.status === "REJECTED") return "REJECTED";
    if (quote.status === "CONVERTED") return "CONVERTED";
    if (quote.status === "DRAFT") return "DRAFT";
    if (expiryDate && expiryDate < now && quote.status === "SENT") return "EXPIRED";
    if (quote.status === "SENT") return "SENT";
    return quote.status || "DRAFT";
  };

  // Filter quotations for each tab
  const sentQuotations = quotations.filter((q) => getQuoteStatus(q) === "SENT");
  const acceptedQuotations = quotations.filter((q) => getQuoteStatus(q) === "ACCEPTED");
  const rejectedQuotations = quotations.filter((q) => getQuoteStatus(q) === "REJECTED");
  const expiredQuotations = quotations.filter((q) => getQuoteStatus(q) === "EXPIRED");
  const convertedQuotations = quotations.filter((q) => getQuoteStatus(q) === "CONVERTED");

  // Search filter
  const filterBySearch = (list) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((q) =>
      q.quote_number?.toLowerCase().includes(term) ||
      q.customer_name?.toLowerCase().includes(term) ||
      q.customer_email?.toLowerCase().includes(term) ||
      q.buyer_name?.toLowerCase().includes(term) ||
      q.items?.some((item) =>
        item.product_name?.toLowerCase().includes(term) ||
        item.part_number?.toLowerCase().includes(term)
      )
    );
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  // View quotation details
  const handleViewQuote = (quote) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  // Print quotation
  const handlePrintQuote = (quote) => {
    setSelectedQuote(quote);
    setShowPrintPreview(true);
  };

  // Get status chip
  const getStatusChip = (status) => {
    const statusConfig = {
      DRAFT: { color: "default", icon: <Description sx={{ fontSize: "14px !important" }} />, label: "Draft" },
      SENT: { color: "info", icon: <Send sx={{ fontSize: "14px !important" }} />, label: "Open" },
      ACCEPTED: { color: "success", icon: <CheckCircle sx={{ fontSize: "14px !important" }} />, label: "Accepted" },
      REJECTED: { color: "error", icon: <Cancel sx={{ fontSize: "14px !important" }} />, label: "Rejected" },
      EXPIRED: { color: "warning", icon: <HourglassEmpty sx={{ fontSize: "14px !important" }} />, label: "Expired" },
      CONVERTED: { color: "primary", icon: <SwapHoriz sx={{ fontSize: "14px !important" }} />, label: "Converted" },
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        color={config.color}
        sx={{ fontSize: "11px", height: "22px" }}
      />
    );
  };

  // Render quotation row
  const renderQuotationRow = (quote, showGeneratePIButton = false) => {
    const status = getQuoteStatus(quote);
    const daysUntilExpiry = getDaysUntilExpiry(quote.expiry_date);
    const isExpiringSoon = status === "SENT" && daysUntilExpiry <= 3 && daysUntilExpiry > 0;

    return (
      <TableRow
        key={quote._id}
        hover
        sx={{
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" },
          ...(isExpiringSoon && { backgroundColor: "rgba(255, 152, 0, 0.05)" }),
        }}
      >
        <TableCell sx={{ fontSize: "13px" }}>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "13px" }}>
            {quote.quote_number}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(quote.createdAt)}
          </Typography>
        </TableCell>

        <TableCell sx={{ fontSize: "13px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
            <Box>
              <Typography variant="body2" sx={{ fontSize: "13px" }}>
                {quote.customer_name || quote.buyer_name || "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {quote.customer_email || "-"}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        <TableCell sx={{ fontSize: "13px" }}>
          <Typography variant="body2" sx={{ fontSize: "13px" }}>
            {quote.items?.length || 0} items
          </Typography>
        </TableCell>

        <TableCell sx={{ fontSize: "13px" }} align="right">
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "13px" }}>
            ${(quote.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ₹{((quote.total_amount || 0) * (quote.exchange_rate || usdToInr)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </Typography>
        </TableCell>

        <TableCell sx={{ fontSize: "13px" }}>
          {quote.expiry_date ? (
            <Box>
              <Typography variant="body2" sx={{ fontSize: "13px" }}>
                {formatDate(quote.expiry_date)}
              </Typography>
              {status === "SENT" && daysUntilExpiry !== null && (
                <Chip
                  size="small"
                  label={daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry}d left`}
                  color={daysUntilExpiry <= 0 ? "error" : daysUntilExpiry <= 3 ? "warning" : "default"}
                  sx={{ fontSize: "10px", height: "18px", mt: 0.5 }}
                />
              )}
            </Box>
          ) : (
            "-"
          )}
        </TableCell>

        <TableCell sx={{ fontSize: "13px" }}>
          {getStatusChip(status)}
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => handleViewQuote(quote)}>
                <Visibility sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton size="small" onClick={() => handlePrintQuote(quote)}>
                <Print sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Email">
              <IconButton
                size="small"
                onClick={async () => {
                  setEmailQuote(quote);
                  setBuyerCurrentEmail(null);
                  // Fetch buyer's current email
                  try {
                    const buyerId = quote.buyer?._id || quote.buyer;
                    if (buyerId) {
                      const response = await apiClient.get(ENDPOINTS.USERS.GET(buyerId));
                      if (response.data?.data?.email) {
                        setBuyerCurrentEmail(response.data.data.email);
                      }
                    }
                  } catch (err) {
                    console.warn('[Quotations] Could not fetch buyer current email:', err.message);
                  }
                  setShowEmailModal(true);
                }}
                sx={{ color: "primary.main" }}
              >
                <Email sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            {showGeneratePIButton && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<Receipt sx={{ fontSize: 16 }} />}
                onClick={() => handleGeneratePI(quote)}
                sx={{ ml: 1, fontSize: "11px", textTransform: "none", whiteSpace: "nowrap" }}
              >
                Generate PI
              </Button>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  // Render table
  const renderTable = (data, page, rowsPerPage, setPage, setRowsPerPage, showGeneratePIButton = false) => {
    const filteredData = filterBySearch(data);
    const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (filteredData.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No quotations found{searchTerm ? " matching your search" : ""}.
        </Alert>
      );
    }

    return (
      <>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Quote #</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Items</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "13px" }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((quote) => renderQuotationRow(quote, showGeneratePIButton))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ "& .MuiTablePagination-select, & .MuiTablePagination-displayedRows": { fontSize: "13px" } }}
        />
      </>
    );
  };

  // Stats cards
  const stats = [
    { label: "Open", count: sentQuotations.length, color: "#2196f3", icon: <Send /> },
    { label: "Accepted", count: acceptedQuotations.length, color: "#4caf50", icon: <CheckCircle /> },
    { label: "Rejected", count: rejectedQuotations.length, color: "#f44336", icon: <Cancel /> },
    { label: "Expired", count: expiredQuotations.length, color: "#ff9800", icon: <HourglassEmpty /> },
    { label: "Converted", count: convertedQuotations.length, color: "#673ab7", icon: <SwapHoriz /> },
  ];

  const totals = calculateQuoteTotals();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b0c1a] mb-1">Quotations</h1>
            <p className="text-gray-600 text-sm">
              Manage all quotations sent to buyers
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

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 6, sm: 4, md:2.4 }} key={stat.label}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: stat.color }}>
                  {stat.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
          placeholder="Search by quote number, customer name, product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
            "& input": { fontSize: "13px" },
          }}
        />
      </Paper>

      {/* Tabs */}
      {!loading && (
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": { textTransform: "none", fontSize: "13px", py: 1.5 },
            }}
          >
            <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Send sx={{ fontSize: 16, color: "info.main" }} /><span>Open ({sentQuotations.length})</span></Box>} />
            <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><CheckCircle sx={{ fontSize: 16, color: "success.main" }} /><span>Accepted ({acceptedQuotations.length})</span></Box>} />
            <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Cancel sx={{ fontSize: 16, color: "error.main" }} /><span>Rejected ({rejectedQuotations.length})</span></Box>} />
            <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><HourglassEmpty sx={{ fontSize: 16, color: "warning.main" }} /><span>Expired ({expiredQuotations.length})</span></Box>} />
            <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><SwapHoriz sx={{ fontSize: 16, color: "primary.main" }} /><span>Converted ({convertedQuotations.length})</span></Box>} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            <TabPanel value={activeTab} index={0}>{renderTable(sentQuotations, sentPage, sentRowsPerPage, setSentPage, setSentRowsPerPage, false)}</TabPanel>
            <TabPanel value={activeTab} index={1}>{renderTable(acceptedQuotations, acceptedPage, acceptedRowsPerPage, setAcceptedPage, setAcceptedRowsPerPage, true)}</TabPanel>
            <TabPanel value={activeTab} index={2}>{renderTable(rejectedQuotations, rejectedPage, rejectedRowsPerPage, setRejectedPage, setRejectedRowsPerPage, false)}</TabPanel>
            <TabPanel value={activeTab} index={3}>{renderTable(expiredQuotations, expiredPage, expiredRowsPerPage, setExpiredPage, setExpiredRowsPerPage, false)}</TabPanel>
            <TabPanel value={activeTab} index={4}>{renderTable(convertedQuotations, convertedPage, convertedRowsPerPage, setConvertedPage, setConvertedRowsPerPage, false)}</TabPanel>
          </Box>
        </Paper>
      )}

      {/* Create Quotation Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setOrderToConvert(null);
          setCreateStep(0);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, minHeight: "80vh" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Create Quotation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From Order: {orderToConvert?.po_number || orderToConvert?.order_id}
              </Typography>
            </Box>
            <Chip label={`Step ${createStep + 1} of 2`} size="small" color="primary" />
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stepper activeStep={createStep} sx={{ mb: 4 }}>
            <Step><StepLabel>Set Prices & Quantities</StepLabel></Step>
            <Step><StepLabel>Review & Confirm</StepLabel></Step>
          </Stepper>

          {createStep === 0 && orderToConvert && (
            <Stack spacing={3}>
              {/* Exchange Rate & Expiry */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Quotation Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Validity (Days)"
                      type="number"
                      value={quoteForm.expiryDays}
                      onChange={(e) => setQuoteForm({ ...quoteForm, expiryDays: parseInt(e.target.value) || 20 })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exchange Rate (1 USD = ₹)"
                      type="number"
                      value={quoteForm.exchangeRate}
                      onChange={(e) => handleExchangeRateChange(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Items Pricing */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Item Pricing
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: "12px", fontWeight: "bold" }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Price (USD)</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Price (INR)</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Total (USD)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderToConvert.items?.map((item, idx) => {
                        const adjustment = quoteForm.priceAdjustments[idx];
                        const quantityInfo = quoteForm.quantities[idx];
                        return (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontSize: "12px" }}>
                              <Typography variant="body2" sx={{ fontSize: "12px" }}>{item.product_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.part_number}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={quantityInfo?.quantity || item.quantity}
                                onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                                sx={{ width: 80, "& input": { fontSize: "12px", textAlign: "right" } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={adjustment?.adjusted_price_usd?.toFixed(2) || "0.00"}
                                onChange={(e) => handlePriceAdjustmentUSD(item.product_id, e.target.value)}
                                slotProps={{
                                  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                                }}
                                sx={{ width: 120, "& input": { fontSize: "12px", textAlign: "right" } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={adjustment?.adjusted_price_inr?.toFixed(2) || "0.00"}
                                onChange={(e) => handlePriceAdjustmentINR(item.product_id, e.target.value)}
                                slotProps={{
                                  input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
                                }}
                                sx={{ width: 130, "& input": { fontSize: "12px", textAlign: "right" } }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>
                              ${((adjustment?.adjusted_price_usd || 0) * (quantityInfo?.quantity || item.quantity)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Additional Charges */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Additional Charges (USD)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Logistics"
                      type="number"
                      value={quoteForm.logisticCharges}
                      onChange={(e) => setQuoteForm({ ...quoteForm, logisticCharges: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Duty"
                      type="number"
                      value={quoteForm.customDuty}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customDuty: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Debit Note"
                      type="number"
                      value={quoteForm.debetNote}
                      onChange={(e) => setQuoteForm({ ...quoteForm, debetNote: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Bank Charges"
                      type="number"
                      value={quoteForm.bankCharges}
                      onChange={(e) => setQuoteForm({ ...quoteForm, bankCharges: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Admin Notes */}
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Internal Notes"
                value={quoteForm.adminNotes}
                onChange={(e) => setQuoteForm({ ...quoteForm, adminNotes: e.target.value })}
              />
            </Stack>
          )}

          {createStep === 1 && orderToConvert && (
            <Stack spacing={3}>
              {/* Summary */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Quotation Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body2">{orderToConvert.customer_name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Validity</Typography>
                    <Typography variant="body2">{quoteForm.expiryDays} days</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Exchange Rate</Typography>
                    <Typography variant="body2">$1 = ₹{quoteForm.exchangeRate.toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Items</Typography>
                    <Typography variant="body2">{orderToConvert.items?.length || 0} items</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Items Preview */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Items
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: "12px", fontWeight: "bold" }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Price (USD)</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Price (INR)</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Total (USD)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderToConvert.items?.map((item, idx) => {
                        const adjustment = quoteForm.priceAdjustments[idx];
                        const quantityInfo = quoteForm.quantities[idx];
                        const priceUSD = adjustment?.adjusted_price_usd || 0;
                        const quantity = quantityInfo?.quantity || item.quantity;
                        return (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontSize: "12px" }}>
                              {item.product_name}
                              <Typography variant="caption" display="block" color="text.secondary">{item.part_number}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px" }}>{quantity}</TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px" }}>${priceUSD.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px" }}>₹{(priceUSD * quoteForm.exchangeRate).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>${(priceUSD * quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Totals */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "primary.50" }}>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${totals.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Additional Charges:</Typography>
                    <Typography variant="body2">${totals.additionalCharges.toFixed(2)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" fontWeight="bold">Grand Total (USD):</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">${totals.total.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Grand Total (INR):</Typography>
                    <Typography variant="body2" color="success.main">₹{(totals.total * quoteForm.exchangeRate).toFixed(2)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button
            onClick={() => {
              setShowCreateModal(false);
              setOrderToConvert(null);
              setCreateStep(0);
            }}
            variant="outlined"
            disabled={createLoading}
          >
            Cancel
          </Button>
          {createStep > 0 && (
            <Button
              onClick={() => setCreateStep(createStep - 1)}
              startIcon={<ArrowBack />}
              disabled={createLoading}
            >
              Back
            </Button>
          )}
          {createStep < 1 ? (
            <Button
              variant="contained"
              onClick={() => setCreateStep(createStep + 1)}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitQuote}
              disabled={createLoading}
              startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : <Send />}
            >
              {createLoading ? "Creating..." : "Create Quotation"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">Quotation Details</Typography>
              <Typography variant="body2" color="text.secondary">{selectedQuote?.quote_number}</Typography>
            </Box>
            {selectedQuote && getStatusChip(getQuoteStatus(selectedQuote))}
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedQuote && (
            <Stack spacing={3}>
              {/* Quotation Info with Exchange Rate */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "primary.50" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Quotation Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Quote Date</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedQuote.createdAt ? new Date(selectedQuote.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedQuote.expiry_date ? new Date(selectedQuote.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Exchange Rate</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      1 USD = ₹{selectedQuote.exchange_rate || usdToInr || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Items</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedQuote.items?.length || 0} items
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Customer Information */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Customer Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{selectedQuote.customer_name || selectedQuote.buyer_name || "-"}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{selectedQuote.customer_email || "-"}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Items ({selectedQuote.items?.length || 0})</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "12px" }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedQuote.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: "12px" }}>
                            <Typography variant="body2" sx={{ fontSize: "12px" }}>{item.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.part_number}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: "12px" }}>{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontSize: "12px" }}>${item.unit_price?.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: "12px" }}>${item.total_price?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${(selectedQuote.subtotal || 0).toFixed(2)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" fontWeight="bold">Grand Total (USD):</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">${(selectedQuote.total_amount || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Grand Total (INR):</Typography>
                    <Typography variant="body2" color="success.main">
                      ₹{((selectedQuote.total_amount || 0) * (selectedQuote.exchange_rate || usdToInr)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {selectedQuote.status === "REJECTED" && selectedQuote.rejection_reason && (
                <Alert severity="error">
                  <Typography variant="subtitle2" fontWeight="bold">Rejection Reason:</Typography>
                  <Typography variant="body2">{selectedQuote.rejection_reason}</Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button onClick={() => setShowViewModal(false)} variant="outlined">Close</Button>
          <Button variant="contained" startIcon={<Print />} onClick={() => { setShowViewModal(false); handlePrintQuote(selectedQuote); }}>Print</Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onClose={() => setShowPrintPreview(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Print Preview - {selectedQuote?.quote_number}</DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <div ref={printRef}>
              <QuotationPrintPreview quotation={selectedQuote} />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowPrintPreview(false)} variant="outlined">Close</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => {
              const printContent = printRef.current;
              if (printContent) {
                const printWindow = window.open("", "_blank");
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Quotation - ${selectedQuote.quote_number}</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                      </style>
                    </head>
                    <body>${printContent.innerHTML}</body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 350);
              }
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate PI Modal */}
      <Dialog
        open={showPIModal}
        onClose={() => {
          setShowPIModal(false);
          setPiQuote(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, minHeight: "80vh" } }}
      >
        <DialogTitle sx={{ pb: 1, bgcolor: "success.50" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Receipt color="success" /> Generate Proforma Invoice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From Quotation: {piQuote?.quote_number}
              </Typography>
            </Box>
            <Chip label="Accepted Quote" size="small" color="success" />
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {piQuote && (
            <Stack spacing={3}>
              {/* PI Settings */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  PI Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="PI Number"
                      value={piForm.piNumber}
                      onChange={(e) => setPiForm({ ...piForm, piNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="PI Date"
                      type="date"
                      value={piForm.piDate}
                      onChange={(e) => setPiForm({ ...piForm, piDate: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exchange Rate (1 USD = ₹)"
                      type="number"
                      value={piForm.exchangeRate}
                      onChange={(e) => handlePIExchangeRateChange(e.target.value)}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Validity (Days)"
                      type="number"
                      value={piForm.validityDays}
                      onChange={(e) => setPiForm({ ...piForm, validityDays: parseInt(e.target.value) || 30 })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Payment Terms"
                      value={piForm.paymentTerms}
                      onChange={(e) => setPiForm({ ...piForm, paymentTerms: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Delivery Terms"
                      value={piForm.deliveryTerms}
                      onChange={(e) => setPiForm({ ...piForm, deliveryTerms: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Customer Info */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Customer Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{piQuote.customer_name || piQuote.buyer_name || "-"}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{piQuote.customer_email || "-"}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Items with Editable Prices */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Items (All fields editable)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontSize: "12px", fontWeight: "bold" }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Price (USD)</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Price (INR)</TableCell>
                        <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>Total (USD)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(piForm.items || []).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: "12px" }}>
                            <Typography variant="body2" sx={{ fontSize: "12px" }}>{item.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.part_number}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handlePIItemQuantity(idx, e.target.value)}
                              sx={{ width: 80, "& input": { fontSize: "12px", textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.unit_price_usd.toFixed(2)}
                              onChange={(e) => handlePIItemPriceUSD(idx, e.target.value)}
                              slotProps={{
                                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                              }}
                              sx={{ width: 120, "& input": { fontSize: "12px", textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.unit_price_inr.toFixed(2)}
                              onChange={(e) => handlePIItemPriceINR(idx, e.target.value)}
                              slotProps={{
                                input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
                              }}
                              sx={{ width: 130, "& input": { fontSize: "12px", textAlign: "right" } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>
                            ${(item.unit_price_usd * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Additional Charges */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Additional Charges (USD)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Logistics"
                      type="number"
                      value={piForm.logisticCharges}
                      onChange={(e) => setPiForm({ ...piForm, logisticCharges: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Duty"
                      type="number"
                      value={piForm.customDuty}
                      onChange={(e) => setPiForm({ ...piForm, customDuty: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Bank Charges"
                      type="number"
                      value={piForm.bankCharges}
                      onChange={(e) => setPiForm({ ...piForm, bankCharges: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Other Charges"
                      type="number"
                      value={piForm.otherCharges}
                      onChange={(e) => setPiForm({ ...piForm, otherCharges: parseFloat(e.target.value) || 0 })}
                      slotProps={{
                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Notes / Remarks"
                value={piForm.notes}
                onChange={(e) => setPiForm({ ...piForm, notes: e.target.value })}
              />

              {/* Totals */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "success.50" }}>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${calculatePITotals().subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Additional Charges:</Typography>
                    <Typography variant="body2">${calculatePITotals().additionalCharges.toFixed(2)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" fontWeight="bold">Grand Total (USD):</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                      ${calculatePITotals().total.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Grand Total (INR):</Typography>
                    <Typography variant="body2" color="primary.main" fontWeight="bold">
                      ₹{(calculatePITotals().total * piForm.exchangeRate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Button
            onClick={() => {
              setShowPIModal(false);
              setPiQuote(null);
            }}
            variant="outlined"
            disabled={piLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmitPI}
            disabled={piLoading}
            startIcon={piLoading ? <CircularProgress size={16} color="inherit" /> : <Receipt />}
          >
            {piLoading ? "Generating..." : "Generate PI"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        open={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailQuote(null);
          setBuyerCurrentEmail(null);
        }}
        documentType="quotation"
        document={emailQuote}
        buyerCurrentEmail={buyerCurrentEmail}
        onSuccess={() => {
          fetchQuotations();
          toast.success("Quotation email sent successfully!");
        }}
      />
    </div>
  );
}

export default Quotations;
