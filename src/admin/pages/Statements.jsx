import { useState, useRef } from 'react'
import {
  Container,
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
  Tooltip,
  TextField,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Skeleton
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Visibility,
  Search,
  Print,
  PictureAsPdf,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CalendarMonth,
  Person
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../services/api/client'
import { ENDPOINTS } from '../../services/api/endpoints'
import { useCurrency } from '../../context/CurrencyContext'
import StatementPrintPreview from '../components/StatementPrintPreview'

// Print styles
const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }
    .print-content {
      padding: 20px !important;
    }
  }
`

function Statements() {
  const { usdToInr } = useCurrency()
  const [selectedStatement, setSelectedStatement] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStatementPreviewModal, setShowStatementPreviewModal] = useState(false)

  // Print preview ref
  const statementPrintRef = useRef(null)

  // Filter state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Fetch transactions from API
  const {
    data: transactionsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['statements', 'transactions'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.STATEMENTS.TRANSACTIONS)
      return response.data
    }
  })

  // Extract transactions from API response
  const allTransactions = transactionsData?.data?.transactions || []

  // Get unique buyers from transactions
  const uniqueBuyers = [...new Set(allTransactions.map(txn =>
    txn.buyer?.user_id || txn.buyer?.name || 'Unknown'
  ))].filter(Boolean).sort()

  // Get unique months from transactions
  const getMonthOptions = () => {
    const months = new Set()
    allTransactions.forEach(txn => {
      const date = new Date(txn.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.add(monthYear)
    })
    return Array.from(months).sort().reverse()
  }

  const monthOptions = getMonthOptions()

  // Format month for display
  const formatMonth = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Helper to get buyer identifier
  const getBuyerId = (txn) => txn.buyer?.user_id || txn.buyer?.name || 'Unknown'

  // Filter transactions
  const filteredTransactions = allTransactions.filter(txn => {
    const buyerId = getBuyerId(txn)
    const description = txn.description || ''
    const reference = txn.reference || ''

    // Search filter
    const matchesSearch = !searchTerm ||
      buyerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase())

    // Buyer filter
    const matchesBuyer = buyerFilter === 'all' || buyerId === buyerFilter

    // Month filter
    let matchesMonth = true
    if (monthFilter !== 'all') {
      const txnDate = new Date(txn.date)
      const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`
      matchesMonth = txnMonth === monthFilter
    }

    return matchesSearch && matchesBuyer && matchesMonth
  })

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let compareA, compareB

    if (sortBy === 'date') {
      compareA = new Date(a.date)
      compareB = new Date(b.date)
    } else if (sortBy === 'amount') {
      compareA = a.charges || a.payments || 0
      compareB = b.charges || b.payments || 0
    } else if (sortBy === 'customer_id') {
      compareA = getBuyerId(a)
      compareB = getBuyerId(b)
    }

    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1
    } else {
      return compareA < compareB ? 1 : -1
    }
  })

  const paginatedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Calculate summary stats
  const totalInflow = filteredTransactions.reduce((sum, txn) => sum + (txn.payments || 0), 0)
  const totalOutflow = filteredTransactions.reduce((sum, txn) => sum + (txn.charges || 0), 0)
  const netBalance = totalInflow - totalOutflow

  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // View buyer statement details - filter transactions for this buyer
  const handleViewBuyerStatement = (buyerId) => {
    const buyerTransactions = allTransactions.filter(txn => getBuyerId(txn) === buyerId)
    if (buyerTransactions.length > 0) {
      // Calculate totals for this buyer
      const totalCharges = buyerTransactions.reduce((sum, txn) => sum + (txn.charges || 0), 0)
      const totalPayments = buyerTransactions.reduce((sum, txn) => sum + (txn.payments || 0), 0)

      setSelectedStatement({
        customer_id: buyerId,
        transactions: buyerTransactions,
        total_charges: totalCharges,
        total_payments: totalPayments,
        opening_balance: 0,
        closing_balance: totalCharges - totalPayments,
        statement_date: new Date().toISOString(),
        period_start: buyerTransactions[buyerTransactions.length - 1]?.date,
        period_end: buyerTransactions[0]?.date,
      })
      setShowDetailsModal(true)
    }
  }

  // Open statement preview modal
  const handleViewStatementPreview = () => {
    setShowStatementPreviewModal(true)
  }

  // Professional print handler for statement
  const handlePrintStatement = () => {
    const printContent = statementPrintRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Account Statement - ${buyerFilter !== 'all' ? buyerFilter : 'All Buyers'}</title>
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
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 350)
    }
  }

  // Professional PDF handler for statement
  const handleDownloadPDF = () => {
    const printContent = statementPrintRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Account Statement - ${buyerFilter !== 'all' ? buyerFilter : 'All Buyers'}</title>
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
      `)
      printWindow.document.close()
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Container className='px-0!' maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={350} height={24} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
      </Container>
    )
  }

  // Error state
  if (isError) {
    return (
      <Container className='px-0!' maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
        <Alert severity="error">
          Failed to load transactions: {error?.message || 'Unknown error'}
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <style>{printStyles}</style>
      <Container className='px-0!' maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <h1 className='text-2xl font-bold text-[#0b0c1a] mb-2'>
              Transaction Statements
            </h1>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '13px' }}>
              View all transactions - payments received and charges (dispatches)
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Visibility />}
              onClick={handleViewStatementPreview}
              sx={{ fontSize: '13px' }}
            >
              Preview & Print
            </Button>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <TrendingUp color="success" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    TOTAL INFLOW (PAYMENTS)
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ${totalInflow.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  ₹{(totalInflow * usdToInr).toFixed(2)} INR
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #f44336' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <TrendingDown color="error" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    TOTAL OUTFLOW (CHARGES)
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ${totalOutflow.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  ₹{(totalOutflow * usdToInr).toFixed(2)} INR
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: netBalance >= 0 ? '#e3f2fd' : '#fff3e0', borderLeft: `4px solid ${netBalance >= 0 ? '#1976d2' : '#ff9800'}` }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <AccountBalance color={netBalance >= 0 ? 'primary' : 'warning'} fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    NET BALANCE
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold" color={netBalance >= 0 ? 'primary.main' : 'warning.main'}>
                  ${netBalance.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  ₹{(netBalance * usdToInr).toFixed(2)} INR
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Buyer, Reference, Description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(0)
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{ '& input': { fontSize: '13px' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '13px' }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Person sx={{ fontSize: 16 }} />
                    <span>Buyer</span>
                  </Stack>
                </InputLabel>
                <Select
                  value={buyerFilter}
                  label="Buyer"
                  onChange={(e) => {
                    setBuyerFilter(e.target.value)
                    setPage(0)
                  }}
                  sx={{ '& .MuiSelect-select': { fontSize: '13px' } }}
                >
                  <MenuItem value="all" sx={{ fontSize: '13px' }}>All Buyers</MenuItem>
                  {uniqueBuyers.map(buyer => (
                    <MenuItem key={buyer} value={buyer} sx={{ fontSize: '13px' }}>{buyer}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '13px' }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CalendarMonth sx={{ fontSize: 16 }} />
                    <span>Month</span>
                  </Stack>
                </InputLabel>
                <Select
                  value={monthFilter}
                  label="Month"
                  onChange={(e) => {
                    setMonthFilter(e.target.value)
                    setPage(0)
                  }}
                  sx={{ '& .MuiSelect-select': { fontSize: '13px' } }}
                >
                  <MenuItem value="all" sx={{ fontSize: '13px' }}>All Months</MenuItem>
                  {monthOptions.map(month => (
                    <MenuItem key={month} value={month} sx={{ fontSize: '13px' }}>{formatMonth(month)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                  {filteredTransactions.length} transactions
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Transactions Table */}
        <TableContainer component={Paper} className="print-content">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortOrder : 'asc'}
                    onClick={() => handleSortChange('date')}
                  >
                    <strong style={{ fontSize: '13px' }}>Date</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'customer_id'}
                    direction={sortBy === 'customer_id' ? sortOrder : 'asc'}
                    onClick={() => handleSortChange('customer_id')}
                  >
                    <strong style={{ fontSize: '13px' }}>Buyer</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: '13px' }}>Type</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: '13px' }}>Reference</strong>
                </TableCell>
                <TableCell>
                  <strong style={{ fontSize: '13px' }}>Description</strong>
                </TableCell>
                <TableCell align="right">
                  <strong style={{ fontSize: '13px', color: '#4caf50' }}>Inflow (+)</strong>
                </TableCell>
                <TableCell align="right">
                  <strong style={{ fontSize: '13px', color: '#f44336' }}>Outflow (-)</strong>
                </TableCell>
                <TableCell align="right">
                  <strong style={{ fontSize: '13px' }}>Balance</strong>
                </TableCell>
                <TableCell align="center" className="no-print">
                  <strong style={{ fontSize: '13px' }}>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Alert severity="info" sx={{ fontSize: '13px' }}>
                      No transactions found
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((txn, index) => (
                  <TableRow key={index} hover sx={{ bgcolor: txn.type === 'PAYMENT' ? '#f1f8e9' : '#fff' }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '13px' }}>
                        {new Date(txn.date).toLocaleDateString('en-GB')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                        {new Date(txn.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                        {getBuyerId(txn)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={txn.type}
                        size="small"
                        color={txn.type === 'PAYMENT' ? 'success' : 'error'}
                        sx={{ fontSize: '11px', height: '22px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {txn.reference}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '12px' }}>
                        {txn.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {txn.payments > 0 ? (
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ fontSize: '13px' }}>
                            +${txn.payments.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                            ₹{(txn.payments * usdToInr).toFixed(2)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {txn.charges > 0 ? (
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ fontSize: '13px' }}>
                            -${txn.charges.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                            ₹{(txn.charges * usdToInr).toFixed(2)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {txn.balance !== undefined ? (
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                            ${txn.balance.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                            ₹{(txn.balance * usdToInr).toFixed(2)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" className="no-print">
                      <Tooltip title="View Buyer Statement">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewBuyerStatement(getBuyerId(txn))}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredTransactions.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{
              '& .MuiTablePagination-select, & .MuiTablePagination-displayedRows': { fontSize: '13px' }
            }}
            className="no-print"
          />
        </TableContainer>

        {/* Buyer Statement Details Dialog */}
        <Dialog
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle className="no-print">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px' }}>
                Buyer Statement - {selectedStatement?.customer_id}
              </Typography>
               
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }} className="print-content">
            {selectedStatement && (
              <Paper elevation={0} sx={{ p: 3 }}>
                {/* Company Header */}
                <Box sx={{ mb: 2, borderBottom: '2px solid #1976d2', pb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '18px', mb: 0.5 }}>
                        GIS
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        Delhi, India
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        mannutemp666@gmail.com
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '24px', color: 'primary.main' }}>
                        ACCOUNT STATEMENT
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Buyer Info */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Buyer ID</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>{selectedStatement.customer_id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Statement Date</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                      {new Date(selectedStatement.statement_date).toLocaleDateString('en-GB')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Period</Typography>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      {new Date(selectedStatement.period_start).toLocaleDateString('en-GB')} - {new Date(selectedStatement.period_end).toLocaleDateString('en-GB')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Closing Balance</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={selectedStatement.closing_balance > 0 ? 'error.main' : 'success.main'}
                      sx={{ fontSize: '15px' }}
                    >
                      ${selectedStatement.closing_balance.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Balance Summary */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '13px', mb: 1.5 }}>
                    Balance Summary
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Opening Balance</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '16px' }}>
                          ${selectedStatement.opening_balance.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#ffebee', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Total Charges</Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main" sx={{ fontSize: '16px' }}>
                          ${selectedStatement.total_charges.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>Total Payments</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ fontSize: '16px' }}>
                          ${selectedStatement.total_payments.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box sx={{
                        p: 1.5,
                        border: '2px solid',
                        borderColor: selectedStatement.closing_balance > 0 ? 'error.main' : 'success.main',
                        borderRadius: 1,
                        bgcolor: selectedStatement.closing_balance > 0 ? '#fff3e0' : '#e8f5e9',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Closing Balance
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={selectedStatement.closing_balance > 0 ? 'error.main' : 'success.main'}
                          sx={{ fontSize: '16px' }}
                        >
                          ${selectedStatement.closing_balance.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Transactions Table */}
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '13px', mb: 1.5 }}>
                    Transaction History ({selectedStatement.transactions.length})
                  </Typography>
                  <TableContainer sx={{ border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>Type</TableCell>
                          <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>Reference</TableCell>
                          <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>Description</TableCell>
                          <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold', color: '#4caf50' }}>Inflow</TableCell>
                          <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold', color: '#f44336' }}>Outflow</TableCell>
                          <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedStatement.transactions || []).map((txn, index) => (
                          <TableRow key={index} hover sx={{ bgcolor: txn.type === 'PAYMENT' ? '#f1f8e9' : '#fff' }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {new Date(txn.date).toLocaleDateString('en-GB')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={txn.type}
                                size="small"
                                color={txn.type === 'PAYMENT' ? 'success' : 'error'}
                                sx={{ fontSize: '11px', height: '22px' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {txn.reference}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                {txn.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {txn.payments > 0 ? (
                                <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ fontSize: '12px' }}>
                                  +${txn.payments.toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {txn.charges > 0 ? (
                                <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ fontSize: '12px' }}>
                                  -${txn.charges.toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {txn.balance !== undefined ? (
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '12px' }}>
                                  ${txn.balance.toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>
            )}
          </DialogContent>
          <DialogActions className="no-print" sx={{ p: 2 }}>
            <Button onClick={() => setShowDetailsModal(false)} sx={{ fontSize: '13px' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Statement Preview Dialog - Professional A4 Preview */}
        <Dialog
          open={showStatementPreviewModal}
          onClose={() => setShowStatementPreviewModal(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { maxHeight: '95vh', m: 1 }
          }}
        >
          <DialogTitle sx={{ py: 1.5, px: 3, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px' }}>
                  Statement Preview
                </Typography>
                <Chip
                  label={buyerFilter !== 'all' ? buyerFilter : 'All Buyers'}
                  color="primary"
                  size="small"
                  sx={{ fontSize: '12px', fontWeight: 600 }}
                />
                {monthFilter !== 'all' && (
                  <Chip
                    label={formatMonth(monthFilter)}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '12px' }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Print Statement">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Print />}
                    onClick={handlePrintStatement}
                    sx={{ fontSize: '12px' }}
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
                    sx={{ fontSize: '12px' }}
                  >
                    PDF
                  </Button>
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
            <StatementPrintPreview
              ref={statementPrintRef}
              transactions={sortedTransactions}
              globalRate={usdToInr}
              title={buyerFilter !== 'all' ? `Account Statement - ${buyerFilter}` : 'Transaction Statement'}
              buyerName={buyerFilter !== 'all' ? buyerFilter : null}
              periodStart={monthFilter !== 'all' ? `${monthFilter}-01` : null}
              periodEnd={monthFilter !== 'all' ? `${monthFilter}-31` : null}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setShowStatementPreviewModal(false)} sx={{ fontSize: '13px' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  )
}

export default Statements
