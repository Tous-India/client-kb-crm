import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { ArrowBack, Save, CloudUpload, Image as ImageIcon, Delete } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "../../context/CurrencyContext";
import { useCreateProduct, useUpdateProduct, useProduct, useUploadProductImages, useUpdateMainImage } from "../../hooks/useProducts";
import categoriesService from "../../services/categories.service";
import brandsService from "../../services/brands.service";
import { showError } from "../../utils/toast";

function AddEditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { usdToInr } = useCurrency();
  const isEditMode = Boolean(id);

  // React Query - Fetch product from database when editing
  const {
    data: productFromDB,
    isLoading: productLoading,
  } = useProduct(id);

  // Use product from DB, fallback to location state for backwards compatibility
  const productData = productFromDB || location.state?.product;

  // React Query - Fetch categories from API
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const result = await categoriesService.getAll({ all: 'true' });
      if (!result.success) throw new Error(result.error);
      return result.data?.categories || [];
    },
  });

  // React Query - Fetch brands from API
  const {
    data: brands = [],
    isLoading: brandsLoading,
  } = useQuery({
    queryKey: ['brands', 'all'],
    queryFn: async () => {
      const result = await brandsService.getAll({ all: 'true' });
      if (!result.success) throw new Error(result.error);
      return result.data?.brands || [];
    },
  });

  // Mutations for create/update
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadImagesMutation = useUploadProductImages();
  const updateMainImageMutation = useUpdateMainImage();

  const [productForm, setProductForm] = useState({
    part_number: "",
    product_name: "",
    category: "",
    brand: "",
    price: "",
    description: "",
    total_quantity: 0,
    image_url: "",
    additional_images: [],
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  // Store actual files for upload
  const [mainImageFile, setMainImageFile] = useState(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);

  useEffect(() => {
    if (isEditMode && productData) {
      const usdPrice = productData.your_price || productData.list_price || 0;
      // Get main image URL (handle both old image_url and new image.url formats)
      const mainImageUrl = productData.image?.url || productData.image_url || "";
      // Get additional images (handle array of objects or strings)
      const additionalImgs = (productData.additional_images || []).map(
        img => typeof img === 'string' ? img : img?.url || ''
      ).filter(Boolean);

      setProductForm({
        part_number: productData.part_number || "",
        product_name: productData.product_name || "",
        category: productData.category || "",
        brand: productData.brand || "",
        price: usdPrice,
        description: productData.description || "",
        total_quantity: productData.total_quantity || 0,
        image_url: mainImageUrl,
        additional_images: additionalImgs,
      });
      if (mainImageUrl) {
        setImagePreview(mainImageUrl);
      }
      if (additionalImgs.length > 0) {
        setAdditionalPreviews(additionalImgs);
      }
      // Reset file states when loading existing product
      setMainImageFile(null);
      setAdditionalImageFiles([]);
    }
  }, [isEditMode, productData]);

  const handleFormChange = (field, value) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showError("Please select a valid image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("Image size should be less than 5MB");
        return;
      }
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Store file for upload (will be uploaded on submit)
      setMainImageFile(file);
      setProductForm((prev) => ({
        ...prev,
        image_url: previewUrl,
      }));
    }
  };


  const handleRemoveImage = () => {
    setImagePreview(null);
    setMainImageFile(null);
    setProductForm((prev) => ({
      ...prev,
      image_url: "",
    }));
  };

  const handleAdditionalImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showError(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
    // Store files for upload (will be uploaded on submit)
    setAdditionalImageFiles((prev) => [...prev, ...validFiles]);
    setProductForm((prev) => ({
      ...prev,
      additional_images: [...prev.additional_images, ...newPreviews],
    }));
  };


  const handleRemoveAdditionalImage = (index) => {
    const imageUrl = additionalPreviews[index];
    // If it's a blob URL (new file), also remove from files array
    if (imageUrl && imageUrl.startsWith("blob:")) {
      // Find the corresponding file index
      const blobUrls = additionalPreviews.filter((url) => url.startsWith("blob:"));
      const blobIndex = blobUrls.indexOf(imageUrl);
      if (blobIndex >= 0) {
        setAdditionalImageFiles((prev) => prev.filter((_, i) => i !== blobIndex));
      }
    }
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
    setProductForm((prev) => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index),
    }));
  };

  const handleSetAsMainImage = (index) => {
    const newMainImage = additionalPreviews[index];
    const oldMainImage = imagePreview;

    // Set the selected additional image as main
    setImagePreview(newMainImage);
    setProductForm((prev) => ({
      ...prev,
      image_url: newMainImage,
    }));

    // Move old main image to additional images (if exists)
    if (oldMainImage) {
      const newAdditional = [...additionalPreviews];
      newAdditional[index] = oldMainImage;
      setAdditionalPreviews(newAdditional);
      setProductForm((prev) => ({
        ...prev,
        additional_images: newAdditional,
      }));
    } else {
      handleRemoveAdditionalImage(index);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!productForm.part_number || !productForm.product_name || !productForm.category || !productForm.brand) {
      showError("Please fill in all required fields");
      return;
    }

    // Parse price - handle empty string and ensure valid number
    const usdPrice = productForm.price === "" || productForm.price === null
      ? 0
      : Number(productForm.price) || 0;

    // Check if we're uploading new images
    const hasNewMainImage = mainImageFile !== null;
    const hasNewAdditionalImages = additionalImageFiles.length > 0;

    // Determine main image to send:
    // - If uploading new: don't include in JSON (upload endpoint handles it)
    // - If keeping existing: use original object with public_id
    // - If removed: send null
    let imageToSend;
    if (hasNewMainImage) {
      // Don't include image field - will be handled by upload endpoint
      imageToSend = undefined;
    } else if (!imagePreview) {
      // User removed the image
      imageToSend = null;
    } else {
      // Keeping existing image - use original object with public_id
      imageToSend = productData?.image || null;
    }

    // For additional images: preserve original objects (with public_id) for existing URLs
    const existingAdditionalImages = (productForm.additional_images || [])
      .filter((url) => typeof url === "string" && !url.startsWith("blob:"))
      .map((url) => {
        // Find original object that matches this URL to preserve public_id
        const original = (productData?.additional_images || []).find(
          (img) => img?.url === url
        );
        return original || { url };
      });

    const productToSave = {
      part_number: productForm.part_number,
      product_name: productForm.product_name,
      category: productForm.category,
      brand: productForm.brand,
      description: productForm.description,
      total_quantity: Number(productForm.total_quantity) || 0,
      your_price: usdPrice,
      list_price: usdPrice,
      additional_images: existingAdditionalImages,
      stock_status:
        productForm.total_quantity > 50
          ? "In Stock"
          : productForm.total_quantity > 0
          ? "Low Stock"
          : "Out of Stock",
    };

    // Only include image field if we're not uploading a new one
    if (imageToSend !== undefined) {
      productToSave.image = imageToSend;
    }

    try {
      let productId = id;

      // Step 1: Create or update product basic info
      if (isEditMode) {
        await updateProductMutation.mutateAsync({
          id: id,
          data: productToSave,
        });
      } else {
        const newProduct = await createProductMutation.mutateAsync(productToSave);
        productId = newProduct?.product_id || newProduct?._id;
      }

      // Step 2: Upload new main image if changed (use dedicated endpoint)
      if (productId && hasNewMainImage) {
        const mainImageFormData = new FormData();
        mainImageFormData.append("images", mainImageFile);
        await updateMainImageMutation.mutateAsync({
          id: productId,
          formData: mainImageFormData,
        });
      }

      // Step 3: Upload additional images if any (use separate endpoint)
      if (productId && hasNewAdditionalImages) {
        const additionalFormData = new FormData();
        additionalImageFiles.forEach((file) => {
          additionalFormData.append("images", file);
        });
        await uploadImagesMutation.mutateAsync({
          id: productId,
          formData: additionalFormData,
        });
      }

      // Navigate back to products list on success
      navigate("/admin/products");
    } catch (error) {
      // Error is already handled in the mutation
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending || uploadImagesMutation.isPending || updateMainImageMutation.isPending;
  const isLoadingProduct = isEditMode && productLoading;

  // Show loading state when fetching product in edit mode
  if (isLoadingProduct) {
    return (
      <Container maxWidth="lg" sx={{ mt: 0, mb: 4 }} className="p-0!">
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mb: 2 }}>
            Back to Products
          </Button>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {[...Array(6)].map((_, i) => (
              <Grid key={i} size={{ xs: 12, md: 6 }}>
                <Skeleton variant="rectangular" height={56} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 0, mb: 4 }} className="p-0!">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          sx={{ mb: 2 }}
        >
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold text-[#0b0c1a] mb-2">
          {isEditMode ? "Edit Product" : "Add New Product"}
        </h1>
        <Typography color="text.secondary">
          {isEditMode
            ? "Update product information"
            : "Fill in the details to add a new product"}
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Part Number */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Part Number"
                value={productForm.part_number}
                onChange={(e) =>
                  handleFormChange("part_number", e.target.value)
                }
                required
                helperText="Unique identifier for the product"
              />
            </Grid>

            {/* Product Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Product Name"
                value={productForm.product_name}
                onChange={(e) =>
                  handleFormChange("product_name", e.target.value)
                }
                required
                helperText="Full name of the product"
              />
            </Grid>

            {/* Category */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={productForm.category}
                  label="Category"
                  onChange={(e) =>
                    handleFormChange("category", e.target.value)
                  }
                  disabled={categoriesLoading}
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {categoriesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading categories...
                    </MenuItem>
                  ) : (
                    categories.map((cat) => (
                      <MenuItem key={cat.category_id || cat._id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Brand */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={productForm.brand}
                  label="Brand"
                  onChange={(e) => handleFormChange("brand", e.target.value)}
                  disabled={brandsLoading}
                >
                  <MenuItem value="">
                    <em>Select Brand</em>
                  </MenuItem>
                  {brandsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading brands...
                    </MenuItem>
                  ) : (
                    brands.map((brand) => (
                      <MenuItem key={brand.brand_id || brand._id} value={brand.name}>
                        {brand.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Price */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Price (USD)"
                type="number"
                value={productForm.price}
                onChange={(e) =>
                  handleFormChange("price", e.target.value)
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                helperText={
                  productForm.price
                    ? `≈ ₹${(Number(productForm.price) * usdToInr).toFixed(2)} INR (1 USD = ₹${usdToInr})`
                    : `Conversion rate: 1 USD = ₹${usdToInr}`
                }
                inputProps={{ min: "0", step: "0.01" }}
              />
            </Grid>

            {/* Total Quantity */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Quantity"
                type="number"
                value={productForm.total_quantity}
                onChange={(e) =>
                  handleFormChange("total_quantity", e.target.value)
                }
                required
                helperText="Available stock"
                inputProps={{ min: "0" }}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={productForm.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                helperText="Detailed product description"
              />
            </Grid>

            {/* Main Product Image */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Main Product Image
              </Typography>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {/* Image Preview */}
                <Box
                  sx={{
                    width: 150,
                    height: 150,
                    border: "2px dashed #1976d2",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: "#f0f7ff",
                  }}
                >
                  {imagePreview ? (
                    <>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Product preview"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={() => setImagePreview(null)}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={handleRemoveImage}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          minWidth: "auto",
                          p: 0.5,
                          bgcolor: "rgba(255,255,255,0.9)",
                          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                        }}
                      >
                        <Delete fontSize="small" />
                      </Button>
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: "rgba(25, 118, 210, 0.9)",
                          color: "white",
                          textAlign: "center",
                          py: 0.5,
                        }}
                      >
                        Main Image
                      </Typography>
                    </>
                  ) : (
                    <Box sx={{ textAlign: "center", color: "#1976d2" }}>
                      <ImageIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="caption" display="block">
                        No main image
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Upload Options */}
                <Box sx={{ flex: 1, minWidth: 250 }}>
                  {/* File Upload */}
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                  >
                    Upload Main Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Supported formats: JPG, PNG, GIF (Max 5MB)
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Additional Product Images */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Additional Images
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add more images to showcase your product from different angles
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                {/* Existing Additional Images */}
                {additionalPreviews.map((img, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 100,
                      height: 100,
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      bgcolor: "#f9f9f9",
                    }}
                  >
                    <Box
                      component="img"
                      src={img}
                      alt={`Additional ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {/* Action buttons */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        opacity: 0,
                        transition: "opacity 0.2s",
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleSetAsMainImage(index)}
                        sx={{ fontSize: "10px", py: 0.25, px: 1, minWidth: "auto" }}
                      >
                        Set Main
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleRemoveAdditionalImage(index)}
                        sx={{ fontSize: "10px", py: 0.25, px: 1, minWidth: "auto" }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                ))}

                {/* Add More Button */}
                <Box
                  component="label"
                  sx={{
                    width: 100,
                    height: 100,
                    border: "2px dashed #ccc",
                    borderRadius: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    bgcolor: "#f9f9f9",
                    "&:hover": { borderColor: "#1976d2", bgcolor: "#f0f7ff" },
                  }}
                >
                  <CloudUpload sx={{ color: "#999", mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Add Image
                  </Typography>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImageUpload}
                  />
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Supported formats: JPG, PNG, GIF (Max 5MB each)
              </Typography>
            </Grid>

            {/* Stock Status Display */}
            {productForm.total_quantity !== undefined && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Stock Status:
                  </Typography>
                  <Typography
                    variant="h6"
                    color={
                      productForm.total_quantity > 50
                        ? "success.main"
                        : productForm.total_quantity > 0
                        ? "warning.main"
                        : "error.main"
                    }
                  >
                    {productForm.total_quantity > 50
                      ? "In Stock"
                      : productForm.total_quantity > 0
                      ? "Low Stock"
                      : "Out of Stock"}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Action Buttons */}
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  size="large"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  size="large"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : isEditMode
                    ? "Update Product"
                    : "Add Product"
                  }
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default AddEditProduct;
