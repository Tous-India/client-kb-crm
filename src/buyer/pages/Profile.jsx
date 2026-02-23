import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Divider,
  Link,
  Breadcrumbs,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Alert,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import client from "../../services/api/client";
import endpoints from "../../services/api/endpoints";
import { useAuth } from "../../context/AuthContext";

function Profile() {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Courier account states
  const [upsAccount, setUpsAccount] = useState("");
  const [fedexAccount, setFedexAccount] = useState("");
  const [dhlAccount, setDhlAccount] = useState("");

  // Profile data from API
  const [profile, setProfile] = useState(null);

  // Edit Profile Form States
  const [editForm, setEditForm] = useState({
    company: "",
    contact: "",
    address: "",
    email: "",
    city: "",
    state: "",
    phone: "",
    fax: "",
    zipcode: "",
    country: "IN",
    website: "",
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.get(endpoints.USERS.PROFILE);
      const user = response.data.data.user;
      setProfile(user);

      // Populate edit form with user data
      setEditForm({
        company: user.company_details?.company_name || user.name || "",
        contact: user.name || "",
        address: user.address?.street || "",
        email: user.email || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        phone: user.phone || "",
        fax: user.fax || "",
        zipcode: user.address?.zip || "",
        country: user.address?.country || "IN",
        website: user.website || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile. Please try again.");
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const updateData = {
        name: editForm.contact,
        // email is intentionally excluded - login email cannot be changed
        phone: editForm.phone,
        fax: editForm.fax,
        website: editForm.website,
        address: {
          street: editForm.address,
          city: editForm.city,
          state: editForm.state,
          zip: editForm.zipcode,
          country: editForm.country,
        },
        company_details: {
          company_name: editForm.company,
        },
      };

      await client.put(endpoints.USERS.UPDATE_PROFILE, updateData);
      // Refresh user from server to update header (better than manual sync)
      await refreshUser();
      toast.success("Profile updated successfully!");
      fetchProfile(); // Refresh profile data
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current profile data
    if (profile) {
      setEditForm({
        company: profile.company_details?.company_name || profile.name || "",
        contact: profile.name || "",
        address: profile.address?.street || "",
        email: profile.email || "",
        city: profile.address?.city || "",
        state: profile.address?.state || "",
        phone: profile.phone || "",
        fax: profile.fax || "",
        zipcode: profile.address?.zip || "",
        country: profile.address?.country || "IN",
        website: profile.website || "",
      });
    }
    toast.info("Changes cancelled");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please enter both current and new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      await client.put(endpoints.USERS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAddress = (index) => {
    console.log("Delete address", index);
    toast.info("This feature is coming soon");
  };

  const handleSaveChanges = () => {
    toast.info("Courier accounts feature coming soon");
  };

  // Shipping addresses from profile
  const shippingAddresses = profile?.address
    ? [
        {
          title: profile.company_details?.company_name || profile.name,
          address: profile.address.street || "",
          city: profile.address.city || "",
          state: profile.address.state || "",
          zip: profile.address.zip || "",
          country: profile.address.country || "",
        },
      ]
    : [];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchProfile}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
        My Profile
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
        <Typography color="text.primary">My Profile</Typography>
      </Breadcrumbs>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "500",
              fontSize: "0.95rem",
              color: "#666",
              "&.Mui-selected": {
                color: "#1976d2",
                fontWeight: "600",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#1976d2",
              height: 3,
            },
          }}
        >
          <Tab label="Profile" />
          <Tab label="Edit Profile" />
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Sidebar - Only show on Profile tab */}
        {activeTab === 0 && (
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  onClick={() => setSidebarTab(0)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    bgcolor: sidebarTab === 0 ? "#1976d2" : "transparent",
                    color: sidebarTab === 0 ? "white" : "inherit",
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: sidebarTab === 0 ? "#1976d2" : "#f5f5f5",
                    },
                  }}
                >
                  <PersonIcon />
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: sidebarTab === 0 ? "bold" : "normal" }}
                  >
                    Profile
                  </Typography>
                </Box>

                <Box
                  onClick={() => setSidebarTab(1)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    cursor: "pointer",
                    bgcolor: sidebarTab === 1 ? "#1976d2" : "transparent",
                    color: sidebarTab === 1 ? "white" : "inherit",
                    "&:hover": {
                      bgcolor: sidebarTab === 1 ? "#1976d2" : "#f5f5f5",
                    },
                    borderRadius: 1,
                  }}
                >
                  <LockIcon />
                  <Typography variant="body2">Username & Password</Typography>
                </Box>

                <Box
                  onClick={() => setSidebarTab(2)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    cursor: "pointer",
                    bgcolor: sidebarTab === 2 ? "#1976d2" : "transparent",
                    color: sidebarTab === 2 ? "white" : "inherit",
                    "&:hover": {
                      bgcolor: sidebarTab === 2 ? "#1976d2" : "#f5f5f5",
                    },
                    borderRadius: 1,
                  }}
                >
                  <LocalShippingIcon />
                  <Typography variant="body2">Shipping Address</Typography>
                </Box>

                <Box
                  onClick={() => setSidebarTab(3)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    cursor: "pointer",
                    bgcolor: sidebarTab === 3 ? "#1976d2" : "transparent",
                    color: sidebarTab === 3 ? "white" : "inherit",
                    "&:hover": {
                      bgcolor: sidebarTab === 3 ? "#1976d2" : "#f5f5f5",
                    },
                    borderRadius: 1,
                  }}
                >
                  <AccountBalanceIcon />
                  <Typography variant="body2">Courier accounts</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Main Content Area */}
        <Grid size={{ xs: 12, md: activeTab === 0 ? 9 : 12 }}>
          <Paper sx={{ p: 3 }}>
            {/* Profile Tab Content */}
            {activeTab === 0 && sidebarTab === 0 && (
              <>
                {/* Company Section */}
                <Typography
                  variant="h5"
                  sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
                >
                  Company
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", mb: 0.5 }}
                    >
                      {profile?.company_details?.company_name || profile?.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Customer Code: {profile?.user_id}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {profile?.address?.street || "-"}
                      </Typography>
                      <Typography variant="body1">
                        {profile?.address?.city}
                        {profile?.address?.state && `, ${profile.address.state}`}{" "}
                        {profile?.address?.zip}
                      </Typography>
                      <Typography variant="body1">
                        {profile?.address?.country}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Contact Information
                      </Typography>
                      <Typography variant="body1">
                        Email: {profile?.email}
                      </Typography>
                      <Typography variant="body1">
                        Phone: {profile?.phone || "-"}
                      </Typography>
                      <Typography variant="body1">
                        Fax: {profile?.fax || "-"}
                      </Typography>
                      <Typography variant="body1">
                        Website: {profile?.website || "-"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Quick Links */}
                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                  <Link href="/buyer" underline="hover" sx={{ cursor: "pointer" }}>
                    Home
                  </Link>
                  <Link
                    href="/buyer/web-orders"
                    underline="hover"
                    sx={{ cursor: "pointer" }}
                  >
                    Web Orders
                  </Link>
                  <Link
                    href="/buyer/quote"
                    underline="hover"
                    sx={{ cursor: "pointer" }}
                  >
                    Quotes
                  </Link>
                  <Link
                    href="/buyer/open-orders"
                    underline="hover"
                    sx={{ cursor: "pointer" }}
                  >
                    Open Orders
                  </Link>
                  <Link
                    href="/buyer/statements"
                    underline="hover"
                    sx={{ cursor: "pointer" }}
                  >
                    Statements
                  </Link>
                  <Link
                    href="/buyer/invoices"
                    underline="hover"
                    sx={{ cursor: "pointer" }}
                  >
                    Invoices
                  </Link>
                </Box>
              </>
            )}

            {/* Username & Password Tab Content */}
            {activeTab === 0 && sidebarTab === 1 && (
              <>
                <Typography
                  variant="h5"
                  sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
                >
                  Username & Password
                </Typography>

                <Grid container columnSpacing="5px" rowSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      Username:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {profile?.email}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      Current Password:
                    </Typography>
                    <TextField
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                    />

                    <Typography
                      variant="body1"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      New Password:
                    </Typography>
                    <TextField
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                      sx={{ mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      The password must contain at least 6 characters
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#1565c0" },
                        }}
                      >
                        {changingPassword ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setCurrentPassword("");
                          setNewPassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Shipping Address Tab Content */}
            {activeTab === 0 && sidebarTab === 2 && (
              <>
                <Typography
                  variant="h5"
                  sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
                >
                  Shipping Address
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    mb: 3,
                    bgcolor: "#90a4ae",
                    "&:hover": { bgcolor: "#78909c" },
                  }}
                  onClick={() => toast.info("Add shipping address feature coming soon")}
                >
                  Create a new ship address
                </Button>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Address</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shippingAddresses.length > 0 ? (
                        shippingAddresses.map((addr, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ verticalAlign: "top" }}>
                              {addr.title}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{addr.address}</Typography>
                              <Typography variant="body2">{addr.city}</Typography>
                              <Typography variant="body2">
                                {addr.state}, {addr.zip} - {addr.country}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleDeleteAddress(index)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No shipping addresses found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Courier Accounts Tab Content */}
            {activeTab === 0 && sidebarTab === 3 && (
              <>
                <Typography
                  variant="h5"
                  sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
                >
                  Courier accounts
                </Typography>

                <Grid container columnSpacing="5px" rowSpacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      UPS account:
                    </Typography>
                    <TextField
                      placeholder="UPS"
                      value={upsAccount}
                      onChange={(e) => setUpsAccount(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      FEDEX account:
                    </Typography>
                    <TextField
                      placeholder="FEDEX"
                      value={fedexAccount}
                      onChange={(e) => setFedexAccount(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      DHL account:
                    </Typography>
                    <TextField
                      placeholder="DHL"
                      value={dhlAccount}
                      onChange={(e) => setDhlAccount(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveChanges}
                        sx={{
                          bgcolor: "#90a4ae",
                          "&:hover": { bgcolor: "#78909c" },
                        }}
                      >
                        Save changes
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 1 && (
              <>
                <Box
                  sx={{
                    bgcolor: "#1976d2",
                    color: "white",
                    p: 1.5,
                    mb: 3,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    My Information
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {/* Row 1: Company, Contact, Address, Email, City */}
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Company
                    </Typography>
                    <TextField
                      value={editForm.company}
                      onChange={(e) =>
                        handleEditFormChange("company", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Contact
                    </Typography>
                    <TextField
                      value={editForm.contact}
                      onChange={(e) =>
                        handleEditFormChange("contact", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Address
                    </Typography>
                    <TextField
                      value={editForm.address}
                      onChange={(e) =>
                        handleEditFormChange("address", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Email (Login)
                    </Typography>
                    <TextField
                      value={editForm.email}
                      fullWidth
                      size="small"
                      type="email"
                      disabled
                      helperText="Login email cannot be changed"
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#333",
                          bgcolor: "#f5f5f5",
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      City
                    </Typography>
                    <TextField
                      value={editForm.city}
                      onChange={(e) =>
                        handleEditFormChange("city", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  {/* Row 2: State, Phone, Fax, Zipcode, Country, Website */}
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      State
                    </Typography>
                    <TextField
                      value={editForm.state}
                      onChange={(e) =>
                        handleEditFormChange("state", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Phone
                    </Typography>
                    <TextField
                      value={editForm.phone}
                      onChange={(e) =>
                        handleEditFormChange("phone", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Fax
                    </Typography>
                    <TextField
                      value={editForm.fax}
                      onChange={(e) =>
                        handleEditFormChange("fax", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Zipcode
                    </Typography>
                    <TextField
                      value={editForm.zipcode}
                      onChange={(e) =>
                        handleEditFormChange("zipcode", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Country
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={editForm.country}
                        onChange={(e) =>
                          handleEditFormChange("country", e.target.value)
                        }
                      >
                        <MenuItem value="India">India</MenuItem>
                        <MenuItem value="US">United States</MenuItem>
                        <MenuItem value="UK">United Kingdom</MenuItem>
                        <MenuItem value="CA">Canada</MenuItem>
                        <MenuItem value="AU">Australia</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: "600", fontSize: "0.875rem" }}
                    >
                      Website
                    </Typography>
                    <TextField
                      value={editForm.website}
                      onChange={(e) =>
                        handleEditFormChange("website", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  {/* Buttons */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#1565c0" },
                        }}
                      >
                        {saving ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
