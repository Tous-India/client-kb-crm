import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
  Link,
  Alert,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

function EightyOneThirty() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Sample 8130 certification data
  const certifications = [
    { partNumber: 'P12345', description: 'Aircraft Engine Component', certDate: 'Nov 15th, 2025', status: 'Active' },
    { partNumber: 'P23456', description: 'Hydraulic System Part', certDate: 'Oct 28th, 2025', status: 'Active' },
    { partNumber: 'P34567', description: 'Landing Gear Assembly', certDate: 'Oct 10th, 2025', status: 'Active' },
    { partNumber: 'P45678', description: 'Avionics Equipment', certDate: 'Sep 22nd, 2025', status: 'Active' },
    { partNumber: 'P56789', description: 'Fuel System Component', certDate: 'Sep 5th, 2025', status: 'Active' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = certifications.filter(cert =>
        cert.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleDownloadCert = (partNumber) => {
    console.log('Download 8130 certification for:', partNumber);
  };

  const displayData = searchResults.length > 0 ? searchResults : certifications;

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        8130 Certifications
      </Typography>

      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary">8130</Typography>
      </Breadcrumbs>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Search 8130 Certifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Enter part number or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>
      </Paper>

      {/* Information Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> 8130-3 forms are airworthiness approval tags for aircraft parts and materials.
          Search by part number to view and download your certifications.
        </Typography>
      </Alert>

      {/* Results Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Part Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Certification Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.length > 0 ? (
              displayData.map((cert, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                    '&:hover': { bgcolor: '#f0f0f0' },
                  }}
                >
                  <TableCell sx={{ color: '#1976d2', fontWeight: '500' }}>
                    {cert.partNumber}
                  </TableCell>
                  <TableCell>{cert.description}</TableCell>
                  <TableCell>{cert.certDate}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: cert.status === 'Active' ? '#e8f5e9' : '#fff3e0',
                        color: cert.status === 'Active' ? '#2e7d32' : '#e65100',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                      }}
                    >
                      {cert.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDownloadCert(cert.partNumber)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No certifications found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {searchResults.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            Found {searchResults.length} certification{searchResults.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EightyOneThirty;
