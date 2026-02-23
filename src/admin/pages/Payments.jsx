import { useState, useEffect } from 'react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TextField,
  IconButton,
  Divider
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Payment,
  CheckCircle,
  Pending,
  Search,
  FilterList,
  Visibility,
  Receipt,
  Download,
  Email
} from '@mui/icons-material'
import paymentsData from '../../mock/payments.json'
import invoicesData from '../../mock/invoices.json'

function Payments() {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    payment_method: '',
    transaction_id: '',
    notes: ''
  })

  // Pagination and filter state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('payment_date')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    setPayments(paymentsData.payments || [])
    setInvoices(invoicesData.invoices || [])
  }, [])

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment)
    setShowDetailsModal(true)
  }

  const handleMarkAsPaid = (payment) => {
    setSelectedPayment(payment)
    setPaymentForm({
      payment_method: 'Wire Transfer',
      transaction_id: '',
      notes: ''
    })
    setShowMarkPaidModal(true)
  }

  const confirmMarkAsPaid = () => {
    const updatedPayment = {
      ...selectedPayment,
      status: 'COMPLETED',
      payment_date: new Date().toISOString(),
      payment_method: paymentForm.payment_method,
      transaction_id: paymentForm.transaction_id || `TXN-${Date.now()}`,
      notes: paymentForm.notes
    }

    setPayments(payments.map(p =>
      p.payment_id === selectedPayment.payment_id ? updatedPayment : p
    ))

    setShowMarkPaidModal(false)
    alert(`Payment ${selectedPayment.payment_id} marked as completed`)
  }

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (statusFilter === 'completed') {
      matchesStatus = payment.status === 'COMPLETED'
    } else if (statusFilter === 'pending') {
      matchesStatus = payment.status === 'PENDING'
    }

    return matchesSearch && matchesStatus
  })

  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let compareA, compareB

    if (sortBy === 'payment_date') {
      compareA = a.payment_date ? new Date(a.payment_date) : new Date(0)
      compareB = b.payment_date ? new Date(b.payment_date) : new Date(0)
    } else if (sortBy === 'amount') {
      compareA = a.amount
      compareB = b.amount
    } else if (sortBy === 'payment_id') {
      compareA = a.payment_id
      compareB = b.payment_id
    } else if (sortBy === 'customer_name') {
      compareA = a.customer_name
      compareB = b.customer_name
    }

    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1
    } else {
      return compareA < compareB ? 1 : -1
    }
  })

  const paginatedPayments = sortedPayments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

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

  // Calculate summary statistics
  const completedPayments = payments.filter(p => p.status === 'COMPLETED')
  const pendingPayments = payments.filter(p => p.status === 'PENDING')
  const totalReceived = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Payment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage customer payments
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Total Payments Received">
            <Paper sx={{ p: 2, minWidth: 150 }} elevation={2}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Received
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ${totalReceived.toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          </Tooltip>
          <Tooltip title="Pending Payments">
            <Paper sx={{ p: 2, minWidth: 150 }} elevation={2}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  ${totalPending.toFixed(2)}
                </Typography>
              </Stack>
            </Paper>
          </Tooltip>
          <Tooltip title="Payment Count">
            <Paper sx={{ p: 2, minWidth: 120 }} elevation={2}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Completed
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {completedPayments.length}
                </Typography>
              </Stack>
            </Paper>
          </Tooltip>
        </Stack>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Payment ID, Invoice, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Payments</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedPayments.length} of {filteredPayments.length} payments
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Payments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'payment_id'}
                  direction={sortBy === 'payment_id' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('payment_id')}
                >
                  <strong>Payment ID</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'customer_name'}
                  direction={sortBy === 'customer_name' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('customer_name')}
                >
                  <strong>Customer</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'payment_date'}
                  direction={sortBy === 'payment_date' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('payment_date')}
                >
                  <strong>Payment Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'amount'}
                  direction={sortBy === 'amount' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('amount')}
                >
                  <strong>Amount</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Method</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">No payments found</Alert>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((payment) => (
                <TableRow key={payment.payment_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {payment.payment_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {payment.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {payment.customer_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {payment.customer_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {payment.payment_date ? (
                      <Typography variant="body2">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Not paid yet
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      ${payment.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {payment.payment_method ? (
                      <Chip label={payment.payment_method} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {payment.status === 'COMPLETED' ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Completed"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<Pending />}
                        label="Pending"
                        color="warning"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {payment.status === 'PENDING' && (
                        <Tooltip title="Mark as Paid">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<Payment />}
                            onClick={() => handleMarkAsPaid(payment)}
                          >
                            Mark Paid
                          </Button>
                        </Tooltip>
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
          count={filteredPayments.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Payment Details Dialog */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              Payment Details
            </Typography>
            {selectedPayment && (
              <Chip
                icon={<Receipt />}
                label={selectedPayment.payment_id}
                color="primary"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Stack spacing={3}>
              {/* Payment Information */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Payment ID</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedPayment.payment_id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Invoice Number</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedPayment.invoice_number}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body2" fontWeight="medium">{selectedPayment.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedPayment.customer_id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        icon={selectedPayment.status === 'COMPLETED' ? <CheckCircle /> : <Pending />}
                        label={selectedPayment.status}
                        color={selectedPayment.status === 'COMPLETED' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Summary */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                  Payment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                      <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        ${selectedPayment.amount.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  {selectedPayment.payment_date && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(selectedPayment.payment_date).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {selectedPayment.payment_method && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedPayment.payment_method}
                      </Typography>
                    </Grid>
                  )}
                  {selectedPayment.transaction_id && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                      <Typography variant="body2" fontWeight="medium" fontFamily="monospace">
                        {selectedPayment.transaction_id}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {selectedPayment.notes && (
                <Box>
                  <Divider />
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter', mt: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedPayment.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog
        open={showMarkPaidModal}
        onClose={() => setShowMarkPaidModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Mark Payment as Received
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Stack spacing={3}>
              <Alert severity="info">
                You are about to mark payment <strong>{selectedPayment.payment_id}</strong> for invoice <strong>{selectedPayment.invoice_number}</strong> as received.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Payment Amount: ${selectedPayment.amount.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customer: {selectedPayment.customer_name}
                </Typography>
              </Paper>

              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentForm.payment_method}
                  label="Payment Method"
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <MenuItem value="Wire Transfer">Wire Transfer</MenuItem>
                  <MenuItem value="Credit Card">Credit Card</MenuItem>
                  <MenuItem value="Check">Check</MenuItem>
                  <MenuItem value="ACH">ACH</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Transaction ID (Optional)"
                value={paymentForm.transaction_id}
                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                placeholder="Enter transaction reference number"
              />

              <TextField
                fullWidth
                size="small"
                label="Notes (Optional)"
                multiline
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Add any additional notes about this payment"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMarkPaidModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={confirmMarkAsPaid}
            disabled={!paymentForm.payment_method}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Payments
