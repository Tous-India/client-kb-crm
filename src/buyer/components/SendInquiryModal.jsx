import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { Email, Send, Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import { quotationsService } from "../../services";

/**
 * SendInquiryModal Component
 * Allows buyers to send inquiries about quotations via CRM email system
 */
function SendInquiryModal({ open, onClose, quotation, onSuccess }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens with new quotation
  useEffect(() => {
    if (open && quotation) {
      setSubject(`Inquiry about Quotation ${quotation.quote_number}`);
      setMessage("");
      setError(null);
    }
  }, [open, quotation]);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter your message");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const result = await quotationsService.sendInquiry(quotation._id, {
        subject: subject.trim(),
        message: message.trim(),
      });

      if (result.success) {
        toast.success(result.message || "Your inquiry has been sent!");
        onSuccess?.();
        onClose();
      } else {
        setError(result.error);
        toast.error(result.error || "Failed to send inquiry");
      }
    } catch (err) {
      console.error("Error sending inquiry:", err);
      setError("Failed to send inquiry. Please try again.");
      toast.error("Failed to send inquiry");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
    }
  };

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
          gap: 1,
          bgcolor: "#1976d2",
          color: "white",
        }}
      >
        <Email />
        Send Inquiry
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Quotation Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Regarding:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={quotation?.quote_number}
              size="small"
              color="primary"
            />
            <Typography variant="body2">
              ${quotation?.total_amount?.toFixed(2)} -{" "}
              {quotation?.items?.length || 0} items
            </Typography>
          </Box>
        </Box>

        {/* To Field (read-only) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            To:
          </Typography>
          <Chip
            icon={<Email fontSize="small" />}
            label="KB Enterprises Support"
            variant="outlined"
          />
        </Box>

        {/* Subject Field */}
        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          disabled={sending}
        />

        {/* Message Field */}
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={6}
          fullWidth
          placeholder="Please describe your question or request..."
          disabled={sending}
          helperText="Your message will be sent via email and we will respond as soon as possible."
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={sending}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={sending || !message.trim()}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <Send />}
        >
          {sending ? "Sending..." : "Send Inquiry"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SendInquiryModal;
