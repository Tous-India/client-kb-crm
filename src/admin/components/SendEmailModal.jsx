/**
 * SendEmailModal Component
 * Modal for previewing and sending emails for documents (Quotations, PIs, Invoices, Dispatches)
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
  IconButton,
  Paper,
} from "@mui/material";
import {
  Send,
  Close,
  Email,
  Description,
  AttachFile,
  CheckCircle,
  Person,
  Subject,
} from "@mui/icons-material";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../../services/api/client";

// Document type configurations
const DOC_CONFIG = {
  quotation: {
    title: "Send Quotation",
    color: "#ed6c02",
    endpoint: (id) => `/quotations/${id}/send-email`,
    subjectPrefix: "Quotation",
    hasPdf: true,
    getSubject: (doc) => `Quotation ${doc?.quote_number || ""} from KB Enterprises`,
  },
  proforma: {
    title: "Send Proforma Invoice",
    color: "#9c27b0",
    endpoint: (id) => `/proforma-invoices/${id}/send-email`,
    subjectPrefix: "Proforma Invoice",
    hasPdf: true,
    getSubject: (doc) => `Proforma Invoice ${doc?.proforma_number || ""} - Payment Required`,
  },
  invoice: {
    title: "Send Invoice",
    color: "#1976d2",
    endpoint: (id) => `/invoices/${id}/send-email`,
    subjectPrefix: "Invoice",
    hasPdf: true,
    getSubject: (doc) => `Invoice ${doc?.invoice_number || ""} - KB Enterprises`,
  },
  dispatch: {
    title: "Send Dispatch Notification",
    color: "#4caf50",
    endpoint: (id) => `/dispatches/${id}/send-email`,
    subjectPrefix: "Dispatch",
    hasPdf: false,
    getSubject: (doc) => `Order Dispatched - ${doc?.dispatch_id || ""}`,
  },
};

const SendEmailModal = ({
  open,
  onClose,
  documentType, // "quotation" | "proforma" | "invoice" | "dispatch"
  document,
  onSuccess,
  buyerCurrentEmail, // Optional: Pass buyer's CURRENT email to override stored email
}) => {
  const config = DOC_CONFIG[documentType] || DOC_CONFIG.invoice;

  // Get default recipient email - prioritize current buyer email if provided
  const getDefaultEmail = () => {
    if (!document) return "";
    // If current buyer email is provided, use it (it reflects the latest email)
    if (buyerCurrentEmail) return buyerCurrentEmail;
    // Otherwise fall back to stored email in document
    return (
      document.customer_email ||
      document.buyer_email ||
      document.buyer?.email ||
      document.bill_to?.email ||
      ""
    );
  };

  // Get document number
  const getDocNumber = () => {
    if (!document) return "";
    return (
      document.quote_number ||
      document.proforma_number ||
      document.invoice_number ||
      document.dispatch_id ||
      ""
    );
  };

  // Get customer/buyer name
  const getRecipientName = () => {
    if (!document) return "";
    return (
      document.customer_name ||
      document.buyer_name ||
      document.buyer?.name ||
      ""
    );
  };

  const [recipientEmail, setRecipientEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens with new document
  useEffect(() => {
    if (open && document) {
      setRecipientEmail(getDefaultEmail());
      setCustomMessage("");
      setSuccess(false);
    }
  }, [open, document]);

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(config.endpoint(document._id), {
        recipientEmail,
        customMessage: customMessage.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(data);
        onClose();
        setSuccess(false);
      }, 1500);
    },
  });

  const handleSend = () => {
    if (!recipientEmail.trim()) return;
    sendEmailMutation.mutate();
  };

  const handleClose = () => {
    if (!sendEmailMutation.isPending) {
      setSuccess(false);
      onClose();
    }
  };

  const emailSubject = config.getSubject(document);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: config.color,
          color: "white",
          py: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Email />
          <Typography variant="h6" fontWeight="bold">
            {config.title}
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size="small" sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Success State */}
        {success && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h6" color="success.main" fontWeight="bold">
              Email Sent Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sent to {recipientEmail}
            </Typography>
          </Box>
        )}

        {/* Email Preview */}
        {!success && (
          <>
            {/* Error Alert */}
            {sendEmailMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {sendEmailMutation.error?.response?.data?.message ||
                  "Failed to send email. Please try again."}
              </Alert>
            )}

            {/* No Email Warning */}
            {!recipientEmail && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No email address found for this customer. Please add an email address below.
              </Alert>
            )}

            {/* Email Preview Card */}
            <Paper
              variant="outlined"
              sx={{
                p: 0,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {/* Document Header */}
              <Box
                sx={{
                  bgcolor: "grey.100",
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Description sx={{ color: config.color, fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {config.subjectPrefix} {getDocNumber()}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {getRecipientName() || "Customer"}
                      </Typography>
                    </Stack>
                  </Box>
                  {config.hasPdf && (
                    <Chip
                      icon={<AttachFile />}
                      label="PDF Attached"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>

              {/* Email Details */}
              <Box sx={{ p: 2 }}>
                {/* To Field */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                    To:
                  </Typography>
                  {recipientEmail ? (
                    <Chip
                      icon={<Email sx={{ fontSize: 16 }} />}
                      label={recipientEmail}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 500 }}
                    />
                  ) : (
                    <Typography variant="body2" color="error">
                      No email address available
                    </Typography>
                  )}
                </Stack>

                {/* Subject Field */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                    Subject:
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {emailSubject}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Custom Message */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Add a personal note (optional):
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here... This will appear at the top of the email."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "grey.50",
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* Email Preview Note */}
            <Alert severity="info" sx={{ mt: 2 }} icon={<Email />}>
              The email will include a professional template with document details
              {config.hasPdf && " and a PDF attachment"}.
            </Alert>
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions
          sx={{
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Button
            onClick={handleClose}
            disabled={sendEmailMutation.isPending}
            sx={{ borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!recipientEmail.trim() || sendEmailMutation.isPending}
            startIcon={
              sendEmailMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
            sx={{
              borderRadius: 1.5,
              bgcolor: config.color,
              "&:hover": {
                bgcolor: config.color,
                filter: "brightness(0.9)",
              },
            }}
          >
            {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SendEmailModal;
