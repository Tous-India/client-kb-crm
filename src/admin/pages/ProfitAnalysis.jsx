import { useState, useMemo, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Chip,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Skeleton,
  Tooltip
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Search,
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  Person,
  AttachMoney,
  ShowChart,
  Receipt,
  Paid,
  Warning
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../services/api/client'
import { ENDPOINTS } from '../../services/api/endpoints'
import { useCurrency } from '../../context/CurrencyContext'

function ProfitAnalysis() {
  const { usdToInr } = useCurrency()

  // Filter state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Read supplier costs from localStorage (same as PurchaseDashboard)
  const [piSupplierCosts, setPiSupplierCosts] = useState(() => {
    const saved = localStorage.getItem("pi_supplier_costs_v2")
    return saved ? JSON.parse(saved) : {}
  })

  // Listen for localStorage changes (in case PurchaseDashboard updates it)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("pi_supplier_costs_v2")
      if (saved) {
        setPiSupplierCosts(JSON.parse(saved))
      }
    }

    // Check every 5 seconds for updates (localStorage events don't fire in same tab)
    const interval = setInterval(handleStorageChange, 5000)

    // Also listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Fetch invoices from API
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    isError: invoicesError,
    error: invoicesErrorMsg
  } = useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.INVOICES.LIST, {
        params: { limit: 500 }
      })
      return response.data
    }
  })

  // Fetch proforma invoices for PI number lookup
  const {
    data: pisData,
    isLoading: pisLoading
  } = useQuery({
    queryKey: ['proforma-invoices', 'all'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.PROFORMA_INVOICES.LIST, {
        params: { limit: 500 }
      })
      return response.data
    }
  })

  const isLoading = invoicesLoading || pisLoading
  const isError = invoicesError

  // Build profit analysis data by joining invoices with localStorage supplier costs
  const allTransactions = useMemo(() => {
    const invoices = invoicesData?.data?.invoices || invoicesData?.data || []
    const proformas = pisData?.data?.proformaInvoices || pisData?.data || []

    // Create PI lookup map
    const piMap = new Map()
    proformas.forEach(pi => {
      piMap.set(pi._id, pi)
    })

    return invoices.map(invoice => {
      // Get PI ID from invoice
      const piId = typeof invoice.proforma_invoice === 'object'
        ? invoice.proforma_invoice?._id
        : invoice.proforma_invoice

      // Get PI details
      const pi = piId ? piMap.get(piId) : null

      // Get supplier costs from localStorage for this PI
      const supplierData = piId ? (piSupplierCosts[piId] || { entries: [] }) : { entries: [] }

      // Calculate total cost from supplier entries
      const entries = (supplierData.entries || []).map(entry => {
        const totalPaid = (entry.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
        return {
          ...entry,
          total_paid: totalPaid,
          balance_due: (entry.bill_amount || 0) - totalPaid
        }
      })

      const supplierCost = entries.reduce((sum, e) => sum + (e.bill_amount || 0), 0)
      const supplierPaid = entries.reduce((sum, e) => sum + (e.total_paid || 0), 0)
      const supplierDue = supplierCost - supplierPaid

      // Calculate amounts
      const invoiceTotal = invoice.total_amount || invoice.grand_total || 0
      const amountPaid = invoice.amount_paid || 0
      const profit = amountPaid - supplierCost

      // Determine payment status
      let paymentStatus = 'UNPAID'
      if (amountPaid >= invoiceTotal && invoiceTotal > 0) {
        paymentStatus = 'PAID'
      } else if (amountPaid > 0) {
        paymentStatus = 'PARTIAL'
      }

      return {
        _id: invoice._id,
        invoice_number: invoice.invoice_number,
        proforma_number: pi?.proforma_number || invoice.proforma_invoice_number || '',
        pi_id: piId,
        buyer: invoice.buyer,
        buyer_name: invoice.buyer?.name || invoice.buyer_name || 'Unknown',
        date: invoice.createdAt || invoice.issue_date,
        invoice_total: invoiceTotal,
        amount_paid: amountPaid,
        cost: supplierCost,
        supplier_paid: supplierPaid,
        supplier_due: supplierDue,
        profit: profit,
        profit_margin: amountPaid > 0 ? ((profit / amountPaid) * 100).toFixed(1) : 0,
        payment_status: paymentStatus,
        supplier_count: entries.length,
        supplier_entries: entries,
        has_cost_data: supplierCost > 0
      }
    }).filter(txn => txn.invoice_number) // Only show invoices with numbers
  }, [invoicesData, pisData, piSupplierCosts])

  // Get unique buyers from transactions
  const uniqueBuyers = useMemo(() => {
    return [...new Set(allTransactions.map(txn =>
      txn.buyer?.user_id || txn.buyer_name || 'Unknown'
    ))].filter(Boolean).sort()
  }, [allTransactions])

  // Get unique months from transactions
  const monthOptions = useMemo(() => {
    const months = new Set()
    allTransactions.forEach(txn => {
      const date = new Date(txn.date)
      if (!isNaN(date.getTime())) {
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.add(monthYear)
      }
    })
    return Array.from(months).sort().reverse()
  }, [allTransactions])

  // Format month for display
  const formatMonth = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Helper to get buyer identifier
  const getBuyerId = (txn) => txn.buyer?.user_id || txn.buyer_name || 'Unknown'

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(txn => {
      const buyerId = getBuyerId(txn)
      const invoiceNumber = txn.invoice_number || ''

      // Search filter
      const matchesSearch = !searchTerm ||
        buyerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (txn.proforma_number || '').toLowerCase().includes(searchTerm.toLowerCase())

      // Buyer filter
      const matchesBuyer = buyerFilter === 'all' || buyerId === buyerFilter

      // Month filter
      let matchesMonth = true
      if (monthFilter !== 'all') {
        const txnDate = new Date(txn.date)
        if (!isNaN(txnDate.getTime())) {
          const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`
          matchesMonth = txnMonth === monthFilter
        } else {
          matchesMonth = false
        }
      }

      return matchesSearch && matchesBuyer && matchesMonth
    })
  }, [allTransactions, searchTerm, buyerFilter, monthFilter])

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let compareA, compareB

      if (sortBy === 'date') {
        compareA = new Date(a.date)
        compareB = new Date(b.date)
      } else if (sortBy === 'amount_paid') {
        compareA = a.amount_paid || 0
        compareB = b.amount_paid || 0
      } else if (sortBy === 'cost') {
        compareA = a.cost || 0
        compareB = b.cost || 0
      } else if (sortBy === 'profit') {
        compareA = a.profit || 0
        compareB = b.profit || 0
      } else if (sortBy === 'buyer') {
        compareA = getBuyerId(a)
        compareB = getBuyerId(b)
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1
      } else {
        return compareA < compareB ? 1 : -1
      }
    })
  }, [filteredTransactions, sortBy, sortOrder])

  const paginatedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Calculate filtered summary
  const summary = useMemo(() => {
    const invoiced = filteredTransactions.reduce((sum, txn) => sum + (txn.invoice_total || 0), 0)
    const paid = filteredTransactions.reduce((sum, txn) => sum + (txn.amount_paid || 0), 0)
    const cost = filteredTransactions.reduce((sum, txn) => sum + (txn.cost || 0), 0)
    const supplierPaid = filteredTransactions.reduce((sum, txn) => sum + (txn.supplier_paid || 0), 0)
    const supplierDue = filteredTransactions.reduce((sum, txn) => sum + (txn.supplier_due || 0), 0)
    const profit = paid - cost
    const margin = paid > 0 ? ((profit / paid) * 100).toFixed(1) : 0
    const withCostData = filteredTransactions.filter(txn => txn.has_cost_data).length
    const withoutCostData = filteredTransactions.length - withCostData

    return { invoiced, paid, cost, supplierPaid, supplierDue, profit, margin, withCostData, withoutCostData }
  }, [filteredTransactions])

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

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  // Loading state
  if (isLoading) {
    return (
      <Container className='px-0!' maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={250} height={40} />
          <Skeleton variant="text" width={400} height={24} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
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
          Failed to load profit analysis: {invoicesErrorMsg?.message || 'Unknown error'}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className='px-0!' maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <h1 className='text-2xl font-bold text-[#0b0c1a] mb-2'>
          Profit Analysis
        </h1>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '13px' }}>
          Order-wise profit tracking - Paid by Buyer vs Supplier Costs (from Purchase Dashboard)
        </Typography>
      </Box>

      {/* Info Alert - Cost Data Source */}
      {summary.withoutCostData > 0 && (
        <Alert severity="info" sx={{ mb: 2, fontSize: '13px' }}>
          <strong>{summary.withoutCostData}</strong> invoice(s) have no supplier cost data.
          Add supplier bills in <a href="/admin/purchase-dashboard" style={{ color: '#1976d2', fontWeight: 'bold' }}>Purchase Dashboard</a> to track costs.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Paid color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                  PAID BY BUYERS
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {formatCurrency(summary.paid)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                ₹{(summary.paid * usdToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <TrendingDown color="warning" fontSize="small" />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                  SUPPLIER COST
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {formatCurrency(summary.cost)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                Paid: {formatCurrency(summary.supplierPaid)} | Due: {formatCurrency(summary.supplierDue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: summary.profit >= 0 ? '#e3f2fd' : '#ffebee', borderLeft: `4px solid ${summary.profit >= 0 ? '#1976d2' : '#f44336'}` }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                {summary.profit >= 0 ? (
                  <TrendingUp color="primary" fontSize="small" />
                ) : (
                  <Warning color="error" fontSize="small" />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                  {summary.profit >= 0 ? 'TOTAL PROFIT' : 'TOTAL LOSS'}
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" color={summary.profit >= 0 ? 'primary.main' : 'error.main'}>
                {formatCurrency(Math.abs(summary.profit))}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                ₹{(Math.abs(summary.profit) * usdToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <ShowChart sx={{ color: '#9c27b0' }} fontSize="small" />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                  PROFIT MARGIN
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#9c27b0' }}>
                {summary.margin}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                {filteredTransactions.length} invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ bgcolor: '#e0f2f1', borderLeft: '4px solid #009688' }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Receipt sx={{ color: '#009688' }} fontSize="small" />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                  COST DATA
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#009688' }}>
                {summary.withCostData}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                {summary.withoutCostData} without cost
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
              placeholder="Search by Invoice, Buyer, PI..."
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
                {filteredTransactions.length} invoices
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Profit Analysis Table */}
      <TableContainer component={Paper}>
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
                  active={sortBy === 'buyer'}
                  direction={sortBy === 'buyer' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('buyer')}
                >
                  <strong style={{ fontSize: '13px' }}>Buyer</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <strong style={{ fontSize: '13px' }}>Invoice / PI</strong>
              </TableCell>
              <TableCell align="right">
                <strong style={{ fontSize: '13px' }}>Invoice Total</strong>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'amount_paid'}
                  direction={sortBy === 'amount_paid' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('amount_paid')}
                >
                  <strong style={{ fontSize: '13px', color: '#4caf50' }}>Paid by Buyer</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'cost'}
                  direction={sortBy === 'cost' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('cost')}
                >
                  <strong style={{ fontSize: '13px', color: '#ff9800' }}>Supplier Cost</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'profit'}
                  direction={sortBy === 'profit' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('profit')}
                >
                  <strong style={{ fontSize: '13px', color: '#1976d2' }}>Profit</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <strong style={{ fontSize: '13px' }}>Status</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info" sx={{ fontSize: '13px' }}>
                    No profit data found
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((txn, index) => (
                <TableRow
                  key={txn._id || index}
                  hover
                  sx={{
                    bgcolor: !txn.has_cost_data
                      ? '#fafafa'
                      : txn.profit >= 0
                        ? '#f1f8e9'
                        : '#fff8e1'
                  }}
                >
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
                      label={txn.invoice_number}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '11px', height: '22px' }}
                    />
                    {txn.proforma_number && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px', mt: 0.5 }}>
                        PI: {txn.proforma_number}
                      </Typography>
                    )}
                    {txn.supplier_count > 0 && (
                      <Tooltip title={`${txn.supplier_count} supplier(s) with cost data`}>
                        <Chip
                          label={`${txn.supplier_count} supplier${txn.supplier_count > 1 ? 's' : ''}`}
                          size="small"
                          sx={{ fontSize: '9px', height: '18px', mt: 0.5, bgcolor: '#e0f2f1', color: '#009688' }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2" sx={{ fontSize: '13px' }}>
                        {formatCurrency(txn.invoice_total)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                        ₹{((txn.invoice_total || 0) * usdToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ fontSize: '13px' }}>
                        {formatCurrency(txn.amount_paid)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                        ₹{((txn.amount_paid || 0) * usdToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {txn.has_cost_data ? (
                      <Stack spacing={0} alignItems="flex-end">
                        <Typography variant="body2" color="warning.main" fontWeight="bold" sx={{ fontSize: '13px' }}>
                          {formatCurrency(txn.cost)}
                        </Typography>
                        <Tooltip title={`Paid: ${formatCurrency(txn.supplier_paid)} | Due: ${formatCurrency(txn.supplier_due)}`}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', cursor: 'help' }}>
                            {txn.supplier_due > 0 ? (
                              <span style={{ color: '#f44336' }}>Due: {formatCurrency(txn.supplier_due)}</span>
                            ) : (
                              <span style={{ color: '#4caf50' }}>Fully Paid</span>
                            )}
                          </Typography>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Tooltip title="Add cost in Purchase Dashboard">
                        <Typography variant="body2" color="text.disabled" sx={{ fontSize: '13px', fontStyle: 'italic' }}>
                          No cost data
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {txn.has_cost_data ? (
                      <Stack spacing={0} alignItems="flex-end">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={txn.profit >= 0 ? 'primary.main' : 'error.main'}
                          sx={{ fontSize: '13px' }}
                        >
                          {txn.profit >= 0 ? '' : '-'}{formatCurrency(Math.abs(txn.profit))}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={txn.profit >= 0 ? 'success.main' : 'error.main'}
                          sx={{ fontSize: '10px' }}
                        >
                          {txn.profit >= 0 ? `+${txn.profit_margin}%` : `${txn.profit_margin}%`}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.disabled" sx={{ fontSize: '13px' }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack spacing={0.5} alignItems="center">
                      <Chip
                        label={txn.payment_status || 'UNPAID'}
                        size="small"
                        sx={{
                          fontSize: '10px',
                          height: '20px',
                          bgcolor: txn.payment_status === 'PAID' ? '#e8f5e9' : txn.payment_status === 'PARTIAL' ? '#fff8e1' : '#ffebee',
                          color: txn.payment_status === 'PAID' ? '#2e7d32' : txn.payment_status === 'PARTIAL' ? '#f57c00' : '#c62828',
                          fontWeight: 'bold'
                        }}
                      />
                      {txn.has_cost_data && txn.profit < 0 && (
                        <Chip
                          label="LOSS"
                          size="small"
                          sx={{
                            fontSize: '9px',
                            height: '18px',
                            bgcolor: '#ffebee',
                            color: '#c62828',
                            fontWeight: 'bold',
                            border: '1px solid #f44336'
                          }}
                        />
                      )}
                    </Stack>
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
        />
      </TableContainer>
    </Container>
  )
}

export default ProfitAnalysis
