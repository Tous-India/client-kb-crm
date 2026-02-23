import { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Tooltip,
  LinearProgress,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search,
  LocalShipping,
  Visibility,
  FilterList,
  CheckCircle,
  Schedule,
  ContentCopy,
  OpenInNew,
  Print,
  PictureAsPdf,
  Refresh
} from '@mui/icons-material';
import { useCurrency } from '../../context/CurrencyContext';
import { dispatchesService } from '../../services';

function Shipments() {
  const { usdToInr } = useCurrency();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Print ref
  const printRef = useRef(null);

  // Pagination and filter state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dispatch_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Status filter options
  const statusOptions = [
    { value: 'All', label: 'All', color: 'default' },
    { value: 'Pending', label: 'Pending', color: 'warning' },
    { value: 'In Transit', label: 'In Transit', color: 'info' },
    { value: 'Delivered', label: 'Delivered', color: 'success' }
  ];

  // Fetch dispatches from API
  const fetchDispatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatchesService.getMyDispatches();
      if (result.success) {
        // Process dispatches to match the expected format
        const processedDispatches = (result.data || []).map(dispatch => ({
          ...dispatch,
          id: dispatch._id,
          order_id: dispatch.dispatch_id,
          source_number: dispatch.source_number,
          order_date: dispatch.dispatch_date,
          dispatch_date: dispatch.dispatch_date,
          estimated_delivery: dispatch.estimated_delivery || new Date(new Date(dispatch.dispatch_date).getTime() + 7 * 24 * 60 * 60 * 1000),
          tracking_number: dispatch.shipping_info?.awb_number || dispatch.tracking_number,
          courier_service: dispatch.shipping_info?.shipping_by || dispatch.courier_service,
          shipment_status: dispatch.shipment_status || (dispatch.shipping_info?.awb_number ? 'In Transit' : 'Pending'),
          total_amount: dispatch.total_amount || 0,
          subtotal: dispatch.total_amount || 0,
          tax: 0,
          shipping: 0,
          items: dispatch.items || [],
          shipping_address: dispatch.shipping_address || {
            street: dispatch.shipping_info?.delivery_address || 'N/A',
            city: '',
            state: '',
            zip: '',
            country: ''
          },
          exchange_rate: dispatch.exchange_rate || usdToInr,
          notes: dispatch.shipping_info?.notes || dispatch.notes,
          invoice_generated: dispatch.invoice_generated,
          invoice_number: dispatch.invoice_number,
        }));
        setShipments(processedDispatches);
      } else {
        setError(result.error || 'Failed to fetch shipments');
      }
    } catch (err) {
      console.error('[Shipments] Error fetching dispatches:', err);
      setError('Failed to load shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [usdToInr]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const handleViewDetails = (shipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(true);
  };

  const copyTrackingNumber = (trackingNumber) => {
    navigator.clipboard.writeText(trackingNumber);
    alert('Tracking number copied to clipboard!');
  };

  // Print handler for shipment details
  const handlePrintShipment = () => {
    if (!selectedShipment) return;

    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipment Details - ${selectedShipment.order_id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 15mm; }
              .print-container {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .logo { height: 40px; }
              .title { font-size: 24px; font-weight: bold; color: #0f172a; }
              .section {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 15px;
                margin-bottom: 15px;
              }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                color: #0f172a;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
              }
              .info-item label {
                font-size: 11px;
                color: #64748b;
                display: block;
              }
              .info-item span {
                font-size: 14px;
                color: #0f172a;
                font-weight: 500;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
              }
              th {
                background: #f1f5f9;
                font-size: 11px;
                text-transform: uppercase;
                font-weight: 600;
              }
              td { font-size: 13px; }
              .status-chip {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .status-pending { background: #fef3c7; color: #92400e; }
              .status-transit { background: #dbeafe; color: #1e40af; }
              .status-delivered { background: #dcfce7; color: #166534; }
              .totals {
                text-align: right;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 2px solid #0f172a;
              }
              .total-row {
                display: flex;
                justify-content: flex-end;
                gap: 30px;
                margin-bottom: 5px;
              }
              .total-label { font-size: 13px; color: #64748b; }
              .total-value { font-size: 14px; font-weight: 600; }
              .grand-total .total-label { font-size: 16px; font-weight: 600; color: #0f172a; }
              .grand-total .total-value { font-size: 18px; font-weight: 700; color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="header">
                <img src="/kb-offical-logo-black.png" alt="KB Logo" class="logo" />
                <div class="title">Shipment Details</div>
              </div>

              <div class="section">
                <div class="section-title">Order Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Order ID</label>
                    <span>${selectedShipment.order_id}</span>
                  </div>
                  <div class="info-item">
                    <label>Order Date</label>
                    <span>${new Date(selectedShipment.order_date).toLocaleDateString()}</span>
                  </div>
                  <div class="info-item">
                    <label>Est. Delivery</label>
                    <span>${new Date(selectedShipment.estimated_delivery).toLocaleDateString()}</span>
                  </div>
                  <div class="info-item">
                    <label>Status</label>
                    <span class="status-chip ${
                      (selectedShipment.dispatch_info?.shipment_status || selectedShipment.shipment_status) === 'Delivered' ? 'status-delivered' :
                      (selectedShipment.dispatch_info?.shipment_status || selectedShipment.shipment_status) === 'In Transit' ? 'status-transit' :
                      'status-pending'
                    }">
                      ${selectedShipment.dispatch_info?.shipment_status || selectedShipment.shipment_status || (selectedShipment.tracking_number ? 'In Transit' : 'Pending')}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Exchange Rate</label>
                    <span style="color: #059669; font-weight: bold;">1 USD = ₹${selectedShipment.exchange_rate || usdToInr}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Tracking Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Courier Service</label>
                    <span>${selectedShipment.dispatch_info?.courier_service || selectedShipment.courier_service || 'Not specified'}</span>
                  </div>
                  <div class="info-item">
                    <label>Tracking Number</label>
                    <span>${selectedShipment.dispatch_info?.tracking_number || selectedShipment.tracking_number || 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Order Items</div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Part Number</th>
                      <th style="text-align: right;">Qty</th>
                      <th style="text-align: right;">Unit Price (USD/INR)</th>
                      <th style="text-align: right;">Total (USD/INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedShipment.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.part_number}</td>
                        <td style="text-align: right;">${item.quantity}</td>
                        <td style="text-align: right;">
                          <div>$${item.unit_price.toFixed(2)}</div>
                          <div style="color: #059669; font-size: 11px;">₹${(item.unit_price * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                        </td>
                        <td style="text-align: right;">
                          <div>$${item.total_price.toFixed(2)}</div>
                          <div style="color: #059669; font-size: 11px;">₹${(item.total_price * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="totals">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.subtotal.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 11px;">₹${(selectedShipment.subtotal * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
                <div class="total-row">
                  <span class="total-label">Tax:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.tax.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 11px;">₹${(selectedShipment.tax * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
                <div class="total-row">
                  <span class="total-label">Shipping:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.shipping.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 11px;">₹${(selectedShipment.shipping * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
                <div class="total-row grand-total">
                  <span class="total-label">Total Amount:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.total_amount.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 12px;">₹${(selectedShipment.total_amount * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
              </div>

              <div class="section" style="margin-top: 15px;">
                <div class="section-title">Shipping Address</div>
                <div>${selectedShipment.shipping_address.street}</div>
                <div>${selectedShipment.shipping_address.city}, ${selectedShipment.shipping_address.state} ${selectedShipment.shipping_address.zip}</div>
                <div>${selectedShipment.shipping_address.country}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
    }
  };

  // PDF download handler
  const handleDownloadPDF = () => {
    if (!selectedShipment) return;

    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipment Details - ${selectedShipment.order_id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 15mm; }
              .print-container {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .logo { height: 40px; }
              .title { font-size: 24px; font-weight: bold; color: #0f172a; }
              .section {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 15px;
                margin-bottom: 15px;
              }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                color: #0f172a;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
              }
              .info-item label {
                font-size: 11px;
                color: #64748b;
                display: block;
              }
              .info-item span {
                font-size: 14px;
                color: #0f172a;
                font-weight: 500;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
              }
              th {
                background: #f1f5f9;
                font-size: 11px;
                text-transform: uppercase;
                font-weight: 600;
              }
              td { font-size: 13px; }
              .status-chip {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .status-pending { background: #fef3c7; color: #92400e; }
              .status-transit { background: #dbeafe; color: #1e40af; }
              .status-delivered { background: #dcfce7; color: #166534; }
              .totals {
                text-align: right;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 2px solid #0f172a;
              }
              .total-row {
                display: flex;
                justify-content: flex-end;
                gap: 30px;
                margin-bottom: 5px;
              }
              .total-label { font-size: 13px; color: #64748b; }
              .total-value { font-size: 14px; font-weight: 600; }
              .grand-total .total-label { font-size: 16px; font-weight: 600; color: #0f172a; }
              .grand-total .total-value { font-size: 18px; font-weight: 700; color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="header">
                <img src="/kb-offical-logo-black.png" alt="KB Logo" class="logo" />
                <div class="title">Shipment Details</div>
              </div>

              <div class="section">
                <div class="section-title">Order Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Order ID</label>
                    <span>${selectedShipment.order_id}</span>
                  </div>
                  <div class="info-item">
                    <label>Order Date</label>
                    <span>${new Date(selectedShipment.order_date).toLocaleDateString()}</span>
                  </div>
                  <div class="info-item">
                    <label>Est. Delivery</label>
                    <span>${new Date(selectedShipment.estimated_delivery).toLocaleDateString()}</span>
                  </div>
                  <div class="info-item">
                    <label>Status</label>
                    <span class="status-chip ${
                      (selectedShipment.dispatch_info?.shipment_status || selectedShipment.shipment_status) === 'Delivered' ? 'status-delivered' :
                      (selectedShipment.dispatch_info?.shipment_status || selectedShipment.shipment_status) === 'In Transit' ? 'status-transit' :
                      'status-pending'
                    }">
                      ${selectedShipment.dispatch_info?.shipment_status || selectedShipment.shipment_status || (selectedShipment.tracking_number ? 'In Transit' : 'Pending')}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Exchange Rate</label>
                    <span style="color: #059669; font-weight: bold;">1 USD = ₹${selectedShipment.exchange_rate || usdToInr}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Tracking Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Courier Service</label>
                    <span>${selectedShipment.dispatch_info?.courier_service || selectedShipment.courier_service || 'Not specified'}</span>
                  </div>
                  <div class="info-item">
                    <label>Tracking Number</label>
                    <span>${selectedShipment.dispatch_info?.tracking_number || selectedShipment.tracking_number || 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Order Items</div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Part Number</th>
                      <th style="text-align: right;">Qty</th>
                      <th style="text-align: right;">Unit Price (USD/INR)</th>
                      <th style="text-align: right;">Total (USD/INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedShipment.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.part_number}</td>
                        <td style="text-align: right;">${item.quantity}</td>
                        <td style="text-align: right;">
                          <div>$${item.unit_price.toFixed(2)}</div>
                          <div style="color: #059669; font-size: 11px;">₹${(item.unit_price * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                        </td>
                        <td style="text-align: right;">
                          <div>$${item.total_price.toFixed(2)}</div>
                          <div style="color: #059669; font-size: 11px;">₹${(item.total_price * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="totals">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.subtotal.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 11px;">₹${(selectedShipment.subtotal * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
                <div class="total-row">
                  <span class="total-label">Tax:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.tax.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 11px;">₹${(selectedShipment.tax * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
                <div class="total-row">
                  <span class="total-label">Shipping:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.shipping.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 11px;">₹${(selectedShipment.shipping * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
                <div class="total-row grand-total">
                  <span class="total-label">Total Amount:</span>
                  <span class="total-value">
                    <div>$${selectedShipment.total_amount.toFixed(2)}</div>
                    <div style="color: #059669; font-size: 12px;">₹${(selectedShipment.total_amount * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</div>
                  </span>
                </div>
              </div>

              <div class="section" style="margin-top: 15px;">
                <div class="section-title">Shipping Address</div>
                <div>${selectedShipment.shipping_address.street}</div>
                <div>${selectedShipment.shipping_address.city}, ${selectedShipment.shipping_address.state} ${selectedShipment.shipping_address.zip}</div>
                <div>${selectedShipment.shipping_address.country}</div>
              </div>
            </div>
            <script>
              window.onload = function() {
                alert('Use "Save as PDF" option in the Print dialog to download as PDF');
                window.print();
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter shipments
  // Helper to get shipment's status
  const getShipmentStatusValue = (shipment) => {
    const hasTracking = shipment.tracking_number || shipment.dispatch_info?.tracking_number;
    const status = shipment.dispatch_info?.shipment_status || shipment.shipment_status;
    if (status) return status;
    return hasTracking ? 'In Transit' : 'Pending';
  };

  const filteredShipments = shipments.filter((shipment) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (shipment.order_id && shipment.order_id.toLowerCase().includes(searchLower)) ||
      (shipment.source_number && shipment.source_number.toLowerCase().includes(searchLower)) ||
      (shipment.tracking_number && shipment.tracking_number.toLowerCase().includes(searchLower)) ||
      (shipment.courier_service && shipment.courier_service.toLowerCase().includes(searchLower));

    // Status filter
    const shipmentStatus = getShipmentStatusValue(shipment);
    const matchesStatus = statusFilter === 'All' || shipmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort shipments
  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let compareA, compareB;

    if (sortBy === 'dispatch_date') {
      compareA = new Date(a.dispatch_date || a.order_date);
      compareB = new Date(b.dispatch_date || b.order_date);
    } else if (sortBy === 'total_amount') {
      compareA = a.total_amount || 0;
      compareB = b.total_amount || 0;
    } else if (sortBy === 'order_id') {
      compareA = a.order_id || '';
      compareB = b.order_id || '';
    } else if (sortBy === 'estimated_delivery') {
      compareA = new Date(a.estimated_delivery || Date.now());
      compareB = new Date(b.estimated_delivery || Date.now());
    }

    return sortOrder === 'asc' ? (compareA > compareB ? 1 : -1) : (compareA < compareB ? 1 : -1);
  });

  // Paginate shipments
  const paginatedShipments = sortedShipments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate statistics based on shipment_status
  const totalShipments = shipments.length;
  const shipmentsWithTracking = shipments.filter(s => s.tracking_number || s.dispatch_info?.tracking_number).length;
  const shipmentsPending = shipments.filter(s => {
    const status = s.dispatch_info?.shipment_status || s.shipment_status || 'Pending';
    return status === 'Pending';
  }).length;
  const shipmentsInTransit = shipments.filter(s => {
    const status = s.dispatch_info?.shipment_status || s.shipment_status;
    const hasTracking = s.tracking_number || s.dispatch_info?.tracking_number;
    // If no explicit status but has tracking, treat as In Transit
    return status === 'In Transit' || (!status && hasTracking);
  }).length;
  const shipmentsDelivered = shipments.filter(s => {
    const status = s.dispatch_info?.shipment_status || s.shipment_status;
    return status === 'Delivered';
  }).length;

  // Get shipment status from data (not calculated from date)
  const getShipmentStatus = (shipment) => {
    const hasTracking = shipment.tracking_number || shipment.dispatch_info?.tracking_number;
    const status = shipment.dispatch_info?.shipment_status || shipment.shipment_status;

    // If explicit status exists, use it
    if (status) {
      if (status === 'Delivered') {
        return { label: 'Delivered', color: 'success', icon: <CheckCircle /> };
      } else if (status === 'In Transit') {
        return { label: 'In Transit', color: 'info', icon: <LocalShipping /> };
      } else {
        return { label: 'Pending', color: 'warning', icon: <Schedule /> };
      }
    }

    // Fallback: determine based on tracking number presence
    if (hasTracking) {
      return { label: 'In Transit', color: 'info', icon: <LocalShipping /> };
    } else {
      return { label: 'Pending', color: 'warning', icon: <Schedule /> };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }} className='px-0!'>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <h1 className='text-2xl font-bold text-[#0b0c1a] mb-0'>
            My Shipments
          </h1>
          <Button
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={fetchDispatches}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Track your dispatched orders and shipments
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'warning.50' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  {shipmentsPending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'info.50' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  In Transit
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="info.main">
                  {shipmentsInTransit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.50' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Delivered
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {shipmentsDelivered}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Total Shipments
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {totalShipments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Order ID, Tracking Number, or Courier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Status:
              </Typography>
              {statusOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.value === 'All' ? 'All' : `${option.label} (${
                    option.value === 'Pending' ? shipmentsPending :
                    option.value === 'In Transit' ? shipmentsInTransit :
                    option.value === 'Delivered' ? shipmentsDelivered :
                    totalShipments
                  })`}
                  color={statusFilter === option.value ? option.color : 'default'}
                  variant={statusFilter === option.value ? 'filled' : 'outlined'}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setPage(0);
                  }}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: statusFilter === option.value ? 600 : 400,
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  size="small"
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
          <FilterList color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            Showing {paginatedShipments.length} of {filteredShipments.length} shipments
            {statusFilter !== 'All' && ` (filtered by ${statusFilter})`}
          </Typography>
        </Box>
      </Paper>

      {/* Shipments Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'order_id'}
                  direction={sortBy === 'order_id' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('order_id')}
                >
                  <strong>Dispatch #</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Source</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'dispatch_date'}
                  direction={sortBy === 'dispatch_date' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('dispatch_date')}
                >
                  <strong>Dispatch Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Courier</strong></TableCell>
              <TableCell><strong>Tracking Number</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'total_amount'}
                  direction={sortBy === 'total_amount' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('total_amount')}
                >
                  <strong>Amount</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No shipments found matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedShipments.map((shipment) => {
                const shipmentStatus = getShipmentStatus(shipment);
                const trackingNumber = shipment.dispatch_info?.tracking_number || shipment.tracking_number;
                const courierService = shipment.dispatch_info?.courier_service || shipment.courier_service;

                return (
                  <TableRow
                    key={shipment.id || shipment.order_id}
                    hover
                    sx={{
                      bgcolor: trackingNumber ? 'inherit' : 'warning.50',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {shipment.order_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shipment.source_number || '-'}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '11px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {shipment.dispatch_date ? new Date(shipment.dispatch_date).toLocaleDateString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {courierService || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {trackingNumber ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            icon={<LocalShipping />}
                            label={trackingNumber}
                            color="success"
                            size="small"
                            variant="outlined"
                            className='px-2!'
                          />
                          <Tooltip title="Copy Tracking Number">
                            <Button
                              size="small"
                              sx={{ minWidth: 'auto', p: 0.5 }}
                              onClick={() => copyTrackingNumber(trackingNumber)}
                            >
                              <ContentCopy fontSize="small" />
                            </Button>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Chip
                          label="Pending"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={shipmentStatus.icon}
                        label={shipmentStatus.label}
                        color={shipmentStatus.color}
                        size="small"
                        sx={{ fontSize: '11px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0}>
                        <Typography variant="body2" fontWeight="bold">
                          ${(shipment.total_amount || 0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{((shipment.total_amount || 0) * (shipment.exchange_rate || usdToInr)).toFixed(2)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewDetails(shipment)}
                          sx={{ minWidth: 'auto', px: 1 }}
                        >
                          <Visibility fontSize="small" />
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredShipments.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      )}

      {/* Shipment Detail Dialog */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Shipment Details
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Print Shipment Details">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrintShipment}
                >
                  Print
                </Button>
              </Tooltip>
              <Tooltip title="Download as PDF">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<PictureAsPdf />}
                  onClick={handleDownloadPDF}
                >
                  PDF
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedShipment && (
            <Stack spacing={3} ref={printRef}>
              {/* Order Header */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Order #{selectedShipment.order_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {selectedShipment.status}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Order Date:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedShipment.order_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Est. Delivery:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedShipment.estimated_delivery).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Exchange Rate:
                        </Typography>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          1 USD = ₹{selectedShipment.exchange_rate || usdToInr}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* Tracking Information */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                  Tracking Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="caption" color="text.secondary">
                        Courier Service
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedShipment.dispatch_info?.courier_service || selectedShipment.courier_service || 'Not specified'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="caption" color="text.secondary">
                        Tracking Number
                      </Typography>
                      {(selectedShipment.dispatch_info?.tracking_number || selectedShipment.tracking_number) ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Chip
                            icon={<LocalShipping sx={{ fontSize: 14 }} />}
                            label={selectedShipment.dispatch_info?.tracking_number || selectedShipment.tracking_number}
                            color="success"
                            size="small"
                          />
                          <Tooltip title="Copy">
                            <Button
                              size="small"
                              sx={{ minWidth: 'auto', p: 0.5 }}
                              onClick={() => copyTrackingNumber(selectedShipment.dispatch_info?.tracking_number || selectedShipment.tracking_number)}
                            >
                              <ContentCopy fontSize="small" />
                            </Button>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="warning.main" fontWeight="medium">
                          Pending
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="caption" color="text.secondary">
                        Shipment Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {(() => {
                          const status = getShipmentStatus(selectedShipment);
                          return (
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          );
                        })()}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Dispatch Notes */}
                {selectedShipment.dispatch_info?.dispatch_notes && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> {selectedShipment.dispatch_info.dispatch_notes}
                    </Typography>
                  </Alert>
                )}
              </Paper>

              {/* Order Items */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Order Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Part Number</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedShipment.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            <Stack spacing={0}>
                              <Typography variant="body2">${item.unit_price.toFixed(2)}</Typography>
                              <Typography variant="caption" color="text.secondary">₹{(item.unit_price * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Stack spacing={0}>
                              <Typography variant="body2" fontWeight="bold">${item.total_price.toFixed(2)}</Typography>
                              <Typography variant="caption" color="text.secondary">₹{(item.total_price * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Order Summary */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Order Summary
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2">${selectedShipment.subtotal.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{(selectedShipment.subtotal * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tax:</Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2">${selectedShipment.tax.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{(selectedShipment.tax * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Shipping:</Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="body2">${selectedShipment.shipping.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">₹{(selectedShipment.shipping * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}</Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount:
                    </Typography>
                    <Stack spacing={0} alignItems="flex-end">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ${selectedShipment.total_amount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{(selectedShipment.total_amount * (selectedShipment.exchange_rate || usdToInr)).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Shipping Address */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Shipping Address
                </Typography>
                <Typography variant="body2">
                  {selectedShipment.shipping_address.street}
                </Typography>
                <Typography variant="body2">
                  {selectedShipment.shipping_address.city}, {selectedShipment.shipping_address.state} {selectedShipment.shipping_address.zip}
                </Typography>
                <Typography variant="body2">
                  {selectedShipment.shipping_address.country}
                </Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Shipments;
