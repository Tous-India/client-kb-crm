import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";

import useCartStore from "../../stores/useCartStore";
import useNotificationStore from "../../stores/useNotificationStore";
import { useAuth } from "../../context/AuthContext";
import { showSuccess as toastSuccess, showError as toastError } from "../../utils/toast";
import { ordersService } from "../../services";

function QuoteRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Cart store
  const { items: cartItems, clearCart, getItemCount } = useCartStore();

  // Notification store for admin alerts
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState(null);

  const totalItems = getItemCount();
  const uniqueProducts = cartItems.length;

  // Generate request ID
  const generateRequestId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QR-${year}-${random}`;
  };

  // Handle submit quote request
  const handleSubmitRequest = async () => {
    if (cartItems.length === 0) {
      toastError("Your cart is empty. Add items before requesting a quote.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data for API
      const orderData = {
        customer_id: user?.id || "BUYER001",
        customer_name: user?.company_name || user?.name || "Unknown Buyer",
        customer_email: user?.email || "",
        priority: priority,
        customer_notes: notes,
        items: cartItems.map(item => ({
          product_id: item.productId,
          product_name: item.product_name,
          part_number: item.part_number,
          quantity: item.quantity,
          category: item.category,
          brand: item.brand,
          requested_unit_price: 0, // Price will be set by admin
          total_price: 0,
        })),
        total_items: totalItems,
        unique_products: uniqueProducts,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total_amount: 0,
      };

      // Submit order via API
      const result = await ordersService.submitQuoteRequest(orderData);

      if (!result.success) {
        throw new Error(result.error || "Failed to submit order");
      }

      const orderId = result.data.order_id || result.data.po_number;

      console.log("Order/Quote Request Submitted:", result.data);

      // Clear cart after successful submission
      clearCart();

      // Add notification for admin
      addNotification({
        type: "QUOTE_REQUEST",
        title: "New Purchase Order",
        message: `${user?.company_name || user?.name || "A buyer"} submitted an order (${orderId}) with ${totalItems} items.`,
        priority: priority,
        requestId: orderId,
        buyerName: user?.company_name || user?.name || "Unknown Buyer",
      });

      // Show success notification to buyer
      toastSuccess(`Order ${orderId} submitted successfully! Admin has been notified.`);

      setSubmittedRequestId(orderId);
      setShowSuccessPage(true);

    } catch (error) {
      console.error("Error submitting order:", error);
      toastError(error.message || "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (showSuccessPage) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 2,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          <CheckCircleIcon
            sx={{ fontSize: 80, color: "success.main", mb: 2 }}
          />
          <Typography
            variant="h4"
            sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
          >
            Quote Request Submitted!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, fontFamily: "Poppins" }}
          >
            Your quote request has been sent to KB Enterprises. Our team will
            review your request and send you a quotation soon.
          </Typography>

          <Paper
            sx={{
              p: 2,
              bgcolor: "primary.lighter",
              borderRadius: 1,
              mb: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Request ID
            </Typography>
            <Typography
              variant="h5"
              color="primary.main"
              sx={{ fontWeight: "bold", fontFamily: "Poppins" }}
            >
              {submittedRequestId}
            </Typography>
          </Paper>

          <Alert severity="info" sx={{ mb: 4, textAlign: "left" }}>
            <Typography variant="body2">
              <strong>What happens next?</strong>
              <br />
              1. Our team reviews your request
              <br />
              2. We prepare pricing for your items
              <br />
              3. You'll receive a quotation in "My Quotations"
              <br />
              4. Review and accept/reject the quotation
            </Typography>
          </Alert>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/products")}
              sx={{ fontFamily: "Poppins", fontWeight: "500" }}
            >
              Continue Shopping
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/web-orders")}
              sx={{
                bgcolor: "#000",
                "&:hover": { bgcolor: "#333" },
                fontFamily: "Poppins",
                fontWeight: "600",
              }}
            >
              View My Orders
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
        >
          Request Quote
        </Typography>

        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontFamily: "Poppins",
            }}
            color="inherit"
            onClick={() => navigate("/")}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link
            underline="hover"
            sx={{ cursor: "pointer", fontFamily: "Poppins" }}
            color="inherit"
            onClick={() => navigate("/cart")}
          >
            Cart
          </Link>
          <Typography color="text.primary" sx={{ fontFamily: "Poppins" }}>
            Request Quote
          </Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: "center",
            bgcolor: "#f9f9f9",
            borderRadius: 2,
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 100, color: "#ccc", mb: 2 }} />
          <Typography
            variant="h5"
            sx={{ mb: 2, fontWeight: "600", fontFamily: "Poppins" }}
          >
            Your cart is empty
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, fontFamily: "Poppins" }}
          >
            Add products to your cart before requesting a quote.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/products")}
            sx={{
              bgcolor: "#000",
              "&:hover": { bgcolor: "#333" },
              fontFamily: "Poppins",
              fontWeight: "600",
              px: 4,
              py: 1.5,
            }}
          >
            Browse Products
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", fontFamily: "Poppins" }}
          >
            Request Quote
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review your items and submit a quote request to KB Enterprises
          </Typography>
        </Box>
        <Chip
          icon={<RequestQuoteIcon />}
          label={`${totalItems} Item${totalItems > 1 ? "s" : ""} (${uniqueProducts} product${uniqueProducts > 1 ? "s" : ""})`}
          color="primary"
          sx={{ fontFamily: "Poppins", fontWeight: "600", fontSize: "1rem" }}
        />
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            fontFamily: "Poppins",
          }}
          color="inherit"
          onClick={() => navigate("/")}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link
          underline="hover"
          sx={{ cursor: "pointer", fontFamily: "Poppins" }}
          color="inherit"
          onClick={() => navigate("/cart")}
        >
          Cart
        </Link>
        <Typography color="text.primary" sx={{ fontFamily: "Poppins" }}>
          Request Quote
        </Typography>
      </Breadcrumbs>

      {/* Main Layout */}
      <Grid container spacing={3}>
        {/* Items Section - Left Side */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 0, overflow: "hidden", borderRadius: 2 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: "600", fontFamily: "Poppins" }}
              >
                Items for Quote ({uniqueProducts})
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fafafa" }}>
                    <TableCell sx={{ fontFamily: "Poppins", fontWeight: "700" }}>
                      Product
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontFamily: "Poppins", fontWeight: "700" }}
                    >
                      Part Number
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontFamily: "Poppins", fontWeight: "700" }}
                    >
                      Quantity
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              style={{
                                width: "60px",
                                height: "45px",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 60,
                                height: 45,
                                bgcolor: "#f5f5f5",
                                borderRadius: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ImageIcon sx={{ color: "#ccc" }} />
                            </Box>
                          )}
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: "600",
                                fontFamily: "Poppins",
                              }}
                            >
                              {item.product_name}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                              {item.category && (
                                <Chip
                                  label={item.category}
                                  size="small"
                                  sx={{ fontSize: "0.65rem", height: 18 }}
                                />
                              )}
                              {item.brand && (
                                <Chip
                                  label={item.brand}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{ fontSize: "0.65rem", height: 18 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "Poppins", color: "text.secondary" }}
                        >
                          {item.part_number}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.quantity}
                          color="primary"
                          sx={{ fontWeight: "bold", minWidth: 50 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Back to Cart Button */}
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/cart")}
            sx={{
              mt: 2,
              fontFamily: "Poppins",
              fontWeight: "500",
              borderColor: "#000",
              color: "#000",
              "&:hover": {
                borderColor: "#333",
                bgcolor: "rgba(0,0,0,0.04)",
              },
            }}
          >
            Back to Cart
          </Button>
        </Grid>

        {/* Request Details Section - Right Side */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3} sx={{ position: "sticky", top: 20, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  fontWeight: "bold",
                  fontFamily: "Poppins",
                  borderBottom: "2px solid #000",
                  pb: 2,
                }}
              >
                Request Details
              </Typography>

              {/* Summary */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography sx={{ fontFamily: "Poppins", color: "#666" }}>
                    Total Items:
                  </Typography>
                  <Typography sx={{ fontFamily: "Poppins", fontWeight: "600" }}>
                    {totalItems}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography sx={{ fontFamily: "Poppins", color: "#666" }}>
                    Unique Products:
                  </Typography>
                  <Typography sx={{ fontFamily: "Poppins", fontWeight: "600" }}>
                    {uniqueProducts}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Priority Selection */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel sx={{ fontFamily: "Poppins" }}>Priority</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  label="Priority"
                  sx={{ fontFamily: "Poppins" }}
                >
                  <MenuItem value="LOW">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label="Low" size="small" color="default" />
                      <Typography variant="body2">Standard processing</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="NORMAL">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label="Normal" size="small" color="primary" />
                      <Typography variant="body2">Regular priority</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="HIGH">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label="High" size="small" color="warning" />
                      <Typography variant="body2">Urgent request</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                placeholder="Add any special requirements, delivery preferences, or questions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              {/* Info Alert */}
              <Alert severity="info" sx={{ mb: 3, fontSize: "0.85rem" }}>
                Our team will review your request and send you a quotation with
                pricing details.
              </Alert>

              {/* Submit Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )
                }
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                sx={{
                  bgcolor: "#000",
                  "&:hover": { bgcolor: "#333" },
                  "&:disabled": { bgcolor: "#666" },
                  fontFamily: "Poppins",
                  fontWeight: "600",
                  fontSize: "1rem",
                  py: 1.5,
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Quote Request"}
              </Button>

              {/* Company Info */}
              <Paper
                elevation={0}
                sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, mt: 2 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "Poppins",
                    color: "#666",
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Requesting as:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Poppins", fontWeight: "600" }}
                >
                  {user?.company_name || user?.name || "Your Company"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: "Poppins", color: "#666" }}
                >
                  {user?.email || ""}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default QuoteRequest;
