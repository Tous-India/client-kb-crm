import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Typography,
  Stack,
  Box,
  Divider,
  Chip,
  Alert
} from '@mui/material'
import {
  Email,
  Send,
  Close,
  CheckCircle,
  Schedule
} from '@mui/icons-material'

/**
 * EmailPreviewModal - Shows a preview of the email to be sent
 * @param {boolean} open - Dialog open state
 * @param {Function} onClose - Close handler
 * @param {Function} onSend - Send handler
 * @param {Object} emailData - Email content data
 */
function EmailPreviewModal({ open, onClose, onSend, emailData }) {
  if (!emailData) return null

  const {
    type = 'PI_CREATED',
    recipient = {},
    subject = '',
    documentNumber = '',
    documentType = 'Performa Invoice',
    amount = 0,
    currency = 'USD',
    validUntil = null,
    items = [],
    companyName = 'KB Solutions Pvt Ltd'
  } = emailData

  const getEmailSubject = () => {
    switch (type) {
      case 'PI_CREATED':
        return `New Performa Invoice ${documentNumber} - ${companyName}`
      case 'QUOTE_CREATED':
        return `Quotation ${documentNumber} - ${companyName}`
      case 'INVOICE_CREATED':
        return `Invoice ${documentNumber} - ${companyName}`
      case 'PAYMENT_RECEIVED':
        return `Payment Confirmation - ${documentNumber}`
      case 'DISPATCH_NOTIFICATION':
        return `Dispatch Notification - ${documentNumber}`
      default:
        return subject || `Document ${documentNumber}`
    }
  }

  const getEmailBody = () => {
    switch (type) {
      case 'PI_CREATED':
        return (
          <>
            <Typography variant="body2" paragraph>
              Dear <strong>{recipient.name || 'Customer'}</strong>,
            </Typography>
            <Typography variant="body2" paragraph>
              Thank you for your interest in our products. We are pleased to send you the Performa Invoice for your order.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, my: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Performa Invoice Details:
              </Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">PI Number:</Typography>
                  <Typography variant="body2" fontWeight="bold">{documentNumber}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {currency} {amount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Items:</Typography>
                  <Typography variant="body2">{items.length} products</Typography>
                </Box>
                {validUntil && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Valid Until:</Typography>
                    <Typography variant="body2" color="warning.main">
                      {new Date(validUntil).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
            <Typography variant="body2" paragraph>
              Please review the attached Performa Invoice and proceed with payment to confirm your order.
            </Typography>
            <Typography variant="body2" paragraph>
              Payment details are included in the attached document.
            </Typography>
          </>
        )
      case 'PAYMENT_RECEIVED':
        return (
          <>
            <Typography variant="body2" paragraph>
              Dear <strong>{recipient.name || 'Customer'}</strong>,
            </Typography>
            <Typography variant="body2" paragraph>
              We have received your payment of <strong>{currency} {amount.toFixed(2)}</strong> for {documentType} <strong>{documentNumber}</strong>.
            </Typography>
            <Alert severity="success" sx={{ my: 2 }}>
              Your order is now being processed for dispatch.
            </Alert>
            <Typography variant="body2" paragraph>
              You will receive a dispatch notification with tracking details once your order is shipped.
            </Typography>
          </>
        )
      case 'DISPATCH_NOTIFICATION':
        return (
          <>
            <Typography variant="body2" paragraph>
              Dear <strong>{recipient.name || 'Customer'}</strong>,
            </Typography>
            <Typography variant="body2" paragraph>
              Great news! Your order has been dispatched.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, my: 2, bgcolor: 'success.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Dispatch Details:
              </Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Invoice Number:</Typography>
                  <Typography variant="body2" fontWeight="bold">{documentNumber}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Items Dispatched:</Typography>
                  <Typography variant="body2">{items.length} products</Typography>
                </Box>
              </Stack>
            </Paper>
            <Typography variant="body2" paragraph>
              Tracking details will be updated in your order status.
            </Typography>
          </>
        )
      default:
        return (
          <Typography variant="body2" paragraph>
            This is a notification regarding your document {documentNumber}.
          </Typography>
        )
    }
  }

  const handleSendEmail = () => {
    // Simulate email sending
    console.log('Email sent:', {
      type,
      to: recipient.email,
      subject: getEmailSubject(),
      sentAt: new Date().toISOString()
    })
    if (onSend) {
      onSend({
        type,
        recipient,
        subject: getEmailSubject(),
        sentAt: new Date().toISOString(),
        status: 'SENT'
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Email color="primary" />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Email Preview
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Review before sending to {recipient.email || 'customer'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Email Header */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 60 }}>To:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {recipient.name || 'Customer'} &lt;{recipient.email || 'customer@example.com'}&gt;
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 60 }}>From:</Typography>
              <Typography variant="body2">
                KB Solutions &lt;sales@kbsolutions.com&gt;
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 60 }}>Subject:</Typography>
              <Typography variant="body2" fontWeight="bold" color="primary.main">
                {getEmailSubject()}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Email Body */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          {getEmailBody()}

          <Divider sx={{ my: 2 }} />

          {/* Email Footer */}
          <Typography variant="body2" color="text.secondary">
            Best Regards,
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {companyName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Email: sales@kbsolutions.com | Phone: +91 22 1234 5678
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            This is an automated email. Please do not reply directly. For queries, contact sales@kbsolutions.com
          </Typography>
        </Paper>

        {/* Attachments */}
        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'info.50' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Attachments:
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={`${documentType} - ${documentNumber}.pdf`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Alert severity="info" sx={{ flex: 1, mr: 2, py: 0 }}>
          <Typography variant="caption">
            This is a simulated email preview. In production, this would be sent via SMTP.
          </Typography>
        </Alert>
        <Button onClick={onClose} startIcon={<Close />}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSendEmail}
          startIcon={<Send />}
          color="primary"
        >
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmailPreviewModal
