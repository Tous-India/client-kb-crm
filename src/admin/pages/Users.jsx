import { useRef, useState } from "react";
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
  TableSortLabel,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TextField,
  IconButton,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  PersonAdd,
  Edit,
  Delete,
  Search,
  FilterList,
  AdminPanelSettings,
  ShoppingCart,
  Email,
  Phone,
  Business,
  LocationOn,
  CheckCircle,
  Cancel,
  Visibility,
  VisibilityOff,
  Receipt,
  Payment,
  LocalShipping,
  Description,
  Assessment,
  CloudUpload,
  Person,
  Close,
  Print,
  PictureAsPdf,
  Refresh,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import InvoicePrintPreview from "../components/InvoicePrintPreview";
import StatementPrintPreview from "../components/StatementPrintPreview";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useActivateUser, useDeactivateUser } from "../../hooks/useUsers";
import { useInvoices } from "../../hooks/useInvoices";
import useUsersStore from "../../stores/useUsersStore";
import { paymentRecordsService, proformaInvoicesService } from "../../services";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function Users() {
  const { usdToInr } = useCurrency();
  const invoicePrintRef = useRef(null);
  const statementPrintRef = useRef(null);

  // React Query - fetch users
  const { data: users = [], isLoading, isError, error, refetch } = useUsers();

  // React Query - fetch invoices for user details
  const { data: invoices = [] } = useInvoices();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();

  // Zustand store - UI state
  const {
    searchTerm,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
    page,
    rowsPerPage,
    selectedUser,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    isDetailsModalOpen,
    detailsTab,
    userForm,
    profileImagePreview,
    setSearchTerm,
    setRoleFilter,
    setStatusFilter,
    handleSort,
    setPage,
    setRowsPerPage,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    openDetailsModal,
    closeDetailsModal,
    setDetailsTab,
    setUserForm,
    updateUserForm,
    updateUserFormNested,
    resetUserForm,
    setProfileImagePreview,
    setProfileImageFile,
    clearProfileImage,
    getSortedUsers,
    getStats,
  } = useUsersStore();

  // State for user-specific data in profile modal
  const [userPayments, setUserPayments] = useState([]);
  const [userPIs, setUserPIs] = useState([]);
  const [loadingUserData, setLoadingUserData] = useState(false);

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Get computed values from store
  const sortedUsers = getSortedUsers(users);
  const stats = getStats(users);

  // Paginated users
  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle profile image upload
  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  // Print handlers
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showStatementPreview, setShowStatementPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const handlePrintInvoice = (invoice) => {
    setPreviewItem(invoice);
    setShowInvoicePreview(true);
  };

  const handlePrintStatement = (statement) => {
    setPreviewItem(statement);
    setShowStatementPreview(true);
  };

  const executePrint = (printRef, title) => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 0; }
              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
    }
  };

  // Create user handler
  const handleCreateUser = () => {
    const userData = {
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      phone: userForm.phone,
      address: userForm.address,
      company_details: userForm.company_details,
    };

    createUserMutation.mutate(userData, {
      onSuccess: () => {
        closeAddModal();
      },
    });
  };

  // Update user handler
  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const updateData = {
      name: userForm.name,
      // email is intentionally excluded - login email cannot be changed
      phone: userForm.phone,
      address: userForm.address,
      company_details: userForm.company_details,
    };

    updateUserMutation.mutate(
      { id: selectedUser._id, data: updateData },
      {
        onSuccess: () => {
          closeEditModal();
        },
      }
    );
  };

  // Delete user handler
  const handleDeleteUserConfirm = () => {
    if (!selectedUser) return;

    deleteUserMutation.mutate(selectedUser._id, {
      onSuccess: () => {
        closeDeleteModal();
      },
    });
  };

  // Toggle user status (activate/deactivate)
  const handleToggleUserStatus = (user) => {
    if (!user) return;

    // Use same logic as UI: is_active !== false means active
    if (user.is_active !== false) {
      deactivateUserMutation.mutate(user._id);
    } else {
      activateUserMutation.mutate(user._id);
    }
  };

  // Get user-specific invoices - filter by buyer._id or buyer (ObjectId string)
  const getUserInvoices = (userId) => {
    if (!userId) return [];
    return invoices.filter((inv) => {
      // Check various ways the buyer ID might be stored
      const buyerId = inv.buyer?._id || inv.buyer;
      const buyerIdStr = typeof buyerId === 'object' ? buyerId?.toString() : buyerId;
      const userIdStr = typeof userId === 'object' ? userId?.toString() : userId;
      return buyerIdStr === userIdStr || inv.buyer?._id === userId;
    });
  };

  // Fetch user-specific data (payments, PIs) when profile modal opens
  const fetchUserData = async (user) => {
    if (!user?._id) return;

    setLoadingUserData(true);
    try {
      // Fetch all payment records and filter by buyer
      const paymentsResult = await paymentRecordsService.getAll();
      if (paymentsResult?.success) {
        const allPayments = paymentsResult.data?.paymentRecords || paymentsResult.data || [];
        const userPaymentsList = Array.isArray(allPayments) ? allPayments.filter(payment => {
          const buyerId = payment.buyer?._id || payment.buyer;
          return buyerId === user._id ||
                 payment.buyer?.user_id === user.user_id ||
                 payment.buyer_name === user.name;
        }) : [];
        setUserPayments(userPaymentsList);
      }

      // Fetch all PIs and filter by buyer
      const pisResult = await proformaInvoicesService.getAll();
      if (pisResult?.success) {
        const allPIs = pisResult.data?.proformaInvoices || pisResult.data || [];
        const userPIsList = Array.isArray(allPIs) ? allPIs.filter(pi => {
          const buyerId = pi.buyer?._id || pi.buyer;
          return buyerId === user._id ||
                 pi.buyer?.user_id === user.user_id ||
                 pi.buyer_name === user.name;
        }) : [];
        setUserPIs(userPIsList);
      }
    } catch (error) {
      console.error('[Users] Error fetching user data:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  // Handle opening user details with data fetch
  const handleViewUserProfile = (user) => {
    openDetailsModal(user);
    setUserPayments([]);
    setUserPIs([]);
    fetchUserData(user);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  return (
    <Box sx={{ p: 0 }}>
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
            User Management
          </h1>
          <Typography variant="body1" color="text.secondary">
            Manage buyer accounts and admin users
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh users">
            <IconButton
              onClick={() => refetch()}
              disabled={isLoading}
              color="primary"
            >
              {isLoading ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Chip
            icon={<AdminPanelSettings />}
            label={`Admin: ${stats.admins}`}
            color="error"
            variant="outlined"
            className="px-2!"
          />
          <Chip
            icon={<ShoppingCart />}
            label={`Buyers: ${stats.buyers}`}
            color="primary"
            variant="outlined"
            className="px-2!"
          />
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={openAddModal}
          >
            Add User
          </Button>
        </Stack>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Name, Email, ID, or Company..."
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
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                <MenuItem value="SUB_ADMIN">Sub Admin</MenuItem>
                <MenuItem value="BUYER">Buyer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedUsers.length} of {sortedUsers.length} users
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Active/Inactive Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => {
            setStatusFilter(newValue);
            setPage(0); // Reset to first page when switching tabs
          }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            value="all"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>All Users</Typography>
                <Chip
                  label={users.length}
                  size="small"
                  color="default"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              </Stack>
            }
          />
          <Tab
            value="active"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle fontSize="small" color="success" />
                <Typography>Active</Typography>
                <Chip
                  label={users.filter(u => u.is_active !== false).length}
                  size="small"
                  color="success"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              </Stack>
            }
          />
          <Tab
            value="inactive"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Cancel fontSize="small" color="error" />
                <Typography>Inactive</Typography>
                <Chip
                  label={users.filter(u => u.is_active === false).length}
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        {isLoading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "user_id"}
                  direction={sortBy === "user_id" ? sortOrder : "asc"}
                  onClick={() => handleSort("user_id")}
                >
                  <strong>User ID</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortOrder : "asc"}
                  onClick={() => handleSort("name")}
                >
                  <strong>Name</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "email"}
                  direction={sortBy === "email" ? sortOrder : "asc"}
                  onClick={() => handleSort("email")}
                >
                  <strong>Email</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <strong>Company</strong>
              </TableCell>
              <TableCell>
                <strong>Location</strong>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === "role"}
                  direction={sortBy === "role" ? sortOrder : "asc"}
                  onClick={() => handleSort("role")}
                >
                  <strong>Role</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === "is_active"}
                  direction={sortBy === "is_active" ? sortOrder : "asc"}
                  onClick={() => handleSort("is_active")}
                >
                  <strong>Status</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading users...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="error">
                    {error?.message || 'Failed to load users'}
                    <Button size="small" onClick={() => refetch()} sx={{ ml: 2 }}>
                      Retry
                    </Button>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">No users found matching your criteria</Alert>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {user.user_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.company_details?.company_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {user.address?.city && user.address?.state
                        ? `${user.address.city}, ${user.address.state}`
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user.role === 'SUB_ADMIN' ? 'ADMIN' : user.role}
                      color={user.role === "SUPER_ADMIN" ? "secondary" : user.role === "SUB_ADMIN" ? "error" : "primary"}
                      size="small"
                      className="px-2!"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={user.is_active !== false ? <CheckCircle /> : <Cancel />}
                      label={user.is_active !== false ? "Active" : "Inactive"}
                      color={user.is_active !== false ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Full Profile">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewUserProfile(user)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {/* SUPER_ADMIN users cannot be deactivated */}
                      {user.role !== 'SUPER_ADMIN' && (
                        <Tooltip title={user.is_active !== false ? "Deactivate User" : "Activate User"}>
                          <IconButton
                            size="small"
                            color={user.is_active !== false ? "error" : "success"}
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={activateUserMutation.isPending || deactivateUserMutation.isPending}
                          >
                            {user.is_active !== false ? <Cancel /> : <CheckCircle />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={sortedUsers.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* User Details Dialog */}
      <Dialog
        open={isDetailsModalOpen}
        onClose={closeDetailsModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Complete User Profile
            </Typography>
            {selectedUser && (
              <Stack direction="row" spacing={1}>
                <Chip label={selectedUser.user_id} color="primary" />
                <Chip
                  icon={
                    selectedUser.role === "SUPER_ADMIN" || selectedUser.role === "SUB_ADMIN" ? (
                      <AdminPanelSettings />
                    ) : (
                      <ShoppingCart />
                    )
                  }
                  label={selectedUser.role}
                  color={selectedUser.role === "SUPER_ADMIN" || selectedUser.role === "SUB_ADMIN" ? "error" : "default"}
                />
                <Chip
                  icon={selectedUser.is_active !== false ? <CheckCircle /> : <Cancel />}
                  label={selectedUser.is_active !== false ? "Active" : "Inactive"}
                  color={selectedUser.is_active !== false ? "success" : "error"}
                  variant="outlined"
                />
              </Stack>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <>
              {/* Basic Info Card */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          bgcolor: "grey.200",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 2,
                          overflow: "hidden",
                        }}
                      >
                        {selectedUser.profile_image ? (
                          <img
                            src={selectedUser.profile_image}
                            alt={selectedUser.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Person sx={{ fontSize: 60, color: "grey.400" }} />
                        )}
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedUser.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.user_id}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Email color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body2">{selectedUser.email}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Phone color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body2">
                              {selectedUser.phone || selectedUser.company_details?.phone || "-"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Business color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Company
                            </Typography>
                            <Typography variant="body2">
                              {selectedUser.company_details?.company_name || "-"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Receipt color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Tax ID
                            </Typography>
                            <Typography variant="body2">
                              {selectedUser.company_details?.tax_id || "-"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocationOn color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Address
                            </Typography>
                            <Typography variant="body2">
                              {selectedUser.address
                                ? `${selectedUser.address.street || ""}, ${selectedUser.address.city || ""}, ${selectedUser.address.state || ""} ${selectedUser.address.zip || ""}, ${selectedUser.address.country || ""}`
                                : "-"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>

              {/* Tabs for different sections */}
              <Tabs
                value={detailsTab}
                onChange={(e, newValue) => setDetailsTab(newValue)}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab icon={<Receipt />} label="Invoices" iconPosition="start" />
                <Tab icon={<Payment />} label="Payments" iconPosition="start" />
                <Tab icon={<LocalShipping />} label="Orders" iconPosition="start" />
                <Tab icon={<Assessment />} label="Statistics" iconPosition="start" />
                <Tab icon={<Description />} label="Statement" iconPosition="start" />
              </Tabs>

              {/* Invoices Tab */}
              <TabPanel value={detailsTab} index={0}>
                {getUserInvoices(selectedUser._id).length === 0 ? (
                  <Alert severity="info">No invoices found for this user</Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Invoice #</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getUserInvoices(selectedUser._id).map((inv) => (
                          <TableRow key={inv._id || inv.invoice_id}>
                            <TableCell>{inv.invoice_number}</TableCell>
                            <TableCell>
                              {new Date(inv.invoice_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              ${(inv.total_amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={inv.status}
                                size="small"
                                color={inv.status === "PAID" ? "success" : "warning"}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Print Invoice">
                                <IconButton
                                  size="small"
                                  onClick={() => handlePrintInvoice(inv)}
                                >
                                  <Print fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              {/* Payments Tab */}
              <TabPanel value={detailsTab} index={1}>
                {loadingUserData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : userPayments.length === 0 ? (
                  <Alert severity="info">No payment records found for this user</Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Payment ID</strong></TableCell>
                          <TableCell><strong>PI Number</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                          <TableCell><strong>Method</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userPayments.map((payment) => (
                          <TableRow key={payment._id || payment.payment_id}>
                            <TableCell>{payment.payment_id || payment._id?.slice(-8)}</TableCell>
                            <TableCell>{payment.proforma_number || payment.pi_number || '-'}</TableCell>
                            <TableCell>
                              {payment.payment_date
                                ? new Date(payment.payment_date).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              ${(payment.amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>{payment.payment_method || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={payment.status || 'PENDING'}
                                size="small"
                                color={
                                  payment.status === 'VERIFIED' || payment.status === 'APPROVED' ? 'success' :
                                  payment.status === 'REJECTED' ? 'error' : 'warning'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              {/* Orders/PIs Tab */}
              <TabPanel value={detailsTab} index={2}>
                {loadingUserData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : userPIs.length === 0 ? (
                  <Alert severity="info">No orders/proforma invoices found for this user</Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>PI Number</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                          <TableCell><strong>Payment</strong></TableCell>
                          <TableCell><strong>Dispatch</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userPIs.map((pi) => (
                          <TableRow key={pi._id || pi.proforma_number}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {pi.proforma_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {pi.issue_date
                                ? new Date(pi.issue_date).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              ${(pi.total_amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={pi.payment_status || 'UNPAID'}
                                size="small"
                                color={
                                  pi.payment_status === 'PAID' ? 'success' :
                                  pi.payment_status === 'PARTIAL' ? 'warning' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={pi.dispatch_status || 'NONE'}
                                size="small"
                                color={
                                  pi.dispatch_status === 'FULL' ? 'success' :
                                  pi.dispatch_status === 'PARTIAL' ? 'warning' : 'default'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              {/* Statistics Tab */}
              <TabPanel value={detailsTab} index={3}>
                {loadingUserData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {/* Row 1: Counts */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {userPIs.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total PIs
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h4" fontWeight="bold" color="secondary">
                          {getUserInvoices(selectedUser._id).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Invoices
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h4" fontWeight="bold" color="info.main">
                          {userPayments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payment Records
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h4" fontWeight="bold" color="text.secondary">
                          {selectedUser.createdAt
                            ? new Date(selectedUser.createdAt).toLocaleDateString()
                            : "-"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Member Since
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Row 2: Amounts */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          ${userPIs.reduce((sum, pi) => sum + (pi.total_amount || 0), 0).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total PI Value
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          ${userPIs
                            .filter((pi) => pi.payment_status === "PAID")
                            .reduce((sum, pi) => sum + (pi.total_amount || 0), 0)
                            .toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Paid Amount
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">
                          ${userPIs
                            .filter((pi) => pi.payment_status !== "PAID")
                            .reduce((sum, pi) => sum + (pi.total_amount || 0) - (pi.payment_received || 0), 0)
                            .toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Outstanding
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          {userPIs.filter((pi) => pi.dispatch_status === "FULL").length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fully Dispatched
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </TabPanel>

              {/* Statement Tab */}
              <TabPanel value={detailsTab} index={4}>
                {loadingUserData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box>
                    {/* Statement Table */}
                    {getUserInvoices(selectedUser._id).length === 0 && userPayments.length === 0 ? (
                      <Alert severity="info">No transactions found for this user</Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                              <TableCell><strong>Date</strong></TableCell>
                              <TableCell><strong>Type</strong></TableCell>
                              <TableCell><strong>Reference</strong></TableCell>
                              <TableCell><strong>Invoice/PI</strong></TableCell>
                              <TableCell><strong>Description</strong></TableCell>
                              <TableCell><strong>Status</strong></TableCell>
                              <TableCell align="right"><strong>Debit ($)</strong></TableCell>
                              <TableCell align="right"><strong>Credit ($)</strong></TableCell>
                              <TableCell align="right"><strong>Balance ($)</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              const transactions = [
                                ...getUserInvoices(selectedUser._id).map(inv => ({
                                  type: 'INVOICE',
                                  date: inv.invoice_date || inv.createdAt,
                                  reference: inv.invoice_number,
                                  linkedDoc: '-',
                                  description: `${inv.items?.length || 0} item(s)`,
                                  status: inv.payment_status || inv.status || 'UNPAID',
                                  debit: inv.total_amount || 0,
                                  credit: 0,
                                  _id: inv._id
                                })),
                                ...userPayments.map(pay => ({
                                  type: 'PAYMENT',
                                  date: pay.payment_date || pay.createdAt,
                                  reference: pay.payment_id || pay.transaction_id || '-',
                                  linkedDoc: pay.invoice_number || pay.proforma_number || pay.pi_number || '-',
                                  description: pay.payment_method || 'Unknown',
                                  status: pay.status || 'PENDING',
                                  debit: 0,
                                  credit: pay.amount || 0,
                                  _id: pay._id
                                }))
                              ].sort((a, b) => new Date(a.date) - new Date(b.date));

                              let runningBalance = 0;
                              return transactions.map((item, index) => {
                                runningBalance += item.debit - item.credit;
                                return (
                                  <TableRow key={item._id || index} hover>
                                    <TableCell>
                                      {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={item.type}
                                        size="small"
                                        color={item.type === 'INVOICE' ? 'primary' : 'success'}
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>{item.reference}</TableCell>
                                    <TableCell>{item.linkedDoc}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={item.status}
                                        size="small"
                                        color={
                                          item.status === 'PAID' || item.status === 'VERIFIED' || item.status === 'APPROVED' ? 'success' :
                                          item.status === 'REJECTED' ? 'error' :
                                          item.status === 'PARTIAL' ? 'warning' : 'default'
                                        }
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: item.debit > 0 ? 'error.main' : 'text.disabled' }}>
                                      {item.debit > 0 ? item.debit.toFixed(2) : '-'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: item.credit > 0 ? 'success.main' : 'text.disabled' }}>
                                      {item.credit > 0 ? item.credit.toFixed(2) : '-'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                      {runningBalance.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                              <TableCell colSpan={6}><strong>Total</strong></TableCell>
                              <TableCell align="right" sx={{ color: 'error.main' }}>
                                <strong>{getUserInvoices(selectedUser._id).reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)}</strong>
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'success.main' }}>
                                <strong>{userPayments.filter(p => p.status === 'VERIFIED' || p.status === 'APPROVED').reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</strong>
                              </TableCell>
                              <TableCell align="right">
                                <strong>{(
                                  getUserInvoices(selectedUser._id).reduce((sum, inv) => sum + (inv.total_amount || 0), 0) -
                                  userPayments.filter(p => p.status === 'VERIFIED' || p.status === 'APPROVED').reduce((sum, p) => sum + (p.amount || 0), 0)
                                ).toFixed(2)}</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
              </TabPanel>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailsModal}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => {
              closeDetailsModal();
              openEditModal(selectedUser);
            }}
          >
            Edit User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={isAddModalOpen}
        onClose={closeAddModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonAdd color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Add New User
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={userForm.name}
                onChange={(e) => updateUserForm("name", e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => updateUserForm("email", e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={userForm.password}
                onChange={(e) => updateUserForm("password", e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={userForm.phone}
                onChange={(e) => updateUserForm("phone", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Company Details
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={userForm.company_details.company_name}
                onChange={(e) =>
                  updateUserFormNested("company_details", "company_name", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tax ID"
                value={userForm.company_details.tax_id}
                onChange={(e) =>
                  updateUserFormNested("company_details", "tax_id", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Company Phone"
                value={userForm.company_details.phone}
                onChange={(e) =>
                  updateUserFormNested("company_details", "phone", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Billing Email"
                value={userForm.company_details.billing_email}
                onChange={(e) =>
                  updateUserFormNested("company_details", "billing_email", e.target.value)
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Street Address"
                value={userForm.address.street}
                onChange={(e) =>
                  updateUserFormNested("address", "street", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="City"
                value={userForm.address.city}
                onChange={(e) =>
                  updateUserFormNested("address", "city", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="State"
                value={userForm.address.state}
                onChange={(e) =>
                  updateUserFormNested("address", "state", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={userForm.address.zip}
                onChange={(e) =>
                  updateUserFormNested("address", "zip", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Country"
                value={userForm.address.country}
                onChange={(e) =>
                  updateUserFormNested("address", "country", e.target.value)
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={!userForm.name || !userForm.email || !userForm.password || createUserMutation.isPending}
            startIcon={createUserMutation.isPending ? <CircularProgress size={20} /> : <PersonAdd />}
          >
            {createUserMutation.isPending ? "Creating..." : "Add User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditModalOpen}
        onClose={closeEditModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Edit color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Edit User
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={userForm.name}
                onChange={(e) => updateUserForm("name", e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                disabled
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Login email cannot be changed"
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#333",
                    bgcolor: "#f5f5f5",
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={userForm.phone}
                onChange={(e) => updateUserForm("phone", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Company Details
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={userForm.company_details.company_name}
                onChange={(e) =>
                  updateUserFormNested("company_details", "company_name", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tax ID"
                value={userForm.company_details.tax_id}
                onChange={(e) =>
                  updateUserFormNested("company_details", "tax_id", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Company Phone"
                value={userForm.company_details.phone}
                onChange={(e) =>
                  updateUserFormNested("company_details", "phone", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Billing Email"
                value={userForm.company_details.billing_email}
                onChange={(e) =>
                  updateUserFormNested("company_details", "billing_email", e.target.value)
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Street Address"
                value={userForm.address.street}
                onChange={(e) =>
                  updateUserFormNested("address", "street", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="City"
                value={userForm.address.city}
                onChange={(e) =>
                  updateUserFormNested("address", "city", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="State"
                value={userForm.address.state}
                onChange={(e) =>
                  updateUserFormNested("address", "state", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={userForm.address.zip}
                onChange={(e) =>
                  updateUserFormNested("address", "zip", e.target.value)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Country"
                value={userForm.address.country}
                onChange={(e) =>
                  updateUserFormNested("address", "country", e.target.value)
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={!userForm.name || updateUserMutation.isPending}
            startIcon={updateUserMutation.isPending ? <CircularProgress size={20} /> : <Edit />}
          >
            {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Delete color="error" />
            <Typography variant="h6" fontWeight="bold">
              Deactivate User
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will deactivate the user account. They will not be able to log in until reactivated.
          </Alert>
          {selectedUser && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {selectedUser.user_id}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteModal}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUserConfirm}
            disabled={deleteUserMutation.isPending}
            startIcon={deleteUserMutation.isPending ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleteUserMutation.isPending ? "Deactivating..." : "Deactivate User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Print Preview Dialog */}
      <Dialog
        open={showInvoicePreview}
        onClose={() => setShowInvoicePreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Invoice Preview</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<Print />}
                variant="contained"
                size="small"
                onClick={() => executePrint(invoicePrintRef, `Invoice - ${previewItem?.invoice_number}`)}
              >
                Print
              </Button>
              <IconButton onClick={() => setShowInvoicePreview(false)}>
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#e8e8e8", display: "flex", justifyContent: "center" }}>
          {previewItem && (
            <InvoicePrintPreview
              ref={invoicePrintRef}
              invoice={previewItem}
              globalRate={usdToInr}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Statement Print Preview Dialog */}
      <Dialog
        open={showStatementPreview}
        onClose={() => setShowStatementPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Statement Preview</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<Print />}
                variant="contained"
                size="small"
                onClick={() => executePrint(statementPrintRef, `Statement - ${previewItem?.statement_number}`)}
              >
                Print
              </Button>
              <IconButton onClick={() => setShowStatementPreview(false)}>
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#e8e8e8", display: "flex", justifyContent: "center" }}>
          {previewItem && (
            <StatementPrintPreview
              ref={statementPrintRef}
              statement={previewItem}
              globalRate={usdToInr}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Users;
