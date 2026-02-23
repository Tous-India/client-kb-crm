import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import HomeIcon from "@mui/icons-material/Home";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ImageIcon from "@mui/icons-material/Image";

import useCartStore from "../../stores/useCartStore";

function Cart() {
  const navigate = useNavigate();

  // Cart store
  const {
    items: cartItems,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    getItemCount,
  } = useCartStore();

  // Calculate totals (without pricing for buyers)
  const totalItems = getItemCount();
  const uniqueItems = cartItems.length;

  // Handle quantity change
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  // Handle clear cart with confirmation
  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your entire cart?")) {
      clearCart();
    }
  };

  // Handle checkout - Navigate to quote request page
  const handleCheckout = () => {
    navigate("/quote-request");
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
        >
          Shopping Cart
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
          <Typography color="text.primary" sx={{ fontFamily: "Poppins" }}>
            Cart
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
            Looks like you haven't added any items to your cart yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowForwardIcon />}
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
            Continue Shopping
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} className="cart-page">
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
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", fontFamily: "Poppins" }}
        >
          Shopping Cart
        </Typography>
        <Chip
          icon={<ShoppingCartIcon />}
          label={`${totalItems} Item${totalItems > 1 ? "s" : ""} (${uniqueItems} product${uniqueItems > 1 ? "s" : ""})`}
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
        <Typography color="text.primary" sx={{ fontFamily: "Poppins" }}>
          Cart
        </Typography>
      </Breadcrumbs>

      
      {/* Cart Layout */}
      <Grid container spacing={3}>
        {/* Cart Items Section - Left Side */}
        <Grid size={{ xs: 12, md: 9, lg: 9 }}>
          <Paper elevation={2} sx={{ p: 0, overflow: "hidden" }}>
            {/* Header with Clear Cart Button */}
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#f5f5f5",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: "600", fontFamily: "Poppins" }}
              >
                Cart Items
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={handleClearCart}
                sx={{
                  fontFamily: "Poppins",
                  borderColor: "#d32f2f",
                  color: "#d32f2f",
                  "&:hover": {
                    borderColor: "#b71c1c",
                    bgcolor: "rgba(211, 47, 47, 0.04)",
                  },
                }}
              >
                Clear Cart
              </Button>
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
                      Available
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontFamily: "Poppins", fontWeight: "700" }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontFamily: "Poppins", fontWeight: "700" }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:hover": { bgcolor: "#f9f9f9" },
                        transition: "background-color 0.2s",
                      }}
                    >
                      {/* Product Info */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              style={{
                                width: "80px",
                                height: "60px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => navigate(`/products/${item.productId}`)}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 80,
                                height: 60,
                                bgcolor: "#f5f5f5",
                                borderRadius: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                              onClick={() => navigate(`/products/${item.productId}`)}
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
                                cursor: "pointer",
                                "&:hover": { color: "#1890ff" },
                              }}
                              onClick={() => navigate(`/products/${item.productId}`)}
                            >
                              {item.product_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", fontFamily: "Poppins" }}
                            >
                              Part #: {item.part_number}
                            </Typography>
                            {item.category && (
                              <Chip
                                label={item.category}
                                size="small"
                                sx={{ mt: 0.5, fontSize: "0.7rem" }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Available Stock */}
                      <TableCell align="center">
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                          <Chip
                            label={`${item.total_quantity} in stock`}
                            size="small"
                            color={
                              item.total_quantity > 50
                                ? "success"
                                : item.total_quantity > 10
                                ? "warning"
                                : "error"
                            }
                            variant="outlined"
                            sx={{ fontFamily: "Poppins" }}
                          />
                          {/* Backorder indicator */}
                          {item.quantity > item.total_quantity && (
                            <Chip
                              label={`${item.quantity - item.total_quantity} backorder`}
                              size="small"
                              color="warning"
                              sx={{ fontFamily: "Poppins", fontSize: "0.65rem" }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => decrementQuantity(item.id)}
                            disabled={item.quantity <= 1}
                            sx={{
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              p: 0.5,
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                            }
                            inputProps={{
                              min: 1,
                              style: {
                                textAlign: "center",
                                fontFamily: "Poppins",
                                fontWeight: "600",
                              },
                            }}
                            sx={{
                              width: "60px",
                              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                                {
                                  display: "none",
                                },
                              "& input[type=number]": {
                                MozAppearance: "textfield",
                              },
                            }}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => incrementQuantity(item.id)}
                            sx={{
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              p: 0.5,
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>

                      {/* Remove Button */}
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => removeItem(item.id)}
                          sx={{
                            "&:hover": {
                              bgcolor: "rgba(211, 47, 47, 0.08)",
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Continue Shopping Button */}
          <Button
            variant="outlined"
            startIcon={<ArrowForwardIcon sx={{ transform: "rotate(180deg)" }} />}
            onClick={() => navigate("/products")}
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
            Continue Shopping
          </Button>
        </Grid>

        {/* Order Summary Section - Right Side */}
        <Grid size={{ xs: 12, md: 3, lg: 3 }}>
          <Card elevation={3} sx={{ position: "sticky", top: 20 }}>
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
                Order Summary
              </Typography>

              {/* Item Count */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Poppins", color: "#666" }}
                >
                  Total Items:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Poppins", fontWeight: "600" }}
                >
                  {totalItems}
                </Typography>
              </Box>

              {/* Unique Products */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Poppins", color: "#666" }}
                >
                  Unique Products:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Poppins", fontWeight: "600" }}
                >
                  {uniqueItems}
                </Typography>
              </Box>

              {/* Backorder items count */}
              {cartItems.some(item => item.quantity > item.total_quantity) && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: "Poppins", color: "#ed6c02" }}
                  >
                    Backorder Items:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: "Poppins", fontWeight: "600", color: "#ed6c02" }}
                  >
                    {cartItems.filter(item => item.quantity > item.total_quantity).length}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Backorder Warning */}
              {cartItems.some(item => item.quantity > item.total_quantity) && (
                <Alert severity="warning" sx={{ mb: 2, fontSize: "0.85rem" }}>
                  Some items exceed available stock and will be on backorder
                </Alert>
              )}

              {/* Info Message */}
              <Alert severity="info" sx={{ mb: 3, fontSize: "0.85rem" }}>
                Request a quote to get pricing for your items
              </Alert>

              {/* Checkout Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleCheckout}
                sx={{
                  bgcolor: "#000",
                  "&:hover": { bgcolor: "#333" },
                  fontFamily: "Poppins",
                  fontWeight: "600",
                  fontSize: "1rem",
                  py: 1.5,
                  mb: 2,
                }}
              >
                Request Quote
              </Button>

              {/* Additional Info */}
              <Paper
                elevation={0}
                sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}
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
                  * Pricing available on quote
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "Poppins",
                    color: "#666",
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  * Fast processing
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: "Poppins", color: "#666", display: "block" }}
                >
                  * Expert support
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Cart;
