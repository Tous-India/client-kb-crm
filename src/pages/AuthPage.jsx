import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Link,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
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
import { useAuth } from "../context/AuthContext";
import loginimg from "../../public/login.webp";

const STEPS = ["Basic Info", "Verify Email", "Create Password", "Complete"];

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [registerError, setRegisterError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company_name: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const otpInputRefs = useRef([]);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  // Mutations
  const initiateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_INITIATE, data);
      return response.data;
    },
    onSuccess: () => {
      setRegisterError("");
      setActiveStep(1);
      setOtpTimer(600);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    },
    onError: (err) => setRegisterError(err.response?.data?.message || "Failed to send verification code"),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_VERIFY_OTP, data);
      return response.data;
    },
    onSuccess: (data) => {
      setRegisterError("");
      setVerificationToken(data.data.verification_token);
      setActiveStep(2);
    },
    onError: (err) => setRegisterError(err.response?.data?.message || "Invalid or expired verification code"),
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (email) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_RESEND_OTP, { email });
      return response.data;
    },
    onSuccess: () => {
      setRegisterError("");
      setOtpTimer(600);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    },
    onError: (err) => setRegisterError(err.response?.data?.message || "Failed to resend verification code"),
  });

  const completeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_COMPLETE, data);
      return response.data;
    },
    onSuccess: () => {
      setRegisterError("");
      setActiveStep(3);
    },
    onError: (err) => setRegisterError(err.response?.data?.message || "Failed to complete registration"),
  });

  const handleToggle = (toLogin) => {
    setIsLogin(toLogin);
    if (toLogin) {
      setActiveStep(0);
      setRegisterError("");
      navigate("/login", { replace: true });
    } else {
      setLoginError("");
      navigate("/register", { replace: true });
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const path = user.role === "BUYER" ? "/" : "/admin";
      navigate(path, { replace: true });
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) { setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  if (authLoading || (isAuthenticated && user)) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password");
      setIsLoginLoading(false);
      return;
    }
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        navigate(result.user.role === "BUYER" ? "/" : "/admin", { replace: true });
      } else {
        setLoginError(result.message);
        setIsLoginLoading(false);
      }
    } catch {
      setLoginError("Login failed. Please try again.");
      setIsLoginLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setRegisterError("");
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) newOtp[i] = pastedData[i];
    setOtp(newOtp);
    otpInputRefs.current[Math.min(pastedData.length - 1, 5)]?.focus();
  };

  const handleSendOtp = () => {
    const { name, email, phone, company_name } = formData;
    if (!name.trim()) return setRegisterError("Please enter your full name");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setRegisterError("Please enter a valid email address");
    if (!phone.trim()) return setRegisterError("Please enter your phone number");
    if (!company_name.trim()) return setRegisterError("Please enter your company name");
    initiateMutation.mutate(formData);
  };

  const handleVerifyOtp = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return setRegisterError("Please enter the complete 6-digit code");
    verifyOtpMutation.mutate({ email: formData.email, otp: otpString });
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    resendOtpMutation.mutate(formData.email);
  };

  const handleCompleteRegistration = () => {
    const actualPassword = passwordRef.current?.value || password;
    const actualConfirmPassword = confirmPasswordRef.current?.value || confirmPassword;
    const actualPasswordValidation = validatePassword(actualPassword);
    const actualPasswordsMatch = actualPassword === actualConfirmPassword && actualConfirmPassword !== "";
    if (!actualPasswordValidation.isValid) return setRegisterError("Please meet all password requirements");
    if (!actualPasswordsMatch) return setRegisterError("Passwords do not match");
    if (!agreeTerms) return setRegisterError("Please accept the Terms and Conditions");
    completeMutation.mutate({
      email: formData.email,
      verification_token: verificationToken,
      password: actualPassword,
      confirm_password: actualConfirmPassword,
    });
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setOtp(["", "", "", "", "", ""]);
      setOtpTimer(0);
    }
  };

  // Common input styles
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "#f9fafb",
      borderRadius: 1.5,
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#1890ff" },
      "&.Mui-focused fieldset": { borderColor: "#1890ff" },
    },
    "& input": { py: 1.25, fontSize: "14px" },
  };

  // ============ MOBILE LAYOUT ============
  if (isMobile) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f5f7fa",
        }}
      >
        {/* Blue Header */}
        <Box
          sx={{
            background: "linear-gradient(145deg, #1890ff 0%, #096dd9 100%)",
            pt: 3,
            pb: 4,
            px: 3,
            textAlign: "center",
            borderRadius: "0 0 24px 24px",
          }}
        >
          <Box
            component="img"
            src="/kb.jpg"
            alt="KB Logo"
            sx={{ height: 48, borderRadius: 1.5, mb: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>KB Vista</Typography>
        </Box>

        {/* Card - positioned to overlap header */}
        <Box sx={{ flex: 1, px: 2, mt: -2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
              {/* Toggle */}
              <Box sx={{ display: "flex", bgcolor: "#f5f5f5", borderRadius: 1.5, p: 0.4, mb: 2 }}>
                <Button
                  fullWidth
                  onClick={() => handleToggle(true)}
                  sx={{
                    py: 0.8,
                    borderRadius: 1.25,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    bgcolor: isLogin ? "#1890ff" : "transparent",
                    color: isLogin ? "#fff" : "#888",
                    boxShadow: isLogin ? "0 2px 8px rgba(24,144,255,0.3)" : "none",
                    "&:hover": { bgcolor: isLogin ? "#1890ff" : "transparent" },
                  }}
                >
                  Login
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleToggle(false)}
                  sx={{
                    py: 0.8,
                    borderRadius: 1.25,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    bgcolor: !isLogin ? "#1890ff" : "transparent",
                    color: !isLogin ? "#fff" : "#888",
                    boxShadow: !isLogin ? "0 2px 8px rgba(24,144,255,0.3)" : "none",
                    "&:hover": { bgcolor: !isLogin ? "#1890ff" : "transparent" },
                  }}
                >
                  Register
                </Button>
              </Box>

              {/* Login Form */}
              {isLogin && (
                <Box>
                  {loginError && (
                    <Alert severity="error" sx={{ mb: 1.5, py: 0.25, "& .MuiAlert-message": { fontSize: "12px" } }}>
                      {loginError}
                    </Alert>
                  )}
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography sx={{ color: "#555", fontWeight: 500, fontSize: "12px", mb: 0.5 }}>Email</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        sx={inputStyle}
                        slotProps={{
                          input: {
                            endAdornment: <InputAdornment position="end"><EmailIcon sx={{ color: "#9ca3af", fontSize: 18 }} /></InputAdornment>,
                          },
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ color: "#555", fontWeight: 500, fontSize: "12px", mb: 0.5 }}>Password</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        sx={inputStyle}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowLoginPassword(!showLoginPassword)} edge="end" size="small">
                                  {showLoginPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Link href="/forgot-password" underline="hover" sx={{ fontSize: "11px", fontWeight: 500, color: "#1890ff" }}>
                        Forgot Password?
                      </Link>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleLoginSubmit}
                      disabled={isLoginLoading}
                      sx={{
                        py: 1.1,
                        bgcolor: "#1890ff",
                        "&:hover": { bgcolor: "#096dd9" },
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                        boxShadow: "0 4px 12px rgba(24,144,255,0.35)",
                      }}
                    >
                      {isLoginLoading ? <CircularProgress size={20} color="inherit" /> : "Sign In"}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Register Form */}
              {!isLogin && (
                <Box>
                  {activeStep < 3 && (
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 1.5 }}>
                      {STEPS.slice(0, 3).map((label) => (
                        <Step key={label}>
                          <StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: "9px", mt: 0.25 }, "& .MuiStepIcon-root": { fontSize: 18 } }}>
                            {label}
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  )}

                  {registerError && (
                    <Alert severity="error" sx={{ mb: 1.5, py: 0.25, "& .MuiAlert-message": { fontSize: "12px" } }} onClose={() => setRegisterError("")}>
                      {registerError}
                    </Alert>
                  )}

                  {/* Step 0: Basic Info */}
                  {activeStep === 0 && (
                    <Stack spacing={1.25}>
                      <TextField fullWidth size="small" label="Full Name" value={formData.name} onChange={handleChange("name")}
                        sx={{ ...inputStyle, "& .MuiInputLabel-root": { fontSize: "12px" } }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment> } }}
                      />
                      <TextField fullWidth size="small" label="Email" value={formData.email} onChange={handleChange("email")}
                        sx={{ ...inputStyle, "& .MuiInputLabel-root": { fontSize: "12px" } }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment> } }}
                      />
                      <TextField fullWidth size="small" label="Phone" value={formData.phone} onChange={handleChange("phone")}
                        sx={{ ...inputStyle, "& .MuiInputLabel-root": { fontSize: "12px" } }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment> } }}
                      />
                      <TextField fullWidth size="small" label="Company" value={formData.company_name} onChange={handleChange("company_name")}
                        sx={{ ...inputStyle, "& .MuiInputLabel-root": { fontSize: "12px" } }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment> } }}
                      />
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSendOtp}
                        disabled={initiateMutation.isPending}
                        endIcon={initiateMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <ArrowForward sx={{ fontSize: 16 }} />}
                        sx={{ py: 1.1, bgcolor: "#1890ff", borderRadius: 1.5, textTransform: "none", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 12px rgba(24,144,255,0.35)" }}
                      >
                        {initiateMutation.isPending ? "Sending..." : "Continue"}
                      </Button>
                    </Stack>
                  )}

                  {/* Step 1: OTP */}
                  {activeStep === 1 && (
                    <>
                      <Typography sx={{ fontSize: "13px", color: "#333", fontWeight: 600, mb: 0.5, textAlign: "center" }}>Verify Email</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#666", mb: 1.5, textAlign: "center" }}>
                        Code sent to <b>{formData.email}</b>
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mb: 1.5 }}>
                        {otp.map((digit, index) => (
                          <TextField
                            key={index}
                            inputRef={(el) => (otpInputRefs.current[index] = el)}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            slotProps={{ htmlInput: { maxLength: 1, style: { textAlign: "center", fontSize: "16px", fontWeight: "bold", padding: "8px" } } }}
                            sx={{ width: 38, "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                          />
                        ))}
                      </Box>
                      {otpTimer > 0 && (
                        <Typography sx={{ fontSize: "11px", color: "#666", textAlign: "center", mb: 1 }}>
                          Expires in <b style={{ color: "#1890ff" }}>{formatTime(otpTimer)}</b>
                        </Typography>
                      )}
                      <Box sx={{ textAlign: "center", mb: 1.5 }}>
                        {canResend ? (
                          <Button onClick={handleResendOtp} disabled={resendOtpMutation.isPending} size="small" sx={{ fontSize: "11px", textTransform: "none" }}>
                            {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
                          </Button>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack sx={{ fontSize: 14 }} />} sx={{ flex: 1, py: 0.9, borderRadius: 1.5, textTransform: "none", fontSize: "12px" }}>
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleVerifyOtp}
                          disabled={otp.join("").length !== 6 || verifyOtpMutation.isPending}
                          endIcon={verifyOtpMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <ArrowForward sx={{ fontSize: 14 }} />}
                          sx={{ flex: 1, py: 0.9, borderRadius: 1.5, textTransform: "none", fontSize: "12px", fontWeight: 600 }}
                        >
                          {verifyOtpMutation.isPending ? "..." : "Verify"}
                        </Button>
                      </Stack>
                    </>
                  )}

                  {/* Step 2: Password */}
                  {activeStep === 2 && (
                    <Stack spacing={1.25}>
                      <TextField
                        fullWidth size="small" label="Password" type={showPassword ? "text" : "password"} value={password}
                        autoComplete="new-password" inputRef={passwordRef}
                        onChange={(e) => { setPassword(e.target.value); setRegisterError(""); }}
                        sx={{ ...inputStyle, "& .MuiInputLabel-root": { fontSize: "12px" } }}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                  {showPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      {password && (
                        <Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                            <Typography sx={{ fontSize: "10px", color: "#666" }}>Strength</Typography>
                            <Typography sx={{ fontSize: "10px", fontWeight: 600, color: getStrengthColor(passwordValidation.strength) }}>
                              {passwordValidation.strengthLabel}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(passwordValidation.strength / 5) * 100}
                            sx={{ height: 3, borderRadius: 1, bgcolor: "#e0e0e0", "& .MuiLinearProgress-bar": { bgcolor: getStrengthColor(passwordValidation.strength) } }}
                          />
                          <Grid container spacing={0.25} sx={{ mt: 0.5 }}>
                            {getRequirementItems().map((item) => (
                              <Grid size={6} key={item.key}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                  {passwordValidation.requirements[item.key] ? (
                                    <CheckCircle sx={{ fontSize: 10, color: "success.main" }} />
                                  ) : (
                                    <Cancel sx={{ fontSize: 10, color: "text.disabled" }} />
                                  )}
                                  <Typography sx={{ fontSize: "9px", color: passwordValidation.requirements[item.key] ? "success.main" : "text.secondary" }}>
                                    {item.label}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                      <TextField
                        fullWidth size="small" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                        autoComplete="new-password" inputRef={confirmPasswordRef}
                        onChange={(e) => { setConfirmPassword(e.target.value); setRegisterError(""); }}
                        error={confirmPassword !== "" && !passwordsMatch}
                        helperText={confirmPassword !== "" && !passwordsMatch ? "Passwords do not match" : ""}
                        sx={{ ...inputStyle, "& .MuiInputLabel-root": { fontSize: "12px" } }}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                  {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <FormControlLabel
                        control={<Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} size="small" sx={{ p: 0.5 }} />}
                        label={<Typography sx={{ fontSize: "10px", color: "#666" }}>I agree to the Terms and Privacy Policy</Typography>}
                      />
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleCompleteRegistration}
                        disabled={!passwordValidation.isValid || !passwordsMatch || !agreeTerms || completeMutation.isPending}
                        endIcon={completeMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <ArrowForward sx={{ fontSize: 16 }} />}
                        sx={{ py: 1.1, bgcolor: "#1890ff", borderRadius: 1.5, textTransform: "none", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 12px rgba(24,144,255,0.35)" }}
                      >
                        {completeMutation.isPending ? "Creating..." : "Create Account"}
                      </Button>
                    </Stack>
                  )}

                  {/* Step 3: Success */}
                  {activeStep === 3 && (
                    <Box sx={{ textAlign: "center", py: 1 }}>
                      <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                        <CheckCircle sx={{ fontSize: 28, color: "#4caf50" }} />
                      </Box>
                      <Typography sx={{ fontSize: "15px", fontWeight: 700, mb: 0.5 }}>Registration Submitted!</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#666", mb: 1.5 }}>Pending admin approval (1-2 days)</Typography>
                      <Button variant="contained" onClick={() => handleToggle(true)} sx={{ px: 3, py: 0.9, borderRadius: 1.5, textTransform: "none", fontSize: "13px", fontWeight: 600 }}>
                        Go to Login
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
        </Box>

        {/* Footer */}
        <Typography sx={{ color: "#999", textAlign: "center", py: 2, fontSize: "10px" }}>
          {new Date().getFullYear()} KB Enterprises
        </Typography>
      </Box>
    );
  }

  // ============ DESKTOP LAYOUT ============
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
        padding: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          width: "100%",
          maxWidth: 900,
          height: 580,
          display: "flex",
          position: "relative",
        }}
      >
        {/* Toggle */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            bgcolor: "#f0f0f0",
            borderRadius: 3,
            p: 0.5,
            display: "flex",
            gap: 0.5,
          }}
        >
          <Button
            onClick={() => handleToggle(true)}
            sx={{
              px: 3,
              py: 0.75,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13px",
              minWidth: 90,
              bgcolor: isLogin ? "#1890ff" : "transparent",
              color: isLogin ? "#fff" : "#666",
              "&:hover": { bgcolor: isLogin ? "#096dd9" : "#e0e0e0" },
              transition: "all 0.3s ease",
            }}
          >
            Login
          </Button>
          <Button
            onClick={() => handleToggle(false)}
            sx={{
              px: 3,
              py: 0.75,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13px",
              minWidth: 90,
              bgcolor: !isLogin ? "#1890ff" : "transparent",
              color: !isLogin ? "#fff" : "#666",
              "&:hover": { bgcolor: !isLogin ? "#096dd9" : "#e0e0e0" },
              transition: "all 0.3s ease",
            }}
          >
            Register
          </Button>
        </Box>

        {/* Sliding Image */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: isLogin ? "50%" : 0,
            width: "50%",
            height: "100%",
            transition: "left 0.6s cubic-bezier(0.68, -0.15, 0.32, 1.15)",
            zIndex: 5,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              backgroundImage: `url(${loginimg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(24, 144, 255, 0.85) 0%, rgba(9, 109, 217, 0.9) 100%)",
              },
            }}
          >
            <Box sx={{ position: "relative", textAlign: "center", color: "#fff", px: 4 }}>
              <Box
                component="img"
                src="/kb.jpg"
                alt="KB Logo"
                sx={{ height: 70, mb: 2, borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                {isLogin ? "New Here?" : "Welcome Back!"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                {isLogin
                  ? "Create an account to access exclusive features."
                  : "Already have an account? Sign in to continue."}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => handleToggle(!isLogin)}
                sx={{
                  color: "#fff",
                  borderColor: "#fff",
                  px: 4,
                  py: 1,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.15)", borderColor: "#fff" },
                }}
              >
                {isLogin ? "Register" : "Login"}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Login Panel */}
        <Box
          sx={{
            width: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            transitionDelay: isLogin ? "0.3s" : "0s",
            pointerEvents: isLogin ? "auto" : "none",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 340 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Welcome Back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sign in to continue to KB Vista</Typography>
            {loginError && <Alert severity="error" sx={{ mb: 2 }}>{loginError}</Alert>}
            <TextField fullWidth placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} sx={{ mb: 2, ...inputStyle }}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><EmailIcon color="action" /></InputAdornment> } }}
            />
            <TextField fullWidth type={showLoginPassword ? "text" : "password"} placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} sx={{ mb: 2, ...inputStyle }}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowLoginPassword(!showLoginPassword)} edge="end">{showLoginPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            />
            <Box sx={{ textAlign: "right", mb: 2 }}>
              <Link href="/forgot-password" underline="hover" sx={{ fontSize: "13px", fontWeight: 500 }}>Forgot Password?</Link>
            </Box>
            <Button variant="contained" fullWidth onClick={handleLoginSubmit} disabled={isLoginLoading}
              sx={{ py: 1.5, bgcolor: "#1890ff", "&:hover": { bgcolor: "#096dd9" }, borderRadius: 2, textTransform: "none", fontSize: "15px", fontWeight: 600 }}>
              {isLoginLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>
          </Box>
        </Box>

        {/* Register Panel */}
        <Box
          sx={{
            width: "50%",
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? "translateX(0)" : "translateX(30px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            transitionDelay: !isLogin ? "0.3s" : "0s",
            pointerEvents: !isLogin ? "auto" : "none",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 360 }}>
            {activeStep < 3 && (
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
                {STEPS.slice(0, 3).map((label) => (
                  <Step key={label}><StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: "0.65rem" } }}>{label}</StepLabel></Step>
                ))}
              </Stepper>
            )}
            {registerError && <Alert severity="error" sx={{ mb: 2, py: 0.5 }} onClose={() => setRegisterError("")}><Typography variant="body2">{registerError}</Typography></Alert>}

            {activeStep === 0 && (
              <>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Create Account</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Join KB Enterprises today</Typography>
                <Stack spacing={1.5}>
                  <TextField fullWidth size="small" label="Full Name" value={formData.name} onChange={handleChange("name")} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon color="action" fontSize="small" /></InputAdornment> } }} />
                  <TextField fullWidth size="small" label="Email" value={formData.email} onChange={handleChange("email")} slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon color="action" fontSize="small" /></InputAdornment> } }} />
                  <TextField fullWidth size="small" label="Phone" value={formData.phone} onChange={handleChange("phone")} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon color="action" fontSize="small" /></InputAdornment> } }} />
                  <TextField fullWidth size="small" label="Company" value={formData.company_name} onChange={handleChange("company_name")} slotProps={{ input: { startAdornment: <InputAdornment position="start"><BusinessIcon color="action" fontSize="small" /></InputAdornment> } }} />
                </Stack>
                <Button variant="contained" fullWidth onClick={handleSendOtp} disabled={initiateMutation.isPending} endIcon={initiateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                  sx={{ mt: 2, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                  {initiateMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
              </>
            )}

            {activeStep === 1 && (
              <>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Verify Email</Typography>
                <Typography variant="body2" color="text.secondary">Code sent to <b>{formData.email}</b></Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, my: 2 }}>
                  {otp.map((digit, index) => (
                    <TextField key={index} inputRef={(el) => (otpInputRefs.current[index] = el)} value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={index === 0 ? handleOtpPaste : undefined}
                      slotProps={{ htmlInput: { maxLength: 1, style: { textAlign: "center", fontSize: "18px", fontWeight: "bold", padding: "10px" } } }}
                      sx={{ width: 42, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  ))}
                </Box>
                {otpTimer > 0 && <Typography variant="caption" color="text.secondary" align="center" display="block">Expires in <b>{formatTime(otpTimer)}</b></Typography>}
                <Box sx={{ textAlign: "center", my: 1.5 }}>
                  {canResend && <Button onClick={handleResendOtp} disabled={resendOtpMutation.isPending} startIcon={<Refresh fontSize="small" />} size="small" sx={{ textTransform: "none" }}>{resendOtpMutation.isPending ? "Sending..." : "Resend"}</Button>}
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />} sx={{ flex: 1, py: 1, borderRadius: 2, textTransform: "none" }}>Back</Button>
                  <Button variant="contained" onClick={handleVerifyOtp} disabled={otp.join("").length !== 6 || verifyOtpMutation.isPending} endIcon={verifyOtpMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                    sx={{ flex: 1, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>{verifyOtpMutation.isPending ? "..." : "Verify"}</Button>
                </Stack>
              </>
            )}

            {activeStep === 2 && (
              <>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Create Password</Typography>
                <Stack spacing={1.5}>
                  <TextField fullWidth size="small" label="Password" type={showPassword ? "text" : "password"} value={password} autoComplete="new-password" inputRef={passwordRef}
                    onChange={(e) => { setPassword(e.target.value); setRegisterError(""); }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon color="action" fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> } }}
                  />
                  {password && (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Strength</Typography>
                        <Typography variant="caption" fontWeight="600" sx={{ color: getStrengthColor(passwordValidation.strength) }}>{passwordValidation.strengthLabel}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={(passwordValidation.strength / 5) * 100} sx={{ height: 4, borderRadius: 2, bgcolor: "#e0e0e0", "& .MuiLinearProgress-bar": { bgcolor: getStrengthColor(passwordValidation.strength) } }} />
                      <Grid container spacing={0.5} sx={{ mt: 1 }}>
                        {getRequirementItems().map((item) => (
                          <Grid size={6} key={item.key}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {passwordValidation.requirements[item.key] ? <CheckCircle sx={{ fontSize: 14, color: "success.main" }} /> : <Cancel sx={{ fontSize: 14, color: "text.disabled" }} />}
                              <Typography variant="caption" color={passwordValidation.requirements[item.key] ? "success.main" : "text.secondary"}>{item.label}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  <TextField fullWidth size="small" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} autoComplete="new-password" inputRef={confirmPasswordRef}
                    onChange={(e) => { setConfirmPassword(e.target.value); setRegisterError(""); }} error={confirmPassword !== "" && !passwordsMatch} helperText={confirmPassword !== "" && !passwordsMatch ? "Passwords do not match" : ""}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon color="action" fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">{showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> } }}
                  />
                  <FormControlLabel control={<Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} size="small" />}
                    label={<Typography variant="caption" color="text.secondary">I agree to Terms and Privacy Policy</Typography>}
                  />
                </Stack>
                <Button variant="contained" fullWidth onClick={handleCompleteRegistration} disabled={!passwordValidation.isValid || !passwordsMatch || !agreeTerms || completeMutation.isPending}
                  endIcon={completeMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />} sx={{ mt: 2, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                  {completeMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </>
            )}

            {activeStep === 3 && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "success.light", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 36, color: "success.main" }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Registration Submitted!</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Pending admin approval (1-2 days)</Typography>
                <Button variant="contained" onClick={() => handleToggle(true)} sx={{ px: 3, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>Go to Login</Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthPage;
