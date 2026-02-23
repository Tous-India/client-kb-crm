import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
  Divider
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Search,
  ArrowBack,
  Receipt,
  Payment as PaymentIcon,
  FilterList,
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  AttachMoney
} from '@mui/icons-material'
import statementsData from '../../mock/statements.json'
import { useCurrency } from '../../context/CurrencyContext'

function BuyerTransactions() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { usdToInr } = useCurrency()

  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    // Load transactions for this specific customer
    loadTransactions()
  }, [customerId])

  useEffect(() => {
    // Apply filters
    applyFilters()
  }, [transactions, searchTerm, typeFilter, dateFilter])

  const loadTransactions = () => {
    // Get all statements for this customer
    const customerStatements = statementsData.statements.filter(
      stmt => stmt.customer_id === customerId
    )

    // Extract all transactions from these statements
    const allTransactions = customerStatements.flatMap(stmt =>
      stmt.transactions.map(txn => ({
        ...txn,
        statement_id: stmt.statement_id,
        statement_date: stmt.statement_date,
        period_start: stmt.period_start,
        period_end: stmt.period_end
      }))
    )

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))

    setTransactions(allTransactions)
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.statement_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(txn => txn.type === typeFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const daysAgo = parseInt(dateFilter)
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(txn => new Date(txn.date) >= cutoffDate)
    }

    setFilteredTransactions(filtered)
    setPage(0) // Reset to first page when filters change
  }

  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calculate summary statistics
  const totalCharges = transactions
    .filter(txn => txn.type === 'INVOICE')
    .reduce((sum, txn) => sum + txn.charges, 0)

  const totalPayments = transactions
    .filter(txn => txn.type === 'PAYMENT')
    .reduce((sum, txn) => sum + txn.payments, 0)

  const invoiceCount = transactions.filter(txn => txn.type === 'INVOICE').length
  const paymentCount = transactions.filter(txn => txn.type === 'PAYMENT').length

  // Paginated data
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Container className='px-0!' maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/admin/statements')} color="primary">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Transaction History - {customerId}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Complete transaction history for this buyer
            </Typography>
          </Box>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Receipt color="error" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    TOTAL INVOICED
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ${totalCharges.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  ₹{(totalCharges * usdToInr).toFixed(2)} INR
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`${invoiceCount} Invoices`}
                    size="small"
                    color="error"
                    sx={{ fontSize: '10px', height: '20px' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <PaymentIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    TOTAL PAID
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ${totalPayments.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  ₹{(totalPayments * usdToInr).toFixed(2)} INR
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`${paymentCount} Payments`}
                    size="small"
                    color="success"
                    sx={{ fontSize: '10px', height: '20px' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <AttachMoney color="primary" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    NET BALANCE
                  </Typography>
                </Stack>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={(totalCharges - totalPayments) > 0 ? 'error.main' : 'success.main'}
                >
                  ${(totalCharges - totalPayments).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  ₹{((totalCharges - totalPayments) * usdToInr).toFixed(2)} INR
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={(totalCharges - totalPayments) > 0 ? 'Outstanding' : 'Paid'}
                    size="small"
                    color={(totalCharges - totalPayments) > 0 ? 'error' : 'success'}
                    sx={{ fontSize: '10px', height: '20px' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CalendarMonth color="info" fontSize="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', fontWeight: 600 }}>
                    TOTAL TRANSACTIONS
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight="bold" color="info.main">
                  {transactions.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  All time activity
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label="Active"
                    size="small"
                    color="info"
                    sx={{ fontSize: '10px', height: '20px' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Reference, Description, or Statement ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={typeFilter}
                label="Filter by Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Transactions</MenuItem>
                <MenuItem value="INVOICE">Invoices Only</MenuItem>
                <MenuItem value="PAYMENT">Payments Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Date</InputLabel>
              <Select
                value={dateFilter}
                label="Filter by Date"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="7">Last 7 Days</MenuItem>
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="90">Last 90 Days</MenuItem>
                <MenuItem value="180">Last 6 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                {filteredTransactions.length} results
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Date & Time</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Reference</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Statement ID</strong></TableCell>
              <TableCell align="right"><strong>Charges (Debt)</strong></TableCell>
              <TableCell align="right"><strong>Payments</strong></TableCell>
              <TableCell align="right"><strong>Running Balance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">No transactions found</Alert>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((txn, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{
                    bgcolor: txn.type === 'PAYMENT' ? 'success.50' : 'error.50'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '13px' }}>
                      {new Date(txn.date).toLocaleDateString('en-GB')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                      {new Date(txn.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={txn.type}
                      size="small"
                      color={txn.type === 'PAYMENT' ? 'success' : 'error'}
                      icon={txn.type === 'PAYMENT' ? <PaymentIcon /> : <Receipt />}
                      sx={{ fontSize: '11px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                      {txn.reference}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '12px' }}>
                      {txn.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                      {txn.statement_id}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {txn.charges > 0 ? (
                      <Stack spacing={0} alignItems="flex-end">
                        <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ fontSize: '13px' }}>
                          ${txn.charges.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                          ₹{(txn.charges * usdToInr).toFixed(2)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {txn.payments > 0 ? (
                      <Stack spacing={0} alignItems="flex-end">
                        <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ fontSize: '13px' }}>
                          ${txn.payments.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                          ₹{(txn.payments * usdToInr).toFixed(2)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={txn.balance > 0 ? 'error.main' : 'success.main'}
                        sx={{ fontSize: '13px' }}
                      >
                        ${txn.balance.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                        ₹{(txn.balance * usdToInr).toFixed(2)}
                      </Typography>
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
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </TableContainer>
    </Container>
  )
}

export default BuyerTransactions
