import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Stack,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Inventory,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Search,
  Add,
  Delete,
  Image as ImageIcon,
  DeleteOutline,
} from "@mui/icons-material";

import { useCurrency } from "../../context/CurrencyContext";
import { useProductsPaginated, useProducts, useDeleteProduct } from "../../hooks/useProducts";
import useProductsStore from "../../stores/useProductsStore";
import categoriesService from "../../services/categories.service";
import brandsService from "../../services/brands.service";
import { useQuery } from "@tanstack/react-query";
import { showError } from "../../utils/toast";

function Products() {
  const navigate = useNavigate();
  const { usdToInr } = useCurrency();

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Zustand store for UI state
  const {
    searchTerm,
    filterCategory,
    filterBrand,
    page,
    rowsPerPage,
    setSearchTerm,
    setFilterCategory,
    setFilterBrand,
    setPage,
    setRowsPerPage,
    getStats,
  } = useProductsStore();

  // Build query params for server-side pagination
  const queryParams = {
    page: page + 1, // Backend uses 1-indexed pages
    limit: rowsPerPage,
    ...(filterCategory && { category: filterCategory }),
    ...(filterBrand && { brand: filterBrand }),
  };

  // React Query - Fetch paginated products for table
  const {
    data: paginatedData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorMsg,
  } = useProductsPaginated(queryParams);

  const products = paginatedData?.products || [];
  const pagination = paginatedData?.pagination || { total: 0, totalPages: 0 };

  // React Query - Fetch all products for stats (separate query)
  const { data: allProducts = [] } = useProducts({ limit: 1000 });

  // React Query - Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await categoriesService.getAll({ all: 'true' });
      if (!result.success) throw new Error(result.error);
      return result.data?.categories || [];
    },
  });
  const categories = categoriesData || [];

  // React Query - Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const result = await brandsService.getAll({ all: 'true' });
      if (!result.success) throw new Error(result.error);
      return result.data?.brands || [];
    },
  });
  const brands = brandsData || [];

  // Delete mutation
  const deleteProductMutation = useDeleteProduct();

  // Apply client-side search filter on paginated results
  const displayProducts = searchTerm
    ? products.filter(
        (p) =>
          p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Get stats from all products
  const stats = getStats(allProducts);

  const handleAddProduct = () => {
    navigate("/admin/products/add");
  };

  const handleEditProduct = (product) => {
    navigate(`/admin/products/edit/${product.product_id || product._id}`, {
      state: { product },
    });
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const deleteId = productToDelete.product_id || productToDelete._id;
    try {
      await deleteProductMutation.mutateAsync(deleteId);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      // Error toast is shown by the mutation's onError callback
      // Keep dialog open so user can retry or cancel
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  // Reset page when filters change
  const handleCategoryChange = (e) => {
    setFilterCategory(e.target.value);
    setPage(0);
  };

  const handleBrandChange = (e) => {
    setFilterBrand(e.target.value);
    setPage(0);
  };

  // Show error state
  if (productsError) {
    showError(productsErrorMsg?.message || "Failed to load products");
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className="p-0!">
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <h1 className="text-2xl font-bold text-[#0b0c1a] mb-2">
            Product & Inventory Management
          </h1>
          <Typography color="text.secondary">
            Manage products, pricing, and inventory levels
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddProduct}>
          Add Product
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1}>
                <Inventory />
                <Box>
                  <Typography variant="caption">Total Products</Typography>
                  <Typography variant="h5">
                    {productsLoading ? <Skeleton width={40} /> : stats.total}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="caption">In Stock</Typography>
                  <Typography variant="h5">
                    {productsLoading ? <Skeleton width={40} /> : stats.inStock}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1}>
                <Warning color="warning" />
                <Box>
                  <Typography variant="caption">Low Stock</Typography>
                  <Typography variant="h5">
                    {productsLoading ? <Skeleton width={40} /> : stats.lowStock}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1}>
                <ErrorIcon color="error" />
                <Box>
                  <Typography variant="caption">Out of Stock</Typography>
                  <Typography variant="h5">
                    {productsLoading ? <Skeleton width={40} /> : stats.outOfStock}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            value={filterCategory}
            onChange={handleCategoryChange}
            SelectProps={{ native: true }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id || cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            value={filterBrand}
            onChange={handleBrandChange}
            SelectProps={{ native: true }}
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.brand_id || brand._id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Image
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Part No
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Name
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Category
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Brand
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Price
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Inventory
              </TableCell>
              <TableCell sx={{ fontSize: "13px", fontWeight: "bold" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {productsLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="rectangular" width={60} height={60} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={150} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={60} /></TableCell>
                  <TableCell><Skeleton width={40} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                </TableRow>
              ))
            ) : displayProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm
                      ? "No products match your search"
                      : "No products found"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayProducts.map((product) => (
                <TableRow key={product.product_id || product._id}>
                  <TableCell sx={{ width: 80 }}>
                    {product.image?.url ? (
                      <Box
                        component="img"
                        src={product.image.url}
                        alt={product.product_name}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "#f5f5f5",
                        borderRadius: 1,
                        display: product.image?.url ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <ImageIcon sx={{ color: "#999", fontSize: 30 }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: "13px" }}>
                    {product.part_number}
                  </TableCell>
                  <TableCell sx={{ fontSize: "13px" }}>
                    {product.product_name}
                  </TableCell>
                  <TableCell sx={{ fontSize: "13px" }}>
                    {product.category}
                  </TableCell>
                  <TableCell sx={{ fontSize: "13px" }}>{product.brand}</TableCell>

                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: "13px", fontWeight: "bold" }}>
                        ${(product.your_price || product.list_price || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "11px", color: "text.secondary" }}>
                        ₹{((product.your_price || product.list_price || 0) * usdToInr).toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color:
                          product.total_quantity === 0
                            ? "error.main"
                            : product.total_quantity < 10
                            ? "warning.main"
                            : "success.main",
                      }}
                    >
                      {product.total_quantity}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => handleEditProduct(product)}
                        sx={{ fontSize: "12px" }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={deleteProductMutation.isPending}
                        sx={{ fontSize: "12px", minWidth: "auto" }}
                      >
                        {deleteProductMutation.isPending ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Delete fontSize="small" />
                        )}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={searchTerm ? displayProducts.length : pagination.total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={deleteProductMutation.isPending ? undefined : handleCancelDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "error.lighter",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DeleteOutline color="error" />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Delete Product
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to delete{" "}
            <Typography component="span" fontWeight={600} color="text.primary">
              {productToDelete?.product_name}
            </Typography>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            color="inherit"
            disabled={deleteProductMutation.isPending}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteProductMutation.isPending}
            sx={{ minWidth: 100 }}
          >
            {deleteProductMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Products;
