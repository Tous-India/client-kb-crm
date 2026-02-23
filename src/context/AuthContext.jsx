import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/auth.service";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.data) {
        const userData = result.data.user;
        const authToken = result.data.token;

        setUser(userData);
        setToken(authToken);

        // Store in localStorage (authService already does this, but we keep state in sync)
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("authToken", authToken);

        return { success: true, user: userData };
      }

      return { success: false, message: result.error || "Invalid email or password" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Login failed. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    // Super admin and admin have all permissions
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
    // Check if permission exists in user's permissions array
    return user.permissions?.includes(permission) || false;
  };

  // Refresh user data from server (better than manual localStorage sync)
  const refreshUser = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.data?.user) {
        const freshUser = result.data.user;
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        return { success: true, user: freshUser };
      }
      return { success: false, error: result.error || "Failed to refresh user" };
    } catch (error) {
      console.error("Error refreshing user:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    hasPermission,
    refreshUser,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
    isBuyer: user?.role === "BUYER",
    isSuperAdmin: user?.role === "SUPER_ADMIN",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
