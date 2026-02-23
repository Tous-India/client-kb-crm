import { useRef } from 'react'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Tooltip,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Skeleton
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Search,
  LocalShipping,
  Visibility,
  Print,
  Email,
  FilterList,
  CheckCircle,
  PictureAsPdf,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useCurrency } from '../../context/CurrencyContext'
import useDispatchedOrdersStore from '../../stores/useDispatchedOrdersStore'
import { useDispatchedOrders, useUpdateDispatchInfo, useSendDispatchEmail } from '../../hooks/useDispatchedOrders'
import InvoicePrintPreview from '../components/InvoicePrintPreview'
import DispatchPrintPreview from '../components/DispatchPrintPreview'
import SendEmailModal from '../components/SendEmailModal'
import { toast } from 'react-toastify'
import { useState } from 'react'
import apiClient from '../../services/api/client'
import ENDPOINTS from '../../services/api/endpoints'

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-content, .print-content * {
      visibility: visible;
    }
    .print-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
`

function DispatchedOrders() {
  const { usdToInr } = useCurrency()

  // React Query - Fetch dispatched orders from API
  const { data: orders = [], isLoading, isError, error, refetch } = useDispatchedOrders()

  // Mutations
  const updateDispatchMutation = useUpdateDispatchInfo()
  const sendEmailMutation = useSendDispatchEmail()

  // Zustand store for UI state
  const {
    // Filter state
    searchTerm,
    filterStatus,
    setSearchTerm,
    setFilterStatus,
    // Pagination state
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,
    // Sort state
    sortBy,
    sortOrder,
    toggleSort,
    // Selected order
    selectedOrder,
    // Modal states
    isDetailModalOpen,
    isEmailModalOpen,
    isProductsModalOpen,
    isInvoicePreviewModalOpen,
    isDispatchPreviewModalOpen,
    isInvoiceCreationModalOpen,
    // Editing states
    isEditingDispatch,
    setIsEditingDispatch,
    // Forms
    dispatchForm,
    updateDispatchForm,
    setDispatchForm,
    resetDispatchForm,
    emailForm,
    updateEmailForm,
    setEmailForm,
    resetEmailForm,
    // Invoice items
    invoiceItems,
    setInvoiceItems,
    updateInvoiceItemQuantity,
    removeInvoiceItem,
    calculateInvoiceTotal,
    // Selected products
    selectedProducts,
    setSelectedProducts,
    // Modal actions
    openDetailModal,
    closeDetailModal,
    openEmailModal,
    closeEmailModal,
    openProductsModal,
    closeProductsModal,
    openInvoicePreviewModal,
    closeInvoicePreviewModal,
    openDispatchPreviewModal,
    closeDispatchPreviewModal,
    openInvoiceCreationModal,
    closeInvoiceCreationModal,
    // Computed
    shipmentStatusOptions,
    getFilteredOrders,
    getSortedOrders,
    getPaginatedOrders,
    getStats,
  } = useDispatchedOrdersStore()

  // Print preview refs
  const invoicePrintRef = useRef(null)
  const dispatchPrintRef = useRef(null)

  // New email modal state (for SendEmailModal component)
  const [showNewEmailModal, setShowNewEmailModal] = useState(false)
  const [emailDispatch, setEmailDispatch] = useState(null)
  const [buyerCurrentEmail, setBuyerCurrentEmail] = useState(null)

  const handleViewDetails = (order) => {
    openDetailModal(order)
  }

  const handleViewProducts = (items) => {
    openProductsModal(items)
  }

  // Professional print handler for dispatch preview
  const handlePrintDispatch = () => {
    const printContent = dispatchPrintRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Dispatch Note - ${selectedOrder?.order_id}</title>
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

  // Professional PDF handler for dispatch
  const handleDownloadDispatchPDF = () => {
    const printContent = dispatchPrintRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Dispatch Note - ${selectedOrder?.order_id}</title>
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

  // Professional print handler for invoice preview
  const handlePrintInvoice = () => {
    const printContent = invoicePrintRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${selectedOrder?.order_id}</title>
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

  // Professional PDF handler for invoice
  const handleDownloadInvoicePDF = () => {
    const printContent = invoicePrintRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${selectedOrder?.order_id}</title>
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

  // View dispatch preview
  const handleViewDispatchPreview = (order) => {
    openDispatchPreviewModal(order)
  }

  const handleEmail = async (order) => {
    // Use the new SendEmailModal with backend template
    setEmailDispatch(order)
    setBuyerCurrentEmail(null)

    // Fetch buyer's current email
    try {
      const buyerId = order.buyer?._id || order.buyer || order.customer_id
      if (buyerId) {
        const response = await apiClient.get(ENDPOINTS.USERS.GET(buyerId))
        if (response.data?.data?.email) {
          setBuyerCurrentEmail(response.data.data.email)
        }
      }
    } catch (err) {
      console.warn('[DispatchedOrders] Could not fetch buyer current email:', err.message)
    }

    setShowNewEmailModal(true)
  }

  const sendEmail = async () => {
    try {
      await sendEmailMutation.mutateAsync({
        orderId: selectedOrder?._id || selectedOrder?.id,
        emailData: emailForm
      })
      closeEmailModal()
      resetEmailForm()
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Save dispatch information and auto-send email when tracking is added
  const handleSaveDispatchInfo = async () => {
    if (!selectedOrder) return

    // Check if tracking number was newly added or updated
    const previousTracking = selectedOrder.dispatch_info?.tracking_number || selectedOrder.tracking_number || ''
    const newTracking = dispatchForm.tracking_number.trim()
    const trackingWasAdded = !previousTracking && newTracking
    const trackingWasUpdated = previousTracking && newTracking && previousTracking !== newTracking

    // Auto-set status to 'In Transit' when tracking is added (if status is still Pending)
    let finalStatus = dispatchForm.shipment_status
    if (trackingWasAdded && dispatchForm.shipment_status === 'Pending') {
      finalStatus = 'In Transit'
    }

    // Update the order with new dispatch info via API
    try {
      await updateDispatchMutation.mutateAsync({
        orderId: selectedOrder._id || selectedOrder.id,
        dispatchData: {
          dispatch_date: dispatchForm.dispatch_date,
          courier_service: dispatchForm.courier_service,
          tracking_number: dispatchForm.tracking_number,
          dispatch_notes: dispatchForm.dispatch_notes,
          shipment_status: finalStatus
        }
      })

      // Update local form state with the auto-set status
      if (finalStatus !== dispatchForm.shipment_status) {
        updateDispatchForm('shipment_status', finalStatus)
      }

      setIsEditingDispatch(false)

      // Auto-send email notification when tracking number is added or updated
      if (trackingWasAdded || trackingWasUpdated) {
        const itemsList = (selectedOrder.items || []).map(item =>
          `- ${item.product_name} (${item.part_number}) - Qty: ${item.quantity}`
        ).join('\n')

        const emailData = {
          to: selectedOrder.buyer_email || `${selectedOrder.customer_id}@example.com`,
          subject: trackingWasAdded
            ? `Shipping Update - Your Order ${selectedOrder.order_id} Has Been Shipped!`
            : `Tracking Update - Order ${selectedOrder.order_id}`,
          message: `Dear ${selectedOrder.buyer_name || 'Customer'},

${trackingWasAdded ? 'Great news! Your order has been shipped.' : 'Your order tracking information has been updated.'}

Order Details:
Order ID: ${selectedOrder.order_id}
Dispatch Date: ${dispatchForm.dispatch_date ? new Date(dispatchForm.dispatch_date).toLocaleDateString() : new Date().toLocaleDateString()}
Courier Service: ${dispatchForm.courier_service || 'Not specified'}
Tracking Number: ${dispatchForm.tracking_number}

Dispatched Items:
${itemsList}

Order Total: $${(selectedOrder.total_amount || 0).toFixed(2)} / ₹${((selectedOrder.total_amount || 0) * usdToInr).toFixed(2)}

Shipping Address:
${selectedOrder.shipping_address?.street || ''}
${selectedOrder.shipping_address?.city || ''}, ${selectedOrder.shipping_address?.state || ''} ${selectedOrder.shipping_address?.zip || ''}
${selectedOrder.shipping_address?.country || ''}

You can track your shipment using the tracking number provided above.

Thank you for your order!

Best regards,
Customer Service Team`
        }

        // Auto-send email
        sendEmailMutation.mutate({
          orderId: selectedOrder._id || selectedOrder.id,
          emailData
        })
      }
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Cancel editing dispatch info
  const handleCancelEditDispatch = () => {
    // Reset form to original values by re-opening the detail modal
    if (selectedOrder) {
      openDetailModal(selectedOrder)
    }
    setIsEditingDispatch(false)
  }

  // Invoice preview handler - Show invoice in modal
  const handleViewInvoice = (order) => {
    openInvoicePreviewModal(order)
  }

  // Invoice creation handlers
  const handleCreateInvoice = (order) => {
    openInvoiceCreationModal(order)
  }

  const handleQuantityChange = (index, newQuantity) => {
    updateInvoiceItemQuantity(index, newQuantity)
  }

  const handleRemoveItem = (index) => {
    removeInvoiceItem(index)
  }

  const handleGenerateInvoice = () => {
    if (invoiceItems.length === 0) {
      alert('Please add at least one item to the invoice')
      return
    }

    if (invoiceItems.every(item => item.dispatch_quantity === 0)) {
      alert('Please set dispatch quantities greater than 0')
      return
    }

    // Create invoice data
    const invoiceTotal = calculateInvoiceTotal()
    const invoiceData = {
      order_id: selectedOrder.order_id,
      customer_id: selectedOrder.customer_id,
      items: invoiceItems.filter(item => item.dispatch_quantity > 0),
      total_amount: invoiceTotal,
      invoice_date: new Date().toISOString(),
      status: 'GENERATED'
    }

    console.log('Invoice Generated:', invoiceData)
    alert(`Invoice created successfully for ${invoiceData.items.length} item(s)!\nTotal: $${invoiceTotal.toFixed(2)} / ₹${(invoiceTotal * usdToInr).toFixed(2)}`)

    closeInvoiceCreationModal()
  }

  // Use store's computed functions for filtering, sorting, and pagination
  const filteredOrders = getFilteredOrders(orders)
  const sortedOrders = getSortedOrders(orders)
  const paginatedOrders = getPaginatedOrders(orders)

  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
  }

  const handleSortChange = (column) => {
    toggleSort(column)
  }

  // Calculate statistics using store's computed function
  const stats = getStats(orders)
  const { totalOrders, totalRevenue, ordersWithTracking, ordersWithoutTracking, statusCounts } = stats

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className='px-0!'>
        <Box sx={{ mb: 4 }}>
          <h1 className='text-2xl font-bold text-[#0b0c1a] mb-2'>
            Dispatched Orders Management
          </h1>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Track and manage dispatched orders and shipments
          </Typography>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Skeleton variant="rectangular" height={40} />
        </Paper>
        <Paper>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ))}
        </Paper>
      </Container>
    )
  }

  // Error state
  if (isError) {
    return (
      <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className='px-0!'>
        <Box sx={{ mb: 4 }}>
          <h1 className='text-2xl font-bold text-[#0b0c1a] mb-2'>
            Dispatched Orders Management
          </h1>
        </Box>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error?.message || 'Failed to load dispatched orders'}
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className='px-0!'>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <h1 className='text-2xl font-bold text-[#0b0c1a] mb-2'>
              Dispatched Orders Management
            </h1>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Track and manage dispatched orders and shipments
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            size="small"
          >
            Refresh
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.50' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Total Dispatched
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  ${totalRevenue.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{(totalRevenue * usdToInr).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  With Tracking
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {ordersWithTracking}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'warning.50' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Missing Tracking
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  {ordersWithoutTracking}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Order ID, Customer, PI Number, or Tracking Number..."
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedOrders.length} of {filteredOrders.length} dispatched orders
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Dispatched Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'order_id'}
                  direction={sortBy === 'order_id' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('order_id')}
                >
                  <strong>Order #</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'order_date'}
                  direction={sortBy === 'order_date' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('order_date')}
                >
                  <strong>Dispatch Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Tracking Number</strong></TableCell>
              <TableCell><strong>Shipment Status</strong></TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'total_amount'}
                  direction={sortBy === 'total_amount' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('total_amount')}
                >
                  <strong>Total Amount</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No dispatched orders found matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const isPastDelivery = new Date(order.estimated_delivery) < new Date()

                return (
                  <TableRow
                    key={order.order_id}
                    hover
                    sx={{
                      bgcolor: order.tracking_number ? 'inherit' : 'warning.50',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.order_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customer_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.order_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.tracking_number ? (
                        <Chip
                          icon={<LocalShipping />}
                          label={order.tracking_number}
                          color="success"
                          size="small"
                          variant="outlined"
                          className='px-2!'
                        />
                      ) : (
                        <Chip
                          label="NO TRACKING"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const hasTracking = order.dispatch_info?.tracking_number || order.tracking_number
                        const status = order.dispatch_info?.shipment_status || order.shipment_status || (hasTracking ? 'In Transit' : 'Pending')
                        const statusConfig = shipmentStatusOptions.find(s => s.value === status) || shipmentStatusOptions[0]
                        return (
                          <Chip
                            label={status}
                            color={statusConfig.color}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        )
                      })()}
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="bold">
                          ${order.total_amount.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{(order.total_amount * usdToInr).toFixed(2)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Invoice">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleViewInvoice(order)}
                            sx={{
                              fontSize: '12px',
                              px: 1.5,
                              py: 0.5,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Invoice
                          </Button>
                        </Tooltip>
                        <Tooltip title="Print Dispatch Note">
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => handleViewDispatchPreview(order)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            <Print fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(order)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            <Visibility fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredOrders.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Order Detail Dialog */}
      <Dialog
        open={isDetailModalOpen}
        onClose={closeDetailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="no-print">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Dispatched Order Details
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Print">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrintDispatch}
                >
                  Print
                </Button>
              </Tooltip>
              <Tooltip title="Download PDF">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<PictureAsPdf />}
                  onClick={handleDownloadDispatchPDF}
                >
                  PDF
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <>
              {/* Hidden Print Preview for Print/PDF functionality */}
              <Box sx={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <DispatchPrintPreview
                  ref={dispatchPrintRef}
                  dispatch={selectedOrder}
                  globalRate={usdToInr}
                />
              </Box>

              <Stack spacing={3} className="print-content">
                {/* Order Header */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Order #{selectedOrder.order_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer: {selectedOrder.customer_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {selectedOrder.status}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Dispatch Date:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedOrder.order_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Est. Delivery:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedOrder.estimated_delivery).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Payment:
                        </Typography>
                        <Chip
                          label={selectedOrder.payment_status}
                          color={selectedOrder.payment_status === 'PAID' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* Dispatch Information - Editable */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'warning.dark' }}>
                    Dispatch Information
                  </Typography>
                  {!isEditingDispatch ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditingDispatch(true)}
                      sx={{ fontSize: '12px', textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={updateDispatchMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveDispatchInfo}
                        disabled={updateDispatchMutation.isPending}
                        sx={{ fontSize: '12px', textTransform: 'none' }}
                      >
                        {updateDispatchMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEditDispatch}
                        disabled={updateDispatchMutation.isPending}
                        sx={{ fontSize: '12px', textTransform: 'none' }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  )}
                </Stack>

                {isEditingDispatch ? (
                  // Edit Mode - Show form fields
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <TextField
                        label="Dispatch Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={dispatchForm.dispatch_date}
                        onChange={(e) => updateDispatchForm('dispatch_date', e.target.value)}
                        slotProps={{
                          inputLabel: { shrink: true }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <TextField
                        label="Courier Service"
                        fullWidth
                        size="small"
                        value={dispatchForm.courier_service}
                        onChange={(e) => updateDispatchForm('courier_service', e.target.value)}
                        placeholder="e.g., FedEx, DHL, UPS"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <TextField
                        label="Tracking Number"
                        fullWidth
                        size="small"
                        value={dispatchForm.tracking_number}
                        onChange={(e) => updateDispatchForm('tracking_number', e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Shipment Status</InputLabel>
                        <Select
                          value={dispatchForm.shipment_status}
                          label="Shipment Status"
                          onChange={(e) => updateDispatchForm('shipment_status', e.target.value)}
                        >
                          {shipmentStatusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={option.label}
                                  color={option.color}
                                  size="small"
                                  sx={{ fontSize: '11px', height: '20px' }}
                                />
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <TextField
                        label="Dispatch Notes"
                        fullWidth
                        size="small"
                        value={dispatchForm.dispatch_notes}
                        onChange={(e) => updateDispatchForm('dispatch_notes', e.target.value)}
                        placeholder="Optional notes"
                      />
                    </Grid>
                  </Grid>
                ) : (
                  // View Mode - Show dispatch info
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Dispatch Date
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px' }}>
                          {dispatchForm.dispatch_date ? new Date(dispatchForm.dispatch_date).toLocaleDateString() : '-'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Courier Service
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px' }}>
                          {dispatchForm.courier_service || <span style={{ color: '#f57c00' }}>Not set</span>}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Tracking Number
                        </Typography>
                        {dispatchForm.tracking_number ? (
                          <Chip
                            icon={<LocalShipping sx={{ fontSize: 14 }} />}
                            label={dispatchForm.tracking_number}
                            color="success"
                            size="small"
                            sx={{ fontSize: '12px', mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '14px', color: '#f57c00', fontWeight: 500 }}>
                            Not set
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Shipment Status
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {(() => {
                            const statusConfig = shipmentStatusOptions.find(s => s.value === dispatchForm.shipment_status) || shipmentStatusOptions[0]
                            return (
                              <Chip
                                label={dispatchForm.shipment_status}
                                color={statusConfig.color}
                                size="small"
                                sx={{ fontSize: '12px', fontWeight: 500 }}
                              />
                            )
                          })()}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Notes
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                          {dispatchForm.dispatch_notes || '-'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}

                {/* Warning if missing info */}
                {(!dispatchForm.courier_service || !dispatchForm.tracking_number) && !isEditingDispatch && (
                  <Alert severity="warning" sx={{ mt: 2, fontSize: '12px' }}>
                    Dispatch information is incomplete. Click "Edit" to add courier service and tracking number.
                  </Alert>
                )}
              </Paper>

              {/* Order Items */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Order Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Part Number</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            <Stack spacing={0}>
                              <Typography variant="body2">${item.unit_price.toFixed(2)}</Typography>
                              <Typography variant="caption" color="text.secondary">₹{(item.unit_price * usdToInr).toFixed(2)}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" fontWeight="bold">
                            <Stack spacing={0}>
                              <Typography variant="body2" fontWeight="bold">${item.total_price.toFixed(2)}</Typography>
                              <Typography variant="caption" color="text.secondary">₹{(item.total_price * usdToInr).toFixed(2)}</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Order Summary */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Order Summary
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2">${selectedOrder.subtotal.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{(selectedOrder.subtotal * usdToInr).toFixed(2)}</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tax:</Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2">${selectedOrder.tax.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{(selectedOrder.tax * usdToInr).toFixed(2)}</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Shipping:</Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2">${selectedOrder.shipping.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{(selectedOrder.shipping * usdToInr).toFixed(2)}</Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount:
                    </Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ${selectedOrder.total_amount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{(selectedOrder.total_amount * usdToInr).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Shipping Address */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Shipping Address
                </Typography>
                <Typography variant="body2">
                  {selectedOrder.shipping_address.street}
                </Typography>
                <Typography variant="body2">
                  {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                </Typography>
                <Typography variant="body2">
                  {selectedOrder.shipping_address.country}
                </Typography>
              </Paper>

              {/* Notes */}
              {selectedOrder.notes && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{selectedOrder.notes}</Typography>
                </Paper>
              )}
            </Stack>
          </>
          )}
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={closeDetailModal}>
            Close
          </Button>
          <Tooltip
            title={!dispatchForm.tracking_number || dispatchForm.tracking_number.trim() === '' ? "Please add tracking number before sending email" : "Send dispatch details to customer"}
          >
            <span>
              <Button
                variant="contained"
                color="success"
                startIcon={<Email />}
                onClick={() => handleEmail(selectedOrder)}
                disabled={!dispatchForm.tracking_number || dispatchForm.tracking_number.trim() === '' || updateDispatchMutation.isPending}
              >
                {updateDispatchMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Email Dispatch Details'}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Email Modal */}
      <Dialog
        open={isEmailModalOpen}
        onClose={closeEmailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Send Dispatch Details via Email
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Stack spacing={2}>
              <Alert severity="info">
                Sending dispatch details for Order #{selectedOrder.order_id}
              </Alert>

              <TextField
                fullWidth
                label="To"
                value={emailForm.to}
                onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                helperText="Customer email address"
              />

              <TextField
                fullWidth
                label="Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />

              <TextField
                fullWidth
                label="Message"
                multiline
                rows={12}
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                helperText="Email body with dispatch details"
              />

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Email Preview:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                  {emailForm.message}
                </Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEmailModal}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={sendEmailMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Email />}
            onClick={sendEmail}
            disabled={!emailForm.to || !emailForm.subject || !emailForm.message || sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Details Modal */}
      <Dialog
        open={isProductsModalOpen}
        onClose={closeProductsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Product Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Product Name</strong></TableCell>
                  <TableCell><strong>Part Number</strong></TableCell>
                  <TableCell align="right"><strong>Quantity</strong></TableCell>
                  <TableCell align="right"><strong>Unit Price</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedProducts.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.product_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.part_number}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`Qty: ${item.quantity}`}
                        size="small"
                        color="info"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="medium">
                          ${item.unit_price.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{(item.unit_price * usdToInr).toFixed(2)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          ${item.total_price.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{(item.total_price * usdToInr).toFixed(2)}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total Items:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {selectedProducts.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total Quantity:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Value:
                </Typography>
                <Stack spacing={0} alignItems="flex-end">
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${selectedProducts.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₹{(selectedProducts.reduce((sum, item) => sum + item.total_price, 0) * usdToInr).toFixed(2)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProductsModal}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Preview Dialog - Professional A4 Preview */}
      <Dialog
        open={isInvoicePreviewModalOpen}
        onClose={closeInvoicePreviewModal}
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
                Invoice Preview
              </Typography>
              {selectedOrder && (
                <Chip
                  label={selectedOrder.order_id}
                  color="primary"
                  size="small"
                  sx={{ fontSize: '12px', fontWeight: 600 }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Print Invoice">
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Print />}
                  onClick={handlePrintInvoice}
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
                  onClick={handleDownloadInvoicePDF}
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
          {selectedOrder && (
            <InvoicePrintPreview
              ref={invoicePrintRef}
              invoice={{
                ...selectedOrder,
                invoice_number: selectedOrder.order_id,
                invoice_date: selectedOrder.order_date,
                customer_name: selectedOrder.customer_id,
                billing_address: selectedOrder.shipping_address
              }}
              globalRate={usdToInr}
            />
          )}
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={closeInvoicePreviewModal} sx={{ fontSize: '13px' }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Email />}
            onClick={() => {
              closeInvoicePreviewModal()
              handleEmail(selectedOrder)
            }}
            sx={{ fontSize: '13px' }}
          >
            Email Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Creation Dialog */}
      <Dialog
        open={isInvoiceCreationModalOpen}
        onClose={closeInvoiceCreationModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReceiptIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px' }}>
                Create Invoice
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                Order: {selectedOrder?.order_id} | Customer: {selectedOrder?.customer_id}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Info Alert */}
            <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" sx={{ fontSize: '13px' }}>
                <strong>Instructions:</strong> Edit the dispatch quantities for items you want to include in this invoice.
                Items with remaining quantities will stay in Open Orders for future invoicing.
              </Typography>
            </Paper>

            {/* Invoice Items Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>Product</TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 'bold' }}>Part Number</TableCell>
                    <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Available Qty</TableCell>
                    <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Dispatch Qty</TableCell>
                    <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Line Total</TableCell>
                    <TableCell align="center" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceItems.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontSize: '13px' }}>{item.product_name}</TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>{item.part_number}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.original_quantity}
                          size="small"
                          color="default"
                          sx={{ fontSize: '12px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.dispatch_quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                          inputProps={{
                            min: 0,
                            max: item.original_quantity,
                            style: { textAlign: 'right', fontSize: '13px' }
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>
                            ${item.unit_price.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                            ₹{(item.unit_price * usdToInr).toFixed(2)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                            ${(item.unit_price * item.dispatch_quantity).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                            ₹{(item.unit_price * item.dispatch_quantity * usdToInr).toFixed(2)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Remove Item">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '16px', mb: 1 }}>
                  Invoice Summary
                </Typography>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>Total Items:</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                    {invoiceItems.filter(item => item.dispatch_quantity > 0).length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>Total Quantity:</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                    {invoiceItems.reduce((sum, item) => sum + item.dispatch_quantity, 0)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '15px' }}>
                    Invoice Total:
                  </Typography>
                  <Stack spacing={0} alignItems="flex-end">
                    <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: '18px' }}>
                      ₹{(calculateInvoiceTotal() * usdToInr).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                      ${calculateInvoiceTotal().toFixed(2)} USD
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeInvoiceCreationModal} sx={{ fontSize: '13px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            onClick={handleGenerateInvoice}
            disabled={invoiceItems.length === 0 || calculateInvoiceTotal() === 0}
            sx={{ fontSize: '13px' }}
          >
            Generate Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispatch Preview Dialog - Professional A4 Preview */}
      <Dialog
        open={isDispatchPreviewModalOpen}
        onClose={closeDispatchPreviewModal}
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
                Dispatch Note Preview
              </Typography>
              {selectedOrder && (
                <Chip
                  label={selectedOrder.order_id}
                  color="success"
                  size="small"
                  sx={{ fontSize: '12px', fontWeight: 600 }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Print Dispatch Note">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<Print />}
                  onClick={handlePrintDispatch}
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
                  onClick={handleDownloadDispatchPDF}
                  sx={{ fontSize: '12px' }}
                >
                  PDF
                </Button>
              </Tooltip>
              <IconButton
                size="small"
                onClick={closeDispatchPreviewModal}
              >
                <CancelIcon />
              </IconButton>
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
          {selectedOrder && (
            <DispatchPrintPreview
              ref={dispatchPrintRef}
              dispatch={selectedOrder}
              globalRate={usdToInr}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={closeDispatchPreviewModal} sx={{ fontSize: '13px' }}>
            Close
          </Button>
          <Tooltip
            title={
              (!selectedOrder?.tracking_number || selectedOrder?.tracking_number.trim() === '') &&
              (!selectedOrder?.dispatch_info?.tracking_number || selectedOrder?.dispatch_info?.tracking_number.trim() === '')
                ? "Please add tracking number before sending email"
                : "Send dispatch details to customer"
            }
          >
            <span>
              <Button
                variant="contained"
                color="success"
                startIcon={<Email />}
                onClick={() => {
                  closeDispatchPreviewModal()
                  handleEmail(selectedOrder)
                }}
                disabled={
                  (!selectedOrder?.tracking_number || selectedOrder?.tracking_number.trim() === '') &&
                  (!selectedOrder?.dispatch_info?.tracking_number || selectedOrder?.dispatch_info?.tracking_number.trim() === '')
                }
                sx={{ fontSize: '13px' }}
              >
                Email Dispatch Details
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* New Send Email Modal (using backend template) */}
      <SendEmailModal
        open={showNewEmailModal}
        onClose={() => {
          setShowNewEmailModal(false)
          setEmailDispatch(null)
          setBuyerCurrentEmail(null)
        }}
        documentType="dispatch"
        document={emailDispatch}
        buyerCurrentEmail={buyerCurrentEmail}
        onSuccess={() => {
          refetch()
          toast.success('Dispatch email sent successfully!')
        }}
      />
    </Container>
    </>
  )
}

export default DispatchedOrders
