import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  TextField,
  Breadcrumbs,
  Link,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Pagination,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

import { useProductsPaginated } from "../../hooks/useProducts";
import useCartStore from "../../stores/useCartStore";
import categoriesService from "../../services/categories.service";
import { useQuery } from "@tanstack/react-query";

function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(12); // Fixed 12 products per page for grid layout
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Build query params for server-side pagination
  const queryParams = {
    page,
    limit: rowsPerPage,
    ...(selectedCategory !== "All" && { category: selectedCategory }),
  };

  // Fetch products from API with server-side pagination
  const {
    data: paginatedData,
    isLoading,
    isError,
  } = useProductsPaginated(queryParams);

  const products = paginatedData?.products || [];
  const pagination = paginatedData?.pagination || { total: 0, totalPages: 0 };

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await categoriesService.getAll({ all: "true" });
      if (!result.success) throw new Error(result.error);
      return result.data?.categories || [];
    },
  });
  const categories = ["All", ...(categoriesData?.map((c) => c.name) || [])];

  // Cart store
  const { addItem, isInCart } = useCartStore();

  const [quantities, setQuantities] = useState({});

  // Set category from URL on component mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setPage(1);
    }
  }, [searchParams]);

  const getProductId = (product) => product.product_id || product._id;

  const handleQuantityChange = (productId, value) => {
    const numValue = parseInt(value) || 0;

    if (numValue >= 0) {
      setQuantities((prev) => ({
        ...prev,
        [productId]: numValue,
      }));
    }
  };

  const incrementQuantity = (productId) => {
    const currentQty = quantities[productId] || 0;
    setQuantities((prev) => ({
      ...prev,
      [productId]: currentQty + 1,
    }));
  };

  const decrementQuantity = (productId) => {
    const currentQty = quantities[productId] || 0;

    if (currentQty > 0) {
      setQuantities((prev) => ({
        ...prev,
        [productId]: currentQty - 1,
      }));
    }
  };

  const handleAddToCart = (product) => {
    const productId = getProductId(product);
    const quantity = quantities[productId] || 0;

    if (quantity === 0) {
      return; // Toast error is shown by the store
    }

    const success = addItem(product, quantity);
    if (success) {
      // Reset quantity after successful add
      setQuantities((prev) => ({
        ...prev,
        [productId]: 0,
      }));
    }
  };

  // Apply client-side search filter on current page results
  const displayProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.product_name?.toLowerCase().includes(query) ||
        p.part_number?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Handle category change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setPage(1);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
        >
          Products
        </Typography>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: "flex", alignItems: "center" }}
            color="inherit"
            href="/"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary">Products</Typography>
        </Breadcrumbs>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Card sx={{ height: "100%" }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={28} />
                  <Skeleton variant="text" width="50%" height={20} />
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{ mt: 1, borderRadius: 1 }}
                  />
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Skeleton
                      variant="rectangular"
                      width="50%"
                      height={36}
                      sx={{ borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width="50%"
                      height={36}
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Failed to load products
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Typography
        variant="h4"
        sx={{ mb: 2, fontWeight: "bold", fontFamily: "Poppins" }}
      >
        Products
      </Typography>

      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          color="inherit"
          href="/"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary">Products</Typography>
      </Breadcrumbs>

      {/* Filter Section */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search by Part Number, Product Name, Category, Brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: 400,
            "& .MuiOutlinedInput-root": {
              fontFamily: "Poppins",
              bgcolor: "#fff",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#1976d2",
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#666" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                    aria-label="clear search"
                  >
                    <ClearIcon sx={{ fontSize: "1.1rem" }} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Category Filter */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FilterListIcon sx={{ color: "#666" }} />
          <Typography
            variant="body1"
            sx={{ fontWeight: "600", fontFamily: "Poppins" }}
          >
            Category:
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel sx={{ fontFamily: "Poppins" }}>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="Category"
            sx={{ fontFamily: "Poppins", bgcolor: "#fff" }}
          >
            {categories.map((category) => (
              <MenuItem
                key={category}
                value={category}
                sx={{ fontFamily: "Poppins" }}
              >
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Product Count */}
        <Chip
          label={`${searchQuery ? displayProducts.length : pagination.total} Products`}
          color="primary"
          sx={{ fontFamily: "Poppins", fontWeight: "500" }}
        />

        {/* Active Filters Display */}
        {(searchQuery || selectedCategory !== "All") && (
          <Button
            size="small"
            variant="text"
            onClick={handleClearFilters}
            sx={{
              fontFamily: "Poppins",
              textTransform: "none",
              color: "#666",
              "&:hover": { color: "#d32f2f" },
            }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {displayProducts.map((product) => {
          const productId = getProductId(product);
          const stockQty = product.total_quantity || 0;
          const imageUrl = product.image?.url;
          const inCart = isInCart(productId);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={productId}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                {/* Product Image */}
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "75%", // 4:3 aspect ratio
                    overflow: "hidden",
                    bgcolor: "#f5f5f5",
                  }}
                >
                  {imageUrl ? (
                    <CardMedia
                      component="img"
                      image={imageUrl}
                      alt={product.product_name}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        cursor: "pointer",
                        p: 2,
                      }}
                      onClick={() => navigate(`/products/${productId}`)}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/products/${productId}`)}
                    >
                      <ImageIcon sx={{ fontSize: 60, color: "#ccc" }} />
                    </Box>
                  )}
                  {/* In Cart Badge */}
                  {inCart && (
                    <Chip
                      icon={
                        <CheckCircleIcon
                          sx={{ fontSize: "0.9rem !important" }}
                        />
                      }
                      label="In Cart"
                      size="small"
                      color="success"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1, pb: 2, px: 2, pt: 2 }}>
                  {/* Product Name */}
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      mb: 0.5,
                      fontWeight: "bold",
                      fontSize: "1rem",
                      fontFamily: "Poppins",
                      cursor: "pointer",
                      lineHeight: 1.3,
                      minHeight: "2.6em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      "&:hover": { color: "#1890ff" },
                    }}
                    onClick={() => navigate(`/products/${productId}`)}
                  >
                    {product.product_name}
                  </Typography>

                  {/* Part Number */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mb: 1,
                      fontFamily: "Poppins",
                      fontSize: "0.7rem",
                    }}
                  >
                    Part #: {product.part_number}
                  </Typography>

                  {/* Category & Brand */}
                  <Box sx={{ mb: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {product.category && (
                      <Chip
                        label={product.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    )}
                    {product.brand && (
                      <Chip
                        label={product.brand}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    )}
                  </Box>

                  {/* Available Quantity */}
                  <Box sx={{ mb: 1.5 }}>
                    <Chip
                      label={stockQty > 0 ? `Stock: ${stockQty}` : "Out of Stock"}
                      size="small"
                      color={
                        stockQty > 20
                          ? "success"
                          : stockQty > 0
                          ? "warning"
                          : "error"
                      }
                      sx={{ fontWeight: "600", fontSize: "0.7rem" }}
                    />
                  </Box>

                  {/* Quantity Selector - Show for all products */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "600",
                        fontFamily: "Poppins",
                        fontSize: "0.75rem",
                      }}
                    >
                      Qty:
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => decrementQuantity(productId)}
                        sx={{
                          minWidth: "28px",
                          width: "28px",
                          height: "28px",
                          p: 0,
                          borderColor: "#ddd",
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: "1rem" }} />
                      </Button>
                      <TextField
                        size="small"
                        type="number"
                        value={quantities[productId] || 0}
                        onChange={(e) =>
                          handleQuantityChange(productId, e.target.value)
                        }
                        slotProps={{
                          input: {
                            inputProps: {
                              min: 0,
                              style: { textAlign: "center", padding: "4px" },
                            },
                          },
                        }}
                        sx={{
                          width: "50px",
                          "& .MuiOutlinedInput-root": {
                            height: "28px",
                          },
                          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "none",
                            },
                          "& input[type=number]": {
                            MozAppearance: "textfield",
                          },
                        }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => incrementQuantity(productId)}
                        sx={{
                          minWidth: "28px",
                          width: "28px",
                          height: "28px",
                          p: 0,
                          borderColor: "#ddd",
                        }}
                      >
                        <AddIcon sx={{ fontSize: "1rem" }} />
                      </Button>
                    </Box>
                  </Box>
                  {/* Backorder warning */}
                  {(quantities[productId] || 0) > stockQty && (
                    <Chip
                      label={`${(quantities[productId] || 0) - stockQty} on backorder`}
                      size="small"
                      color="warning"
                      sx={{ mb: 1, fontSize: "0.65rem" }}
                    />
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<VisibilityIcon sx={{ fontSize: "1rem" }} />}
                      onClick={() => navigate(`/products/${productId}`)}
                      sx={{
                        fontFamily: "Poppins",
                        fontWeight: "500",
                        fontSize: "0.75rem",
                        py: 0.75,
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                          borderColor: "#000",
                          bgcolor: "rgba(0,0,0,0.02)",
                        },
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCartIcon sx={{ fontSize: "1rem" }} />}
                      onClick={() => handleAddToCart(product)}
                      sx={{
                        bgcolor: "#000",
                        "&:hover": { bgcolor: "#333" },
                        fontFamily: "Poppins",
                        fontWeight: "500",
                        fontSize: "0.75rem",
                        py: 0.75,
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {displayProducts.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
          }}
        >
          <SearchIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontFamily: "Poppins", mb: 1 }}
          >
            {searchQuery
              ? `No products found for "${searchQuery}"`
              : selectedCategory !== "All"
              ? `No products found in "${selectedCategory}" category`
              : "No products available"}
          </Typography>
          {(searchQuery || selectedCategory !== "All") && (
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{
                mt: 2,
                fontFamily: "Poppins",
                textTransform: "none",
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && !searchQuery && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            mb: 2,
          }}
        >
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": {
                fontFamily: "Poppins",
              },
            }}
          />
        </Box>
      )}

      {/* Page info */}
      {pagination.total > 0 && !searchQuery && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", fontFamily: "Poppins" }}
        >
          Showing {(page - 1) * rowsPerPage + 1} -{" "}
          {Math.min(page * rowsPerPage, pagination.total)} of {pagination.total}{" "}
          products
        </Typography>
      )}
    </Box>
  );
}

export default Products;
