import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Print,
  PictureAsPdf,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Receipt,
  Search,
  Refresh,
  Description,
  Payment,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import StatementPrintPreview from "../../admin/components/StatementPrintPreview";
import apiClient from "../../services/api/client";

function Statements() {
  const { user } = useAuth();
  const { usdToInr } = useCurrency();

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_pi_amount: 0,
    total_payments: 0,
    balance_due: 0,
    total_pis: 0,
    total_payment_records: 0,
  });
  const [piSummary, setPiSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Custom date range filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Print ref
  const printRef = useRef(null);

  // Fetch statement data from database
  const fetchStatementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/statements/my");
      const data = response.data?.data || response.data;

      setTransactions(data.transactions || []);
      setSummary(data.summary || {
        total_pi_amount: 0,
        total_payments: 0,
        balance_due: 0,
        total_pis: 0,
        total_payment_records: 0,
      });
      setPiSummary(data.pi_summary || []);
    } catch (err) {
      console.error("[Statements] Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load statement data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatementData();
  }, [fetchStatementData]);

  // Filter by period
  const filteredTransactions = selectedPeriod === "all"
    ? transactions
    : transactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        const now = new Date();
        if (selectedPeriod === "current") {
          return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
        }
        if (selectedPeriod === "last30") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return txnDate >= thirtyDaysAgo;
        }
        if (selectedPeriod === "last90") {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return txnDate >= ninetyDaysAgo;
        }
        if (selectedPeriod === "custom") {
          if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            return txnDate >= from && txnDate <= to;
          }
          if (fromDate) {
            const from = new Date(fromDate);
            return txnDate >= from;
          }
          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            return txnDate <= to;
          }
        }
        return true;
      });

  // Search filter
  const searchedTransactions = searchTerm
    ? filteredTransactions.filter(
        (txn) =>
          txn.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredTransactions;

  // Sort by date (newest first)
  const sortedTransactions = [...searchedTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Calculate filtered totals
  const filteredCharges = sortedTransactions.reduce((sum, txn) => sum + (txn.charges || 0), 0);
  const filteredPayments = sortedTransactions.reduce((sum, txn) => sum + (txn.payments || 0), 0);

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Pagination
  const paginatedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePeriodChange = (event) => {
    setSelectedPeriod(event.target.value);
    setPage(0);
    if (event.target.value !== "custom") {
      setFromDate("");
      setToDate("");
    }
  };

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    setPage(0);
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    setPage(0);
  };

  const handleClearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  // Open print preview
  const handlePreviewStatement = (statement) => {
    setSelectedStatement(statement);
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
            <title>Statement - ${selectedStatement?.statement_id}</title>
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
            <title>Statement - ${selectedStatement?.statement_id}</title>
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

  // Get type chip color
  const getTypeChipColor = (type) => {
    switch (type) {
      case "PI":
        return "warning";
      case "PAYMENT":
        return "success";
      default:
        return "default";
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Account Statement
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your invoices and payments
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchStatementData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Description sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {summary.total_pis}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invoices
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
                <TrendingDown sx={{ fontSize: 40, color: "error.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(summary.total_pi_amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Billed
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹{formatCurrency(summary.total_pi_amount * usdToInr)}
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
                <TrendingUp sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ${formatCurrency(summary.total_payments)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You Paid
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹{formatCurrency(summary.total_payments * usdToInr)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: summary.balance_due > 0 ? "error.50" : "success.50" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AccountBalance
                  sx={{
                    fontSize: 40,
                    color: summary.balance_due > 0 ? "error.main" : "success.main",
                  }}
                />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color={summary.balance_due > 0 ? "error.main" : "success.main"}>
                    ${formatCurrency(Math.abs(summary.balance_due))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {summary.balance_due > 0 ? "To Pay" : "Credit"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹{formatCurrency(Math.abs(summary.balance_due) * usdToInr)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PI Summary Section */}
      {piSummary.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Invoice Summary
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>PI Number</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>You Paid</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>To Pay</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Extra Paid</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {piSummary.map((pi, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {pi.proforma_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(pi.date)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="medium">
                          ${formatCurrency(pi.total_amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{formatCurrency(pi.total_amount * (pi.exchange_rate || usdToInr))}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0}>
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          ${formatCurrency(pi.payment_received)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{formatCurrency(pi.payment_received * (pi.exchange_rate || usdToInr))}
                        </Typography>
                      </Stack>
                    </TableCell>
                    {/* To Pay column */}
                    <TableCell align="right">
                      {pi.balance > 0 ? (
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight="medium" color="error.main">
                            ${formatCurrency(pi.balance)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(pi.balance * (pi.exchange_rate || usdToInr))}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          Paid
                        </Typography>
                      )}
                    </TableCell>
                    {/* Extra Paid column */}
                    <TableCell align="right">
                      {pi.balance < 0 ? (
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight="medium" color="info.main">
                            ${formatCurrency(Math.abs(pi.balance))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(Math.abs(pi.balance) * (pi.exchange_rate || usdToInr))}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pi.payment_status || "UNPAID"}
                        size="small"
                        color={
                          pi.payment_status === "PAID" ? "success" :
                          pi.payment_status === "PARTIAL" ? "warning" : "error"
                        }
                        variant="filled"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by reference or descrip..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 220 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 145 }}>
            <Select value={selectedPeriod} onChange={handlePeriodChange}>
              <MenuItem value="all">All Transactions</MenuItem>
              <MenuItem value="current">Current Month</MenuItem>
              <MenuItem value="last30">Last 30 Days</MenuItem>
              <MenuItem value="last90">Last 90 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Range Filter */}
          {selectedPeriod === "custom" && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="date"
                label="From"
                value={fromDate}
                onChange={handleFromDateChange}
                sx={{ width: 135 }}
                slotProps={{
                  inputLabel: { shrink: true, sx: { fontSize: 13 } },
                  input: { sx: { fontSize: 13 } }
                }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={toDate}
                onChange={handleToDateChange}
                sx={{ width: 135 }}
                slotProps={{
                  inputLabel: { shrink: true, sx: { fontSize: 13 } },
                  input: { sx: { fontSize: 13 } }
                }}
              />
              {(fromDate || toDate) && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={handleClearDateFilter}
                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: 12 }}
                >
                  Clear
                </Button>
              )}
            </Stack>
          )}

          <Box sx={{ flexGrow: 1 }} />
          {sortedTransactions.length > 0 && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Print sx={{ fontSize: 16 }} />}
                onClick={() => {
                  const statementToPreview = {
                    statement_id: `STMT-${new Date().getTime()}`,
                    statement_date: new Date().toISOString(),
                    customer_id: user?.customer_id || 'BUYER001',
                    period_start: fromDate || sortedTransactions[sortedTransactions.length - 1]?.date,
                    period_end: toDate || sortedTransactions[0]?.date,
                    transactions: sortedTransactions,
                    opening_balance: 0,
                    closing_balance: summary.balance_due,
                    total_charges: filteredCharges,
                    total_payments: filteredPayments,
                    exchange_rate: usdToInr,
                  };
                  handlePreviewStatement(statementToPreview);
                }}
                sx={{ fontSize: 13, px: 1.5 }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<PictureAsPdf sx={{ fontSize: 16 }} />}
                onClick={() => {
                  const statementToPreview = {
                    statement_id: `STMT-${new Date().getTime()}`,
                    statement_date: new Date().toISOString(),
                    customer_id: user?.customer_id || 'BUYER001',
                    period_start: fromDate || sortedTransactions[sortedTransactions.length - 1]?.date,
                    period_end: toDate || sortedTransactions[0]?.date,
                    transactions: sortedTransactions,
                    opening_balance: 0,
                    closing_balance: summary.balance_due,
                    total_charges: filteredCharges,
                    total_payments: filteredPayments,
                    exchange_rate: usdToInr,
                  };
                  handlePreviewStatement(statementToPreview);
                }}
                sx={{ fontSize: 13, px: 1.5 }}
              >
                Download PDF
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Transactions Table */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Transaction History
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Billed
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  You Paid
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  To Pay
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Extra Paid
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((txn, index) => {
                  const globalIndex = page * rowsPerPage + index;
                  return (
                  <TableRow
                    key={`${txn.reference}-${index}`}
                    hover
                    selected={selectedRowIndex === globalIndex}
                    onClick={() => setSelectedRowIndex(globalIndex)}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" },
                      cursor: "pointer",
                      "&.Mui-selected": { backgroundColor: "rgba(25, 118, 210, 0.08)" },
                      "&.Mui-selected:hover": { backgroundColor: "rgba(25, 118, 210, 0.12)" },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">{formatDate(txn.date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={txn.type === "PI" ? "warning.main" : "primary.main"}
                      >
                        {txn.reference}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={txn.type === "PI" ? "Invoice" : "Payment"}
                        size="small"
                        color={getTypeChipColor(txn.type)}
                        variant="outlined"
                        icon={txn.type === "PI" ? <Description sx={{ fontSize: 14 }} /> : <Payment sx={{ fontSize: 14 }} />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{txn.description}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {txn.charges > 0 && (
                        <Stack spacing={0}>
                          <Typography variant="body2" color="error.main" fontWeight="medium">
                            ${formatCurrency(txn.charges)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(txn.charges * usdToInr)}
                          </Typography>
                        </Stack>
                      )}
                      {(!txn.charges || txn.charges === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {/* For PAYMENT rows, show the payment amount */}
                      {txn.payments > 0 && (
                        <Stack spacing={0}>
                          <Typography variant="body2" color="success.main" fontWeight="medium">
                            ${formatCurrency(txn.payments)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(txn.payments * usdToInr)}
                          </Typography>
                        </Stack>
                      )}
                      {/* For PI rows, show amount paid against this PI */}
                      {txn.type === "PI" && txn.pi_paid > 0 && (
                        <Stack spacing={0}>
                          <Typography variant="body2" color="success.main" fontWeight="medium">
                            ${formatCurrency(txn.pi_paid)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(txn.pi_paid * usdToInr)}
                          </Typography>
                        </Stack>
                      )}
                      {/* Show dash only if no payment amount to display */}
                      {(!txn.payments || txn.payments === 0) && (!txn.pi_paid || txn.pi_paid === 0) && (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    {/* To Pay column - show remaining balance (only positive amounts) */}
                    <TableCell align="right">
                      {txn.type === "PI" && txn.pi_balance > 0 ? (
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight="medium" color="error.main">
                            ${formatCurrency(txn.pi_balance)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency(txn.pi_balance * usdToInr)}
                          </Typography>
                        </Stack>
                      ) : txn.type === "PI" ? (
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          Paid
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    {/* Extra Paid column - show overpayment (when paid > billed) */}
                    <TableCell align="right">
                      {txn.type === "PI" && txn.pi_paid > txn.pi_total ? (
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight="medium" color="info.main">
                            ${formatCurrency(txn.pi_paid - txn.pi_total)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{formatCurrency((txn.pi_paid - txn.pi_total) * usdToInr)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {/* Totals Row */}
              {paginatedTransactions.length > 0 && (
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell colSpan={4} sx={{ fontWeight: "bold" }}>
                    TOTALS
                  </TableCell>
                  <TableCell align="right">
                    <Stack spacing={0}>
                      <Typography variant="body2" color="error.main" fontWeight="bold">
                        ${formatCurrency(filteredCharges)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₹{formatCurrency(filteredCharges * usdToInr)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack spacing={0}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ${formatCurrency(filteredPayments)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₹{formatCurrency(filteredPayments * usdToInr)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {/* To Pay - show balance if positive */}
                    {summary.balance_due > 0 ? (
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          ${formatCurrency(summary.balance_due)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{formatCurrency(summary.balance_due * usdToInr)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Paid
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {/* Extra Paid - show credit if balance is negative */}
                    {summary.balance_due < 0 ? (
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="bold" color="info.main">
                          ${formatCurrency(Math.abs(summary.balance_due))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{formatCurrency(Math.abs(summary.balance_due) * usdToInr)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {sortedTransactions.length > 0 && (
        <TablePagination
          component="div"
          count={sortedTransactions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* Print Preview Modal */}
      <Dialog
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Statement Preview</Typography>
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
            <StatementPrintPreview
              ref={printRef}
              statement={selectedStatement}
              transactions={selectedStatement?.transactions}
              buyerName={user?.name}
              periodStart={selectedStatement?.period_start}
              periodEnd={selectedStatement?.period_end}
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrintPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Statements;
