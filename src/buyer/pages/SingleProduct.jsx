import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Breadcrumbs,
  Link,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import InventoryIcon from "@mui/icons-material/Inventory";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useProduct } from "../../hooks/useProducts";
import useCartStore from "../../stores/useCartStore";

function SingleProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch product from API
  const { data: product, isLoading, isError } = useProduct(id);

  // Cart store
  const { addItem, isInCart, getItemQuantity } = useCartStore();

  const [quantity, setQuantity] = useState(1);

  const stockQty = product?.total_quantity || 0;
  const imageUrl = product?.image?.url;
  const inCart = product ? isInCart(product.product_id || product._id) : false;
  const cartQty = product ? getItemQuantity(product.product_id || product._id) : 0;

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setQuantity(numValue);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (quantity === 0) {
      return;
    }
    addItem(product, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/products")}
          sx={{ mb: 2, fontFamily: "Poppins", color: "#666" }}
        >
          Back to Products
        </Button>

        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Skeleton width={60} />
          <Skeleton width={80} />
          <Skeleton width={150} />
        </Breadcrumbs>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="text" width="80%" height={50} />
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={140} height={32} sx={{ borderRadius: 2 }} />
            </Box>
            <Skeleton variant="rectangular" width={200} height={50} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error or not found state
  if (isError || !product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Product not found
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/products")}
          sx={{ fontFamily: "Poppins" }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button */}
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/products")}
        sx={{
          mb: 2,
          fontFamily: "Poppins",
          color: "#666",
          "&:hover": { color: "#000" },
        }}
      >
        Back to Products
      </Button>

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
          onClick={() => navigate("/products")}
        >
          Products
        </Link>
        <Typography color="text.primary" sx={{ fontFamily: "Poppins" }}>
          {product.product_name}
        </Typography>
      </Breadcrumbs>

      {/* Main Product Section */}
      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              bgcolor: "#f9f9f9",
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.product_name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#ccc",
                }}
              >
                <ImageIcon sx={{ fontSize: 100 }} />
                <Typography variant="body2" color="text.secondary">
                  No image available
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Additional Images (if any) */}
          {product.additional_images?.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              {product.additional_images.map((img, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    width: 80,
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3 },
                  }}
                >
                  <img
                    src={img.url}
                    alt={`${product.product_name} ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Grid>

        {/* Product Details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box>
            {/* Product Title */}
            <Typography
              variant="h4"
              sx={{
                mb: 1,
                fontWeight: "bold",
                fontFamily: "Poppins",
              }}
            >
              {product.product_name}
            </Typography>

            {/* Part Number */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 2, fontFamily: "Poppins" }}
            >
              Part #: {product.part_number}
            </Typography>

            {/* Category, Brand, Stock */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              {product.category && (
                <Chip
                  icon={<CategoryIcon />}
                  label={`Category: ${product.category}`}
                  sx={{ fontFamily: "Poppins", fontWeight: "500" }}
                  color="primary"
                  variant="outlined"
                />
              )}
              {product.brand && (
                <Chip
                  icon={<BusinessIcon />}
                  label={`Brand: ${product.brand}`}
                  sx={{ fontFamily: "Poppins", fontWeight: "500" }}
                  color="secondary"
                  variant="outlined"
                />
              )}
              <Chip
                icon={<InventoryIcon />}
                label={stockQty > 0 ? `In Stock: ${stockQty}` : "Out of Stock"}
                sx={{ fontFamily: "Poppins", fontWeight: "500" }}
                color={
                  stockQty > 50
                    ? "success"
                    : stockQty > 20
                    ? "warning"
                    : stockQty > 0
                    ? "warning"
                    : "error"
                }
                variant="filled"
              />
            </Box>

            {/* In Cart indicator */}
            {inCart && (
              <Alert
                icon={<CheckCircleIcon fontSize="inherit" />}
                severity="success"
                sx={{ mb: 2 }}
              >
                {cartQty} item(s) already in your cart
              </Alert>
            )}

            {/* Description */}
            {product.description && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Poppins", color: "#666", lineHeight: 1.8 }}
                >
                  {product.description}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Quantity Selector & Add to Cart - Show for all products */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body1"
                sx={{ mb: 1, fontWeight: "600", fontFamily: "Poppins" }}
              >
                Quantity:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={decrementQuantity}
                    sx={{ minWidth: "40px", p: 1 }}
                    disabled={quantity <= 1}
                  >
                    <RemoveIcon />
                  </Button>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    inputProps={{
                      min: 1,
                      style: { textAlign: "center", fontFamily: "Poppins" },
                    }}
                    sx={{
                      width: "80px",
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
                  <Button
                    variant="outlined"
                    onClick={incrementQuantity}
                    sx={{ minWidth: "40px", p: 1 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ({stockQty} available)
                </Typography>
              </Box>
              {/* Backorder warning */}
              {quantity > stockQty && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {stockQty === 0
                    ? `All ${quantity} units will be on backorder`
                    : `${quantity - stockQty} of ${quantity} units will be on backorder`}
                </Alert>
              )}
            </Box>

            {/* Add to Cart Button */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                sx={{
                  bgcolor: "#000",
                  "&:hover": { bgcolor: "#333" },
                  fontFamily: "Poppins",
                  fontWeight: "600",
                  fontSize: "1rem",
                  px: 4,
                  py: 1.5,
                }}
              >
                Add to Cart
              </Button>
              {inCart && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/cart")}
                  sx={{
                    fontFamily: "Poppins",
                    fontWeight: "600",
                    fontSize: "1rem",
                    px: 4,
                    py: 1.5,
                  }}
                >
                  View Cart
                </Button>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Product Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
            >
              Specifications
            </Typography>
            <Table>
              <TableBody>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell
                      sx={{
                        fontFamily: "Poppins",
                        fontWeight: "600",
                        width: "30%",
                        textTransform: "capitalize",
                      }}
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Poppins" }}>
                      {value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {/* Manufacturer Info */}
      {product.manufacturer && (
        <Box sx={{ mt: 3 }}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
            >
              Manufacturer
            </Typography>
            <Typography sx={{ fontFamily: "Poppins" }}>
              {product.manufacturer}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default SingleProduct;
