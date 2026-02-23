/**
 * Password Validation Utility
 * Enforces strong password requirements for registration and password reset
 */

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*(),.?":{}|<>)
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  hasUppercase: {
    label: "At least 1 uppercase letter (A-Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  hasLowercase: {
    label: "At least 1 lowercase letter (a-z)",
    test: (password) => /[a-z]/.test(password),
  },
  hasNumber: {
    label: "At least 1 number (0-9)",
    test: (password) => /[0-9]/.test(password),
  },
  hasSpecial: {
    label: "At least 1 special character (!@#$%^&*)",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
};

/**
 * Validate password against all requirements
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with details
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
      },
      isValid: false,
      strength: 0,
      strengthLabel: "None",
    };
  }

  const requirements = {
    minLength: PASSWORD_REQUIREMENTS.minLength.test(password),
    hasUppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
    hasLowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
    hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    hasSpecial: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
  };

  const passedCount = Object.values(requirements).filter(Boolean).length;
  const isValid = passedCount === 5;

  // Calculate strength (0-5)
  const strength = passedCount;

  // Get strength label
  let strengthLabel = "None";
  if (strength === 1) strengthLabel = "Very Weak";
  else if (strength === 2) strengthLabel = "Weak";
  else if (strength === 3) strengthLabel = "Fair";
  else if (strength === 4) strengthLabel = "Strong";
  else if (strength === 5) strengthLabel = "Very Strong";

  return {
    requirements,
    isValid,
    strength,
    strengthLabel,
  };
};

/**
 * Get strength color for UI
 * @param {number} strength - Strength value (0-5)
 * @returns {string} - Color code
 */
export const getStrengthColor = (strength) => {
  switch (strength) {
    case 1:
      return "#f44336"; // Red
    case 2:
      return "#ff9800"; // Orange
    case 3:
      return "#ffeb3b"; // Yellow
    case 4:
      return "#8bc34a"; // Light Green
    case 5:
      return "#4caf50"; // Green
    default:
      return "#e0e0e0"; // Gray
  }
};

/**
 * Get requirement items for display
 * @returns {Array} - Array of requirement objects with key and label
 */
export const getRequirementItems = () => {
  return Object.entries(PASSWORD_REQUIREMENTS).map(([key, value]) => ({
    key,
    label: value.label,
  }));
};

export default {
  validatePassword,
  getStrengthColor,
  getRequirementItems,
  PASSWORD_REQUIREMENTS,
};
