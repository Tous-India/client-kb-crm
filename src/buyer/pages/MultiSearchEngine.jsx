import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Breadcrumbs,
  Link,
  InputAdornment,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

function MultiSearchEngine() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Sample search categories
  const searchCategories = [
    { id: 0, name: 'All', icon: '🔍' },
    { id: 1, name: 'Products', icon: '📦' },
    { id: 2, name: 'Invoices', icon: '📄' },
    { id: 3, name: 'Orders', icon: '🛒' },
    { id: 4, name: 'Certifications', icon: '📜' },
  ];

  // Sample multi-category search results
  const sampleResults = {
    products: [
      { id: 1, type: 'Product', name: 'Aircraft Engine Component', sku: 'AEC-12345', category: 'Engine Parts' },
      { id: 2, type: 'Product', name: 'Hydraulic Pump Assembly', sku: 'HPA-23456', category: 'Hydraulic Systems' },
    ],
    invoices: [
      { id: 1, type: 'Invoice', number: 'INV-1742665', date: 'Nov 10th, 2025', amount: '$3,206.52' },
      { id: 2, type: 'Invoice', number: 'INV-0974465', date: 'Oct 30th, 2025', amount: '$1,842.35' },
    ],
    orders: [
      { id: 1, type: 'Order', number: 'ORD-APS/FSTC/AUG/20', date: 'Aug 20th, 2025', status: 'Completed' },
      { id: 2, type: 'Order', number: 'ORD-CHETAK/OCT/01', date: 'Oct 1st, 2025', status: 'Processing' },
    ],
    certifications: [
      { id: 1, type: 'Certification', partNumber: 'P12345', description: '8130-3 Form', status: 'Active' },
      { id: 2, type: 'Certification', partNumber: 'P23456', description: '8130-3 Form', status: 'Active' },
    ],
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Simulate search across all categories
      const allResults = [
        ...sampleResults.products,
        ...sampleResults.invoices,
        ...sampleResults.orders,
        ...sampleResults.certifications,
      ];
      setSearchResults(allResults);
    } else {
      setSearchResults([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getResultColor = (type) => {
    const colors = {
      Product: '#1976d2',
      Invoice: '#ff6b35',
      Order: '#2e7d32',
      Certification: '#9c27b0',
    };
    return colors[type] || '#757575';
  };

  const renderResultCard = (result) => (
    <Grid size={{ xs: 12, md: 6 }} key={result.id}>
      <Card sx={{ '&:hover': { boxShadow: 4 } }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Chip
              label={result.type}
              size="small"
              sx={{
                bgcolor: getResultColor(result.type),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          {result.type === 'Product' && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {result.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SKU: {result.sku}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Category: {result.category}
              </Typography>
            </>
          )}
          {result.type === 'Invoice' && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {result.number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {result.date}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: {result.amount}
              </Typography>
            </>
          )}
          {result.type === 'Order' && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {result.number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {result.date}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {result.status}
              </Typography>
            </>
          )}
          {result.type === 'Certification' && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {result.partNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {result.status}
              </Typography>
            </>
          )}
          <Button variant="outlined" size="small" sx={{ mt: 2 }}>
            View Details
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Multi-Search Engine
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
        <Typography color="text.primary">Multi-Search Engine</Typography>
      </Breadcrumbs>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Search Across All Categories
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="medium"
            placeholder="Search products, invoices, orders, certifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="large" onClick={handleSearch}>
            Search
          </Button>
        </Box>
      </Paper>

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {searchCategories.map((category) => (
            <Tab
              key={category.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search Results ({searchResults.length} items found)
          </Typography>
          <Grid container spacing={2}>
            {searchResults.map((result) => renderResultCard(result))}
          </Grid>
        </>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No search results yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a search query to find products, invoices, orders, and certifications
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default MultiSearchEngine;
