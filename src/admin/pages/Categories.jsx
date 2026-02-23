import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Tooltip,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Close,
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
  Category as CategoryIcon,
} from "@mui/icons-material";
import categoriesService from "../../services/categories.service";
import { showSuccess, showError } from "../../utils/toast";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Sub-category modal states
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  // Expanded rows for sub-categories
  const [expandedRows, setExpandedRows] = useState({});

  // Form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    display_order: 0,
  });

  // Sub-category form
  const [subCategoryForm, setSubCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Pagination and filter
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await categoriesService.getAll({ all: 'true' });
      if (result.success) {
        setCategories(result.data?.categories || []);
      } else {
        showError(result.error || "Failed to fetch categories");
      }
    } catch (err) {
      showError("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    return (
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.category_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedCategories = filteredCategories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Toggle row expansion
  const toggleExpand = (categoryId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Reset form
  const resetForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      display_order: 0,
    });
  };

  // Handle Add
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Handle Edit
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      display_order: category.display_order || 0,
    });
    setShowEditModal(true);
  };

  // Handle Save (Add/Edit)
  const handleSave = async (isEdit = false) => {
    if (!categoryForm.name.trim()) {
      showError("Category name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && selectedCategory) {
        const result = await categoriesService.update(
          selectedCategory._id || selectedCategory.category_id,
          categoryForm
        );
        if (result.success) {
          await fetchCategories();
          setShowEditModal(false);
          showSuccess("Category updated successfully");
        } else {
          showError(result.error || "Failed to update category");
        }
      } else {
        const result = await categoriesService.create(categoryForm);
        if (result.success) {
          await fetchCategories();
          setShowAddModal(false);
          showSuccess("Category created successfully");
        } else {
          showError(result.error || "Failed to create category");
        }
      }
      resetForm();
    } catch (err) {
      showError("Failed to save category");
      console.error("Error saving category:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      const result = await categoriesService.delete(category._id || category.category_id);
      if (result.success) {
        await fetchCategories();
        showSuccess("Category deleted successfully");
      } else {
        showError(result.error || "Failed to delete category");
      }
    } catch (err) {
      showError("Failed to delete category");
      console.error("Error deleting category:", err);
    }
  };

  // Handle Add Sub-Category
  const handleAddSubCategory = (category) => {
    setSelectedCategory(category);
    setEditingSubCategory(null);
    setSubCategoryForm({ name: "", description: "" });
    setShowSubCategoryModal(true);
  };

  // Handle Edit Sub-Category
  const handleEditSubCategory = (category, subCategory) => {
    setSelectedCategory(category);
    setEditingSubCategory(subCategory);
    setSubCategoryForm({
      name: subCategory.name || "",
      description: subCategory.description || "",
    });
    setShowSubCategoryModal(true);
  };

  // Handle Save Sub-Category
  const handleSaveSubCategory = async () => {
    if (!subCategoryForm.name.trim()) {
      showError("Sub-category name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingSubCategory) {
        const result = await categoriesService.updateSubCategory(
          selectedCategory._id || selectedCategory.category_id,
          editingSubCategory.sub_category_id,
          subCategoryForm
        );
        if (result.success) {
          await fetchCategories();
          setShowSubCategoryModal(false);
          showSuccess("Sub-category updated successfully");
        } else {
          showError(result.error || "Failed to update sub-category");
        }
      } else {
        const result = await categoriesService.addSubCategory(
          selectedCategory._id || selectedCategory.category_id,
          subCategoryForm
        );
        if (result.success) {
          await fetchCategories();
          setShowSubCategoryModal(false);
          showSuccess("Sub-category added successfully");
        } else {
          showError(result.error || "Failed to add sub-category");
        }
      }
    } catch (err) {
      showError("Failed to save sub-category");
      console.error("Error saving sub-category:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Sub-Category
  const handleDeleteSubCategory = async (category, subCategory) => {
    if (!window.confirm(`Are you sure you want to delete "${subCategory.name}"?`)) {
      return;
    }

    try {
      const result = await categoriesService.deleteSubCategory(
        category._id || category.category_id,
        subCategory.sub_category_id
      );
      if (result.success) {
        await fetchCategories();
        showSuccess("Sub-category deleted successfully");
      } else {
        showError(result.error || "Failed to delete sub-category");
      }
    } catch (err) {
      showError("Failed to delete sub-category");
      console.error("Error deleting sub-category:", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Categories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage product categories and sub-categories
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{ bgcolor: "#1976d2" }}
          >
            Add Category
          </Button>
        </Stack>
      </Paper>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 2, bgcolor: "#e3f2fd" }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {categories.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Categories
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 2, bgcolor: "#e8f5e9" }}>
          <Typography variant="h4" fontWeight="bold" color="success.main">
            {categories.filter((c) => c.is_active !== false).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Categories
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 2, bgcolor: "#fff3e0" }}>
          <Typography variant="h4" fontWeight="bold" color="warning.main">
            {categories.reduce((sum, c) => sum + (c.sub_categories?.length || 0), 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Sub-categories
          </Typography>
        </Paper>
      </Stack>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {filteredCategories.length} categories found
          </Typography>
        </Stack>
      </Paper>

      {/* Categories Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold", width: 50 }}></TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Sub-categories
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Order
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Loading categories...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <>
                    <TableRow key={category._id || category.category_id} hover>
                      <TableCell>
                        {category.sub_categories?.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(category._id || category.category_id)}
                          >
                            {expandedRows[category._id || category.category_id] ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {category.category_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CategoryIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight="medium">
                            {category.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {category.description || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={category.sub_categories?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{category.display_order || 0}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={category.is_active !== false ? "Active" : "Inactive"}
                          size="small"
                          color={category.is_active !== false ? "success" : "default"}
                          icon={
                            category.is_active !== false ? (
                              <CheckCircle sx={{ fontSize: 14 }} />
                            ) : (
                              <Cancel sx={{ fontSize: 14 }} />
                            )
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Add Sub-category">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAddSubCategory(category)}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(category)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(category)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {/* Sub-categories collapse */}
                    {category.sub_categories?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0, bgcolor: "#fafafa" }}>
                          <Collapse in={expandedRows[category._id || category.category_id]}>
                            <Box sx={{ p: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Sub-categories
                              </Typography>
                              <List dense disablePadding>
                                {category.sub_categories.map((sub) => (
                                  <ListItem
                                    key={sub.sub_category_id}
                                    sx={{
                                      bgcolor: "white",
                                      mb: 0.5,
                                      borderRadius: 1,
                                      border: "1px solid #e0e0e0",
                                    }}
                                  >
                                    <ListItemText
                                      primary={sub.name}
                                      secondary={sub.description || "No description"}
                                      primaryTypographyProps={{ fontWeight: 500 }}
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditSubCategory(category, sub)}
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteSubCategory(category, sub)}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No categories found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredCategories.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      {/* Add/Edit Category Modal */}
      <Dialog
        open={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {showEditModal ? "Edit Category" : "Add New Category"}
            </Typography>
            <IconButton
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              type="number"
              label="Display Order"
              value={categoryForm.display_order}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })
              }
              helperText="Lower numbers appear first"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSave(showEditModal)}
            disabled={!categoryForm.name.trim() || saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : showEditModal ? "Save Changes" : "Add Category"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Sub-Category Modal */}
      <Dialog
        open={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingSubCategory ? "Edit Sub-category" : "Add Sub-category"}
            </Typography>
            <IconButton onClick={() => setShowSubCategoryModal(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Adding to: <strong>{selectedCategory?.name}</strong>
          </Alert>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Sub-category Name"
              value={subCategoryForm.name}
              onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={subCategoryForm.description}
              onChange={(e) =>
                setSubCategoryForm({ ...subCategoryForm, description: e.target.value })
              }
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubCategoryModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSubCategory}
            disabled={!subCategoryForm.name.trim() || saving}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingSubCategory ? (
              "Save Changes"
            ) : (
              "Add Sub-category"
            )}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Categories;
