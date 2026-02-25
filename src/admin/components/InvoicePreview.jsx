import { Box, Typography, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Chip, Alert } from '@mui/material'

/**
 * InvoicePreview - Renders invoice differently based on invoice_type
 * @param {Object} order - The invoice/order data
 * @param {number} usdToInr - Exchange rate
 * @param {Object} companyInfo - Company information
 * @param {string} invoiceType - 'TAX_INVOICE' | 'REIMBURSEMENT' | 'BILL_OF_SUPPLY'
 */
const InvoicePreview = ({
  order,
  usdToInr,
  companyInfo = {
    name: 'KB Solutions Pvt Ltd',
    address: '123 Industrial Park, Sector 5',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400001',
    country: 'India',
    email: 'sales@kbsolutions.com',
    phone: '+91 22 1234 5678',
    gst_number: '27AABCK1234L1ZD',
    pan_number: 'AABCK1234L'
  },
  invoiceType: propInvoiceType
}) => {
  // Determine invoice type from prop or order data
  const invoiceType = propInvoiceType || order.invoice_type || 'TAX_INVOICE'

  // Effective exchange rate - use document's rate if available
  const effectiveRate = order.exchange_rate || usdToInr

  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.total_price, 0)
  const discount = order.discount || 0

  // Tax calculation based on invoice type
  // TAX_INVOICE: Apply GST/tax
  // REIMBURSEMENT & BILL_OF_SUPPLY: No tax
  const hasTax = invoiceType === 'TAX_INVOICE'
  const taxRate = hasTax ? (order.tax_rate || 18) : 0
  const tds = hasTax ? (order.tds || order.tax || (subtotal * taxRate / 100)) : 0

  const total = subtotal - discount + (hasTax ? tds : 0)
  const paymentMade = order.payment_received || order.amount_paid || 0
  const balanceDue = total - paymentMade

  // Invoice type configuration
  const invoiceTypeConfig = {
    TAX_INVOICE: {
      title: 'TAX INVOICE',
      color: 'success.main',
      bgcolor: 'success.50',
      description: 'Invoice with applicable GST/Tax',
      showTax: true,
      showGST: true
    },
    REIMBURSEMENT: {
      title: 'REIMBURSEMENT INVOICE',
      color: 'warning.main',
      bgcolor: 'warning.50',
      description: 'For expense reimbursement - No tax applicable',
      showTax: false,
      showGST: false
    },
    BILL_OF_SUPPLY: {
      title: 'BILL OF SUPPLY',
      color: 'info.main',
      bgcolor: 'info.50',
      description: 'For exempt/nil-rated supplies - No tax applicable',
      showTax: false,
      showGST: false
    }
  }

  const config = invoiceTypeConfig[invoiceType] || invoiceTypeConfig.TAX_INVOICE

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'white' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '18px', mb: 0.5 }}>
              {companyInfo.name}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4 }}>
              {companyInfo.address}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4 }}>
              {companyInfo.city}, {companyInfo.state} {companyInfo.zip}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4 }}>
              {companyInfo.country}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4 }}>
              {companyInfo.email} | {companyInfo.phone}
            </Typography>
            {config.showGST && companyInfo.gst_number && (
              <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4, mt: 0.5 }}>
                <strong>GSTIN:</strong> {companyInfo.gst_number}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '22px', color: config.color }}>
              {order.invoice_title || config.title}
            </Typography>
            {invoiceType !== 'TAX_INVOICE' && (
              <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {config.description}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Invoice Info */}
      <Grid container spacing={4} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
              <strong>#</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px' }}>
              : {order.order_id || order.invoice_number}
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
              <strong>Invoice Date</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px' }}>
              : {new Date(order.invoice_date || order.order_date).toLocaleDateString('en-GB')}
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
              <strong>Terms</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px' }}>
              : Due on Receipt
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
              <strong>Due Date</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px' }}>
              : {new Date(order.due_date || order.order_date).toLocaleDateString('en-GB')}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6 }}></Grid>
      </Grid>

      {/* Bill To */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px', mb: 1 }}>
          Bill To
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '13px', color: 'primary.main', fontWeight: 'medium' }}>
          {order.customer_id}
        </Typography>
      </Box>

      {/* Subject */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
          Subject :
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '13px' }}>
          {order.notes || 'Order Processing'}
        </Typography>
      </Box>

      {/* Items Table */}
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontSize: '13px', fontWeight: 'bold', width: '5%' }}>#</TableCell>
              <TableCell sx={{ fontSize: '13px', fontWeight: 'bold', width: '50%' }}>Item & Description</TableCell>
              <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 'bold', width: '15%' }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 'bold', width: '15%' }}>Rate</TableCell>
              <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 'bold', width: '15%' }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ fontSize: '13px' }}>{idx + 1}</TableCell>
                <TableCell sx={{ fontSize: '13px' }}>
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 'medium' }}>
                    {item.product_name}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                    {item.part_number}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '13px' }}>
                  {item.quantity.toFixed(2)}
                  <Typography variant="caption" sx={{ fontSize: '11px', display: 'block', color: 'text.secondary' }}>
                    box
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '13px' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      ${item.unit_price.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                      ₹{(item.unit_price * effectiveRate).toFixed(2)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '13px' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      ${item.total_price.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                      ₹{(item.total_price * effectiveRate).toFixed(2)}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Section */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 6 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px', mb: 1 }}>
              Total In Words
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px', fontStyle: 'italic', color: 'text.secondary', mb: 2 }}>
              Indian Rupee {total.toFixed(2).replace('.', ' and ')} Paise Only
            </Typography>

            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px', mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
              Looking forward for your business.
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Box sx={{ border: '1px solid #e0e0e0', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '13px' }}>Sub Total</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  ${subtotal.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                  ₹{(subtotal * effectiveRate).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  Discount{order.discount_type === 'percentage' ? ` (${order.discount_value || 10}%)` : ''}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'error.main' }}>
                    (-) ${discount.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                    ₹{(discount * effectiveRate).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Tax section - Only show for TAX_INVOICE */}
            {config.showTax && tds > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  GST/Tax ({taxRate}%)
                  {order.tax_breakdown && (
                    <Typography variant="caption" sx={{ fontSize: '10px', display: 'block', color: 'text.secondary' }}>
                      CGST: {order.tax_breakdown.cgst || taxRate/2}% + SGST: {order.tax_breakdown.sgst || taxRate/2}%
                    </Typography>
                  )}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                    ${tds.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                    ₹{(tds * effectiveRate).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* No Tax Notice for non-tax invoices */}
            {!config.showTax && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, py: 0.5, px: 1, bgcolor: config.bgcolor, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '12px', fontStyle: 'italic', color: 'text.secondary' }}>
                  {invoiceType === 'REIMBURSEMENT' ? 'No tax applicable (Reimbursement)' : 'No tax applicable (Exempt Supply)'}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '12px' }}>$0.00</Typography>
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px' }}>Total</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px' }}>
                  ${total.toFixed(2)}
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px', color: 'primary.main' }}>
                  ₹{(total * effectiveRate).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Authorized Signature */}
      <Box sx={{ mt: 6, textAlign: 'right' }}>
        <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>
          Authorized Signature
        </Typography>
      </Box>
    </Paper>
  )
}

export default InvoicePreview
