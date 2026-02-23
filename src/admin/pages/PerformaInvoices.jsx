import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Link,
  Slider,
  CircularProgress,
  Autocomplete
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Print,
  Email,
  FilterList,
  Payment,
  Receipt,
  TrendingUp,
  TrendingDown,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Edit,
  Inventory,
  LocalShipping,
  Warning,
  AccountBalance,
  AttachMoney,
  Refresh,
  ContentCopy,
  Replay,
  PictureAsPdf,
  MoneyOff,
  Percent,
  AccountBalanceWallet,
  OpenInNew,
  Image as ImageIcon,
  CloudUpload,
  Description,
  Pending
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { proformaInvoicesService, dispatchesService } from '../../services'
import { useDispatchesBySource } from '../../hooks/useDispatchedOrders'
import paymentRecordsService from '../../services/paymentRecords.service'
import { useCreateInvoiceFromPI } from '../../hooks/useInvoices'
import invoiceSettingsData from '../../mock/invoiceSettings.json'
import settingsData from '../../mock/settings.json'
import { useCurrency } from '../../context/CurrencyContext'
import BankDetailsCard from '../components/BankDetailsCard'
import EditPIItemsDialog from '../components/EditPIItemsDialog'
import PerformaInvoicePrintPreview from '../components/PerformaInvoicePrintPreview'
import SendEmailModal from '../components/SendEmailModal'
import apiClient from '../../services/api/client'
import ENDPOINTS from '../../services/api/endpoints'

function PerformaInvoices() {
  const navigate = useNavigate()
  const { usdToInr } = useCurrency()

  // React Query mutation for creating invoice from PI
  const createInvoiceMutation = useCreateInvoiceFromPI()

  const [performaInvoices, setPerformaInvoices] = useState([])
  const [invoices, setInvoices] = useState([])
  const [invoiceSettings, setInvoiceSettings] = useState(invoiceSettingsData)

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPI, setSelectedPI] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [showEditItemsModal, setShowEditItemsModal] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState([])

  // Tab state for payment-based filtering
  const [activeTab, setActiveTab] = useState(0)

  // Print Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewPI, setPreviewPI] = useState(null)
  const printRef = useRef(null)

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailPI, setEmailPI] = useState(null)
  const [buyerCurrentEmail, setBuyerCurrentEmail] = useState(null)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    currency: 'USD',
    payment_method: 'BANK_TRANSFER',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_exchange_rate: 83.5, // Manual exchange rate at time of payment
    collection_source: 'BUYER_PORTAL' // BUYER_PORTAL, ADMIN_DIRECT, EMAIL, PHONE_CALL, IN_PERSON, OTHER
  })

  // Direct collection proof file (for admin collecting via email/phone)
  const [directCollectionProof, setDirectCollectionProof] = useState(null)
  const [directCollectionProofPreview, setDirectCollectionProofPreview] = useState(null)
  const directCollectionProofRef = useRef(null)

  // Generate invoice on payment collection
  const [generateInvoiceOnPayment, setGenerateInvoiceOnPayment] = useState(true)

  // Pending payment records for the selected PI
  const [pendingPaymentRecords, setPendingPaymentRecords] = useState([])
  const [loadingPaymentRecords, setLoadingPaymentRecords] = useState(false)
  const [selectedPaymentRecordForCollection, setSelectedPaymentRecordForCollection] = useState(null)

  // Fetch dispatches for the selected PI (for dispatch history in detail modal)
  const {
    data: piDispatches = [],
    isLoading: loadingDispatches
  } = useDispatchesBySource(
    selectedPI ? 'PROFORMA_INVOICE' : null,
    selectedPI?._id
  )
  const [collectingPayment, setCollectingPayment] = useState(false)

  // Dispatch options state - enhanced with partial/percentage options
  const [dispatchWithoutPayment, setDispatchWithoutPayment] = useState(false)
  const [dispatchType, setDispatchType] = useState('STANDARD') // STANDARD, PROJECT, CREDIT, PARTIAL, HALF, PERCENTAGE
  const [dispatchPaymentOption, setDispatchPaymentOption] = useState('full') // full, without, partial, half, percentage
  const [dispatchPercentage, setDispatchPercentage] = useState(50) // For percentage-based dispatch
  const [projectName, setProjectName] = useState('')
  const [invoiceExchangeRate, setInvoiceExchangeRate] = useState(83.5) // Exchange rate for invoice generation

  // Dispatch shipping & invoice info - NEW: HSN, AWB, Shipping By, Invoice Number
  const [dispatchShippingInfo, setDispatchShippingInfo] = useState({
    hsn_code: '',
    awb_number: '',
    shipping_by: '',
    custom_invoice_number: '',
    generate_invoice: true, // Auto-generate invoice on dispatch
    shipping_notes: ''
  })

  // Common shipping providers for autocomplete
  const shippingProviders = ['FedEx', 'DHL', 'UPS', 'BlueDart', 'DTDC', 'Delhivery', 'IndiaPost', 'Aramex', 'TNT', 'Other']

  // Bank details state for editable bank selection
  const [selectedBankAccount, setSelectedBankAccount] = useState('primary') // primary, secondary, international, custom
  const [customBankDetails, setCustomBankDetails] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    ifsc_code: '',
    swift_code: '',
    branch: '',
    account_type: 'Current Account'
  })
  const [showBankEditModal, setShowBankEditModal] = useState(false)

  // Invoice Generation Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceModalTab, setInvoiceModalTab] = useState(0) // 0 = Form, 1 = Preview
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1) // Track next invoice number
  const [invoiceForm, setInvoiceForm] = useState({
    custom_invoice_number: '', // User-editable invoice number
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoice_type: 'TAX_INVOICE',
    notes: '',
    include_dispatch_info: true,
    // Additional fields for comprehensive invoice
    po_number: '',
    hsn_sac: '',
    awb_number: '',
    shipping_method: 'BYAIR',
    tax_type: 'IGST', // IGST, CGST_SGST, EXEMPT
    gst_rate: 18,
    terms_preset: 'STANDARD'
  })

  // Generate next invoice number based on existing invoices
  const generateNextInvoiceNumber = useCallback(() => {
    // Get current year and month for invoice numbering
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2) // Last 2 digits
    const month = String(now.getMonth() + 1).padStart(2, '0')

    // Format: INV-YYMM-XXXXX (e.g., INV-2602-00001)
    const prefix = `INV-${year}${month}`
    const number = String(nextInvoiceNumber).padStart(5, '0')
    return `${prefix}-${number}`
  }, [nextInvoiceNumber])

  // Fetch next invoice number when modal opens
  const initializeInvoiceNumber = useCallback(async () => {
    try {
      // Try to get the count of existing invoices to determine next number
      // For now, use a timestamp-based approach for uniqueness
      const timestamp = Date.now().toString().slice(-5)
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const defaultNumber = `INV-${year}${month}-${timestamp}`

      setInvoiceForm(prev => ({
        ...prev,
        custom_invoice_number: defaultNumber
      }))
    } catch (error) {
      console.error('Error generating invoice number:', error)
    }
  }, [])

  // Pagination and filter state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dispatchedFilter, setDispatchedFilter] = useState('all') // all, dispatched, undispatched - for Paid tab
  const [sortBy, setSortBy] = useState('issue_date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Fetch proforma invoices from API
  const fetchProformaInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await proformaInvoicesService.getAll()
      if (result.success) {
        // Map API data to component format with payment tracking fields
        const pis = (result.data?.proformaInvoices || result.data || []).map(pi => ({
          ...pi,
          performa_invoice_id: pi._id || pi.performa_invoice_id,
          performa_invoice_number: pi.proforma_number || pi.performa_invoice_number,
          customer_name: pi.buyer_name || pi.customer_name,
          customer_id: pi.buyer_id || pi.customer_id,
          quotation_id: pi.quote_number || pi.quotation_id,
          payment_received: pi.payment_received || 0,
          payment_history: pi.payment_history || [],
          payment_status: pi.payment_status || 'UNPAID',
          exchange_rate: pi.exchange_rate || usdToInr || 83.5,
          // Invoice generation tracking
          invoice_generated: pi.invoice_generated || false,
          invoice_id: pi.invoice || null,
          invoice_number: pi.invoice_number || null,
        }))
        setPerformaInvoices(pis)
      } else {
        setError(result.error || 'Failed to fetch proforma invoices')
        toast.error(result.error || 'Failed to fetch proforma invoices')
      }
    } catch (err) {
      console.error('[PerformaInvoices] Error fetching:', err)
      setError(err.message || 'Failed to fetch proforma invoices')
      toast.error(err.message || 'Failed to fetch proforma invoices')
    } finally {
      setLoading(false)
    }
  }, [usdToInr])

  useEffect(() => {
    fetchProformaInvoices()
  }, [fetchProformaInvoices])

  const handleViewDetails = (pi) => {
    setSelectedPI(pi)
    setShowDetailModal(true)
  }

  const handlePreview = (pi) => {
    setPreviewPI(pi)
    setShowPreviewModal(true)
  }

  const handlePrintAction = () => {
    const printContent = printRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Proforma Invoice- ${previewPI?.performa_invoice_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 0; }
              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 350)
    }
  }

  const handleDownloadPDF = () => {
    const printContent = printRef.current
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Proforma Invoice - ${previewPI?.performa_invoice_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 210mm;
                min-height: 297mm;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 0; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              window.onload = function() {
                alert('Use "Save as PDF" option in the Print dialog to download as PDF');
                window.print();
              };
            <\/script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handlePrint = (pi) => {
    handlePreview(pi)
  }

  // Direct PDF download from table row
  const handleDirectPDF = (pi) => {
    setPreviewPI(pi)
    // Wait for state and ref to update, then trigger PDF
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Proforma Invoice - ${pi.performa_invoice_number}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body {
                  width: 210mm;
                  min-height: 297mm;
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                @page { size: A4; margin: 0; }
              </style>
            </head>
            <body>
              ${printRef.current.outerHTML}
              <script>
                window.onload = function() {
                  alert('Use "Save as PDF" option in the Print dialog to download as PDF');
                  window.print();
                };
              <\/script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }, 100)
  }

  // Direct Print from table row
  const handleDirectPrint = (pi) => {
    setPreviewPI(pi)
    // Wait for state and ref to update, then trigger print
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Proforma Invoice - ${pi.performa_invoice_number}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body {
                  width: 210mm;
                  min-height: 297mm;
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                @page { size: A4; margin: 0; }
                @media print {
                  html, body {
                    width: 210mm;
                    height: 297mm;
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.outerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 350)
      }
    }, 100)
  }

  const handleEmail = async (pi) => {
    setEmailPI(pi)
    setBuyerCurrentEmail(null) // Reset previous email

    // Fetch buyer's current email from the users API
    try {
      const buyerId = pi.buyer?._id || pi.buyer
      if (buyerId) {
        const response = await apiClient.get(ENDPOINTS.USERS.GET(buyerId))
        if (response.data?.data?.email) {
          setBuyerCurrentEmail(response.data.data.email)
        }
      }
    } catch (err) {
      console.warn('[PerformaInvoices] Could not fetch buyer current email:', err.message)
      // Modal will still open with stored email as fallback
    }

    setShowEmailModal(true)
  }

  const handleApprove = async (piId) => {
    try {
      const result = await proformaInvoicesService.approve(piId)
      if (result.success) {
        setPerformaInvoices(performaInvoices.map(pi =>
          pi.performa_invoice_id === piId || pi._id === piId
            ? { ...pi, status: 'APPROVED', approved_date: new Date().toISOString() }
            : pi
        ))
        toast.success('Performa Invoice approved successfully!')
      } else {
        toast.error(result.error || 'Failed to approve PI')
      }
    } catch (err) {
      console.error('[PerformaInvoices] Error approving:', err)
      toast.error(err.message || 'Failed to approve PI')
    }
  }

  const handleReject = async (piId) => {
    try {
      const result = await proformaInvoicesService.reject(piId)
      if (result.success) {
        setPerformaInvoices(performaInvoices.map(pi =>
          pi.performa_invoice_id === piId || pi._id === piId
            ? { ...pi, status: 'REJECTED', approved_date: null }
            : pi
        ))
        toast.success('Performa Invoice rejected.')
      } else {
        toast.error(result.error || 'Failed to reject PI')
      }
    } catch (err) {
      console.error('[PerformaInvoices] Error rejecting:', err)
      toast.error(err.message || 'Failed to reject PI')
    }
  }

  const handleCollectPayment = async (pi) => {
    setSelectedPI(pi)
    const remainingAmount = pi.total_amount - (pi.payment_received || 0)
    setPaymentForm({
      amount: remainingAmount,
      currency: 'USD',
      payment_method: 'BANK_TRANSFER',
      transaction_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_exchange_rate: pi.exchange_rate || usdToInr, // Default to PI's rate or global rate
      collection_source: 'ADMIN_DIRECT' // Default to admin direct when opening modal
    })
    setSelectedPaymentRecordForCollection(null)
    setDirectCollectionProof(null)
    setDirectCollectionProofPreview(null)
    setShowPaymentModal(true)

    // Fetch pending payment records for this PI
    setLoadingPaymentRecords(true)
    try {
      const result = await paymentRecordsService.getByProformaInvoice(pi._id)
      if (result.success) {
        // Filter to show only PENDING records
        const pending = (result.data?.records || []).filter(r => r.status === 'PENDING')
        setPendingPaymentRecords(pending)
      } else {
        setPendingPaymentRecords([])
      }
    } catch (err) {
      console.error('[PerformaInvoices] Error fetching payment records:', err)
      setPendingPaymentRecords([])
    } finally {
      setLoadingPaymentRecords(false)
    }
  }

  // Handle selecting a payment record to pre-fill the form
  const handleSelectPaymentRecord = (record) => {
    setSelectedPaymentRecordForCollection(record)
    setDirectCollectionProof(null) // Clear direct proof when selecting buyer record
    setDirectCollectionProofPreview(null)
    setPaymentForm({
      amount: record.amount || 0,
      currency: record.currency || 'USD',
      payment_method: record.payment_method || 'BANK_TRANSFER',
      transaction_id: record.transaction_id || '',
      payment_date: record.payment_date
        ? new Date(record.payment_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes: record.notes || '',
      payment_exchange_rate: selectedPI?.exchange_rate || usdToInr,
      collection_source: 'BUYER_PORTAL' // Buyer submitted record
    })
  }

  // Handle direct collection proof file selection
  const handleDirectCollectionProofSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setDirectCollectionProof(file)
      if (file.type.startsWith('image/')) {
        setDirectCollectionProofPreview(URL.createObjectURL(file))
      } else {
        setDirectCollectionProofPreview(null)
      }
    }
  }

  const confirmPayment = async () => {
    // Prevent double-clicks
    if (collectingPayment) return
    setCollectingPayment(true)

    // Use the manual payment exchange rate entered by admin
    const paymentExchangeRate = parseFloat(paymentForm.payment_exchange_rate) || usdToInr
    const paymentAmount = paymentForm.currency === 'USD'
      ? parseFloat(paymentForm.amount)
      : parseFloat(paymentForm.amount) / paymentExchangeRate

    // If a payment record was selected, verify it via API
    if (selectedPaymentRecordForCollection) {
      try {
        const result = await paymentRecordsService.verify(selectedPaymentRecordForCollection._id, {
          recorded_amount: paymentAmount,
          verification_notes: paymentForm.notes || 'Payment verified and recorded by admin',
          payment_exchange_rate: paymentExchangeRate,
          payment_method: paymentForm.payment_method,
          payment_date: paymentForm.payment_date,
          transaction_id: paymentForm.transaction_id,
          generate_invoice: generateInvoiceOnPayment,
        })

        if (result.success) {
          let successMsg = `Payment of ${paymentForm.currency} ${paymentForm.amount} verified and recorded!`
          if (generateInvoiceOnPayment && result.data?.invoice) {
            successMsg += ` Invoice #${result.data.invoice.invoice_number} generated.`
          }
          toast.success(successMsg)
          setShowPaymentModal(false)
          setSelectedPaymentRecordForCollection(null)
          setPendingPaymentRecords([])
          setCollectingPayment(false)
          fetchProformaInvoices() // Refresh PI list to get updated payment status
          return
        } else {
          toast.error(result.error || 'Failed to verify payment record')
          setCollectingPayment(false)
          return
        }
      } catch (err) {
        console.error('[PerformaInvoices] Error verifying payment record:', err)
        toast.error('Failed to verify payment record')
        setCollectingPayment(false)
        return
      }
    }

    // Direct payment collection via admin (no buyer submission)
    // Use the adminCollect API to create a payment record that's visible to both admin and buyer
    try {
      const result = await paymentRecordsService.adminCollect({
        proforma_invoice_id: selectedPI._id,
        amount: paymentAmount,
        currency: paymentForm.currency,
        transaction_id: paymentForm.transaction_id,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
        collection_source: paymentForm.collection_source || 'ADMIN_DIRECT',
        payment_exchange_rate: paymentExchangeRate,
      }, directCollectionProof)

      if (result.success) {
        let successMsg = `Payment of ${paymentForm.currency} ${paymentForm.amount} collected via ${getCollectionSourceLabel(paymentForm.collection_source)}!`
        if (generateInvoiceOnPayment && result.data?.invoice) {
          successMsg += ` Invoice #${result.data.invoice.invoice_number} generated.`
        }
        toast.success(successMsg)
        setShowPaymentModal(false)
        setPendingPaymentRecords([])
        setDirectCollectionProof(null)
        setDirectCollectionProofPreview(null)
        setCollectingPayment(false)
        fetchProformaInvoices() // Refresh PI list to get updated payment status
        return // Exit after success - prevent any error from showing
      }

      // Only show error if result.success is false
      toast.error(result.error || 'Failed to collect payment')
      setCollectingPayment(false)
    } catch (err) {
      console.error('[PerformaInvoices] Error collecting payment:', err)
      toast.error(err.message || 'Failed to collect payment')
      setCollectingPayment(false)
    }
  }

  // Helper function to get collection source label
  const getCollectionSourceLabel = (source) => {
    const labels = {
      'BUYER_PORTAL': 'Buyer Portal',
      'ADMIN_DIRECT': 'Admin Direct',
      'EMAIL': 'Email',
      'PHONE_CALL': 'Phone Call',
      'IN_PERSON': 'In Person',
      'OTHER': 'Other'
    }
    return labels[source] || source
  }

  // Handler for editing PI items
  const handleEditItems = (pi) => {
    setSelectedPI(pi)
    setShowEditItemsModal(true)
  }

  const handleSaveEditedItems = async (updatedPI) => {
    try {
      const piId = updatedPI._id || updatedPI.performa_invoice_id
      const result = await proformaInvoicesService.update(piId, {
        items: updatedPI.items,
        subtotal: updatedPI.subtotal,
        total_amount: updatedPI.total_amount,
        exchange_rate: updatedPI.exchange_rate,
      })

      if (result.success) {
        setPerformaInvoices(performaInvoices.map(pi =>
          (pi.performa_invoice_id === updatedPI.performa_invoice_id || pi._id === updatedPI._id)
            ? updatedPI
            : pi
        ))
        // Also update the selectedPI for immediate UI refresh
        setSelectedPI(updatedPI)
        toast.success('PI items updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update PI items')
      }
    } catch (err) {
      console.error('[PerformaInvoices] Error updating items:', err)
      toast.error(err.message || 'Failed to update PI items')
    }
  }

  // Update PI exchange rate
  const handleUpdatePIExchangeRate = async (pi, newRate) => {
    if (!newRate || newRate <= 0) return

    const updatedPI = {
      ...pi,
      exchange_rate: newRate,
      exchange_rate_history: [
        ...(pi.exchange_rate_history || []),
        {
          previous_rate: pi.exchange_rate,
          new_rate: newRate,
          changed_at: new Date().toISOString(),
          changed_by: 'admin'
        }
      ]
    }

    try {
      const piId = pi._id || pi.performa_invoice_id
      const result = await proformaInvoicesService.update(piId, {
        exchange_rate: newRate,
      })

      if (result.success) {
        setPerformaInvoices(performaInvoices.map(p =>
          (p.performa_invoice_id === pi.performa_invoice_id || p._id === pi._id) ? updatedPI : p
        ))
        setSelectedPI(updatedPI)
        toast.success('Exchange rate updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update exchange rate')
      }
    } catch (err) {
      console.error('[PerformaInvoices] Error updating exchange rate:', err)
      toast.error(err.message || 'Failed to update exchange rate')
    }
  }

  // Renew PI - extends expiry date
  const handleRenewPI = (pi, validityDays = 30) => {
    const newValidUntil = new Date()
    newValidUntil.setDate(newValidUntil.getDate() + validityDays)

    const validityPeriod = validityDays === 7 ? '7_DAYS' : validityDays === 15 ? '15_DAYS' : '30_DAYS'

    const updatedPI = {
      ...pi,
      valid_until: newValidUntil.toISOString(),
      validity_period: validityPeriod,
      status: 'PENDING', // Reset to pending after renewal
      renewal_count: (pi.renewal_count || 0) + 1,
      last_renewed: new Date().toISOString(),
      renewal_history: [
        ...(pi.renewal_history || []),
        {
          renewed_at: new Date().toISOString(),
          previous_valid_until: pi.valid_until,
          new_valid_until: newValidUntil.toISOString(),
          renewed_by: 'admin'
        }
      ]
    }

    setPerformaInvoices(performaInvoices.map(p =>
      p.performa_invoice_id === pi.performa_invoice_id ? updatedPI : p
    ))
    if (selectedPI?.performa_invoice_id === pi.performa_invoice_id) {
      setSelectedPI(updatedPI)
    }
    alert(`PI renewed successfully! New validity: ${validityDays} days (until ${newValidUntil.toLocaleDateString()})`)
  }

  // Reactivate PI - changes status from EXPIRED/REJECTED to PENDING (same PI number)
  const handleReactivatePI = (pi) => {
    const newValidUntil = new Date()
    newValidUntil.setDate(newValidUntil.getDate() + 30) // Default 30 days

    const updatedPI = {
      ...pi,
      status: 'APPROVED', // Set to APPROVED so it can be dispatched
      valid_until: newValidUntil.toISOString(),
      validity_period: '30_DAYS',
      reactivated_at: new Date().toISOString(),
      // Keep same PI number - important!
      performa_invoice_number: pi.performa_invoice_number,
      performa_invoice_id: pi.performa_invoice_id,
      reactivation_history: [
        ...(pi.reactivation_history || []),
        {
          reactivated_at: new Date().toISOString(),
          previous_status: pi.status,
          previous_valid_until: pi.valid_until,
          new_valid_until: newValidUntil.toISOString(),
          reactivated_by: 'admin'
        }
      ]
    }

    setPerformaInvoices(performaInvoices.map(p =>
      p.performa_invoice_id === pi.performa_invoice_id ? updatedPI : p
    ))
    if (selectedPI?.performa_invoice_id === pi.performa_invoice_id) {
      setSelectedPI(updatedPI)
    }
    setActiveTab(0) // Go to All tab to see the reactivated PI
    alert(`PI reactivated successfully!\n\nPI Number: ${pi.performa_invoice_number} (unchanged)\nStatus: ${pi.status} → APPROVED\nNew Validity: 30 days\n\n✓ PI is now editable`)
  }

  // Clone PI - creates a copy with new PI number, resets payment, keeps products
  const handleClonePI = async (pi) => {
    // Get the PI ID - could be _id or performa_invoice_id
    const piId = pi._id || pi.performa_invoice_id

    if (!piId || piId.toString().startsWith('PI-')) {
      toast.error('Cannot clone this PI - invalid ID. Please save it to database first.')
      return
    }

    try {
      setLoading(true)
      const result = await proformaInvoicesService.clone(piId)

      if (result.success) {
        const clonedPI = result.data.proforma
        toast.success(`PI cloned successfully! New PI: ${clonedPI.proforma_number}`)
        // Refresh the list to show the new cloned PI
        fetchProformaInvoices()
      } else {
        toast.error(result.error || 'Failed to clone PI')
      }
    } catch (error) {
      console.error('Error cloning PI:', error)
      toast.error('Failed to clone PI')
    } finally {
      setLoading(false)
    }
  }

  const handleDispatch = (pi) => {
    setSelectedPI(pi)
    // Reset dispatch options
    setDispatchWithoutPayment(false)
    setDispatchType('STANDARD')
    setProjectName('')
    // Initialize invoice exchange rate from PI's rate (can be edited for invoice)
    setInvoiceExchangeRate(pi.exchange_rate || usdToInr)

    // Initialize dispatch shipping info with auto-generated invoice number
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-5)
    const defaultInvoiceNumber = `INV-${year}${month}-${timestamp}`

    setDispatchShippingInfo({
      hsn_code: '',
      awb_number: '',
      shipping_by: '',
      custom_invoice_number: defaultInvoiceNumber,
      generate_invoice: true,
      shipping_notes: ''
    })

    // Initialize invoice items with editable quantities and manual inventory tracking
    const items = pi.items.map(item => {
      return {
        ...item,
        invoice_quantity: item.quantity,
        original_quantity: item.quantity,
        hsn_code: item.hsn_code || "",
        // Set has_inventory from item data if available, otherwise default to false (no inventory)
        has_inventory: item.has_inventory || false,
        inventory_quantity: item.inventory_quantity || 0
      }
    })
    setInvoiceItems(items)
    setShowDispatchModal(true)
  }

  const handleQuantityChange = (index, newQuantity) => {
    const updatedItems = [...invoiceItems]
    const qty = Math.max(0, Math.min(newQuantity, updatedItems[index].original_quantity))
    updatedItems[index].invoice_quantity = qty
    setInvoiceItems(updatedItems)
  }

  // Handle HSS code change per item
  const handleItemHsnCodeChange = (index, hsnCode) => {
    const updatedItems = [...invoiceItems]
    updatedItems[index].hsn_code = hsnCode
    setInvoiceItems(updatedItems)
  }

  const handleRemoveItem = (index) => {
    const itemToRemove = invoiceItems[index]

    // Check if there are multiple items
    if (invoiceItems.length <= 1) {
      alert('Cannot remove item: At least one item must remain in the invoice.')
      return
    }

    // Check if the item has inventory
    if (itemToRemove.has_inventory) {
      alert(`Cannot remove "${itemToRemove.product_name}": This product has inventory (${itemToRemove.inventory_quantity} units available). Items with inventory cannot be removed.`)
      return
    }

    // Remove the item if all checks pass
    const updatedItems = invoiceItems.filter((_, i) => i !== index)
    setInvoiceItems(updatedItems)
  }

  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce((sum, item) => {
      return sum + ((item.unit_price || 0) * (item.invoice_quantity || 0))
    }, 0)
  }

  // Generate invoice number using series settings
  const generateInvoiceNumber = () => {
    const settings = invoiceSettings.invoiceSeries
    const year = new Date().getFullYear().toString()
    const yearShort = year.slice(-2)

    // Get all used, skipped, and reserved numbers
    const usedNumbers = invoiceSettings.usedNumbers || []
    const skippedNumbers = invoiceSettings.skippedNumbers.map(s => s.number)
    const reservedNumbers = invoiceSettings.reservedNumbers.map(r => r.number)
    const unavailableNumbers = [...usedNumbers, ...skippedNumbers, ...reservedNumbers]

    // Find next available number (greater than last used, not in unavailable list)
    let nextNumber = settings.last_invoice_number + 1
    while (unavailableNumbers.includes(nextNumber)) {
      nextNumber++
    }

    // Format the invoice number based on settings
    const padding = settings.padding || 4
    const formattedNumber = String(nextNumber).padStart(padding, '0')

    // Use year prefix if configured
    if (settings.year_prefix) {
      return `${yearShort}${formattedNumber}`
    }
    return formattedNumber
  }

  // Get series number for invoice
  const getNextSeriesNumber = () => {
    const settings = invoiceSettings.invoiceSeries
    const usedNumbers = invoiceSettings.usedNumbers || []
    const skippedNumbers = invoiceSettings.skippedNumbers.map(s => s.number)
    const reservedNumbers = invoiceSettings.reservedNumbers.map(r => r.number)
    const unavailableNumbers = [...usedNumbers, ...skippedNumbers, ...reservedNumbers]

    let nextNumber = settings.last_invoice_number + 1
    while (unavailableNumbers.includes(nextNumber)) {
      nextNumber++
    }
    return nextNumber
  }

  // Calculate dispatch financial summary for partial payments
  const calculateDispatchSummary = () => {
    const itemsToDispatch = invoiceItems.filter(item => (item.invoice_quantity || 0) > 0)
    const invoiceSubtotal = itemsToDispatch.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.invoice_quantity || 0)), 0)
    const taxRate = selectedPI?.tax && selectedPI?.subtotal ? (selectedPI.tax / selectedPI.subtotal * 100) : 10
    const invoiceTax = (invoiceSubtotal * taxRate) / 100
    const invoiceShipping = selectedPI?.shipping || 0
    const invoiceTotal = invoiceSubtotal + invoiceTax + invoiceShipping

    const paymentReceived = selectedPI?.payment_received || 0
    const piTotal = selectedPI?.total_amount || 0

    // Calculate how payment is applied to this invoice
    const amountAppliedToInvoice = Math.min(paymentReceived, invoiceTotal)
    const invoiceBalanceDue = Math.max(0, invoiceTotal - amountAppliedToInvoice)

    // Calculate remaining items value (not dispatched)
    const remainingItemsTotal = piTotal - invoiceTotal

    // Calculate advance/credit if payment exceeds invoice total
    const advanceCredit = Math.max(0, paymentReceived - invoiceTotal)

    // Calculate remaining PI due (for undispatched items)
    const remainingPIDue = Math.max(0, remainingItemsTotal - advanceCredit)

    return {
      invoiceSubtotal,
      invoiceTax,
      invoiceShipping,
      invoiceTotal,
      paymentReceived,
      piTotal,
      amountAppliedToInvoice,
      invoiceBalanceDue,
      remainingItemsTotal,
      advanceCredit,
      remainingPIDue,
      itemsToDispatch,
      taxRate
    }
  }

  const confirmDispatch = async () => {
    // Filter out items with zero quantity
    const itemsToDispatch = invoiceItems.filter(item => item.invoice_quantity > 0)

    if (itemsToDispatch.length === 0) {
      toast.error('Please include at least one item with quantity greater than 0')
      return
    }

    // Calculate financial summary for tracking
    const summary = calculateDispatchSummary()

    // Prepare dispatch data for API
    const dispatchData = {
      source_type: 'PROFORMA_INVOICE',
      source_id: selectedPI._id || selectedPI.id,
      items: itemsToDispatch.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        part_number: item.part_number,
        quantity: item.invoice_quantity,
        unit_price: item.unit_price,
      })),
      shipping_info: {
        hsn_code: dispatchShippingInfo.hsn_code || '',
        awb_number: dispatchShippingInfo.awb_number || '',
        shipping_by: dispatchShippingInfo.shipping_by || '',
        notes: dispatchShippingInfo.shipping_notes || ''
      },
      dispatch_type: dispatchType,
      project_name: dispatchWithoutPayment ? projectName : null,
      generate_invoice: dispatchShippingInfo.generate_invoice || false,
      invoice_number: dispatchShippingInfo.generate_invoice ? dispatchShippingInfo.custom_invoice_number : null,
      exchange_rate: invoiceExchangeRate,
      notes: dispatchShippingInfo.shipping_notes || ''
    }

    try {
      // Call the dispatch API
      const result = await dispatchesService.create(dispatchData)

      if (result.success) {
        const { dispatch, invoice, is_fully_dispatched } = result.data

        // Refresh the PI list to get updated data
        fetchProformaInvoices()

        // Build success message
        let successMsg = `Dispatch ${dispatch.dispatch_id} created successfully!`
        if (invoice) {
          successMsg += ` Invoice ${invoice.invoice_number} generated.`
        }
        if (!is_fully_dispatched) {
          successMsg += ' (Partial dispatch - remaining items pending)'
        }

        toast.success(successMsg)
        setShowDispatchModal(false)
      } else {
        toast.error(result.error || 'Failed to create dispatch')
      }
    } catch (error) {
      console.error('[Dispatch] Error:', error)
      toast.error('An error occurred while creating dispatch')
    }
  }

  // Open invoice generation modal for fully paid PI
  const handleGenerateInvoice = (pi) => {
    // Only allow for fully paid PIs
    if (pi.payment_status !== 'PAID') {
      alert('Invoice can only be generated after full payment is received.')
      return
    }

    // Check if invoice already generated
    if (pi.invoice_generated) {
      alert('Invoice has already been generated for this PI.')
      return
    }

    // Set selected PI and open modal
    setSelectedPI(pi)
    // Initialize invoice exchange rate from PI's rate
    setInvoiceExchangeRate(pi.exchange_rate || usdToInr)

    // Generate unique invoice number
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-5)
    const generatedInvoiceNumber = `INV-${year}${month}-${timestamp}`

    // Reset invoice form with defaults including invoice number
    setInvoiceForm({
      custom_invoice_number: generatedInvoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      invoice_type: 'TAX_INVOICE',
      notes: '',
      include_dispatch_info: pi.dispatched || false,
      po_number: '',
      hsn_sac: '',
      awb_number: '',
      shipping_method: 'BYAIR',
      tax_type: 'IGST',
      gst_rate: 18,
      terms_preset: 'STANDARD'
    })
    setInvoiceModalTab(0)
    setShowInvoiceModal(true)
  }

  // Confirm and generate invoice via React Query mutation
  const confirmGenerateInvoice = () => {
    if (!selectedPI) return

    const pi = selectedPI
    const piId = pi._id || pi.performa_invoice_id

    // Prepare API request payload
    const invoiceData = {
      proforma_invoice_id: piId,
      custom_invoice_number: invoiceForm.custom_invoice_number, // User-defined invoice number
      invoice_type: invoiceForm.invoice_type,
      invoice_date: invoiceForm.invoice_date,
      due_date: invoiceForm.due_date,
      exchange_rate: invoiceExchangeRate,
      bank_details: selectedBankAccount === 'custom'
        ? customBankDetails
        : settingsData.bankDetails[selectedBankAccount],
      bank_account_type: selectedBankAccount,
      include_dispatch_info: invoiceForm.include_dispatch_info,
      notes: invoiceForm.notes || '',
      // Additional fields
      po_number: invoiceForm.po_number || '',
      hsn_sac: invoiceForm.hsn_sac || '',
      awb_number: invoiceForm.awb_number || '',
      shipping_method: invoiceForm.shipping_method,
      tax_type: invoiceForm.tax_type,
      tax_rate: invoiceForm.gst_rate,
      terms_preset: invoiceForm.terms_preset
    }

    createInvoiceMutation.mutate(invoiceData, {
      onSuccess: (data) => {
        const invoice = data?.invoice || data

        // Update local PI state to mark invoice as generated
        setPerformaInvoices(performaInvoices.map(p =>
          (p._id || p.performa_invoice_id) === piId
            ? {
                ...p,
                invoice_generated: true,
                invoice_id: invoice._id || invoice.invoice_id,
                invoice_number: invoice.invoice_number,
                invoices_generated: [...(p.invoices_generated || []), {
                  invoice_id: invoice._id || invoice.invoice_id,
                  invoice_number: invoice.invoice_number,
                  total: invoice.total_amount,
                  items_count: invoice.items?.length || pi.items?.length,
                  created_at: invoice.created_at || new Date().toISOString()
                }]
              }
            : p
        ))

        setShowInvoiceModal(false)
      },
      onError: (error) => {
        // If error indicates invoice already exists, update local state
        if (error.message?.includes('already exists')) {
          // Extract invoice number from error message if present
          const match = error.message.match(/Invoice (INV-\d+) already exists/)
          const invoiceNumber = match ? match[1] : 'Generated'

          setPerformaInvoices(performaInvoices.map(p =>
            (p._id || p.performa_invoice_id) === piId
              ? {
                  ...p,
                  invoice_generated: true,
                  invoice_number: invoiceNumber
                }
              : p
          ))

          setShowInvoiceModal(false)
          toast.info(`Invoice ${invoiceNumber} already exists for this PI`)
        }
      }
    })
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'success'
      case 'PARTIAL':
        return 'warning'
      case 'UNPAID':
        return 'error'
      default:
        return 'default'
    }
  }

  const calculatePaymentPercentage = (pi) => {
    if (!pi.total_amount || pi.total_amount === 0) return 0
    return Math.min(100, ((pi.payment_received || 0) / pi.total_amount) * 100)
  }

  const getRemainingAmount = (pi) => {
    return Math.max(0, (pi?.total_amount || 0) - (pi?.payment_received || 0))
  }

  const getAdvanceAmount = (pi) => {
    return Math.max(0, (pi?.payment_received || 0) - (pi?.total_amount || 0))
  }

  // Tab-based filtering by payment status
  const getTabFilteredPIs = () => {
    let filtered = performaInvoices

    // First apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pi =>
        pi.performa_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pi.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pi.quotation_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter if set
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pi => pi.status === statusFilter)
    }

    // Then apply tab-based payment filter
    // Logic: Payment status takes priority over EXPIRED status
    // - PAID PIs go to Paid tab (even if status is EXPIRED)
    // - PARTIAL PIs go to Partial tab (even if status is EXPIRED)
    // - UNPAID + EXPIRED status PIs go to Expired tab only
    // - UNPAID + non-EXPIRED status PIs go to Unpaid tab
    switch (activeTab) {
      case 0: // Total PI - All
        return filtered
      case 1: // Fully Paid - with dispatched filter (includes EXPIRED with PAID)
        let paidFiltered = filtered.filter(pi => pi.payment_status === 'PAID')
        // Apply dispatched filter for Paid tab
        if (dispatchedFilter === 'dispatched') {
          paidFiltered = paidFiltered.filter(pi => pi.dispatched === true)
        } else if (dispatchedFilter === 'undispatched') {
          paidFiltered = paidFiltered.filter(pi => !pi.dispatched)
        }
        return paidFiltered
      case 2: // Partial Paid (includes EXPIRED with PARTIAL payment)
        return filtered.filter(pi => pi.payment_status === 'PARTIAL')
      case 3: // UnPaid - only non-EXPIRED unpaid PIs
        return filtered.filter(pi =>
          (!pi.payment_status || pi.payment_status === 'UNPAID') &&
          pi.status !== 'EXPIRED'
        )
      case 4: // Expired - only EXPIRED status PIs that are UNPAID (no payment received)
        return filtered.filter(pi =>
          pi.status === 'EXPIRED' &&
          (!pi.payment_status || pi.payment_status === 'UNPAID')
        )
      default:
        return filtered
    }
  }

  // Tab counts for badges
  // Payment status takes priority - EXPIRED with payment goes to payment tabs
  const tabCounts = {
    total: performaInvoices.length,
    fullyPaid: performaInvoices.filter(pi => pi.payment_status === 'PAID').length,
    partialPaid: performaInvoices.filter(pi => pi.payment_status === 'PARTIAL').length,
    unpaid: performaInvoices.filter(pi =>
      (!pi.payment_status || pi.payment_status === 'UNPAID') &&
      pi.status !== 'EXPIRED'
    ).length,
    expired: performaInvoices.filter(pi =>
      pi.status === 'EXPIRED' &&
      (!pi.payment_status || pi.payment_status === 'UNPAID')
    ).length
  }

  // Total due amount calculation
  const totalDueAmount = performaInvoices.reduce((sum, pi) => {
    return sum + Math.max(0, pi.total_amount - (pi.payment_received || 0))
  }, 0)

  // Filter performa invoices based on active tab
  const filteredPIs = getTabFilteredPIs()

  // Sort performa invoices
  const sortedPIs = [...filteredPIs].sort((a, b) => {
    let compareA, compareB

    if (sortBy === 'issue_date') {
      compareA = new Date(a.issue_date)
      compareB = new Date(b.issue_date)
    } else if (sortBy === 'total_amount') {
      compareA = a.total_amount
      compareB = b.total_amount
    } else if (sortBy === 'performa_invoice_number') {
      compareA = a.performa_invoice_number
      compareB = b.performa_invoice_number
    }

    return sortOrder === 'asc' ? (compareA > compareB ? 1 : -1) : (compareA < compareB ? 1 : -1)
  })

  // Paginate performa invoices
  const paginatedPIs = sortedPIs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Calculate statistics
  const totalPIs = performaInvoices.length
  const approvedPIs = performaInvoices.filter(pi => pi.status === 'APPROVED').length
  const pendingPIs = performaInvoices.filter(pi => pi.status === 'PENDING').length
  const rejectedPIs = performaInvoices.filter(pi => pi.status === 'REJECTED').length
  const expiredPIs = performaInvoices.filter(pi => pi.status === 'EXPIRED').length
  const totalValue = performaInvoices.reduce((sum, pi) => sum + pi.total_amount, 0)
  const totalPaidAmount = performaInvoices.reduce((sum, pi) => sum + (pi.payment_received || 0), 0)

  // Handle customer name click - navigate to customer profile
  const handleCustomerClick = (customerId) => {
    navigate(`/admin/users/${customerId}`)
  }

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setPage(0) // Reset pagination when tab changes
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'REJECTED':
        return 'error'
      case 'EXPIRED':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle fontSize="small" />
      case 'PENDING':
        return <HourglassEmpty fontSize="small" />
      case 'REJECTED':
        return <Cancel fontSize="small" />
      case 'EXPIRED':
        return <Cancel fontSize="small" />
      default:
        return null
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4}} className='p-0!'>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <h1 className='text-2xl font-bold text-[#0b0c1a] mb-2'>
              Performa Invoices Management
            </h1>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Manage and track performa invoices for quotations
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={fetchProformaInvoices}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards - Compact */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card sx={{ bgcolor: 'primary.50' }}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Total Value</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card sx={{ bgcolor: 'success.50' }}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ${totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card sx={{ bgcolor: 'error.50' }}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Total Due</Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  ${totalDueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Approved</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.dark">
                  {approvedPIs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Pending</Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {pendingPIs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Total PIs</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {totalPIs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs for Payment Status Filtering */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '13px',
              py: 1.5
            },
            '& .Mui-selected': {
              fontWeight: 600
            }
          }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Receipt sx={{ fontSize: 16 }} />
                <span>All</span>
                <Chip label={tabCounts.total} size="small" sx={{ height: 18, fontSize: '10px', ml: 0.5 }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                <span>Paid</span>
                <Chip label={tabCounts.fullyPaid} size="small" color="success" sx={{ height: 18, fontSize: '10px', ml: 0.5 }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <AccountBalanceWallet sx={{ fontSize: 16, color: 'warning.main' }} />
                <span>Partial</span>
                <Chip label={tabCounts.partialPaid} size="small" color="warning" sx={{ height: 18, fontSize: '10px', ml: 0.5 }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <MoneyOff sx={{ fontSize: 16, color: 'error.main' }} />
                <span>Unpaid</span>
                <Chip label={tabCounts.unpaid} size="small" color="error" sx={{ height: 18, fontSize: '10px', ml: 0.5 }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <HourglassEmpty sx={{ fontSize: 16 }} />
                <span>Expired</span>
                <Chip label={tabCounts.expired} size="small" sx={{ height: 18, fontSize: '10px', ml: 0.5 }} />
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {/* Search and Filter - Simplified */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: activeTab === 1 ? 4 : 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by PI Number, Customer, or Quotation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: activeTab === 1 ? 2 : 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="PI Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              slotProps={{
                select: {
                  native: true
                }
              }}
            >
              <option value="all">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </TextField>
          </Grid>
          {/* Dispatched filter - only for Paid tab */}
          {activeTab === 1 && (
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Dispatch Status"
                value={dispatchedFilter}
                onChange={(e) => setDispatchedFilter(e.target.value)}
                slotProps={{
                  select: {
                    native: true
                  }
                }}
              >
                <option value="all">All</option>
                <option value="dispatched">Dispatched</option>
                <option value="undispatched">Undispatched</option>
              </TextField>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedPIs.length} of {filteredPIs.length} performa invoices
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Performa Invoices Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'performa_invoice_number'}
                  direction={sortBy === 'performa_invoice_number' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('performa_invoice_number')}
                >
                  <strong>PI Number</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Quotation ID</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'issue_date'}
                  direction={sortBy === 'issue_date' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('issue_date')}
                >
                  <strong>Issue Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortBy === 'total_amount'}
                  direction={sortBy === 'total_amount' ? sortOrder : 'asc'}
                  onClick={() => handleSortChange('total_amount')}
                >
                  <strong>Total Amount</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right"><strong>Payment Status</strong></TableCell>
              <TableCell align="center"><strong>Dispatch Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && performaInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary">
                      Loading proforma invoices...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : paginatedPIs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No performa invoices found matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPIs.map((pi) => {
                const isExpired = activeTab === 4 && new Date(pi.valid_until) < new Date()

                return (
                  <TableRow
                    key={pi.performa_invoice_id}
                    hover
                    sx={{
                      bgcolor: isExpired ? 'error.50' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {pi.performa_invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pi.quotation_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link
                        component="button"
                        variant="body2"
                        fontWeight="medium"
                        onClick={() => handleCustomerClick(pi.customer_id)}
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {pi.customer_name}
                      </Link>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {pi.customer_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(pi.issue_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Valid: {new Date(pi.valid_until).toLocaleDateString()}
                      </Typography>
                      {activeTab === 4 && (
                        <Typography variant="caption" color="error.main" fontWeight="bold" sx={{ fontSize: '10px' }}>
                          Expired
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                        ${(pi.total_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '13px' }}>
                        ₹{((pi.total_amount || 0) * (pi.exchange_rate || usdToInr)).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="primary.main" sx={{ fontSize: '10px', display: 'block' }}>
                        @{pi.exchange_rate || usdToInr}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ minWidth: 120 }}>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={pi.payment_status || 'UNPAID'}
                              color={getPaymentStatusColor(pi.payment_status)}
                              size="small"
                              sx={{ fontSize: '11px' }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={calculatePaymentPercentage(pi)}
                            color={pi.payment_status === 'PAID' ? 'success' : 'warning'}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '11px' }}>
                            {calculatePaymentPercentage(pi).toFixed(0)}% ({pi.payment_received || 0}/${pi.total_amount || 0})
                          </Typography>
                        </Stack>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ minWidth: 120 }}>
                        <Stack spacing={0.5} alignItems="center">
                          <Chip
                            label={pi.dispatch_status || 'NONE'}
                            color={
                              pi.dispatch_status === 'FULL' ? 'success' :
                              pi.dispatch_status === 'PARTIAL' ? 'warning' : 'default'
                            }
                            size="small"
                            sx={{ fontSize: '11px' }}
                          />
                          <LinearProgress
                            variant="determinate"
                            value={pi.total_quantity > 0 ? ((pi.dispatched_quantity || 0) / pi.total_quantity) * 100 : 0}
                            color={
                              pi.dispatch_status === 'FULL' ? 'success' :
                              pi.dispatch_status === 'PARTIAL' ? 'warning' : 'inherit'
                            }
                            sx={{ height: 6, borderRadius: 1, width: '100%' }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '11px' }}>
                            {pi.dispatched_quantity || 0}/{pi.total_quantity || 0} dispatched
                          </Typography>
                          {(pi.pending_quantity > 0 || (!pi.dispatch_status && pi.total_quantity > 0)) && (
                            <Typography variant="caption" color="warning.main" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                              {pi.pending_quantity || pi.total_quantity || 0} remaining
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5} alignItems="center">
                        {/* EXPIRED Tab - Only View and Reactivate */}
                        {activeTab === 4 ? (
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewDetails(pi)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reactivate PI (Same Number)">
                              <Button
                                size="small"
                                variant="contained"
                                color="info"
                                onClick={() => handleReactivatePI(pi)}
                                sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                              >
                                <Replay fontSize="small" sx={{ mr: 0.5 }} />
                                Reactivate
                              </Button>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <>
                            {/* Row 1: View, Print/PDF, Email, Collect Payment (for UNPAID/PARTIAL) */}
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewDetails(pi)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Print / Download PDF">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handlePreview(pi)}
                                >
                                  <Print fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Email">
                                <IconButton
                                  size="small"
                                  color="default"
                                  onClick={() => handleEmail(pi)}
                                >
                                  <Email fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {/* Collect Payment in upper row for UNPAID and PARTIAL */}
                              {(pi.payment_status === 'PARTIAL' || !pi.payment_status || pi.payment_status === 'UNPAID') && pi.status !== 'REJECTED' && (
                                <Tooltip title="Collect Payment">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleCollectPayment(pi)}
                                  >
                                    <Payment fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>

                            {/* Row 2: Context-specific actions based on payment status */}
                            <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">

                              {/* PAID - Dispatched: Generate Invoice + Clone */}
                              {pi.payment_status === 'PAID' && pi.dispatched && (
                                <>
                                  <Chip
                                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                    label="Dispatched"
                                    color="success"
                                    size="small"
                                    sx={{ fontSize: '10px', height: 24 }}
                                  />
                                  {!pi.invoice_generated ? (
                                    <Tooltip title="Generate Final Invoice">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleGenerateInvoice(pi)}
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <Receipt fontSize="small" sx={{ mr: 0.5 }} />
                                        Invoice
                                      </Button>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title={`Invoice: ${pi.invoice_number || 'Generated'}`}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        disabled
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <Receipt fontSize="small" sx={{ mr: 0.5 }} />
                                        Invoiced
                                      </Button>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Clone PI (New Number)">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleClonePI(pi)}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}

                              {/* PAID - Undispatched: Dispatch + Generate Invoice + Clone */}
                              {pi.payment_status === 'PAID' && !pi.dispatched && (
                                <>
                                  <Tooltip title="Dispatch">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      onClick={() => handleDispatch(pi)}
                                      sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                    >
                                      <LocalShipping fontSize="small" sx={{ mr: 0.5 }} />
                                      Dispatch
                                    </Button>
                                  </Tooltip>
                                  {!pi.invoice_generated ? (
                                    <Tooltip title="Generate Final Invoice">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleGenerateInvoice(pi)}
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <Receipt fontSize="small" sx={{ mr: 0.5 }} />
                                        Invoice
                                      </Button>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title={`Invoice: ${pi.invoice_number || 'Generated'}`}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        disabled
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <Receipt fontSize="small" sx={{ mr: 0.5 }} />
                                        Invoiced
                                      </Button>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Clone PI (New Number)">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleClonePI(pi)}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}

                              {/* PARTIAL PAID: Edit, Dispatch, Clone */}
                              {pi.payment_status === 'PARTIAL' && (
                                <>
                                  <Tooltip title="Edit PI">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditItems(pi)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {!pi.dispatched && (
                                    <Tooltip title="Dispatch (Partial Payment)">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        onClick={() => handleDispatch(pi)}
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <LocalShipping fontSize="small" sx={{ mr: 0.5 }} />
                                        Dispatch
                                      </Button>
                                    </Tooltip>
                                  )}
                                  {pi.dispatched && (
                                    <Chip
                                      icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                      label="Dispatched"
                                      color="success"
                                      size="small"
                                      sx={{ fontSize: '10px', height: 24 }}
                                    />
                                  )}
                                  <Tooltip title="Clone PI (New Number, Zero Payment)">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleClonePI(pi)}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}

                              {/* UNPAID: Edit, Dispatch, Clone */}
                              {(!pi.payment_status || pi.payment_status === 'UNPAID') && pi.status !== 'REJECTED' && pi.status !== 'EXPIRED' && (
                                <>
                                  <Tooltip title="Edit PI">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditItems(pi)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {!pi.dispatched && (
                                    <Tooltip title="Dispatch Without Payment">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="info"
                                        onClick={() => handleDispatch(pi)}
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <LocalShipping fontSize="small" sx={{ mr: 0.5 }} />
                                        Dispatch
                                      </Button>
                                    </Tooltip>
                                  )}
                                  {pi.dispatched && (
                                    <Chip
                                      icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                      label="Dispatched"
                                      color="success"
                                      size="small"
                                      sx={{ fontSize: '10px', height: 24 }}
                                    />
                                  )}
                                  <Tooltip title="Clone PI (New Number, Zero Payment)">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleClonePI(pi)}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}

                              {/* REJECTED: Edit, Dispatch, Clone */}
                              {pi.status === 'REJECTED' && (
                                <>
                                  <Tooltip title="Edit PI">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditItems(pi)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {!pi.dispatched && (
                                    <Tooltip title="Dispatch Without Payment">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="info"
                                        onClick={() => handleDispatch(pi)}
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <LocalShipping fontSize="small" sx={{ mr: 0.5 }} />
                                        Dispatch
                                      </Button>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Clone PI (New Number)">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleClonePI(pi)}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}

                              {/* EXPIRED status with UNPAID payment (when NOT in Expired tab): Edit, Dispatch, Clone */}
                              {pi.status === 'EXPIRED' && (!pi.payment_status || pi.payment_status === 'UNPAID') && activeTab !== 4 && (
                                <>
                                  <Tooltip title="Edit PI">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditItems(pi)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {!pi.dispatched && (
                                    <Tooltip title="Dispatch Without Payment">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="info"
                                        onClick={() => handleDispatch(pi)}
                                        sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                                      >
                                        <LocalShipping fontSize="small" sx={{ mr: 0.5 }} />
                                        Dispatch
                                      </Button>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Clone PI (New Number, Zero Payment)">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleClonePI(pi)}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPIs.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Performa Invoice Detail Dialog */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Performa Invoice Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPI && (
            <Stack spacing={3}>
              {/* PI Header */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      PI #{selectedPI.performa_invoice_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      PI ID: {selectedPI.performa_invoice_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quotation ID: {selectedPI.quotation_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer: {selectedPI.customer_name} ({selectedPI.customer_id})
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Issue Date:
                        </Typography>
                        <Typography variant="body2">
                          {new Date(selectedPI.issue_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Valid Until:
                        </Typography>
                        <Stack alignItems="flex-end">
                          <Typography variant="body2">
                            {new Date(selectedPI.valid_until).toLocaleDateString()}
                          </Typography>
                          {selectedPI.validity_period && (
                            <Typography variant="caption" color="primary.main">
                              ({selectedPI.validity_period === '7_DAYS' ? '1 Week' :
                                selectedPI.validity_period === '15_DAYS' ? '15 Days' :
                                selectedPI.validity_period === '30_DAYS' ? '30 Days' : ''})
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="medium">
                          Status:
                        </Typography>
                        <Chip
                          icon={getStatusIcon(selectedPI.status)}
                          label={selectedPI.status}
                          color={getStatusColor(selectedPI.status)}
                          size="small"
                        />
                      </Box>
                      {selectedPI.approved_date && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" fontWeight="medium">
                            Approved Date:
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            {new Date(selectedPI.approved_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* PI Items */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Items
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditItems(selectedPI)}
                    disabled={selectedPI?.dispatched || selectedPI?.payment_status === 'PAID'}
                  >
                    Edit Items
                  </Button>
                </Box>
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
                      {selectedPI.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.part_number}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${(item.unit_price || 0).toFixed(2)}</TableCell>
                          <TableCell align="right" fontWeight="bold">
                            ${(item.total_price || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* PI Summary with Additional Charges & Currency Conversion */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney color="primary" fontSize="small" />
                  Summary & Charges
                </Typography>
                <Stack spacing={1}>
                  {/* Base amounts */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Stack alignItems="flex-end">
                      <Typography variant="body2" fontWeight="medium">${(selectedPI.subtotal || 0).toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₹{((selectedPI.subtotal || 0) * (selectedPI.exchange_rate || usdToInr)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Box>
                  {(selectedPI.tax || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tax:</Typography>
                      <Typography variant="body2">${(selectedPI.tax || 0).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {(selectedPI.shipping || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Shipping:</Typography>
                      <Typography variant="body2">${(selectedPI.shipping || 0).toFixed(2)}</Typography>
                    </Box>
                  )}

                  {/* Additional Charges Section */}
                  {((selectedPI.logistic_charges || 0) > 0 || (selectedPI.custom_duty || 0) > 0 ||
                    (selectedPI.bank_charges || 0) > 0 || (selectedPI.other_charges || 0) > 0 ||
                    (selectedPI.igst_18 || 0) > 0 || (selectedPI.igst_28 || 0) > 0 ||
                    (selectedPI.freight || 0) > 0 || (selectedPI.duty || 0) > 0) && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="caption" fontWeight="bold" color="error.main">
                        ADDITIONAL CHARGES (INR)
                      </Typography>
                      {(selectedPI.logistic_charges || selectedPI.freight || 0) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">Logistics/Freight:</Typography>
                          <Typography variant="body2" color="error.main">
                            ₹{(selectedPI.logistic_charges || selectedPI.freight || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      {(selectedPI.custom_duty || selectedPI.duty || 0) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">Custom Duty:</Typography>
                          <Typography variant="body2" color="error.main">
                            ₹{(selectedPI.custom_duty || selectedPI.duty || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      {(selectedPI.bank_charges || 0) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">Bank Charges:</Typography>
                          <Typography variant="body2" color="error.main">
                            ₹{(selectedPI.bank_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      {(selectedPI.igst_18 || 0) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">IGST @ 18%:</Typography>
                          <Typography variant="body2" color="error.main">
                            ₹{(selectedPI.igst_18 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      {(selectedPI.igst_28 || 0) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">IGST @ 28%:</Typography>
                          <Typography variant="body2" color="error.main">
                            ₹{(selectedPI.igst_28 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      {(selectedPI.other_charges || 0) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">Other Charges:</Typography>
                          <Typography variant="body2" color="error.main">
                            ₹{(selectedPI.other_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}

                  {/* Debit Note Section */}
                  {(selectedPI.debit_note || 0) > 0 && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'success.50', p: 1, borderRadius: 1, mx: -1 }}>
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          Debit Note {selectedPI.debit_note_reason ? `(${selectedPI.debit_note_reason})` : ''}:
                        </Typography>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          - ₹{(selectedPI.debit_note || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  {/* Grand Total */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount:
                    </Typography>
                    <Stack alignItems="flex-end">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ${(selectedPI.total_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="warning.main">
                        ₹{((selectedPI.total_amount || 0) * (selectedPI.exchange_rate || usdToInr)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Exchange Rate Editor */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'info.50', p: 1.5, borderRadius: 1, mt: 1 }}>
                    <Stack>
                      <Typography variant="body2" fontWeight="medium">
                        Exchange Rate:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        1 USD = ₹{(selectedPI.exchange_rate || usdToInr).toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        type="number"
                        value={selectedPI.exchange_rate || usdToInr}
                        onChange={(e) => handleUpdatePIExchangeRate(selectedPI, parseFloat(e.target.value))}
                        inputProps={{ min: 1, step: 0.01, style: { textAlign: 'right', width: 70 } }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        sx={{ width: 120 }}
                      />
                      <Tooltip title="Update Exchange Rate">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => alert('Exchange rate updated for this PI')}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Address Information */}
              {(selectedPI.billing_address || selectedPI.shipping_address) && (
                <Grid container spacing={2}>
                  {selectedPI.billing_address && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                        <Typography variant="body2" fontWeight="medium" gutterBottom>
                          Billing Address:
                        </Typography>
                        <Typography variant="body2">
                          {selectedPI.billing_address?.street || '-'}
                        </Typography>
                        <Typography variant="body2">
                          {selectedPI.billing_address?.city}{selectedPI.billing_address?.state ? `, ${selectedPI.billing_address.state}` : ''} {selectedPI.billing_address?.zip || ''}
                        </Typography>
                        <Typography variant="body2">
                          {selectedPI.billing_address?.country || ''}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedPI.shipping_address && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                        <Typography variant="body2" fontWeight="medium" gutterBottom>
                          Shipping Address:
                        </Typography>
                        <Typography variant="body2">
                          {selectedPI.shipping_address?.street || '-'}
                        </Typography>
                        <Typography variant="body2">
                          {selectedPI.shipping_address?.city}{selectedPI.shipping_address?.state ? `, ${selectedPI.shipping_address.state}` : ''} {selectedPI.shipping_address?.zip || ''}
                        </Typography>
                        <Typography variant="body2">
                          {selectedPI.shipping_address?.country || ''}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Payment Terms */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50' }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Payment Terms:
                </Typography>
                <Typography variant="body2">{selectedPI.payment_terms}</Typography>
              </Paper>

              {/* Notes */}
              {selectedPI.notes && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Notes:
                  </Typography>
                  <Typography variant="body2">{selectedPI.notes}</Typography>
                </Paper>
              )}

              {/* Validity Period */}
              {selectedPI.validity_period && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      Validity Period:
                    </Typography>
                    <Chip
                      label={selectedPI.validity_period === '7_DAYS' ? '1 Week (7 Days)' :
                             selectedPI.validity_period === '15_DAYS' ? '15 Days' :
                             selectedPI.validity_period === '30_DAYS' ? '30 Days' : selectedPI.validity_period}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Paper>
              )}

              {/* Terms & Conditions */}
              {selectedPI.terms_conditions && selectedPI.terms_conditions.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                    Terms & Conditions:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, m: 0 }}>
                    {selectedPI.terms_conditions.map((term, idx) => (
                      <Box component="li" key={idx} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '12px' }}>
                          {term}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Bank Details for Payment - Editable Selection */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50', border: '2px solid', borderColor: 'info.main' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountBalance sx={{ color: 'info.main' }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '14px' }}>
                      Bank Details for Payment
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel sx={{ fontSize: '13px' }}>Select Bank Account</InputLabel>
                      <Select
                        value={selectedBankAccount}
                        label="Select Bank Account"
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        sx={{ fontSize: '13px' }}
                      >
                        <MenuItem value="primary">
                          <Stack>
                            <Typography variant="body2" fontWeight="medium">Primary - HDFC Bank</Typography>
                            <Typography variant="caption" color="text.secondary">Domestic Transfers</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="secondary">
                          <Stack>
                            <Typography variant="body2" fontWeight="medium">Secondary - ICICI Bank</Typography>
                            <Typography variant="caption" color="text.secondary">Alternate Account</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="international">
                          <Stack>
                            <Typography variant="body2" fontWeight="medium">International - SBI</Typography>
                            <Typography variant="caption" color="text.secondary">Wire Transfers / SWIFT</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="custom">
                          <Stack>
                            <Typography variant="body2" fontWeight="medium" color="warning.main">Custom Details</Typography>
                            <Typography variant="caption" color="text.secondary">Enter manually</Typography>
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      size="small"
                      onClick={() => {
                        // Initialize custom details from selected account if not custom
                        if (selectedBankAccount !== 'custom') {
                          const currentBank = settingsData.bankDetails[selectedBankAccount]
                          setCustomBankDetails({ ...currentBank })
                        }
                        setShowBankEditModal(true)
                      }}
                      title="Edit Bank Details"
                      sx={{ bgcolor: 'warning.100' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Display selected bank details */}
                {selectedBankAccount === 'custom' ? (
                  customBankDetails.bank_name ? (
                    <BankDetailsCard
                      bankDetails={customBankDetails}
                      variant="full"
                      title="Custom Bank Details"
                    />
                  ) : (
                    <Alert severity="warning" sx={{ fontSize: '12px' }}>
                      Please click Edit to enter custom bank details.
                    </Alert>
                  )
                ) : (
                  <BankDetailsCard
                    bankDetails={settingsData.bankDetails[selectedBankAccount]}
                    variant="full"
                    title={selectedBankAccount === 'international' ? 'International Wire Transfer Details' : 'Bank Account Details'}
                  />
                )}
              </Paper>

              {/* Dispatch History Section */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShipping color="primary" fontSize="small" />
                  Dispatch History
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {loadingDispatches ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : piDispatches.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: '0.85rem' }}>No dispatches yet for this PI</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell>Dispatch ID</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="center">Items</TableCell>
                          <TableCell align="center" sx={{ color: 'success.main' }}>Dispatched</TableCell>
                          <TableCell align="center" sx={{ color: 'warning.main' }}>Remaining</TableCell>
                          <TableCell>AWB/Tracking</TableCell>
                          <TableCell>Invoice</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {piDispatches.map((dispatch, index) => {
                          // Calculate cumulative dispatched up to this point
                          const cumulativeDispatched = piDispatches
                            .slice(0, index + 1)
                            .reduce((sum, d) => sum + (d.total_quantity || 0), 0)
                          // Calculate total PI quantity from items
                          const piTotalQty = selectedPI?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
                          const remaining = Math.max(0, piTotalQty - cumulativeDispatched)

                          return (
                            <TableRow key={dispatch._id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {dispatch.dispatch_id}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {new Date(dispatch.dispatch_date || dispatch.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={dispatch.dispatch_type || 'STANDARD'}
                                  size="small"
                                  color={dispatch.dispatch_type === 'PARTIAL' ? 'warning' : 'default'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {dispatch.items?.length || 0}
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" color="success.main" fontWeight="medium">
                                  {dispatch.total_quantity || 0}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography
                                  variant="body2"
                                  color={remaining > 0 ? 'warning.main' : 'success.main'}
                                  fontWeight="medium"
                                >
                                  {remaining}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {dispatch.shipping_info?.awb_number || dispatch.awb_number || '-'}
                              </TableCell>
                              <TableCell>
                                {dispatch.invoice_generated ? (
                                  <Chip label={dispatch.invoice_number || 'Yes'} size="small" color="success" />
                                ) : (
                                  <Chip label="No" size="small" color="default" />
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              {/* Created By */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created by: {selectedPI.created_by}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          {/* Clone button - available for all PIs */}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ContentCopy />}
            onClick={() => {
              handleClonePI(selectedPI)
              setShowDetailModal(false)
            }}
          >
            Clone
          </Button>
          {/* EXPIRED PI actions */}
          {selectedPI?.status === 'EXPIRED' && (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Refresh />}
                onClick={() => {
                  handleRenewPI(selectedPI)
                  setShowDetailModal(false)
                }}
              >
                Renew
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<Replay />}
                onClick={() => {
                  handleReactivatePI(selectedPI)
                  setShowDetailModal(false)
                }}
              >
                Reactivate
              </Button>
            </>
          )}
          {/* REJECTED PI actions */}
          {selectedPI?.status === 'REJECTED' && (
            <Button
              variant="contained"
              color="info"
              startIcon={<Replay />}
              onClick={() => {
                handleReactivatePI(selectedPI)
                setShowDetailModal(false)
              }}
            >
              Reactivate
            </Button>
          )}
          {/* PENDING PI actions */}
          {selectedPI?.status === 'PENDING' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => {
                  handleApprove(selectedPI.performa_invoice_id)
                  setShowDetailModal(false)
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={() => {
                  handleReject(selectedPI.performa_invoice_id)
                  setShowDetailModal(false)
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Payment Collection Modal */}
      <Dialog
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Collect Payment
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPI && (
            <Stack spacing={3}>
              {/* PI Info */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">PI Number</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedPI.performa_invoice_number}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedPI.customer_name}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Pending Payment Records from Buyer */}
              {loadingPaymentRecords ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading buyer submissions...
                  </Typography>
                </Paper>
              ) : pendingPaymentRecords.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: selectedPaymentRecordForCollection ? 'success.50' : 'warning.50',
                    borderColor: selectedPaymentRecordForCollection ? 'success.main' : 'warning.main',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" color={selectedPaymentRecordForCollection ? 'success.main' : 'warning.main'}>
                      {selectedPaymentRecordForCollection
                        ? '✓ Buyer Payment Record Selected'
                        : `🔔 ${pendingPaymentRecords.length} Pending Payment Record(s) from Buyer`
                      }
                    </Typography>
                    {selectedPaymentRecordForCollection && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => {
                          setSelectedPaymentRecordForCollection(null)
                          const remainingAmount = selectedPI.total_amount - (selectedPI.payment_received || 0)
                          setPaymentForm({
                            amount: remainingAmount,
                            currency: 'USD',
                            payment_method: 'BANK_TRANSFER',
                            transaction_id: '',
                            payment_date: new Date().toISOString().split('T')[0],
                            notes: '',
                            payment_exchange_rate: selectedPI.exchange_rate || usdToInr
                          })
                        }}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </Stack>

                  {pendingPaymentRecords.map((record) => (
                    <Paper
                      key={record._id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 1,
                        cursor: 'pointer',
                        bgcolor: selectedPaymentRecordForCollection?._id === record._id ? 'success.lighter' : 'white',
                        borderColor: selectedPaymentRecordForCollection?._id === record._id ? 'success.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: selectedPaymentRecordForCollection?._id === record._id ? 'success.lighter' : 'grey.50',
                        },
                      }}
                      onClick={() => handleSelectPaymentRecord(record)}
                    >
                      <Grid container spacing={2}>
                        {/* Payment Proof Image */}
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                            Payment Proof
                          </Typography>
                          {record.proof_file_url ? (
                            <Box sx={{ textAlign: 'center' }}>
                              <Box
                                component="img"
                                src={record.proof_file_url}
                                alt="Payment Proof"
                                sx={{
                                  maxWidth: '100%',
                                  maxHeight: 120,
                                  objectFit: 'contain',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  mb: 0.5,
                                }}
                              />
                              <Button
                                size="small"
                                startIcon={<OpenInNew />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(record.proof_file_url, '_blank')
                                }}
                                sx={{ fontSize: '11px' }}
                              >
                                View Full Size
                              </Button>
                            </Box>
                          ) : (
                            <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                              <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                              <Typography variant="caption" color="text.secondary" display="block">
                                No proof uploaded
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        {/* Payment Details */}
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Grid container spacing={1}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Amount</Typography>
                              <Typography variant="body1" fontWeight="bold" color="success.main">
                                ${parseFloat(record.amount || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {record.transaction_id || '-'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                              <Typography variant="body2">
                                {record.payment_method?.replace(/_/g, ' ') || '-'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                              <Typography variant="body2">
                                {record.payment_date ? new Date(record.payment_date).toLocaleDateString() : '-'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Submitted By</Typography>
                              <Typography variant="body2">{record.buyer_name || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">Submitted On</Typography>
                              <Typography variant="body2">
                                {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-'}
                              </Typography>
                            </Grid>
                            {record.notes && (
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary">Notes</Typography>
                                <Typography variant="body2">{record.notes}</Typography>
                              </Grid>
                            )}
                          </Grid>

                          {selectedPaymentRecordForCollection?._id === record._id && (
                            <Alert severity="success" sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                This record is selected. Click "Record & Generate Invoice" to verify and record this payment.
                              </Typography>
                            </Alert>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}

                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      Click on a payment record to select it. The form below will be pre-filled with the buyer's details.
                    </Typography>
                  </Alert>
                </Paper>
              )}

              {/* Payment Summary */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Payment Summary
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Exchange Rate (₹/$):</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      ₹{selectedPI.exchange_rate || usdToInr}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Amount:</Typography>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="body2" fontWeight="bold">
                        ${(selectedPI.total_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{((selectedPI.total_amount || 0) * (selectedPI.exchange_rate || usdToInr)).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Payment Received:</Typography>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="body2" color="success.main">
                        ${(selectedPI.payment_received || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{((selectedPI.payment_received || 0) * (selectedPI.exchange_rate || usdToInr)).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Remaining Due:</Typography>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        ${getRemainingAmount(selectedPI).toFixed(2)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        ₹{(getRemainingAmount(selectedPI) * (selectedPI.exchange_rate || usdToInr)).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Bank Details for Payment - Editable Selection */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Bank Details for Payment
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel sx={{ fontSize: '12px' }}>Bank Account</InputLabel>
                      <Select
                        value={selectedBankAccount}
                        label="Bank Account"
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        sx={{ fontSize: '12px' }}
                      >
                        <MenuItem value="primary">Primary - HDFC</MenuItem>
                        <MenuItem value="secondary">Secondary - ICICI</MenuItem>
                        <MenuItem value="international">International - SBI</MenuItem>
                        <MenuItem value="custom">Custom Details</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (selectedBankAccount !== 'custom') {
                          setCustomBankDetails({ ...settingsData.bankDetails[selectedBankAccount] })
                        }
                        setShowBankEditModal(true)
                      }}
                      title="Edit Bank Details"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Alert severity="info" sx={{ mb: 2, fontSize: '12px' }}>
                  <strong>Payment Instructions:</strong> Use the bank details below for payment. Include PI number as reference.
                </Alert>
                {selectedBankAccount === 'custom' && customBankDetails.bank_name ? (
                  <BankDetailsCard
                    bankDetails={customBankDetails}
                    variant="compact"
                    showCopy={true}
                    title="Custom Bank Details"
                  />
                ) : (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: paymentForm.currency === 'USD' ? 6 : 12 }}>
                      <BankDetailsCard
                        bankDetails={settingsData.bankDetails[selectedBankAccount] || settingsData.bankDetails.primary}
                        variant="compact"
                        showCopy={true}
                      />
                    </Grid>
                    {paymentForm.currency === 'USD' && selectedBankAccount !== 'international' && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <BankDetailsCard
                          bankDetails={settingsData.bankDetails.international}
                          variant="compact"
                          title="For USD Transfers"
                          showCopy={true}
                        />
                      </Grid>
                    )}
                  </Grid>
                )}
              </Paper>

              {/* Payment Form */}
              <Stack spacing={2}>
                {selectedPaymentRecordForCollection && (
                  <Alert severity="success" icon={<CheckCircle />}>
                    <Typography variant="body2">
                      <strong>Verifying Buyer's Payment Record:</strong> The form below is pre-filled with the buyer's submitted payment details. Review and adjust if needed.
                    </Typography>
                  </Alert>
                )}

                {/* Collection Source - Only show when NOT verifying a buyer record */}
                {!selectedPaymentRecordForCollection && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Payment Collection Source
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>How was payment info received?</InputLabel>
                      <Select
                        value={paymentForm.collection_source}
                        label="How was payment info received?"
                        onChange={(e) => setPaymentForm({ ...paymentForm, collection_source: e.target.value })}
                      >
                        <MenuItem value="ADMIN_DIRECT">Admin Direct Entry</MenuItem>
                        <MenuItem value="EMAIL">Email from Buyer</MenuItem>
                        <MenuItem value="PHONE_CALL">Phone Call</MenuItem>
                        <MenuItem value="IN_PERSON">In Person</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      This helps track how payments are collected and will be visible to the buyer.
                    </Typography>
                  </Paper>
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Payment Amount"
                      type="number"
                      fullWidth
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">
                          {paymentForm.currency === 'USD' ? '$' : '₹'}
                        </InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={paymentForm.currency}
                        label="Currency"
                        onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="INR">INR</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Exchange Rate at Payment (₹/$)"
                      type="number"
                      fullWidth
                      value={paymentForm.payment_exchange_rate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_exchange_rate: e.target.value })}
                      inputProps={{ min: 1, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      helperText="Enter the exchange rate at time of payment collection"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={paymentForm.payment_method}
                        label="Payment Method"
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      >
                        <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                        <MenuItem value="WIRE_TRANSFER">Wire Transfer</MenuItem>
                        <MenuItem value="CHECK">Check</MenuItem>
                        <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                        <MenuItem value="CASH">Cash</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Payment Date"
                      type="date"
                      fullWidth
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      slotProps={{
                        inputLabel: {
                          shrink: true
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Transaction ID / Reference Number"
                      fullWidth
                      value={paymentForm.transaction_id}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                      placeholder="Enter transaction ID or reference number"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Notes"
                      fullWidth
                      multiline
                      rows={2}
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="Add any notes about this payment"
                    />
                  </Grid>

                  {/* Proof Upload - Only for direct collections */}
                  {!selectedPaymentRecordForCollection && (
                    <Grid size={{ xs: 12 }}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Optional: Upload Payment Proof
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          Upload email screenshot, bank statement, or any supporting document
                        </Typography>

                        <input
                          type="file"
                          ref={directCollectionProofRef}
                          hidden
                          accept="image/*,.pdf"
                          onChange={handleDirectCollectionProofSelect}
                        />

                        {!directCollectionProofPreview ? (
                          <Button
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            onClick={() => directCollectionProofRef.current?.click()}
                            size="small"
                          >
                            Upload Proof
                          </Button>
                        ) : (
                          <Box>
                            <Stack direction="row" spacing={2} alignItems="center">
                              {directCollectionProof?.type?.startsWith('image/') ? (
                                <Box
                                  component="img"
                                  src={directCollectionProofPreview}
                                  alt="Payment proof"
                                  sx={{
                                    width: 100,
                                    height: 100,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                  }}
                                />
                              ) : (
                                <Box sx={{
                                  width: 100,
                                  height: 100,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'grey.200',
                                  borderRadius: 1
                                }}>
                                  <Description sx={{ fontSize: 40, color: 'grey.500' }} />
                                </Box>
                              )}
                              <Stack spacing={1}>
                                <Typography variant="body2" fontWeight="medium">
                                  {directCollectionProof?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {directCollectionProof?.size ? `${(directCollectionProof.size / 1024).toFixed(1)} KB` : ''}
                                </Typography>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDirectCollectionProof(null);
                                    setDirectCollectionProofPreview(null);
                                  }}
                                >
                                  Remove
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {selectedPI && (
                  <Alert severity="info" icon={<AttachMoney />}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        <strong>Payment Conversion:</strong> Using rate ₹{paymentForm.payment_exchange_rate}/$1
                      </Typography>
                      {paymentForm.currency === 'INR' && (
                        <Typography variant="body2">
                          INR ₹{parseFloat(paymentForm.amount || 0).toFixed(2)} = USD ${(parseFloat(paymentForm.amount || 0) / parseFloat(paymentForm.payment_exchange_rate || 83.5)).toFixed(2)}
                        </Typography>
                      )}
                      {paymentForm.currency === 'USD' && (
                        <Typography variant="body2">
                          USD ${parseFloat(paymentForm.amount || 0).toFixed(2)} = INR ₹{(parseFloat(paymentForm.amount || 0) * parseFloat(paymentForm.payment_exchange_rate || 83.5)).toFixed(2)}
                        </Typography>
                      )}
                      {selectedPI.exchange_rate && selectedPI.exchange_rate !== parseFloat(paymentForm.payment_exchange_rate) && (
                        <Typography variant="caption" color="warning.main">
                          Note: PI was created at ₹{selectedPI.exchange_rate}/$1
                        </Typography>
                      )}
                    </Stack>
                  </Alert>
                )}
              </Stack>

              {/* Payment History */}
              {selectedPI.payment_history && selectedPI.payment_history.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Payment History
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Rate</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Reference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPI.payment_history.map((payment, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="caption">
                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" fontWeight="bold">
                                {payment.currency || 'USD'} {(payment.amount || 0).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                (${(payment.amount_usd || payment.amount || 0).toFixed(2)})
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="info.main">
                                ₹{payment.exchange_rate_at_payment || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{payment.payment_method}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{payment.transaction_id || '-'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={generateInvoiceOnPayment}
                  onChange={(e) => setGenerateInvoiceOnPayment(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Generate Invoice on Payment
                </Typography>
              }
            />
          </Stack>
          <Button onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedPaymentRecordForCollection ? 'success' : 'primary'}
            startIcon={collectingPayment ? <CircularProgress size={20} color="inherit" /> : <Payment />}
            onClick={confirmPayment}
            disabled={collectingPayment || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
          >
            {collectingPayment ? 'Processing...' : (
              selectedPaymentRecordForCollection
                ? (generateInvoiceOnPayment ? 'Verify & Generate Invoice' : 'Verify Payment')
                : (generateInvoiceOnPayment ? 'Record & Generate Invoice' : 'Record Payment')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispatch Modal */}
      <Dialog
        open={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '2px solid #4caf50', pb: 2, pt: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalShipping sx={{ color: 'success.main', fontSize: 28 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '22px', color: 'text.primary' }}>
                    Dispatch Products
                  </Typography>
                  {selectedPI && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', mt: 0.5 }}>
                      PI: {selectedPI.performa_invoice_number} | Customer: {selectedPI.customer_name}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
            <IconButton
              onClick={() => setShowDispatchModal(false)}
              sx={{ color: 'text.secondary' }}
            >
              <Cancel />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          {selectedPI && (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Info Banner - Dynamic based on payment status */}
              {selectedPI.payment_status === 'PAID' ? (
                <Box sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid', borderColor: 'success.main', p: 1.5, mx: 3, mt: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      <strong>Full Payment Received:</strong> Select products to dispatch. Tracking details can be added in Dispatched Orders. Invoice can be generated separately after dispatch.
                    </Typography>
                  </Stack>
                </Box>
              ) : !dispatchWithoutPayment ? (
                <Box sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid', borderColor: 'warning.main', p: 1.5, mx: 3, mt: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      <strong>Partial Payment:</strong> ${(selectedPI.payment_received || 0).toFixed(2)} received out of ${(selectedPI.total_amount || 0).toFixed(2)}.
                      Select items to dispatch based on payment coverage. Remaining items will stay due.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid', borderColor: 'info.main', p: 1.5, mx: 3, mt: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalShipping sx={{ color: 'info.main', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                      <strong>Project-Based Dispatch:</strong> Dispatching without full payment. Outstanding balance will be tracked.
                      {projectName && <> Project: <strong>{projectName}</strong></>}
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Invoice Exchange Rate - Editable */}
              <Paper variant="outlined" sx={{ mx: 3, mt: 2, p: 2, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
                <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main" gutterBottom>
                      Invoice Exchange Rate (₹/$)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Set the conversion rate for this invoice. PI was created at ₹{selectedPI.exchange_rate || usdToInr}/$
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      size="small"
                      type="number"
                      value={invoiceExchangeRate}
                      onChange={(e) => setInvoiceExchangeRate(parseFloat(e.target.value) || 0)}
                      inputProps={{ step: 0.01, min: 1 }}
                      sx={{ width: 120, '& input': { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } }}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>₹</Typography>
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setInvoiceExchangeRate(usdToInr)}
                      title="Reset to current market rate"
                      sx={{ bgcolor: 'primary.100' }}
                    >
                      <Refresh fontSize="small" />
                    </IconButton>
                    <Stack alignItems="flex-end">
                      <Typography variant="body2" fontWeight="bold">
                        Total: ${calculateInvoiceTotal().toFixed(2)}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        = ₹{(calculateInvoiceTotal() * invoiceExchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
                {invoiceExchangeRate !== (selectedPI.exchange_rate || usdToInr) && (
                  <Alert severity="info" sx={{ mt: 1, fontSize: '12px' }}>
                    <strong>Rate Changed:</strong> Invoice rate (₹{invoiceExchangeRate}) differs from PI rate (₹{selectedPI.exchange_rate || usdToInr}).
                    Difference: {invoiceExchangeRate > (selectedPI.exchange_rate || usdToInr) ? '+' : ''}
                    ₹{(invoiceExchangeRate - (selectedPI.exchange_rate || usdToInr)).toFixed(2)} per dollar
                  </Alert>
                )}
              </Paper>

              {/* Bank Details for Invoice - Editable Selection */}
              <Paper variant="outlined" sx={{ mx: 3, mt: 2, p: 2, bgcolor: 'info.50' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountBalance sx={{ fontSize: 20, color: 'info.main' }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Bank Details for Invoice
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel sx={{ fontSize: '12px' }}>Bank Account</InputLabel>
                      <Select
                        value={selectedBankAccount}
                        label="Bank Account"
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        sx={{ fontSize: '12px' }}
                      >
                        <MenuItem value="primary">Primary - HDFC</MenuItem>
                        <MenuItem value="secondary">Secondary - ICICI</MenuItem>
                        <MenuItem value="international">International - SBI</MenuItem>
                        <MenuItem value="custom">Custom Details</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (selectedBankAccount !== 'custom') {
                          setCustomBankDetails({ ...settingsData.bankDetails[selectedBankAccount] })
                        }
                        setShowBankEditModal(true)
                      }}
                      title="Edit Bank Details"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Select which bank account details to display on the generated invoice.
                  {selectedBankAccount === 'custom' && customBankDetails.bank_name && (
                    <> Using: <strong>{customBankDetails.bank_name}</strong> - {customBankDetails.account_number}</>
                  )}
                  {selectedBankAccount !== 'custom' && (
                    <> Using: <strong>{settingsData.bankDetails[selectedBankAccount]?.bank_name}</strong></>
                  )}
                </Typography>
              </Paper>

              {/* Dispatch Options - Enhanced with Multiple Payment Options */}
              <Paper variant="outlined" sx={{ mx: 3, mt: 2, p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Dispatch Payment Options
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '13px' }}>Payment Option</InputLabel>
                      <Select
                        value={dispatchPaymentOption}
                        label="Payment Option"
                        onChange={(e) => {
                          setDispatchPaymentOption(e.target.value)
                          setDispatchWithoutPayment(e.target.value !== 'full')
                          if (e.target.value === 'full') {
                            setDispatchType('STANDARD')
                            setProjectName('')
                          } else if (e.target.value === 'without') {
                            setDispatchType('PROJECT')
                          } else if (e.target.value === 'half') {
                            setDispatchPercentage(50)
                            setDispatchType('PARTIAL')
                          } else if (e.target.value === 'partial') {
                            setDispatchType('PARTIAL')
                          } else if (e.target.value === 'percentage') {
                            setDispatchType('PERCENTAGE')
                          }
                        }}
                        sx={{ fontSize: '13px' }}
                      >
                        <MenuItem value="full">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                            <span>Full Payment Received</span>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="without">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <MoneyOff sx={{ fontSize: 16, color: 'info.main' }} />
                            <span>Without Payment (Project)</span>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="partial">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AccountBalanceWallet sx={{ fontSize: 16, color: 'warning.main' }} />
                            <span>Partial Payment</span>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="half">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Percent sx={{ fontSize: 16, color: 'warning.dark' }} />
                            <span>Half Payment (50%)</span>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="percentage">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Percent sx={{ fontSize: 16, color: 'secondary.main' }} />
                            <span>Custom Percentage</span>
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {dispatchPaymentOption === 'percentage' && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ px: 1 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Payment Percentage: {dispatchPercentage}%
                        </Typography>
                        <Slider
                          value={dispatchPercentage}
                          onChange={(e, newValue) => setDispatchPercentage(newValue)}
                          valueLabelDisplay="auto"
                          step={5}
                          marks={[
                            { value: 0, label: '0%' },
                            { value: 25, label: '25%' },
                            { value: 50, label: '50%' },
                            { value: 75, label: '75%' },
                            { value: 100, label: '100%' }
                          ]}
                          min={0}
                          max={100}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Grid>
                  )}

                  {(dispatchPaymentOption === 'without' || dispatchPaymentOption === 'partial') && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Project / Reference Name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name or reference"
                        sx={{ '& input': { fontSize: '13px' } }}
                      />
                    </Grid>
                  )}

                  {dispatchPaymentOption !== 'full' && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: '13px' }}>Dispatch Category</InputLabel>
                        <Select
                          value={dispatchType}
                          label="Dispatch Category"
                          onChange={(e) => setDispatchType(e.target.value)}
                          sx={{ fontSize: '13px' }}
                        >
                          <MenuItem value="PROJECT">Project Dispatch</MenuItem>
                          <MenuItem value="CREDIT">Credit Dispatch</MenuItem>
                          <MenuItem value="PARTIAL">Partial Dispatch</MenuItem>
                          <MenuItem value="PERCENTAGE">Percentage-Based</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>

                {/* Payment Info Display */}
                {dispatchPaymentOption !== 'full' && selectedPI && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">PI Total</Typography>
                        <Typography variant="body2" fontWeight="bold">${(selectedPI.total_amount || 0).toFixed(2)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">Already Paid</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          ${(selectedPI.payment_received || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          {dispatchPaymentOption === 'half' ? 'Required (50%)' :
                           dispatchPaymentOption === 'percentage' ? `Required (${dispatchPercentage}%)` :
                           'Balance Due'}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          ${dispatchPaymentOption === 'half' ? ((selectedPI.total_amount || 0) * 0.5).toFixed(2) :
                            dispatchPaymentOption === 'percentage' ? ((selectedPI.total_amount || 0) * dispatchPercentage / 100).toFixed(2) :
                            ((selectedPI.total_amount || 0) - (selectedPI.payment_received || 0)).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {dispatchPaymentOption !== 'full' && (
                  <Alert severity={dispatchPaymentOption === 'without' ? 'info' : 'warning'} sx={{ mt: 2, fontSize: '12px' }}>
                    <strong>
                      {dispatchPaymentOption === 'without' ? 'Project-Based Dispatch:' :
                       dispatchPaymentOption === 'half' ? 'Half Payment Dispatch:' :
                       dispatchPaymentOption === 'percentage' ? `${dispatchPercentage}% Payment Dispatch:` :
                       'Partial Payment Dispatch:'}
                    </strong>{' '}
                    {dispatchPaymentOption === 'without'
                      ? 'Dispatching without payment. Outstanding balance will be tracked.'
                      : `Dispatching with ${dispatchPaymentOption === 'half' ? '50%' : dispatchPaymentOption === 'percentage' ? `${dispatchPercentage}%` : 'partial'} payment. Remaining balance will be due.`}
                  </Alert>
                )}
              </Paper>

              {/* Shipping & Invoice Details - NEW: HSN, AWB, Shipping By, Invoice Number */}
              <Paper variant="outlined" sx={{ mx: 3, mt: 2, p: 2, bgcolor: '#fff8e1', border: '2px solid', borderColor: 'warning.main' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <LocalShipping sx={{ color: 'warning.main', fontSize: 22 }} />
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'warning.dark' }}>
                    Shipping & Invoice Details
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dispatchShippingInfo.generate_invoice}
                        onChange={(e) => setDispatchShippingInfo(prev => ({ ...prev, generate_invoice: e.target.checked }))}
                        size="small"
                        color="success"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 500 }}>Generate Invoice on Dispatch</Typography>}
                    sx={{ ml: 'auto' }}
                  />
                </Stack>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Invoice Number"
                      value={dispatchShippingInfo.custom_invoice_number}
                      onChange={(e) => setDispatchShippingInfo(prev => ({ ...prev, custom_invoice_number: e.target.value }))}
                      placeholder="INV-YYMM-XXXXX"
                      sx={{ '& input': { fontSize: '13px', fontWeight: 600 }, bgcolor: 'white' }}
                      disabled={!dispatchShippingInfo.generate_invoice}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="HSS NO."
                      value={dispatchShippingInfo.hsn_code}
                      onChange={(e) => setDispatchShippingInfo(prev => ({ ...prev, hsn_code: e.target.value }))}
                      placeholder="e.g., IN-DL42659961966116Y"
                      sx={{ '& input': { fontSize: '13px' }, bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="AWB Number"
                      value={dispatchShippingInfo.awb_number}
                      onChange={(e) => setDispatchShippingInfo(prev => ({ ...prev, awb_number: e.target.value }))}
                      placeholder="Air Waybill / Tracking No."
                      sx={{ '& input': { fontSize: '13px' }, bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Autocomplete
                      size="small"
                      freeSolo
                      options={shippingProviders}
                      value={dispatchShippingInfo.shipping_by}
                      onChange={(e, newValue) => setDispatchShippingInfo(prev => ({ ...prev, shipping_by: newValue || '' }))}
                      onInputChange={(e, newValue) => setDispatchShippingInfo(prev => ({ ...prev, shipping_by: newValue }))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Shipping By"
                          placeholder="Select or type courier"
                          sx={{ '& input': { fontSize: '13px' }, bgcolor: 'white' }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Shipping Notes (Optional)"
                      value={dispatchShippingInfo.shipping_notes}
                      onChange={(e) => setDispatchShippingInfo(prev => ({ ...prev, shipping_notes: e.target.value }))}
                      placeholder="Any additional shipping instructions or notes"
                      multiline
                      rows={2}
                      sx={{ '& textarea': { fontSize: '13px' }, bgcolor: 'white' }}
                    />
                  </Grid>
                </Grid>
                {dispatchShippingInfo.generate_invoice && (
                  <Alert severity="success" sx={{ mt: 2, fontSize: '12px' }}>
                    <strong>Invoice will be generated:</strong> Invoice #{dispatchShippingInfo.custom_invoice_number} will be created automatically upon dispatch with the shipping details above.
                  </Alert>
                )}
              </Paper>

              {/* Editable Items Table */}
              <Box sx={{ mx: 3, mt: 2, mb: 2, minHeight: '250px', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '15px', mb: 1.5 }}>
                  Products to Dispatch (Editable)
                </Typography>
                <TableContainer sx={{ border: '1px solid #e0e0e0', flex: 1, overflow: 'auto', maxHeight: '350px' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Product</TableCell>
                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Part Number</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Inventory</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Original Qty</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Invoice Qty</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Line Total</TableCell>
                        <TableCell align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '13px', py: 1.5 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:hover': { bgcolor: '#f9f9f9' }
                          }}
                        >
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '14px' }}>
                              {item.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                              {item.part_number}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                              {item.has_inventory ? (
                                <>
                                  <Chip
                                    icon={<Inventory sx={{ fontSize: 14 }} />}
                                    label={`${item.inventory_quantity} units`}
                                    color="success"
                                    size="small"
                                    sx={{ fontSize: '11px', height: 22 }}
                                  />
                                </>
                              ) : (
                                <Chip
                                  label="No Stock"
                                  color="warning"
                                  size="small"
                                  sx={{ fontSize: '11px', height: 22 }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 500 }}>
                              {item.original_quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.invoice_quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                              inputProps={{
                                min: 0,
                                max: item.original_quantity,
                                style: { fontSize: '14px', textAlign: 'center' }
                              }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Stack spacing={0.3} alignItems="flex-end">
                              <Typography variant="body2" fontWeight={500} sx={{ fontSize: '14px' }}>
                                ${(item.unit_price || 0).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                ₹{((item.unit_price || 0) * (selectedPI.exchange_rate || usdToInr)).toFixed(2)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Stack spacing={0.3} alignItems="flex-end">
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '15px', color: '#1976d2' }}>
                                ${((item.unit_price || 0) * (item.invoice_quantity || 0)).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                ₹{((item.unit_price || 0) * (item.invoice_quantity || 0) * (selectedPI.exchange_rate || usdToInr)).toFixed(2)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Tooltip
                              title={
                                invoiceItems.length <= 1
                                  ? "Cannot remove: At least one item required"
                                  : item.has_inventory
                                    ? "Cannot remove: Item has inventory"
                                    : "Remove item"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveItem(index)}
                                  disabled={invoiceItems.length <= 1 || item.has_inventory}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {invoiceItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No items available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Summary Section */}
              <Box sx={{ borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa', p: 3 }}>
                {(() => {
                  const summary = calculateDispatchSummary()
                  const isPartialPayment = selectedPI.payment_status === 'PARTIAL'

                  return (
                    <Grid container spacing={3}>
                      {/* Invoice Summary */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ fontSize: '14px', mb: 2 }}>
                          Invoice Summary
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                Items to Dispatch
                              </Typography>
                              <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '24px', mt: 0.5 }}>
                                {summary.itemsToDispatch.length}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                Total Quantity
                              </Typography>
                              <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '24px', mt: 0.5 }}>
                                {invoiceItems.reduce((sum, item) => sum + item.invoice_quantity, 0)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                Invoice Total
                              </Typography>
                              <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ fontSize: '24px', mt: 0.5 }}>
                                ${summary.invoiceTotal.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                                ₹{(summary.invoiceTotal * (selectedPI.exchange_rate || usdToInr)).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="primary.main" sx={{ fontSize: '10px', display: 'block' }}>
                                Rate: ₹{selectedPI.exchange_rate || usdToInr}/$
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Financial Breakdown */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ fontSize: '14px', mb: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AttachMoney sx={{ fontSize: 18 }} />
                            <span>Payment Breakdown</span>
                          </Stack>
                        </Typography>
                        <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>PI Total:</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                                ${(selectedPI.total_amount || 0).toFixed(2)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>Payment Received:</Typography>
                              <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: '13px' }}>
                                ${summary.paymentReceived.toFixed(2)}
                              </Typography>
                            </Stack>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>This Invoice Total:</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px' }}>
                                ${summary.invoiceTotal.toFixed(2)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>Applied to Invoice:</Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ fontSize: '13px' }}>
                                ${summary.amountAppliedToInvoice.toFixed(2)}
                              </Typography>
                            </Stack>
                            {summary.invoiceBalanceDue > 0 && (
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>Invoice Balance Due:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: '13px' }}>
                                  ${summary.invoiceBalanceDue.toFixed(2)}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                      </Grid>

                      {/* Remaining Balance / Advance Credit */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ fontSize: '14px', mb: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AccountBalance sx={{ fontSize: 18 }} />
                            <span>Account Status</span>
                          </Stack>
                        </Typography>
                        <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                          <Stack spacing={1.5}>
                            {/* Payment Status */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>Payment Status:</Typography>
                              <Chip
                                label={selectedPI.payment_status}
                                color={selectedPI.payment_status === 'PAID' ? 'success' : 'warning'}
                                size="small"
                                icon={selectedPI.payment_status === 'PAID' ? <CheckCircle /> : <Warning />}
                                sx={{ fontSize: '10px', height: 22 }}
                              />
                            </Stack>
                            <Divider />

                            {/* Advance Credit - if payment exceeds invoice */}
                            {summary.advanceCredit > 0 && (
                              <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1, border: '1px solid #90caf9' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" sx={{ fontSize: '12px', color: '#1565c0' }}>
                                    💰 Advance Credit (to Buyer Account):
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px', color: '#1565c0' }}>
                                    ${summary.advanceCredit.toFixed(2)}
                                  </Typography>
                                </Stack>
                              </Box>
                            )}

                            {/* Remaining Items Due */}
                            {summary.remainingItemsTotal > 0 && (
                              <Box sx={{ bgcolor: '#fff8e1', p: 1.5, borderRadius: 1, border: '1px solid #ffcc80' }}>
                                <Stack spacing={0.5}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#f57c00' }}>
                                      Remaining Items Value:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '13px', color: '#f57c00' }}>
                                      ${summary.remainingItemsTotal.toFixed(2)}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#e65100' }}>
                                      Due Amount (After Credit):
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '14px', color: '#e65100' }}>
                                      ${summary.remainingPIDue.toFixed(2)}
                                    </Typography>
                                  </Stack>
                                </Stack>
                              </Box>
                            )}

                            {/* All Paid - No remaining */}
                            {summary.remainingItemsTotal <= 0 && summary.advanceCredit <= 0 && (
                              <Box sx={{ bgcolor: '#e8f5e9', p: 1.5, borderRadius: 1, border: '1px solid #a5d6a7' }}>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                  <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ fontSize: '13px', color: 'success.main', fontWeight: 500 }}>
                                    Fully Paid - All Items Dispatching
                                  </Typography>
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Grid>
                    </Grid>
                  )
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
          <Button
            onClick={() => setShowDispatchModal(false)}
            sx={{ fontSize: '14px', textTransform: 'none' }}
          >
            Cancel
          </Button>
          {selectedPI && (
            <Button
              variant="contained"
              color={selectedPI.payment_status === 'PARTIAL' ? 'warning' : 'success'}
              startIcon={dispatchShippingInfo.generate_invoice ? <Receipt /> : <LocalShipping />}
              onClick={confirmDispatch}
              disabled={invoiceItems.filter(item => item.invoice_quantity > 0).length === 0}
              sx={{
                fontSize: '14px',
                textTransform: 'none',
                px: 3,
                fontWeight: 600
              }}
            >
              {dispatchShippingInfo.generate_invoice
                ? 'Dispatch & Generate Invoice'
                : selectedPI.payment_status === 'PARTIAL'
                  ? 'Dispatch Selected Items'
                  : 'Dispatch Only'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit PI Items Dialog */}
      <EditPIItemsDialog
        open={showEditItemsModal}
        onClose={() => setShowEditItemsModal(false)}
        pi={selectedPI}
        onSave={handleSaveEditedItems}
        exchangeRate={selectedPI?.exchange_rate || usdToInr}
      />

      {/* Invoice Generation Modal */}
      <Dialog
        open={showInvoiceModal}
        onClose={() => { setShowInvoiceModal(false); setInvoiceModalTab(0); }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '2px solid #1976d2', pb: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Receipt sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Generate Final Invoice
                </Typography>
                {selectedPI && (
                  <Typography variant="body2" color="text.secondary">
                    PI: {selectedPI.performa_invoice_number} | Customer: {selectedPI.customer_name}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton onClick={() => { setShowInvoiceModal(false); setInvoiceModalTab(0); }}>
              <Cancel />
            </IconButton>
          </Stack>
          {/* Tabs for Form and Preview */}
          <Tabs
            value={invoiceModalTab}
            onChange={(_, newValue) => setInvoiceModalTab(newValue)}
            sx={{ mt: 2 }}
          >
            <Tab label="Invoice Details" icon={<Edit sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Preview" icon={<Visibility sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, minHeight: '60vh' }}>
          {selectedPI && (
            <>
              {/* Tab 0: Form */}
              {invoiceModalTab === 0 && (
                <Stack spacing={3}>
                  {/* PI Summary */}
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          ${(selectedPI.total_amount || 0).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                        <Chip label="FULLY PAID" color="success" size="small" icon={<CheckCircle />} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Dispatch Status</Typography>
                        <Chip
                          label={selectedPI.dispatched ? "Dispatched" : "Not Dispatched"}
                          color={selectedPI.dispatched ? "success" : "warning"}
                          size="small"
                          icon={selectedPI.dispatched ? <LocalShipping /> : <Pending />}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Items</Typography>
                        <Typography variant="h6" fontWeight="bold">{selectedPI.items?.length || 0}</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Invoice Number - Prominent at top */}
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50', borderColor: 'warning.main' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Invoice Number"
                          value={invoiceForm.custom_invoice_number}
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, custom_invoice_number: e.target.value.toUpperCase() }))}
                          size="small"
                          required
                          helperText="Unique invoice number (editable)"
                          InputProps={{
                            sx: { fontWeight: 'bold', fontSize: '1.1rem' }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Alert severity="info" sx={{ py: 0 }}>
                          <Typography variant="caption">
                            This invoice number must be unique. Format: INV-YYMM-XXXXX
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Invoice Details */}
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: -1 }}>
                    Invoice Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Invoice Date"
                        type="date"
                        value={invoiceForm.invoice_date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Due Date"
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Invoice Type</InputLabel>
                        <Select
                          value={invoiceForm.invoice_type}
                          label="Invoice Type"
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_type: e.target.value }))}
                        >
                          <MenuItem value="TAX_INVOICE">Tax Invoice</MenuItem>
                          <MenuItem value="PROFORMA">Proforma Invoice</MenuItem>
                          <MenuItem value="COMMERCIAL">Commercial Invoice</MenuItem>
                          <MenuItem value="EXPORT">Export Invoice</MenuItem>
                          <MenuItem value="BILL_OF_SUPPLY">Bill of Supply</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={invoiceForm.include_dispatch_info}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, include_dispatch_info: e.target.checked }))}
                            disabled={!selectedPI.dispatched}
                          />
                        }
                        label="Include Dispatch Info"
                      />
                    </Grid>
                  </Grid>

                  {/* Document References */}
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: -1 }}>
                    Document References
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        label="PO Number"
                        value={invoiceForm.po_number}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, po_number: e.target.value }))}
                        size="small"
                        placeholder="Customer PO reference"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        label="HSN/SAC Code"
                        value={invoiceForm.hsn_sac}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, hsn_sac: e.target.value }))}
                        size="small"
                        placeholder="Header level HSN/SAC"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        label="AWB Number"
                        value={invoiceForm.awb_number}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, awb_number: e.target.value }))}
                        size="small"
                        placeholder="Air Waybill Number"
                      />
                    </Grid>
                  </Grid>

                  {/* Tax Settings */}
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: -1 }}>
                    Tax Settings (GST)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tax Type</InputLabel>
                        <Select
                          value={invoiceForm.tax_type}
                          label="Tax Type"
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, tax_type: e.target.value }))}
                        >
                          <MenuItem value="IGST">IGST (Inter-State)</MenuItem>
                          <MenuItem value="CGST_SGST">CGST + SGST (Intra-State)</MenuItem>
                          <MenuItem value="EXEMPT">Exempt / Export</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControl fullWidth size="small" disabled={invoiceForm.tax_type === 'EXEMPT'}>
                        <InputLabel>GST Rate</InputLabel>
                        <Select
                          value={invoiceForm.gst_rate}
                          label="GST Rate"
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, gst_rate: e.target.value }))}
                        >
                          <MenuItem value={0}>0%</MenuItem>
                          <MenuItem value={5}>5%</MenuItem>
                          <MenuItem value={12}>12%</MenuItem>
                          <MenuItem value={18}>18%</MenuItem>
                          <MenuItem value={28}>28%</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Shipping Method</InputLabel>
                        <Select
                          value={invoiceForm.shipping_method}
                          label="Shipping Method"
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, shipping_method: e.target.value }))}
                        >
                          <MenuItem value="BYAIR">By Air</MenuItem>
                          <MenuItem value="BY_SEA">By Sea</MenuItem>
                          <MenuItem value="BY_ROAD">By Road</MenuItem>
                          <MenuItem value="COURIER">Courier</MenuItem>
                          <MenuItem value="HAND_DELIVERY">Hand Delivery</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Exchange Rate */}
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                          Invoice Exchange Rate (₹/$)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PI was created at ₹{selectedPI.exchange_rate || usdToInr}/$
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                          size="small"
                          type="number"
                          value={invoiceExchangeRate}
                          onChange={(e) => setInvoiceExchangeRate(parseFloat(e.target.value) || 0)}
                          inputProps={{ step: 0.01, min: 1 }}
                          sx={{ width: 120 }}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>₹</Typography>
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setInvoiceExchangeRate(usdToInr)}
                          title="Reset to current market rate"
                          sx={{ bgcolor: 'primary.100' }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2">
                            Total: ${(selectedPI.total_amount || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            = ₹{((selectedPI.total_amount || 0) * invoiceExchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>

                  {/* Bank Account Selection */}
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccountBalance sx={{ fontSize: 20, color: 'info.main' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Bank Details for Invoice
                        </Typography>
                      </Stack>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Bank Account</InputLabel>
                        <Select
                          value={selectedBankAccount}
                          label="Bank Account"
                          onChange={(e) => setSelectedBankAccount(e.target.value)}
                        >
                          <MenuItem value="india">India (Primary)</MenuItem>
                          <MenuItem value="usa">USA Account</MenuItem>
                          <MenuItem value="international">International</MenuItem>
                          <MenuItem value="custom">Custom Details</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                    {selectedBankAccount && selectedBankAccount !== 'custom' && settingsData.bankDetails[selectedBankAccount] && (
                      <Box sx={{ mt: 2, pl: 4 }}>
                        <Typography variant="body2">
                          <strong>Bank:</strong> {settingsData.bankDetails[selectedBankAccount].bank_name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>A/C:</strong> {settingsData.bankDetails[selectedBankAccount].account_number}
                        </Typography>
                        <Typography variant="body2">
                          <strong>IFSC:</strong> {settingsData.bankDetails[selectedBankAccount].ifsc_code}
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Terms & Notes */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Terms Preset</InputLabel>
                        <Select
                          value={invoiceForm.terms_preset}
                          label="Terms Preset"
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, terms_preset: e.target.value }))}
                        >
                          <MenuItem value="STANDARD">Standard Terms</MenuItem>
                          <MenuItem value="EXPORT">Export Terms</MenuItem>
                          <MenuItem value="CUSTOM">Custom Terms</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Invoice Notes (Optional)"
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notes to appear on invoice..."
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {/* Tab 1: Preview */}
              {invoiceModalTab === 1 && (
                <Box sx={{ bgcolor: '#e8e8e8', p: 2, borderRadius: 1, minHeight: '55vh' }}>
                  <Paper
                    elevation={3}
                    sx={{
                      maxWidth: 900,
                      mx: 'auto',
                      p: 4,
                      bgcolor: 'white'
                    }}
                  >
                    {/* Invoice Header */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          KB Enterprises
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          123 Business Avenue, Tech Park
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mumbai, Maharashtra 400001
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          GSTIN: 27AABCK1234L1Z5
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: accounts@kbenterprises.com
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Chip
                          label={invoiceForm.invoice_type.replace('_', ' ')}
                          color={invoiceForm.invoice_type === 'TAX_INVOICE' ? 'success' : 'primary'}
                          sx={{ mb: 1, fontWeight: 'bold' }}
                        />
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {invoiceForm.custom_invoice_number || 'Invoice #'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          PI Ref: {selectedPI.performa_invoice_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(invoiceForm.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {new Date(invoiceForm.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                        {invoiceForm.po_number && (
                          <Typography variant="body2" color="text.secondary">
                            PO: {invoiceForm.po_number}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    {/* Bill To / Ship To */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary.main" gutterBottom>
                          BILL TO
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedPI.customer_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPI.billing_address?.street || 'Address on file'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPI.billing_address?.city}, {selectedPI.billing_address?.state} {selectedPI.billing_address?.zip}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: {selectedPI.buyer_email || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="secondary.main" gutterBottom>
                          SHIP TO
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedPI.customer_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPI.shipping_address?.street || selectedPI.billing_address?.street || 'Same as billing'}
                        </Typography>
                        {invoiceForm.shipping_method && (
                          <Typography variant="body2" color="text.secondary">
                            Shipping: {invoiceForm.shipping_method.replace('_', ' ')}
                          </Typography>
                        )}
                        {invoiceForm.awb_number && (
                          <Typography variant="body2" color="text.secondary">
                            AWB: {invoiceForm.awb_number}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>

                    {/* Items Table */}
                    <TableContainer sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>HSN</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate (USD)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate (INR)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selectedPI.items || []).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{item.product_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.part_number}</Typography>
                              </TableCell>
                              <TableCell>{item.hsn_code || invoiceForm.hsn_sac || '-'}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">${(item.unit_price || 0).toFixed(2)}</TableCell>
                              <TableCell align="right">₹{((item.unit_price || 0) * invoiceExchangeRate).toFixed(2)}</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold">
                                  ${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Summary */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 7 }}>
                        {/* Bank Details */}
                        {selectedBankAccount && selectedBankAccount !== 'custom' && settingsData.bankDetails[selectedBankAccount] && (
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Bank Details for Payment
                            </Typography>
                            <Typography variant="body2">
                              Bank: {settingsData.bankDetails[selectedBankAccount].bank_name}
                            </Typography>
                            <Typography variant="body2">
                              A/C: {settingsData.bankDetails[selectedBankAccount].account_number}
                            </Typography>
                            <Typography variant="body2">
                              IFSC: {settingsData.bankDetails[selectedBankAccount].ifsc_code}
                            </Typography>
                            {settingsData.bankDetails[selectedBankAccount].swift_code && (
                              <Typography variant="body2">
                                SWIFT: {settingsData.bankDetails[selectedBankAccount].swift_code}
                              </Typography>
                            )}
                          </Paper>
                        )}

                        {/* Amount in Words */}
                        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="caption" fontWeight="bold">Amount in Words (INR):</Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            Rupees {Math.floor((selectedPI.total_amount || 0) * invoiceExchangeRate).toLocaleString('en-IN')} Only
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid size={{ xs: 5 }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Subtotal:</Typography>
                            <Typography variant="body2">${(selectedPI.subtotal || selectedPI.total_amount || 0).toFixed(2)}</Typography>
                          </Box>
                          {invoiceForm.tax_type !== 'EXEMPT' && invoiceForm.invoice_type === 'TAX_INVOICE' && (
                            <>
                              {invoiceForm.tax_type === 'IGST' ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">IGST ({invoiceForm.gst_rate}%):</Typography>
                                  <Typography variant="body2">
                                    ${(((selectedPI.total_amount || 0) * invoiceForm.gst_rate) / 100).toFixed(2)}
                                  </Typography>
                                </Box>
                              ) : (
                                <>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">CGST ({invoiceForm.gst_rate / 2}%):</Typography>
                                    <Typography variant="body2">
                                      ${(((selectedPI.total_amount || 0) * invoiceForm.gst_rate / 2) / 100).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">SGST ({invoiceForm.gst_rate / 2}%):</Typography>
                                    <Typography variant="body2">
                                      ${(((selectedPI.total_amount || 0) * invoiceForm.gst_rate / 2) / 100).toFixed(2)}
                                    </Typography>
                                  </Box>
                                </>
                              )}
                            </>
                          )}
                          <Divider />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" fontWeight="bold">Total (USD):</Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              ${(selectedPI.total_amount || 0).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" fontWeight="bold">Total (INR):</Typography>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                              ₹{((selectedPI.total_amount || 0) * invoiceExchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Chip label="PAID" color="success" size="small" />
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>

                    {/* Notes & Terms */}
                    {invoiceForm.notes && (
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" fontWeight="bold">Notes:</Typography>
                        <Typography variant="body2" color="text.secondary">{invoiceForm.notes}</Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                      <Typography variant="caption" fontWeight="bold">Terms & Conditions:</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        1. Goods once sold will not be taken back or exchanged.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        2. Payment must be made within the due date mentioned above.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        3. E. & O.E.
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', justifyContent: 'space-between' }}>
          <Box>
            {invoiceModalTab === 0 && (
              <Button
                variant="outlined"
                onClick={() => setInvoiceModalTab(1)}
                startIcon={<Visibility />}
              >
                Preview Invoice
              </Button>
            )}
            {invoiceModalTab === 1 && (
              <Button
                variant="outlined"
                onClick={() => setInvoiceModalTab(0)}
                startIcon={<Edit />}
              >
                Edit Details
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => { setShowInvoiceModal(false); setInvoiceModalTab(0); }}
              color="inherit"
              disabled={createInvoiceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={confirmGenerateInvoice}
              disabled={createInvoiceMutation.isPending}
              startIcon={createInvoiceMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Receipt />}
            >
              {createInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
            m: 1
          }
        }}
      >
        <DialogTitle sx={{ py: 1.5, px: 3, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ fontSize: '18px' }}
              >
                Proforma Invoice Preview
              </Typography>
              {previewPI && (
                <Chip
                  label={previewPI.performa_invoice_number}
                  color="primary"
                  size="small"
                  sx={{ fontSize: '12px', fontWeight: 600 }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Print">
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Print />}
                  onClick={handlePrintAction}
                  sx={{ fontSize: '12px' }}
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
                  sx={{ fontSize: '12px' }}
                >
                  PDF
                </Button>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={() => setShowPreviewModal(false)}
                  sx={{ ml: 1 }}
                >
                  <Cancel />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 2,
            bgcolor: '#e8e8e8',
            display: 'flex',
            justifyContent: 'center',
            overflowY: 'auto'
          }}
        >
          {previewPI && (
            <PerformaInvoicePrintPreview
              ref={printRef}
              performaInvoice={previewPI}
              globalRate={usdToInr}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bank Details Edit Modal */}
      <Dialog
        open={showBankEditModal}
        onClose={() => setShowBankEditModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccountBalance color="primary" />
            <Typography variant="h6">Edit Bank Details</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ fontSize: '12px' }}>
              Customize bank details for this document. Changes will only apply to this PI/Invoice.
            </Alert>
            <TextField
              label="Bank Name"
              fullWidth
              value={customBankDetails.bank_name}
              onChange={(e) => setCustomBankDetails({ ...customBankDetails, bank_name: e.target.value })}
              placeholder="Enter bank name"
            />
            <TextField
              label="Account Name"
              fullWidth
              value={customBankDetails.account_name}
              onChange={(e) => setCustomBankDetails({ ...customBankDetails, account_name: e.target.value })}
              placeholder="Enter account holder name"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Account Number"
                  fullWidth
                  value={customBankDetails.account_number}
                  onChange={(e) => setCustomBankDetails({ ...customBankDetails, account_number: e.target.value })}
                  placeholder="Enter account number"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={customBankDetails.account_type}
                    label="Account Type"
                    onChange={(e) => setCustomBankDetails({ ...customBankDetails, account_type: e.target.value })}
                  >
                    <MenuItem value="Current Account">Current Account</MenuItem>
                    <MenuItem value="Savings Account">Savings Account</MenuItem>
                    <MenuItem value="EEFC Account">EEFC Account</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="IFSC Code"
                  fullWidth
                  value={customBankDetails.ifsc_code}
                  onChange={(e) => setCustomBankDetails({ ...customBankDetails, ifsc_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., HDFC0001234"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="SWIFT Code (for international)"
                  fullWidth
                  value={customBankDetails.swift_code}
                  onChange={(e) => setCustomBankDetails({ ...customBankDetails, swift_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., HDFCINBBXXX"
                />
              </Grid>
            </Grid>
            <TextField
              label="Branch"
              fullWidth
              value={customBankDetails.branch}
              onChange={(e) => setCustomBankDetails({ ...customBankDetails, branch: e.target.value })}
              placeholder="Enter branch name"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBankEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedBankAccount('custom')
              setShowBankEditModal(false)
            }}
            disabled={!customBankDetails.bank_name || !customBankDetails.account_number}
          >
            Save & Use Custom Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        open={showEmailModal}
        onClose={() => {
          setShowEmailModal(false)
          setEmailPI(null)
          setBuyerCurrentEmail(null)
        }}
        documentType="proforma"
        document={emailPI}
        buyerCurrentEmail={buyerCurrentEmail}
        onSuccess={() => {
          fetchPerformaInvoices()
          toast.success('Proforma Invoice email sent successfully!')
        }}
      />
    </Container>
  )
}

export default PerformaInvoices
