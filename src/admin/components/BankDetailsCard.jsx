import { Paper, Typography, Stack, Box, Divider, Chip } from '@mui/material';
import { AccountBalance, ContentCopy } from '@mui/icons-material';

// DetailRow component - moved outside to prevent re-creation on each render
const DetailRow = ({ label, value, copyable = false, showCopy = true, onCopy }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
      {label}:
    </Typography>
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '13px', fontFamily: 'monospace' }}>
        {value}
      </Typography>
      {showCopy && copyable && onCopy && (
        <ContentCopy
          sx={{
            fontSize: 14,
            color: 'action.active',
            cursor: 'pointer',
            '&:hover': { color: 'primary.main' }
          }}
          onClick={() => onCopy(value, label)}
        />
      )}
    </Stack>
  </Box>
);

/**
 * BankDetailsCard - Displays bank account information for payments
 * @param {Object} bankDetails - Bank account details object
 * @param {string} variant - 'full' | 'compact' - display mode
 * @param {boolean} showCopy - Show copy buttons for account details
 * @param {string} title - Optional custom title
 */
function BankDetailsCard({
  bankDetails,
  variant = 'full',
  showCopy = true,
  title = 'Bank Details for Payment'
}) {
  if (!bankDetails) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (variant === 'compact') {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'primary.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <AccountBalance sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '13px' }}>
            {bankDetails.bank_name}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ fontSize: '12px' }}>
          A/C: <strong>{bankDetails.account_number}</strong>
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '12px' }}>
          IFSC: <strong>{bankDetails.ifsc_code}</strong>
        </Typography>
        {bankDetails.swift_code && (
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            SWIFT: <strong>{bankDetails.swift_code}</strong>
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <AccountBalance sx={{ color: 'info.main' }} />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '14px' }}>
          {title}
        </Typography>
        {bankDetails.account_type && (
          <Chip label={bankDetails.account_type} size="small" color="info" variant="outlined" sx={{ fontSize: '10px' }} />
        )}
      </Stack>

      <Stack spacing={0.5}>
        <DetailRow label="Bank Name" value={bankDetails.bank_name} showCopy={showCopy} onCopy={handleCopy} />
        <DetailRow label="Account Name" value={bankDetails.account_name} showCopy={showCopy} onCopy={handleCopy} />
        <DetailRow label="Account Number" value={bankDetails.account_number} copyable showCopy={showCopy} onCopy={handleCopy} />
        <DetailRow label="IFSC Code" value={bankDetails.ifsc_code} copyable showCopy={showCopy} onCopy={handleCopy} />
        {bankDetails.swift_code && (
          <DetailRow label="SWIFT Code" value={bankDetails.swift_code} copyable showCopy={showCopy} onCopy={handleCopy} />
        )}
        <DetailRow label="Branch" value={bankDetails.branch} showCopy={showCopy} onCopy={handleCopy} />
      </Stack>

      {bankDetails.correspondent_bank && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '11px' }}>
            For International Transfers:
          </Typography>
          <Stack spacing={0.5}>
            <DetailRow label="Correspondent Bank" value={bankDetails.correspondent_bank} showCopy={showCopy} onCopy={handleCopy} />
            <DetailRow label="Correspondent SWIFT" value={bankDetails.correspondent_swift} copyable showCopy={showCopy} onCopy={handleCopy} />
          </Stack>
        </>
      )}
    </Paper>
  );
}

export default BankDetailsCard;
