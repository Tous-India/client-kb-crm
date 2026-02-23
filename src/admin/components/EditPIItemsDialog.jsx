import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Typography,
  Stack,
  Box,
  Paper,
  Divider,
  Alert,
  Tooltip,
  Autocomplete
} from '@mui/material'
import {
  Add,
  Delete,
  Save,
  Cancel,
  Calculate,
  Edit,
  Send
} from '@mui/icons-material'
import productsData from '../../mock/products.json'

/**
 * EditPIItemsDialog - Allows editing items in an existing PI
 * @param {boolean} open - Dialog open state
 * @param {Function} onClose - Close handler
 * @param {Object} pi - The Performa Invoice object
 * @param {Function} onSave - Save handler receives updated PI
 * @param {number} exchangeRate - Exchange rate for INR conversion
 */
function EditPIItemsDialog({ open, onClose, pi, onSave, exchangeRate = 83.5 }) {
  const [items, setItems] = useState([])
  const [validUntil, setValidUntil] = useState('')
  const [errors, setErrors] = useState({})
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const products = productsData.products || []

  // Additional charges state (all in INR)
  const [igst18, setIgst18] = useState(0)
  const [igst28, setIgst28] = useState(0)
  const [bankCharges, setBankCharges] = useState(0)
  const [duty, setDuty] = useState(0)
  const [freight, setFreight] = useState(0)

  // Debit Note (deduction from total)
  const [debitNote, setDebitNote] = useState(0)
  const [debitNoteReason, setDebitNoteReason] = useState('')

  // Initialize items from PI
  useEffect(() => {
    if (pi && open) {
      setItems(pi.items.map(item => ({
        ...item,
        originalQuantity: item.quantity,
        originalPrice: item.unit_price
      })))
      // Set additional charges
      setIgst18(pi.igst_18 || 0)
      setIgst28(pi.igst_28 || 0)
      setBankCharges(pi.bank_charges || 0)
      setDuty(pi.duty || pi.custom_duty || 0)
      setFreight(pi.freight || pi.logistic_charges || 0)
      // Set debit note
      setDebitNote(pi.debit_note || 0)
      setDebitNoteReason(pi.debit_note_reason || '')
      // Set expiry date
      if (pi.valid_until) {
        setValidUntil(new Date(pi.valid_until).toISOString().split('T')[0])
      }
    }
  }, [pi, open])

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  // Subtotal in INR
  const calculateSubtotalINR = () => {
    return calculateSubtotal() * exchangeRate
  }

  // Total additional charges in USD
  const calculateAdditionalCharges = () => {
    return Number(igst18) + Number(igst28) + Number(bankCharges) + Number(duty) + Number(freight)
  }

  // Grand Total in USD (subtotal + charges - debit note)
  const calculateTotal = () => {
    return calculateSubtotal() + calculateAdditionalCharges() - Number(debitNote)
  }

  // Grand Total in INR (convert USD total to INR)
  const calculateGrandTotalINR = () => {
    return calculateTotal() * exchangeRate
  }

  // Handle item update
  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...items]
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index][field] = Number(value) || 0
      // Recalculate total_price
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    } else {
      updatedItems[index][field] = value
    }
    setItems(updatedItems)
  }

  // Handle item removal
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      alert('PI must have at least one item')
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  // Handle add product
  const handleAddProduct = () => {
    if (!selectedProduct) return

    const existingIndex = items.findIndex(item => item.product_id === selectedProduct.product_id)
    if (existingIndex >= 0) {
      // Increment quantity if product exists
      const updatedItems = [...items]
      updatedItems[existingIndex].quantity += 1
      updatedItems[existingIndex].total_price = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_price
      setItems(updatedItems)
    } else {
      // Add new product
      const newItem = {
        product_id: selectedProduct.product_id,
        part_number: selectedProduct.part_number,
        product_name: selectedProduct.product_name,
        quantity: 1,
        unit_price: selectedProduct.your_price || selectedProduct.list_price || 0,
        total_price: selectedProduct.your_price || selectedProduct.list_price || 0,
        originalQuantity: 0,
        originalPrice: selectedProduct.your_price || selectedProduct.list_price || 0,
        isNew: true
      }
      setItems([...items, newItem])
    }

    setSelectedProduct(null)
    setShowAddProduct(false)
  }

  // Validate before save
  const validateItems = () => {
    const newErrors = {}
    items.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors[`qty_${index}`] = 'Quantity must be > 0'
      }
      if (item.unit_price < 0) {
        newErrors[`price_${index}`] = 'Price cannot be negative'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle save
  const handleSave = () => {
    if (!validateItems()) {
      return
    }

    const updatedPI = {
      ...pi,
      items: items.map(item => ({
        product_id: item.product_id,
        part_number: item.part_number,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      })),
      subtotal: calculateSubtotal(),
      subtotal_inr: calculateSubtotalINR(),
      // Additional charges (INR)
      igst_18: Number(igst18) || 0,
      igst_28: Number(igst28) || 0,
      bank_charges: Number(bankCharges) || 0,
      duty: Number(duty) || 0,
      custom_duty: Number(duty) || 0,
      freight: Number(freight) || 0,
      logistic_charges: Number(freight) || 0,
      // Debit Note
      debit_note: Number(debitNote) || 0,
      debit_note_reason: debitNoteReason || '',
      // Totals
      total_amount: calculateTotal(),
      grand_total_inr: calculateGrandTotalINR(),
      exchange_rate: exchangeRate,
      valid_until: validUntil ? new Date(validUntil).toISOString() : pi.valid_until,
      // Track edit history
      last_edited: new Date().toISOString(),
      last_sent_date: new Date().toISOString(),
      edit_history: [
        ...(pi.edit_history || []),
        {
          edited_at: new Date().toISOString(),
          edited_by: 'admin',
          changes: 'Items updated and sent to buyer',
          previous_total: pi.total_amount,
          new_total: calculateTotal()
        }
      ]
    }

    onSave(updatedPI)
    onClose()
  }

  if (!pi) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Edit color="primary" />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Edit PI Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PI #{pi.performa_invoice_number} - {pi.customer_name}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setShowAddProduct(true)}
          >
            Add Item
          </Button>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Items Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Part Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '12%' }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', width: '15%' }}>Unit Price ($)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', width: '15%' }}>Total ($)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '6%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow
                  key={item.product_id}
                  hover
                  sx={{
                    bgcolor: item.isNew ? 'success.50' : (item.quantity !== item.originalQuantity || item.unit_price !== item.originalPrice) ? 'warning.50' : 'inherit'
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.product_name}
                    </Typography>
                    {item.isNew && (
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        NEW
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.part_number}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      error={!!errors[`qty_${index}`]}
                      helperText={errors[`qty_${index}`]}
                      sx={{ width: 80 }}
                    />
                    {item.originalQuantity > 0 && item.quantity !== item.originalQuantity && (
                      <Typography variant="caption" color="warning.main" display="block">
                        was: {item.originalQuantity}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateItem(index, 'unit_price', e.target.value)}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                      error={!!errors[`price_${index}`]}
                      sx={{ width: 100 }}
                    />
                    {item.unit_price !== item.originalPrice && (
                      <Typography variant="caption" color="warning.main" display="block">
                        was: ${item.originalPrice.toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹{((item.quantity * item.unit_price) * exchangeRate).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Remove item">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Additional Charges with USD/INR Display */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calculate color="primary" /> Additional Charges & Validity
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Enter amounts in USD ($). INR equivalent shown at rate: 1 USD = ₹{exchangeRate}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Box>
              <TextField
                size="small"
                label="IGST @ 18%"
                type="number"
                value={igst18}
                onChange={(e) => setIgst18(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                sx={{ width: 140 }}
              />
              {Number(igst18) > 0 && (
                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                  = ₹{(Number(igst18) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              )}
            </Box>
            <Box>
              <TextField
                size="small"
                label="IGST @ 28%"
                type="number"
                value={igst28}
                onChange={(e) => setIgst28(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                sx={{ width: 140 }}
              />
              {Number(igst28) > 0 && (
                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                  = ₹{(Number(igst28) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              )}
            </Box>
            <Box>
              <TextField
                size="small"
                label="Bank Charges"
                type="number"
                value={bankCharges}
                onChange={(e) => setBankCharges(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                sx={{ width: 140 }}
              />
              {Number(bankCharges) > 0 && (
                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                  = ₹{(Number(bankCharges) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              )}
            </Box>
            <Box>
              <TextField
                size="small"
                label="Duty"
                type="number"
                value={duty}
                onChange={(e) => setDuty(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                sx={{ width: 130 }}
              />
              {Number(duty) > 0 && (
                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                  = ₹{(Number(duty) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              )}
            </Box>
            <Box>
              <TextField
                size="small"
                label="Freight"
                type="number"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                sx={{ width: 130 }}
              />
              {Number(freight) > 0 && (
                <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                  = ₹{(Number(freight) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              )}
            </Box>
          </Stack>
          {/* Total Additional Charges Summary */}
          {calculateAdditionalCharges() > 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
              <Typography variant="body2" fontWeight="medium">
                Total Additional Charges: ${calculateAdditionalCharges().toFixed(2)}
                <Typography component="span" color="primary.main" sx={{ ml: 1 }}>
                  (₹{(calculateAdditionalCharges() * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                </Typography>
              </Typography>
            </Box>
          )}
          {/* Debit Note Section */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" fontWeight="bold" color="success.main" gutterBottom>
            DEBIT NOTE (Deduction from Total)
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }} alignItems="flex-start">
            <Box>
              <TextField
                size="small"
                label="Debit Note Amount"
                type="number"
                value={debitNote}
                onChange={(e) => setDebitNote(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                sx={{ width: 160 }}
                color="success"
              />
              {Number(debitNote) > 0 && (
                <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>
                  = ₹{(Number(debitNote) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (deduction)
                </Typography>
              )}
            </Box>
            <TextField
              size="small"
              label="Reason for Debit Note"
              value={debitNoteReason}
              onChange={(e) => setDebitNoteReason(e.target.value)}
              placeholder="e.g., Discount, Adjustment..."
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              size="small"
              label="Valid Until (Expiry Date)"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
              helperText={validUntil && new Date(validUntil) < new Date() ? 'Date is in the past' : ''}
              error={validUntil && new Date(validUntil) < new Date()}
            />
          </Stack>
        </Paper>

        {/* Summary */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Updated Summary
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal (USD):</Typography>
              <Typography variant="body2">${calculateSubtotal().toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal (INR) @ {exchangeRate}:</Typography>
              <Typography variant="body2">₹{calculateSubtotalINR().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            {Number(igst18) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">IGST @ 18%:</Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" color="error.main">${Number(igst18).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">(₹{(Number(igst18) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</Typography>
                </Stack>
              </Box>
            )}
            {Number(igst28) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">IGST @ 28%:</Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" color="error.main">${Number(igst28).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">(₹{(Number(igst28) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</Typography>
                </Stack>
              </Box>
            )}
            {Number(bankCharges) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">Bank Charges:</Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" color="error.main">${Number(bankCharges).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">(₹{(Number(bankCharges) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</Typography>
                </Stack>
              </Box>
            )}
            {Number(duty) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">Duty:</Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" color="error.main">${Number(duty).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">(₹{(Number(duty) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</Typography>
                </Stack>
              </Box>
            )}
            {Number(freight) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">Freight:</Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" color="error.main">${Number(freight).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">(₹{(Number(freight) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</Typography>
                </Stack>
              </Box>
            )}
            {Number(debitNote) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.main">
                  Debit Note {debitNoteReason ? `(${debitNoteReason})` : ''}:
                </Typography>
                <Stack alignItems="flex-end">
                  <Typography variant="body2" color="success.main">
                    - ${Number(debitNote).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">(-₹{(Number(debitNote) * exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</Typography>
                </Stack>
              </Box>
            )}
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight="bold">Grand Total:</Typography>
              <Stack alignItems="flex-end">
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  ${calculateTotal().toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (₹{calculateGrandTotalINR().toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                </Typography>
              </Stack>
            </Box>
            {pi.total_amount !== calculateTotal() && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Original Total: ${pi.total_amount.toFixed(2)} →
                  New Total: ${calculateTotal().toFixed(2)}
                  ({calculateTotal() > pi.total_amount ? '+' : ''}
                  ${(calculateTotal() - pi.total_amount).toFixed(2)})
                </Typography>
              </Alert>
            )}
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Cancel />}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<Send />}
          color="primary"
        >
          Save and Send
        </Button>
      </DialogActions>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onClose={() => setShowAddProduct(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product to PI</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={products}
            getOptionLabel={(option) => `${option.product_name} (${option.part_number})`}
            value={selectedProduct}
            onChange={(_, newValue) => setSelectedProduct(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Product"
                placeholder="Search by name or part number..."
                sx={{ mt: 1 }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" fontWeight="medium">{option.product_name}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {option.part_number}
                    </Typography>
                    <Typography variant="caption" color="primary" fontWeight="medium">
                      ${(option.your_price || option.list_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          />

          {selectedProduct && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">{selectedProduct.product_name}</Typography>
              <Typography variant="body2" color="text.secondary">Part #: {selectedProduct.part_number}</Typography>
              <Typography variant="body2" color="primary" fontWeight="medium" sx={{ mt: 1 }}>
                Price: ${(selectedProduct.your_price || selectedProduct.list_price || 0).toFixed(2)}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddProduct(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={!selectedProduct}
            startIcon={<Add />}
          >
            Add to PI
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default EditPIItemsDialog
