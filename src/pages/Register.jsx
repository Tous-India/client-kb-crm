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
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
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
import Logo from "../components/Logo";

// Steps for the registration wizard
const STEPS = ["Basic Info", "Verify Email", "Create Password", "Complete"];

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");

  // Step 1: Basic Info
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
  });

  // Step 2: OTP Verification
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const otpInputRefs = useRef([]);

  // Step 3: Password - refs to capture autofilled values
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Step 3: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

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

  // Step 1: Initiate Registration
  const initiateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_INITIATE, data);
      return response.data;
    },
    onSuccess: () => {
      setError("");
      setActiveStep(1);
      setOtpTimer(600); // 10 minutes
      setCanResend(false);
      // Clear OTP inputs
      setOtp(["", "", "", "", "", ""]);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to send verification code");
    },
  });

  // Step 2: Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_VERIFY_OTP, data);
      return response.data;
    },
    onSuccess: (data) => {
      setError("");
      setVerificationToken(data.data.verification_token);
      setActiveStep(2);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Invalid or expired verification code");
    },
  });

  // Resend OTP
  const resendOtpMutation = useMutation({
    mutationFn: async (email) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_RESEND_OTP, { email });
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

  // Step 3: Complete Registration
  const completeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_COMPLETE, data);
      return response.data;
    },
    onSuccess: () => {
      setError("");
      setActiveStep(3);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to complete registration");
    },
  });

  // Handle input change for Step 1
  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError("");
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit
    setOtp(newOtp);

    // Auto-focus next input
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

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    otpInputRefs.current[lastIndex]?.focus();
  };

  // Step 1: Send OTP
  const handleSendOtp = () => {
    const { name, email, phone, company_name } = formData;

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!company_name.trim()) {
      setError("Please enter your company name");
      return;
    }

    initiateMutation.mutate(formData);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    verifyOtpMutation.mutate({
      email: formData.email,
      otp: otpString,
    });
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!canResend) return;
    resendOtpMutation.mutate(formData.email);
  };

  // Step 3: Complete Registration
  const handleCompleteRegistration = () => {
    // Get actual DOM values (handles browser autofill that bypasses React state)
    const actualPassword = passwordRef.current?.value || password;
    const actualConfirmPassword = confirmPasswordRef.current?.value || confirmPassword;

    // Validate using actual DOM values
    const actualPasswordValidation = validatePassword(actualPassword);
    const actualPasswordsMatch = actualPassword === actualConfirmPassword && actualConfirmPassword !== "";

    if (!actualPasswordValidation.isValid) {
      setError("Please meet all password requirements");
      return;
    }
    if (!actualPasswordsMatch) {
      setError("Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      setError("Please accept the Terms and Conditions");
      return;
    }

    completeMutation.mutate({
      email: formData.email,
      verification_token: verificationToken,
      password: actualPassword,
      confirm_password: actualConfirmPassword,
    });
  };

  // Go back
  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setOtp(["", "", "", "", "", ""]);
      setOtpTimer(0);
    } else if (activeStep === 2) {
      // Can't go back from password step (OTP already verified)
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicInfoStep();
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

  // Step 1: Basic Info
  const renderBasicInfoStep = () => (
    <>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Create Your Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your details to get started with KB Enterprises
      </Typography>

      <Stack spacing={2}>
        <TextField
          fullWidth
          required
          size="small"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange("name")}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          fullWidth
          required
          size="small"
          label="Email Address"
          placeholder="Enter your email"
          type="email"
          value={formData.email}
          onChange={handleChange("email")}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 12 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Phone Number"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange("phone")}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              required
              size="small"
              label="Company Name"
              placeholder="Enter company name"
              value={formData.company_name}
              onChange={handleChange("company_name")}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </Stack>

      <Button
        variant="contained"
        fullWidth
        onClick={handleSendOtp}
        disabled={initiateMutation.isPending}
        endIcon={initiateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
        sx={{ mt: 2.5, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {initiateMutation.isPending ? "Sending..." : "Send Verification Code"}
      </Button>
    </>
  );

  // Step 2: OTP Verification
  const renderOtpVerificationStep = () => (
    <>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Verify Your Email
      </Typography>
      <Typography variant="body2" color="text.secondary">
        We sent a 6-digit verification code to
      </Typography>
      <Typography variant="body2" fontWeight="600" color="primary" sx={{ mb: 2 }}>
        {formData.email}
      </Typography>

      {/* OTP Input */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 2 }}>
        {otp.map((digit, index) => (
          <TextField
            key={index}
            inputRef={(el) => (otpInputRefs.current[index] = el)}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={index === 0 ? handleOtpPaste : undefined}
            slotProps={{
              htmlInput: {
                maxLength: 1,
                style: {
                  textAlign: "center",
                  fontSize: "20px",
                  fontWeight: "bold",
                  padding: "10px",
                },
              },
            }}
            sx={{
              width: 46,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />
        ))}
      </Box>

      {/* Timer */}
      {otpTimer > 0 && (
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mb: 1.5 }}>
          Code expires in{" "}
          <Typography component="span" color="primary" fontWeight="600" variant="caption">
            {formatTime(otpTimer)}
          </Typography>
        </Typography>
      )}

      {/* Resend */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        {canResend ? (
          <Button
            onClick={handleResendOtp}
            disabled={resendOtpMutation.isPending}
            startIcon={<Refresh fontSize="small" />}
            size="small"
            sx={{ textTransform: "none" }}
          >
            {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Didn't receive the code? Wait {formatTime(otpTimer)} to resend
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBack />}
          sx={{ flex: 1, py: 1.25, borderRadius: 2, textTransform: "none" }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleVerifyOtp}
          disabled={otp.join("").length !== 6 || verifyOtpMutation.isPending}
          endIcon={verifyOtpMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
          sx={{ flex: 1, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {verifyOtpMutation.isPending ? "Verifying..." : "Verify"}
        </Button>
      </Box>
    </>
  );

  // Step 3: Password
  const renderPasswordStep = () => (
    <>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Create Your Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose a strong password to secure your account
      </Typography>

      <Stack spacing={2}>
        <TextField
          fullWidth
          required
          size="small"
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          value={password}
          autoComplete="new-password"
          inputRef={passwordRef}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onInput={(e) => {
            if (e.target.value !== password) {
              setPassword(e.target.value);
              setError("");
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Password Strength */}
        {password && (
          <Box>
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
                height: 4,
                borderRadius: 2,
                bgcolor: "#e0e0e0",
                "& .MuiLinearProgress-bar": {
                  bgcolor: getStrengthColor(passwordValidation.strength),
                  borderRadius: 2,
                },
              }}
            />

            {/* Requirements List - Compact Grid */}
            <Grid container spacing={0.5} sx={{ mt: 1 }}>
              {getRequirementItems().map((item) => (
                <Grid size={6} key={item.key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {passwordValidation.requirements[item.key] ? (
                      <CheckCircle sx={{ fontSize: 14, color: "success.main" }} />
                    ) : (
                      <Cancel sx={{ fontSize: 14, color: "text.disabled" }} />
                    )}
                    <Typography
                      variant="caption"
                      color={passwordValidation.requirements[item.key] ? "success.main" : "text.secondary"}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <TextField
          fullWidth
          required
          size="small"
          label="Confirm Password"
          placeholder="Re-enter your password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          autoComplete="new-password"
          inputRef={confirmPasswordRef}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          onInput={(e) => {
            if (e.target.value !== confirmPassword) {
              setConfirmPassword(e.target.value);
              setError("");
            }
          }}
          error={confirmPassword !== "" && !passwordsMatch}
          helperText={confirmPassword !== "" && !passwordsMatch ? "Passwords do not match" : ""}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Terms and Conditions */}
        <FormControlLabel
          control={
            <Checkbox
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              I agree to the{" "}
              <Link href="#" underline="hover">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="#" underline="hover">
                Privacy Policy
              </Link>
            </Typography>
          }
          sx={{ mt: 0 }}
        />
      </Stack>

      <Button
        variant="contained"
        fullWidth
        onClick={handleCompleteRegistration}
        disabled={
          !passwordValidation.isValid ||
          !passwordsMatch ||
          !agreeTerms ||
          completeMutation.isPending
        }
        endIcon={completeMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
        sx={{ mt: 2.5, py: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {completeMutation.isPending ? "Creating Account..." : "Create Account"}
      </Button>
    </>
  );

  // Step 4: Success
  const renderSuccessStep = () => (
    <Box sx={{ textAlign: "center", py: 2 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "success.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
        }}
      >
        <CheckCircle sx={{ fontSize: 36, color: "success.main" }} />
      </Box>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Registration Submitted!
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your account has been created and is pending admin approval.
      </Typography>

      <Alert severity="info" sx={{ mb: 2, textAlign: "left", py: 0.5 }}>
        <Typography variant="caption">
          You will receive an email notification once your account is approved. This usually
          takes 1-2 business days.
        </Typography>
      </Alert>

      <Button
        variant="contained"
        onClick={() => navigate("/login")}
        sx={{ px: 3, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        Go to Login
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
        py: 3,
      }}
    >
      <Container maxWidth="xs" sx={{ maxWidth: 420 }}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <Logo width={40} height={40} />
              <Typography variant="h6" fontWeight="bold" color="primary" sx={{ ml: 1 }}>
                KB Enterprises
              </Typography>
            </Box>

            {/* Stepper */}
            {activeStep < 3 && (
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2.5 }}>
                {STEPS.slice(0, 3).map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        "& .MuiStepLabel-label": { fontSize: "0.75rem" },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2, py: 0.5 }} onClose={() => setError("")}>
                <Typography variant="body2">{error}</Typography>
              </Alert>
            )}

            {/* Step Content */}
            {renderStepContent()}

            {/* Sign In Link */}
            {activeStep < 3 && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Already have an account?{" "}
                <Link
                  href="/login"
                  underline="hover"
                  sx={{ fontWeight: 600, cursor: "pointer" }}
                >
                  Sign in
                </Link>
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Footer */}
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} KB Enterprises. All Rights Reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Register;
