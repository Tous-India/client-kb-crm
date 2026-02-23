import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

/**
 * Helper to check if a role is an admin role
 */
const isAdminRole = (role) => {
  return role === "ADMIN" || role === "SUPER_ADMIN";
};

/**
 * Helper to check if user role is allowed
 */
const isRoleAllowed = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;

  // Direct match
  if (allowedRoles.includes(userRole)) return true;

  // SUPER_ADMIN has access to ADMIN routes
  if (userRole === "SUPER_ADMIN" && allowedRoles.includes("ADMIN")) return true;

  return false;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user role is allowed for this route
  if (!isRoleAllowed(user?.role, allowedRoles)) {
    // Redirect to appropriate dashboard based on role
    // Avoid redirect loops by checking current path
    if (isAdminRole(user?.role)) {
      if (!location.pathname.startsWith("/admin")) {
        return <Navigate to="/admin" replace />;
      }
    } else if (user?.role === "BUYER") {
      if (location.pathname !== "/") {
        return <Navigate to="/" replace />;
      }
    } else {
      // Unknown role - redirect to login only if not already there
      if (location.pathname !== "/login") {
        return <Navigate to="/login" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
