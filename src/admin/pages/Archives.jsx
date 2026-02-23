import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileDownload as DownloadIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import archivesService from '../../services/archives.service';
import useArchivesStore from '../../stores/useArchivesStore';

const DOCUMENT_TYPES = ['INVOICE', 'ORDER', 'QUOTATION', 'PI', 'PAYMENT', 'OTHER'];
const PAYMENT_STATUSES = ['PAID', 'PARTIAL', 'UNPAID', 'REFUNDED', 'CANCELLED'];

const Archives = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const {
    filters,
    setFilter,
    resetFilters,
    selectedArchive,
    isDetailModalOpen,
    closeDetailModal,
    openDetailModal,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    stats,
    setStats,
    fiscalYears,
    setFiscalYears,
    buyers,
    setBuyers,
    getQueryParams,
    getActiveFiltersCount,
  } = useArchivesStore();

  // Fetch archives
  const fetchArchives = useCallback(async () => {
    setLoading(true);
    try {
      const params = getQueryParams();
      const result = await archivesService.getAll(params);

      if (result.success) {
        setArchives(result.data.archives || []);
      } else {
        toast.error(result.error);
        setArchives([]);
      }
    } catch (error) {
      console.error('Error fetching archives:', error);
      toast.error('Failed to fetch archives');
    } finally {
      setLoading(false);
    }
  }, [getQueryParams]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const result = await archivesService.getStats();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [setStats]);

  // Fetch fiscal years
  const fetchFiscalYears = useCallback(async () => {
    try {
      const result = await archivesService.getFiscalYears();
      if (result.success) {
        setFiscalYears(result.data.fiscal_years || []);
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
    }
  }, [setFiscalYears]);

  // Fetch buyers
  const fetchBuyers = useCallback(async () => {
    try {
      const result = await archivesService.getBuyers();
      if (result.success) {
        setBuyers(result.data.buyers || []);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  }, [setBuyers]);

  // Initial load
  useEffect(() => {
    fetchArchives();
    fetchStats();
    fetchFiscalYears();
    fetchBuyers();
  }, [fetchArchives, fetchStats, fetchFiscalYears, fetchBuyers]);

  // Handle delete
  const handleDelete = async () => {
    if (!selectedArchive) return;

    try {
      const result = await archivesService.delete(selectedArchive._id);
      if (result.success) {
        toast.success('Archive deleted successfully');
        closeDeleteDialog();
        fetchArchives();
        fetchStats();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error deleting archive:', error);
      toast.error('Failed to delete archive');
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchArchives();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    resetFilters();
    setTimeout(() => fetchArchives(), 100);
  };

  // DataGrid columns
  const columns = [
    {
      field: 'archive_id',
      headerName: 'Archive ID',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'document_type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'INVOICE' ? 'success' :
            params.value === 'ORDER' ? 'primary' :
            params.value === 'QUOTATION' ? 'info' :
            'default'
          }
        />
      ),
    },
    {
      field: 'original_reference',
      headerName: 'Reference',
      width: 150,
    },
    {
      field: 'buyer_name',
      headerName: 'Buyer',
      width: 180,
    },
    {
      field: 'document_date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'fiscal_year',
      headerName: 'FY',
      width: 100,
    },
    {
      field: 'total_amount',
      headerName: 'Amount (USD)',
      width: 130,
      valueFormatter: (params) => {
        return `$${params.value?.toLocaleString() || 0}`;
      },
    },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'PAID' ? 'success' :
            params.value === 'PARTIAL' ? 'warning' :
            params.value === 'UNPAID' ? 'error' :
            'default'
          }
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => openDetailModal(params.row)}
              color="primary"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => openDeleteDialog(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className="p-0">
      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">
          Archives
        </Typography>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {showStats && stats && (
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Archives
                </Typography>
                <Typography variant="h4">{stats.total_archives || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Value
                </Typography>
                <Typography variant="h4">
                  ${(stats.total_value || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  By Type
                </Typography>
                {stats.by_type && Object.entries(stats.by_type).map(([type, count]) => (
                  <Typography key={type} variant="body2">
                    {type}: {count}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{xs:12, md:23}}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  By Status
                </Typography>
                {stats.by_payment_status && Object.entries(stats.by_payment_status).map(([status, count]) => (
                  <Typography key={status} variant="body2">
                    {status}: {count}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper className="p-4 mb-4">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="flex items-center gap-2">
            <FilterIcon /> Filters
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} active`}
                size="small"
                color="primary"
              />
            )}
          </Typography>
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={getActiveFiltersCount() === 0}
          >
            Clear All
          </Button>
        </Box>

        {/* Search Bar - Full Width at Top */}
        <TextField
          fullWidth
          size="small"
          label="Search"
          placeholder="Search by reference, buyer name, part number, items..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                size="small"
                onClick={handleSearch}
                disabled={loading}
              >
                <SearchIcon />
              </IconButton>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Filter Fields */}
        <Grid container spacing={2}>
          {/* Document Type */}
          <Grid size={{xs:6, md:2}}>
            <TextField
              select
              fullWidth
              size="small"
              label="Document Type"
              value={filters.document_type}
              onChange={(e) => setFilter('document_type', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Fiscal Year */}
          <Grid size={{xs:6, md:2}}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fiscal Year"
              value={filters.fiscal_year}
              onChange={(e) => setFilter('fiscal_year', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {fiscalYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Payment Status */}
          <Grid size={{xs:6, md:2}}>
            <TextField
              select
              fullWidth
              size="small"
              label="Payment Status"
              value={filters.payment_status}
              onChange={(e) => setFilter('payment_status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {PAYMENT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>


          {/* Date From */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date From"
              value={filters.date_from || ''}
              onChange={(e) => setFilter('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Date To */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date To"
              value={filters.date_to || ''}
              onChange={(e) => setFilter('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Min Amount */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min Amount (USD)"
              value={filters.min_amount}
              onChange={(e) => setFilter('min_amount', e.target.value)}
            />
          </Grid>

          {/* Max Amount */}
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max Amount (USD)"
              value={filters.max_amount}
              onChange={(e) => setFilter('max_amount', e.target.value)}
            />
          </Grid>

          {/* Apply Filters Button */}
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<FilterIcon />}
              disabled={loading}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <Paper className="p-4">
        <DataGrid
          rows={archives}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20, 50, 100]}
          autoHeight
          loading={loading}
          getRowId={(row) => row._id}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Detail Modal */}
      <Dialog
        open={isDetailModalOpen}
        onClose={closeDetailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Archive Details
          {selectedArchive && (
            <Chip
              label={selectedArchive.archive_id}
              size="small"
              color="primary"
              className="ml-2"
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedArchive && (
            <Box>
              {/* Header Info */}
              <Grid container spacing={2} className="mb-4">
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Document Type
                  </Typography>
                  <Typography>{selectedArchive.document_type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Original Reference
                  </Typography>
                  <Typography>{selectedArchive.original_reference || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Document Date
                  </Typography>
                  <Typography>
                    {selectedArchive.document_date
                      ? new Date(selectedArchive.document_date).toLocaleDateString()
                      : '-'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Fiscal Year
                  </Typography>
                  <Typography>{selectedArchive.fiscal_year || '-'}</Typography>
                </Grid>
              </Grid>

              {/* Buyer Info */}
              <Typography variant="h6" className="mb-2">Buyer Information</Typography>
              <Grid container spacing={2} className="mb-4">
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Buyer Name
                  </Typography>
                  <Typography>{selectedArchive.buyer_name || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Company
                  </Typography>
                  <Typography>{selectedArchive.buyer_company || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Email
                  </Typography>
                  <Typography>{selectedArchive.buyer_email || '-'}</Typography>
                </Grid>
              </Grid>

              {/* Financial Info */}
              <Typography variant="h6" className="mb-2">Financial Information</Typography>
              <Grid container spacing={2} className="mb-4">
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Subtotal
                  </Typography>
                  <Typography>${(selectedArchive.subtotal || 0).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Tax
                  </Typography>
                  <Typography>${(selectedArchive.tax || 0).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Total Amount (USD)
                  </Typography>
                  <Typography className="font-bold">
                    ${(selectedArchive.total_amount || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Total Amount (INR)
                  </Typography>
                  <Typography className="font-bold">
                    ₹{(selectedArchive.total_amount_inr || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Status
                  </Typography>
                  <Chip
                    label={selectedArchive.payment_status}
                    size="small"
                    color={
                      selectedArchive.payment_status === 'PAID' ? 'success' :
                      selectedArchive.payment_status === 'PARTIAL' ? 'warning' :
                      'error'
                    }
                  />
                </Grid>
              </Grid>

              {/* Items */}
              {selectedArchive.items && selectedArchive.items.length > 0 && (
                <>
                  <Typography variant="h6" className="mb-2">Items</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Part Number</TableCell>
                          <TableCell>Product Name</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedArchive.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.sn || index + 1}</TableCell>
                            <TableCell>{item.part_number}</TableCell>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              ${(item.unit_price || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              ${(item.total_price || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Notes */}
              {selectedArchive.notes && (
                <Box className="mt-4">
                  <Typography variant="h6" className="mb-2">Notes</Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {selectedArchive.notes}
                  </Typography>
                </Box>
              )}

              {/* Tags */}
              {selectedArchive.tags && selectedArchive.tags.length > 0 && (
                <Box className="mt-4">
                  <Typography variant="h6" className="mb-2">Tags</Typography>
                  <Box className="flex gap-1 flex-wrap">
                    {selectedArchive.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Archive?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this archive entry?
            {selectedArchive && (
              <Box className="mt-2">
                <strong>{selectedArchive.archive_id}</strong> - {selectedArchive.original_reference}
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Archives;
