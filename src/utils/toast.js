import { toast } from 'react-toastify';

/**
 * Toast Notification Utility
 * Reusable toast notifications for the entire application
 */

// Default toast configuration
const defaultOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
};

/**
 * Show a success toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast options
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Show an error toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast options
 */
export const showError = (message, options = {}) => {
  toast.error(message, { ...defaultOptions, autoClose: 5000, ...options });
};

/**
 * Show a warning toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast options
 */
export const showWarning = (message, options = {}) => {
  toast.warn(message, { ...defaultOptions, autoClose: 4000, ...options });
};

/**
 * Show an info toast notification
 * @param {string} message - The message to display
 * @param {Object} options - Optional toast options
 */
export const showInfo = (message, options = {}) => {
  toast.info(message, { ...defaultOptions, ...options });
};

/**
 * Show a loading toast notification
 * @param {string} message - The message to display
 * @returns {string|number} - The toast ID for later updates
 */
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

/**
 * Update an existing toast (useful for loading -> success/error transitions)
 * @param {string|number} toastId - The ID of the toast to update
 * @param {Object} options - New options for the toast
 */
export const updateToast = (toastId, { type, message, ...options }) => {
  toast.update(toastId, {
    render: message,
    type: type || 'success',
    isLoading: false,
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    ...options,
  });
};

/**
 * Dismiss a specific toast or all toasts
 * @param {string|number} toastId - Optional toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

/**
 * Promise-based toast notification
 * @param {Promise} promise - The promise to track
 * @param {Object} messages - Messages for pending, success, and error states
 * @param {Object} options - Optional toast options
 */
export const showPromise = (promise, messages = {}, options = {}) => {
  return toast.promise(
    promise,
    {
      pending: messages.pending || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    },
    { ...defaultOptions, ...options }
  );
};

// Export all toast methods for convenience
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  update: updateToast,
  dismiss: dismissToast,
  promise: showPromise,
};
