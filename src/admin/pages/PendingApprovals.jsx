/**
 * Pending Approvals Page
 * Admin page to review and approve/reject buyer registrations
 */

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Stack,
  Avatar,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Person,
  Email,
  Phone,
  Business,
  Refresh,
  HowToReg,
  Close,
  Info,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../services/api/client";
import { ENDPOINTS } from "../../services/api/endpoints";
import toast from "../../utils/toast";

const PendingApprovals = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch pending approvals
  const {
    data: pendingData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["pendingApprovals"],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.USERS.PENDING_APPROVALS);
      return response.data;
    },
  });

  const pendingUsers = pendingData?.data?.users || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await apiClient.put(ENDPOINTS.USERS.APPROVE(userId));
      return response.data;
    },
    onSuccess: () => {
      toast.success("User approved successfully! They can now login.");
      queryClient.invalidateQueries(["pendingApprovals"]);
      queryClient.invalidateQueries(["pendingApprovalsCount"]);
      setApproveDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to approve user");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      const response = await apiClient.put(ENDPOINTS.USERS.REJECT(userId), { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success("User registration rejected");
      queryClient.invalidateQueries(["pendingApprovals"]);
      queryClient.invalidateQueries(["pendingApprovalsCount"]);
      setRejectDialogOpen(false);
      setSelectedUser(null);
      setRejectionReason("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to reject user");
    },
  });

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle approve click
  const handleApproveClick = (user) => {
    setSelectedUser(user);
    setApproveDialogOpen(true);
  };

  // Handle reject click
  const handleRejectClick = (user) => {
    setSelectedUser(user);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Handle view details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  // Confirm approve
  const handleConfirmApprove = () => {
    if (!selectedUser) return;
    approveMutation.mutate(selectedUser._id);
  };

  // Confirm reject
  const handleConfirmReject = () => {
    if (!selectedUser) return;
    rejectMutation.mutate({
      userId: selectedUser._id,
      reason: rejectionReason,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load pending approvals: {error?.message || "Unknown error"}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HowToReg color="primary" />
            Pending Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve new buyer registrations
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => refetch()}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Content */}
      {pendingUsers.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            All Caught Up!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no pending registrations to review.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="500">
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.user_id || "ID pending"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Email sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2">{user.email}</Typography>
                      </Box>
                      {user.phone && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2">{user.phone}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Business sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2">
                        {user.company_details?.company_name || "-"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Info />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApproveClick(user)}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRejectClick(user)}
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircle color="success" />
          Approve Registration
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve the registration for{" "}
            <strong>{selectedUser?.name}</strong>?
          </DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            The user will receive an email notification and will be able to login immediately.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmApprove}
            disabled={approveMutation.isPending}
            startIcon={approveMutation.isPending ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {approveMutation.isPending ? "Approving..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Cancel color="error" />
          Reject Registration
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to reject the registration for{" "}
            <strong>{selectedUser?.name}</strong>?
          </DialogContentText>
          <TextField
            fullWidth
            label="Rejection Reason (Optional)"
            placeholder="Provide a reason for rejection..."
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            The user will receive an email notification with the rejection reason.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={rejectMutation.isPending}
            startIcon={rejectMutation.isPending ? <CircularProgress size={20} /> : <Cancel />}
          >
            {rejectMutation.isPending ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Person color="primary" />
            User Details
          </Box>
          <IconButton size="small" onClick={() => setDetailsDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              {/* Basic Info */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 24 }}>
                  {selectedUser.name?.charAt(0).toUpperCase() || "?"}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Chip
                    label="Pending Approval"
                    size="small"
                    color="warning"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Contact Info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Contact Information
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Email color="action" sx={{ fontSize: 20 }} />
                  <Typography variant="body2">{selectedUser.email}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Phone color="action" sx={{ fontSize: 20 }} />
                  <Typography variant="body2">{selectedUser.phone || "-"}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Company Info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Company Details
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Business color="action" sx={{ fontSize: 20 }} />
                  <Typography variant="body2">
                    {selectedUser.company_details?.company_name || "-"}
                  </Typography>
                </Box>
                {selectedUser.company_details?.tax_id && (
                  <Typography variant="body2" color="text.secondary">
                    Tax ID: {selectedUser.company_details.tax_id}
                  </Typography>
                )}
              </Stack>

              {/* Address */}
              {selectedUser.address && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Address
                  </Typography>
                  <Typography variant="body2">
                    {[
                      selectedUser.address.street,
                      selectedUser.address.city,
                      selectedUser.address.state,
                      selectedUser.address.zip,
                      selectedUser.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Registration Info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Registration
              </Typography>
              <Typography variant="body2">
                Registered on: {formatDate(selectedUser.createdAt)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setDetailsDialogOpen(false);
              handleApproveClick(selectedUser);
            }}
            startIcon={<CheckCircle />}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setDetailsDialogOpen(false);
              handleRejectClick(selectedUser);
            }}
            startIcon={<Cancel />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingApprovals;
