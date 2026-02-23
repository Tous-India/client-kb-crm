import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Link,
  InputAdornment,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  CheckCircle,
  Cancel,
  ArrowBack,
  ArrowForward,
  Refresh,
} from "@mui/icons-material";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../services/api/client";
import { ENDPOINTS } from "../services/api/endpoints";
import {
  validatePassword,
  getStrengthColor,
  getRequirementItems,
} from "../utils/passwordValidator";
import Logo from "../components/Logo";

// Steps for the forgot password wizard
const STEPS = ["Enter Email", "Verify Code", "New Password"];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");

  // Step 1: Email
  const [email, setEmail] = useState("");

  // Step 2: OTP Verification
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const otpInputRefs = useRef([]);

  // Step 3: New Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation
  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  // OTP Timer Effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Initiate Forgot Password
  const initiateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_INITIATE, data);
      return response.data;
    },
    onSuccess: () => {
      setError("");
      setActiveStep(1);
      setOtpTimer(600); // 10 minutes
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to send verification code");
    },
  });

  // Step 2: Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_OTP, data);
      return response.data;
    },
    onSuccess: (data) => {
      setError("");
      setResetToken(data.data.reset_token);
      setActiveStep(2);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Invalid or expired verification code");
    },
  });

  // Resend OTP
  const resendOtpMutation = useMutation({
    mutationFn: async (emailAddress) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_RESEND_OTP, {
        email: emailAddress,
      });
      return response.data;
    },
    onSuccess: () => {
      setError("");
      setOtpTimer(600);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to resend verification code");
    },
  });

  // Step 3: Reset Password
  const resetMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, data);
      return response.data;
    },
    onSuccess: () => {
      setError("");
      setActiveStep(3); // Success state
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to reset password");
    },
  });

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP key down (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length - 1, 5);
    otpInputRefs.current[lastIndex]?.focus();
  };

  // Step 1: Send OTP
  const handleSendOtp = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    initiateMutation.mutate({ email });
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    verifyOtpMutation.mutate({ email, otp: otpString });
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!canResend) return;
    resendOtpMutation.mutate(email);
  };

  // Step 3: Reset Password
  const handleResetPassword = () => {
    if (!passwordValidation.isValid) {
      setError("Please meet all password requirements");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    resetMutation.mutate({
      email,
      reset_token: resetToken,
      new_password: password,
    });
  };

  // Go back
  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setOtp(["", "", "", "", "", ""]);
      setOtpTimer(0);
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderEmailStep();
      case 1:
        return renderOtpVerificationStep();
      case 2:
        return renderPasswordStep();
      case 3:
        return renderSuccessStep();
      default:
        return null;
    }
  };

  // Step 1: Email
  const renderEmailStep = () => (
    <>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Forgot Password?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a verification code to reset your password.
      </Typography>

      <TextField
        fullWidth
        label="Email Address"
        placeholder="Enter your registered email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={handleSendOtp}
        disabled={initiateMutation.isPending}
        endIcon={initiateMutation.isPending ? <CircularProgress size={20} /> : <ArrowForward />}
        sx={{ py: 1.5, borderRadius: 2 }}
      >
        {initiateMutation.isPending ? "Sending..." : "Send Verification Code"}
      </Button>
    </>
  );

  // Step 2: OTP Verification
  const renderOtpVerificationStep = () => (
    <>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Verify Your Email
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        We sent a 6-digit verification code to
      </Typography>
      <Typography variant="body1" fontWeight="600" color="primary" sx={{ mb: 3 }}>
        {email}
      </Typography>

      {/* OTP Input */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mb: 3 }}>
        {otp.map((digit, index) => (
          <TextField
            key={index}
            inputRef={(el) => (otpInputRefs.current[index] = el)}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={index === 0 ? handleOtpPaste : undefined}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: "center",
                fontSize: "24px",
                fontWeight: "bold",
                padding: "12px",
              },
            }}
            sx={{
              width: 56,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        ))}
      </Box>

      {/* Timer */}
      {otpTimer > 0 && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Code expires in{" "}
          <Typography component="span" color="primary" fontWeight="600">
            {formatTime(otpTimer)}
          </Typography>
        </Typography>
      )}

      {/* Resend */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        {canResend ? (
          <Button
            onClick={handleResendOtp}
            disabled={resendOtpMutation.isPending}
            startIcon={<Refresh />}
            sx={{ textTransform: "none" }}
          >
            {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Didn't receive the code? Wait {formatTime(otpTimer)} to resend
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBack />}
          sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleVerifyOtp}
          disabled={otp.join("").length !== 6 || verifyOtpMutation.isPending}
          endIcon={verifyOtpMutation.isPending ? <CircularProgress size={20} /> : <ArrowForward />}
          sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
        >
          {verifyOtpMutation.isPending ? "Verifying..." : "Verify"}
        </Button>
      </Box>
    </>
  );

  // Step 3: Password
  const renderPasswordStep = () => (
    <>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Create New Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a strong password to secure your account
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="New Password"
            placeholder="Enter your new password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Password Strength */}
        {password && (
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Password Strength
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="600"
                  sx={{ color: getStrengthColor(passwordValidation.strength) }}
                >
                  {passwordValidation.strengthLabel}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(passwordValidation.strength / 5) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "#e0e0e0",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: getStrengthColor(passwordValidation.strength),
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            {/* Requirements List */}
            <List dense sx={{ py: 0 }}>
              {getRequirementItems().map((item) => (
                <ListItem key={item.key} sx={{ py: 0.25, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {passwordValidation.requirements[item.key] ? (
                      <CheckCircle sx={{ fontSize: 18, color: "success.main" }} />
                    ) : (
                      <Cancel sx={{ fontSize: 18, color: "error.main" }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: passwordValidation.requirements[item.key]
                        ? "success.main"
                        : "text.secondary",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Confirm New Password"
            placeholder="Re-enter your new password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            error={confirmPassword !== "" && !passwordsMatch}
            helperText={confirmPassword !== "" && !passwordsMatch ? "Passwords do not match" : ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        fullWidth
        onClick={handleResetPassword}
        disabled={!passwordValidation.isValid || !passwordsMatch || resetMutation.isPending}
        endIcon={resetMutation.isPending ? <CircularProgress size={20} /> : <ArrowForward />}
        sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
      >
        {resetMutation.isPending ? "Resetting..." : "Reset Password"}
      </Button>
    </>
  );

  // Step 4: Success
  const renderSuccessStep = () => (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: "success.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 3,
        }}
      >
        <CheckCircle sx={{ fontSize: 48, color: "success.main" }} />
      </Box>

      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Password Reset Successful!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
        Your password has been reset successfully. You can now log in with your new password.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate("/login")}
        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
      >
        Login Now
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
              <Logo width={48} height={48} />
              <Typography variant="h5" fontWeight="bold" color="primary" sx={{ ml: 1 }}>
                KB Enterprises
              </Typography>
            </Box>

            {/* Stepper */}
            {activeStep < 3 && (
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* Step Content */}
            {renderStepContent()}

            {/* Back to Login Link */}
            {activeStep < 3 && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                Remember your password?{" "}
                <Link
                  href="/login"
                  underline="hover"
                  sx={{ fontWeight: 500, cursor: "pointer" }}
                >
                  Back to Login
                </Link>
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Footer */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          {new Date().getFullYear()} KB Enterprises. All Rights Reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
