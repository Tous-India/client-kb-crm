import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Link,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import loginimg from "../../public/login.webp";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
      } else if (user.role === "BUYER") {
        navigate("/", { replace: true });
      } else {
        // Default redirect for other roles
        navigate("/admin", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  // Show loading spinner while checking auth status or if already authenticated
  if (authLoading || (isAuthenticated && user)) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      // Attempt login (now async)
      const result = await login(email, password);

      if (result.success) {
        // Redirect based on role
        if (result.user.role === "ADMIN" || result.user.role === "SUPER_ADMIN") {
          navigate("/admin", { replace: true });
        } else if (result.user.role === "BUYER") {
          navigate("/", { replace: true });
        } else {
          // Default redirect for other roles
          navigate("/admin", { replace: true });
        }
      } else {
        setError(result.message);
        setIsLoading(false);
      }
    } catch (error) {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url(bg.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        padding: 3,
      }}
      className="Login-Page"
    >
      <Paper
        elevation={10}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          maxWidth: "60%",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            p: 6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <Box
              component="img"
              src="/kb.jpg"
              alt="KB Logo"
              sx={{ height: 60 }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Login
          </Typography>
          {/* <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            to access
          </Typography> */}

          {/* Error Alert */}
          {error && (
            <Alert
              severity={
                error.includes("pending") || error.includes("verify")
                  ? "warning"
                  : "error"
              }
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* Email Input */}
          <TextField
            fullWidth
            placeholder="User Name"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Password Input */}
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: "right", mb: 2 }}>
            <Link
              href="/forgot-password"
              underline="hover"
              sx={{ fontSize: "14px", fontWeight: 500 }}
            >
              Forgot Password?
            </Link>
          </Box>

          {/* Sign In Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={isLoading}
            sx={{
              mb: 3,
              py: 1.5,
              bgcolor: "#1890ff",
              "&:hover": { bgcolor: "#096dd9" },
              borderRadius: 2,
              textTransform: "none",
              fontSize: "16px",
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Sign Up Link */}
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link href="/register" underline="hover" sx={{ fontWeight: 500 }}>
              Sign up now
            </Link>
          </Typography>
        </Box>
        <Box
          sx={{
            p: 6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "end",
            width: "100%",
          }}
          className="image-div"
        >
          <img src={loginimg} width={"100%"} height={"100%"} />
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
