import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Email, Send, Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import apiClient from "../../services/api/client";
import { ENDPOINTS } from "../../services/api/endpoints";

/**
 * ContactModal - Allows buyers to send general inquiries to admin via CRM
 * Sends email through the backend instead of opening Outlook/mailto
 */
function ContactModal({ open, onClose, onSuccess }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (sending) return;
    setSubject("");
    setMessage("");
    setError("");
    onClose();
  };

  const handleSend = async () => {
    // Validation
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      setError("Please enter your message");
      return;
    }

    setError("");
    setSending(true);

    try {
      const response = await apiClient.post(ENDPOINTS.USERS.CONTACT, {
        subject: subject.trim(),
        message: message.trim(),
      });

      if (response.data?.success) {
        toast.success(response.data?.message || "Message sent successfully!");
        setSubject("");
        setMessage("");
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.message || "Failed to send message");
      }
    } catch (err) {
      console.error("[ContactModal] Error sending message:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to send message";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white", pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Email />
          <Typography variant="h6" fontWeight="bold">
            Contact Sales Representative
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send a message to our sales team. We'll respond to your inquiry as soon as possible.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            label="Subject"
            placeholder="What is your inquiry about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
            disabled={sending}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
            }}
          />

          <TextField
            label="Message"
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            required
            multiline
            rows={5}
            disabled={sending}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, bgcolor: "grey.50" }}>
        <Button
          onClick={handleClose}
          disabled={sending}
          startIcon={<Close />}
          variant="outlined"
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <Send />}
          variant="contained"
          color="primary"
          sx={{ textTransform: "none", minWidth: 120 }}
        >
          {sending ? "Sending..." : "Send Message"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ContactModal;
