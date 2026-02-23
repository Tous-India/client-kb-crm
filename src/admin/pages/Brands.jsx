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
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Close,
  CheckCircle,
  Cancel,
  Image as ImageIcon,
  Language,
} from "@mui/icons-material";
import brandsService from "../../services/brands.service";
import { showSuccess, showError } from "../../utils/toast";

function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Form state
  const [brandForm, setBrandForm] = useState({
    name: "",
    description: "",
    website: "",
  });

  // Pagination and filter
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch brands from API
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const result = await brandsService.getAll({ all: 'true' });
      if (result.success) {
        setBrands(result.data?.brands || []);
      } else {
        showError(result.error || "Failed to fetch brands");
      }
    } catch (err) {
      showError("Failed to fetch brands");
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Filter brands
  const filteredBrands = brands.filter((brand) => {
    return (
      brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.brand_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedBrands = filteredBrands.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Reset form
  const resetForm = () => {
    setBrandForm({
      name: "",
      description: "",
      website: "",
    });
  };

  // Handle Add
  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Handle Edit
  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setBrandForm({
      name: brand.name || "",
      description: brand.description || "",
      website: brand.website || "",
    });
    setShowEditModal(true);
  };

  // Handle Save (Add/Edit)
  const handleSave = async (isEdit = false) => {
    if (!brandForm.name.trim()) {
      showError("Brand name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && selectedBrand) {
        const result = await brandsService.update(
          selectedBrand._id || selectedBrand.brand_id,
          brandForm
        );
        if (result.success) {
          await fetchBrands();
          setShowEditModal(false);
          showSuccess("Brand updated successfully");
        } else {
          showError(result.error || "Failed to update brand");
        }
      } else {
        const result = await brandsService.create(brandForm);
        if (result.success) {
          await fetchBrands();
          setShowAddModal(false);
          showSuccess("Brand created successfully");
        } else {
          showError(result.error || "Failed to create brand");
        }
      }
      resetForm();
    } catch (err) {
      showError("Failed to save brand");
      console.error("Error saving brand:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (brand) => {
    if (!window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      return;
    }

    try {
      const result = await brandsService.delete(brand._id || brand.brand_id);
      if (result.success) {
        await fetchBrands();
        showSuccess("Brand deleted successfully");
      } else {
        showError(result.error || "Failed to delete brand");
      }
    } catch (err) {
      showError("Failed to delete brand");
      console.error("Error deleting brand:", err);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "BR";
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
              Brands
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage product brands and manufacturers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{ bgcolor: "#1976d2" }}
          >
            Add Brand
          </Button>
        </Stack>
      </Paper>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 2, bgcolor: "#e3f2fd" }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {brands.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Brands
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 2, bgcolor: "#e8f5e9" }}>
          <Typography variant="h4" fontWeight="bold" color="success.main">
            {brands.filter((b) => b.is_active !== false).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Brands
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 2, bgcolor: "#fff3e0" }}>
          <Typography variant="h4" fontWeight="bold" color="warning.main">
            {brands.filter((b) => b.website).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            With Website
          </Typography>
        </Paper>
      </Stack>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search brands..."
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
            {filteredBrands.length} brands found
          </Typography>
        </Stack>
      </Paper>

      {/* Brands Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Website</TableCell>
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
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Loading brands...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedBrands.length > 0 ? (
                paginatedBrands.map((brand) => (
                  <TableRow key={brand._id || brand.brand_id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={brand.logo?.url}
                          sx={{ bgcolor: "#1976d2", width: 40, height: 40 }}
                        >
                          {getInitials(brand.name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {brand.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary" fontWeight="medium">
                        {brand.brand_id}
                      </Typography>
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
                        {brand.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {brand.website ? (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Language fontSize="small" color="action" />
                          <Typography
                            variant="body2"
                            component="a"
                            href={brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "primary.main", textDecoration: "none" }}
                          >
                            {brand.website.replace(/^https?:\/\//, "").slice(0, 30)}
                            {brand.website.length > 30 ? "..." : ""}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={brand.is_active !== false ? "Active" : "Inactive"}
                        size="small"
                        color={brand.is_active !== false ? "success" : "default"}
                        icon={
                          brand.is_active !== false ? (
                            <CheckCircle sx={{ fontSize: 14 }} />
                          ) : (
                            <Cancel sx={{ fontSize: 14 }} />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(brand)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(brand)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No brands found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredBrands.length}
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

      {/* Add/Edit Brand Modal */}
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
              {showEditModal ? "Edit Brand" : "Add New Brand"}
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
              label="Brand Name"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={brandForm.description}
              onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Website"
              value={brandForm.website}
              onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
              placeholder="https://example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Language />
                  </InputAdornment>
                ),
              }}
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
            disabled={!brandForm.name.trim() || saving}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : showEditModal ? (
              "Save Changes"
            ) : (
              "Add Brand"
            )}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Brands;
