import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { RefreshOutlined } from '@mui/icons-material';

/**
 * ErrorDisplay Component
 * Displays error messages with optional retry functionality
 */
const ErrorDisplay = ({
  error,
  title = 'Error',
  onRetry = null,
  severity = 'error',
  fullScreen = false
}) => {
  const content = (
    <Box
      sx={{
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Alert severity={severity}>
        <AlertTitle>{title}</AlertTitle>
        {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}
      </Alert>
      {onRetry && (
        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={onRetry}
          sx={{ alignSelf: 'flex-start' }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          padding: 3,
        }}
      >
        <Box sx={{ maxWidth: 600, width: '100%' }}>
          {content}
        </Box>
      </Box>
    );
  }

  return content;
};

export default ErrorDisplay;
