import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Stack,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  InputAdornment,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add,
  Delete,
  Receipt,
  Person,
  Business,
  Save,
  Visibility,
  Print,
  Close,
  LocalShipping,
  AccountBalance,
  Calculate,
  ShoppingCart,
  ExpandMore,
  Description,
  Gavel,
  Flight,
  Store,
  CloudUpload,
} from "@mui/icons-material";
import { useCurrency } from "../../context/CurrencyContext";
import { useBuyers } from "../../hooks/useUsers";
import { useProducts } from "../../hooks/useProducts";
import { useCreateManualInvoice } from "../../hooks/useInvoices";
import Logo from "../../components/Logo";

// Default company details (can be moved to settings/config)
const DEFAULT_COMPANY_DETAILS = {
  company_name: "KB Enterprises",
  address_line1: "123 Business Avenue",
  address_line2: "Tech Park, Building A",
  city: "Mumbai",
  state: "Maharashtra",
  zip: "400001",
  country: "India",
  gstin: "27AABCK1234L1Z5",
  pan: "AABCK1234L",
  attention: "Accounts Department",
  phone: "+91 22 1234 5678",
  email: "accounts@kbenterprises.com",
};

// Default terms and conditions
const DEFAULT_TERMS = [
  "Goods once sold will not be taken back or exchanged.",
  "Payment must be made within the due date mentioned above.",
  "Interest @ 18% p.a. will be charged on overdue amounts.",
  "All disputes are subject to Mumbai jurisdiction.",
  "E. & O.E.",
];

const EXPORT_TERMS = [
  "This is an export invoice. No GST applicable.",
  "Payment via wire transfer to the bank account mentioned.",
  "Goods shipped at buyer's risk.",
  "All disputes subject to arbitration in India.",
];

// Unit of Measure options
const UOM_OPTIONS = [
  { value: "EA", label: "Each (EA)" },
  { value: "PCS", label: "Pieces (PCS)" },
  { value: "SET", label: "Set (SET)" },
  { value: "BOX", label: "Box (BOX)" },
  { value: "KG", label: "Kilogram (KG)" },
  { value: "LTR", label: "Liter (LTR)" },
  { value: "MTR", label: "Meter (MTR)" },
  { value: "SQM", label: "Square Meter (SQM)" },
  { value: "PAIR", label: "Pair (PAIR)" },
  { value: "DOZ", label: "Dozen (DOZ)" },
];

// Countries list for dropdown
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Cambodia", "Cameroon",
  "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia",
  "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Honduras", "Hong Kong",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon", "Libya",
  "Lithuania", "Luxembourg", "Macau", "Malaysia", "Maldives", "Malta", "Mauritius", "Mexico",
  "Moldova", "Monaco", "Mongolia", "Morocco", "Myanmar", "Nepal", "Netherlands", "New Zealand",
  "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Tunisia", "Turkey",
  "Turkmenistan", "UAE", "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Number to words converter for INR
const numberToWordsINR = (num) => {
  if (num === 0) return "Zero Rupees Only";

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';

  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    result += convertIndian(rupees % 10000000);
  } else {
    result = convertIndian(rupees);
  }

  function convertIndian(n) {
    if (n === 0) return '';
    if (n >= 100000) {
      return convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ' + convertIndian(n % 100000);
    }
    if (n >= 1000) {
      return convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ' + convertLessThanThousand(n % 1000);
    }
    return convertLessThanThousand(n);
  }

  result = result.trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }
  result += ' Only';

  return result;
};

function ManualInvoice() {
  const { usdToInr } = useCurrency();

  // React Query hooks for data fetching
  const { data: users = [], isLoading: usersLoading } = useBuyers();
  const { data: products = [], isLoading: productsLoading } = useProducts({ limit: 1000 });
  const createInvoiceMutation = useCreateManualInvoice();

  // Tab state for form sections
  const [activeTab, setActiveTab] = useState(0);

  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("NET_30");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Invoice type and status
  const [invoiceType, setInvoiceType] = useState("TAX_INVOICE");
  const [invoiceTitle, setInvoiceTitle] = useState("TAX INVOICE"); // Display title on invoice badge
  const [invoiceStatus, setInvoiceStatus] = useState("UNPAID");
  const invoiceTitleOptions = ['INVOICE', 'TAX INVOICE']; // Preset options for invoice title

  // Company details (seller)
  const [companyDetails, setCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);

  // Bill To details
  const [billTo, setBillTo] = useState({
    company_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    gstin: "",
    pan: "",
    attention: "",
    contact: "",
    email: "",
  });

  // Ship To details
  const [shipTo, setShipTo] = useState({
    company_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    gstin: "",
    pan: "",
    attention: "",
    contact: "",
    email: "",
  });

  const [sameAsBillTo, setSameAsBillTo] = useState(true);

  // Document references
  const [hsnSac, setHsnSac] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [quoteReference, setQuoteReference] = useState("");
  const [piNumber, setPiNumber] = useState(""); // Proforma Invoice reference

  // Shipping details
  const [shippingMethod, setShippingMethod] = useState("BYAIR");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Tax settings
  const [taxType, setTaxType] = useState("PERCENTAGE"); // PERCENTAGE, IGST, CGST_SGST, CUSTOM, EXEMPT, NONE
  const [taxRate, setTaxRate] = useState(18);
  const [customTaxName, setCustomTaxName] = useState(""); // For CUSTOM tax type
  const [customTaxRate, setCustomTaxRate] = useState(0); // For CUSTOM tax type

  // Additional charges
  const [shippingCharge, setShippingCharge] = useState(0);
  const [freight, setFreight] = useState(0);
  const [customDuty, setCustomDuty] = useState(0);
  const [bankCharges, setBankCharges] = useState(0);
  const [logisticCharges, setLogisticCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [otherChargesLabel, setOtherChargesLabel] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [enableRoundOff, setEnableRoundOff] = useState(false);
  const [roundOff, setRoundOff] = useState(0);

  // Currency exchange for invoice
  const [useCustomExchangeRate, setUseCustomExchangeRate] = useState(false);
  const [customExchangeRate, setCustomExchangeRate] = useState(usdToInr);
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD");
  const [exchangeRateSource, setExchangeRateSource] = useState("CUSTOM");

  // Payment info
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  // Bank details
  const [bankDetails, setBankDetails] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    ifsc_code: "",
    swift_code: "",
    branch: "",
    account_type: "Current",
  });

  // Terms and conditions
  const [termsPreset, setTermsPreset] = useState("STANDARD");
  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
  const [customTerms, setCustomTerms] = useState("");

  // UI states
  const [showPreview, setShowPreview] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchProduct, setSearchProduct] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Set default due date based on payment terms
    const days = paymentTerms === "100%PREPAID" ? 0 :
                 paymentTerms === "50%_ADVANCE" ? 0 :
                 paymentTerms === "NET_7" ? 7 :
                 paymentTerms === "NET_15" ? 15 :
                 paymentTerms === "NET_30" ? 30 :
                 paymentTerms === "NET_45" ? 45 :
                 paymentTerms === "NET_60" ? 60 :
                 paymentTerms === "NET_90" ? 90 : 30;

    const newDueDate = new Date(invoiceDate);
    newDueDate.setDate(newDueDate.getDate() + days);
    setDueDate(newDueDate.toISOString().split("T")[0]);
  }, [invoiceDate, paymentTerms]);

  // Update Bill To when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      // Map user data to Bill To fields
      setBillTo({
        company_name: selectedCustomer.company_details?.company_name || selectedCustomer.name || "",
        address_line1: selectedCustomer.address?.street || "",
        address_line2: "",
        city: selectedCustomer.address?.city || "",
        state: selectedCustomer.address?.state || "",
        zip: selectedCustomer.address?.zip || selectedCustomer.address?.pincode || "",
        country: selectedCustomer.address?.country || "India",
        gstin: selectedCustomer.company_details?.tax_id || selectedCustomer.gstin || "",
        pan: selectedCustomer.pan || "",
        attention: selectedCustomer.name || "",
        contact: selectedCustomer.phone || selectedCustomer.company_details?.phone || "",
        email: selectedCustomer.email || selectedCustomer.company_details?.billing_email || "",
      });

      // Also update Ship To if sameAsBillTo is checked (will be handled by the other useEffect)
      // But set the initial values directly for immediate feedback
      if (sameAsBillTo) {
        setShipTo({
          company_name: selectedCustomer.company_details?.company_name || selectedCustomer.name || "",
          address_line1: selectedCustomer.address?.street || "",
          address_line2: "",
          city: selectedCustomer.address?.city || "",
          state: selectedCustomer.address?.state || "",
          zip: selectedCustomer.address?.zip || selectedCustomer.address?.pincode || "",
          country: selectedCustomer.address?.country || "India",
          gstin: selectedCustomer.company_details?.tax_id || selectedCustomer.gstin || "",
          pan: selectedCustomer.pan || "",
          attention: selectedCustomer.name || "",
          contact: selectedCustomer.phone || selectedCustomer.company_details?.phone || "",
          email: selectedCustomer.email || selectedCustomer.company_details?.billing_email || "",
        });
      }
    }
  }, [selectedCustomer, sameAsBillTo]);

  // Copy Bill To to Ship To when sameAsBillTo is true
  useEffect(() => {
    if (sameAsBillTo) {
      setShipTo({ ...billTo });
    }
  }, [billTo, sameAsBillTo]);

  // Update terms when preset changes
  useEffect(() => {
    if (termsPreset === "STANDARD") {
      setTermsAndConditions(DEFAULT_TERMS);
    } else if (termsPreset === "EXPORT") {
      setTermsAndConditions(EXPORT_TERMS);
    }
  }, [termsPreset]);

  // Get effective exchange rate
  const effectiveExchangeRate = useCustomExchangeRate ? customExchangeRate : usdToInr;

  // Calculate totals
  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return (subtotal * discount) / 100;
    }
    return discount;
  };

  const calculateTax = () => {
    if (taxType === "EXEMPT" || taxType === "NONE" || invoiceType === "REIMBURSEMENT" || invoiceType === "BILL_OF_SUPPLY") {
      return 0;
    }
    const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
    const rate = taxType === "CUSTOM" ? customTaxRate : taxRate;
    return (subtotalAfterDiscount * rate) / 100;
  };

  const calculateTaxBreakdown = () => {
    if (taxType === "EXEMPT" || taxType === "NONE") {
      return { total_igst: 0, total_cgst: 0, total_sgst: 0, total_tax: 0, custom_tax: 0 };
    }

    const totalTax = calculateTax() * effectiveExchangeRate;
    const rate = taxType === "CUSTOM" ? customTaxRate : taxRate;

    if (taxType === "IGST") {
      return {
        total_igst: totalTax,
        total_cgst: 0,
        total_sgst: 0,
        total_tax: totalTax,
        [`igst_${rate}`]: totalTax,
      };
    } else if (taxType === "CGST_SGST") {
      const halfTax = totalTax / 2;
      return {
        total_igst: 0,
        total_cgst: halfTax,
        total_sgst: halfTax,
        total_tax: totalTax,
        [`cgst_${rate/2}`]: halfTax,
        [`sgst_${rate/2}`]: halfTax,
      };
    } else {
      // PERCENTAGE or CUSTOM tax type
      return {
        total_igst: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_tax: totalTax,
        custom_tax: totalTax,
        custom_tax_name: taxType === "CUSTOM" ? customTaxName : "Tax",
        custom_tax_rate: rate,
      };
    }
  };

  const calculateAdditionalCharges = () => {
    return Number(shippingCharge) + Number(freight) + Number(customDuty) + Number(bankCharges) + Number(logisticCharges) + Number(otherCharges);
  };

  const calculateTotal = () => {
    const roundOffAmount = enableRoundOff ? Number(roundOff) : 0;
    return calculateSubtotal() - calculateDiscount() + calculateTax() + calculateAdditionalCharges() + roundOffAmount;
  };

  const calculateTotalINR = () => {
    return calculateTotal() * effectiveExchangeRate;
  };

  const calculateBalanceDue = () => {
    return calculateTotal() - amountPaid;
  };

  // Add product to invoice
  const handleAddProduct = () => {
    if (!searchProduct) return;

    const productKey = searchProduct._id || searchProduct.product_id;
    const existingIndex = invoiceItems.findIndex(item => (item._id || item.product_id) === productKey);

    if (existingIndex >= 0) {
      const updatedItems = [...invoiceItems];
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].qty_ordered += 1;
      updatedItems[existingIndex].total_price = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_price;
      setInvoiceItems(updatedItems);
    } else {
      const newItem = {
        sn: invoiceItems.length + 1,
        _id: searchProduct._id,
        product_id: searchProduct.product_id || searchProduct._id,
        part_number: searchProduct.part_number || "",
        product_name: searchProduct.product_name || "",
        description: searchProduct.description || "",
        hsn_sac_code: searchProduct.hsn_code || "",
        qty_ordered: 1,
        qty_delivered: 0,
        qty_pending: 1,
        quantity: 1,
        uom: "EA",
        delivery_status: "PENDING",
        unit_price: searchProduct.your_price || searchProduct.list_price || 0,
        total_price: searchProduct.your_price || searchProduct.list_price || 0,
        original_price: searchProduct.your_price || searchProduct.list_price || 0,
      };
      setInvoiceItems([...invoiceItems, newItem]);
    }

    setSearchProduct(null);
    setShowProductSearch(false);
  };

  // Update item in invoice
  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    if (field === "quantity" || field === "unit_price" || field === "qty_ordered" || field === "qty_delivered") {
      updatedItems[index][field] = Number(value);
      // Recalculate totals
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
      if (field === "qty_ordered" || field === "qty_delivered") {
        updatedItems[index].qty_pending = (updatedItems[index].qty_ordered || updatedItems[index].quantity) - (updatedItems[index].qty_delivered || 0);
        // Update delivery status
        if (updatedItems[index].qty_delivered === 0) {
          updatedItems[index].delivery_status = "PENDING";
        } else if (updatedItems[index].qty_delivered >= updatedItems[index].qty_ordered) {
          updatedItems[index].delivery_status = "DELIVERED";
        } else {
          updatedItems[index].delivery_status = "PARTIAL";
        }
      }
    } else {
      updatedItems[index][field] = value;
    }
    setInvoiceItems(updatedItems);
  };

  // Remove item from invoice
  const handleRemoveItem = (index) => {
    const newItems = invoiceItems.filter((_, i) => i !== index);
    // Re-number serial numbers
    newItems.forEach((item, idx) => {
      item.sn = idx + 1;
    });
    setInvoiceItems(newItems);
  };

  // Add custom item
  const handleAddCustomItem = () => {
    const newItem = {
      sn: invoiceItems.length + 1,
      product_id: `CUSTOM-${Date.now()}`,
      part_number: "",
      product_name: "",
      description: "",
      hsn_sac_code: "",
      qty_ordered: 1,
      qty_delivered: 0,
      qty_pending: 1,
      quantity: 1,
      uom: "EA",
      delivery_status: "PENDING",
      unit_price: 0,
      total_price: 0,
      original_price: 0,
      isCustom: true,
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!selectedCustomer) {
      newErrors.customer = "Please select a customer";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create invoice using mutation
  const handleCreateInvoice = () => {
    if (!validateForm()) {
      return;
    }

    const taxBreakdown = calculateTaxBreakdown();

    // Prepare invoice data for API
    const invoiceData = {
      // Buyer info
      buyer: selectedCustomer._id,
      buyer_name: selectedCustomer.name,
      buyer_email: selectedCustomer.email,

      // Invoice type
      invoice_type: invoiceType,
      invoice_title: invoiceTitle || "TAX INVOICE",
      source: "MANUAL",
      is_manual: true,

      // Company details (seller)
      company_details: companyDetails,

      // Bill To / Ship To
      bill_to: billTo,
      ship_to: sameAsBillTo ? billTo : shipTo,

      // Document references
      hsn_sac: hsnSac,
      awb_number: awbNumber,
      po_number: poNumber,
      quote_reference: quoteReference,
      proforma_invoice_number: piNumber, // PI reference

      // Shipping details
      shipping_method: shippingMethod,
      shipping_carrier: shippingCarrier,
      tracking_number: trackingNumber,

      // Dates
      invoice_date: invoiceDate,
      due_date: dueDate,

      // Payment terms
      payment_terms: paymentTerms,

      // Invoice items
      items: invoiceItems.map((item, index) => ({
        sn: index + 1,
        product: item.product_id?.startsWith("CUSTOM-") ? undefined : item._id,
        product_id: item.product_id,
        part_number: item.part_number,
        product_name: item.product_name,
        description: item.description,
        hsn_sac_code: item.hsn_sac_code,
        qty_ordered: item.qty_ordered || item.quantity,
        qty_delivered: item.qty_delivered || 0,
        qty_pending: item.qty_pending || item.quantity,
        quantity: item.quantity,
        uom: item.uom,
        delivery_status: item.delivery_status,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      })),

      // Tax settings
      tax_type: taxType,
      tax_rate: taxType === "CUSTOM" ? customTaxRate : taxRate,
      custom_tax_name: taxType === "CUSTOM" ? customTaxName : null,
      tax: calculateTax(),
      tax_breakdown: taxBreakdown,

      // Financial breakdown
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      discount_type: discountType,
      discount_value: discount,
      shipping: shippingCharge,
      freight: freight,
      custom_duty: customDuty,
      bank_charges: bankCharges,
      logistic_charges: logisticCharges,
      other_charges: otherCharges,
      other_charges_label: otherChargesLabel || null,
      round_off: enableRoundOff ? roundOff : 0,
      total_amount: calculateTotal(),
      balance_due: calculateBalanceDue(),

      // Payment info
      amount_paid: amountPaid,
      payment_method: paymentMethod || null,
      payment_date: paymentDate || null,

      // Currency settings
      currency: invoiceCurrency,
      exchange_rate: effectiveExchangeRate,
      exchange_rate_source: exchangeRateSource,

      // INR amounts
      subtotal_inr: calculateSubtotal() * effectiveExchangeRate,
      total_amount_inr: calculateTotalINR(),
      grand_total_inr: calculateTotalINR() + (taxBreakdown.total_tax || 0),

      // Amount in words
      amount_in_words_usd: `USD ${calculateTotal().toFixed(2)}`,
      amount_in_words_inr: numberToWordsINR(calculateTotalINR()),

      // Bank details
      bank_details: bankDetails,

      // Terms and conditions
      terms_preset: termsPreset,
      terms_and_conditions: termsPreset === "CUSTOM" ? customTerms.split("\n").filter(t => t.trim()) : termsAndConditions,

      // Notes
      notes: notes,
      internal_notes: internalNotes,

      // Status (user selected)
      status: invoiceStatus,
    };

    // Call mutation
    createInvoiceMutation.mutate(invoiceData, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setInvoiceItems([]);
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setPaymentTerms("NET_30");
    setNotes("");
    setInternalNotes("");
    setInvoiceType("TAX_INVOICE");
    setInvoiceStatus("UNPAID");
    setTaxType("PERCENTAGE");
    setTaxRate(18);
    setCustomTaxName("");
    setCustomTaxRate(0);
    setShippingCharge(0);
    setFreight(0);
    setCustomDuty(0);
    setBankCharges(0);
    setLogisticCharges(0);
    setOtherCharges(0);
    setOtherChargesLabel("");
    setDiscount(0);
    setDiscountType("percentage");
    setEnableRoundOff(false);
    setRoundOff(0);
    setAmountPaid(0);
    setPaymentMethod("");
    setPaymentDate("");
    setUseCustomExchangeRate(false);
    setCustomExchangeRate(usdToInr);
    setHsnSac("");
    setAwbNumber("");
    setPoNumber("");
    setQuoteReference("");
    setBillTo({
      company_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      gstin: "",
      pan: "",
      attention: "",
      contact: "",
      email: "",
    });
    setShipTo({
      company_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      gstin: "",
      pan: "",
      attention: "",
      contact: "",
      email: "",
    });
    setSameAsBillTo(true);
    setTermsPreset("STANDARD");
    setTermsAndConditions(DEFAULT_TERMS);
    setErrors({});
    setActiveTab(0);
  };

  // Print invoice handler
  const handlePrint = () => {
    const printContent = document.getElementById("invoice-preview-content");
    if (!printContent) return;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice Preview</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              margin: 20px;
              color: #000;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .header {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .total-section {
              margin-top: 15px;
              text-align: right;
            }
            .amount-words {
              font-style: italic;
              margin-top: 10px;
              padding: 10px;
              background: #f9f9f9;
              border: 1px dashed #ccc;
            }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt sx={{ fontSize: 28, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                Manual Invoice Generation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create comprehensive invoices with GST, delivery tracking, and more
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => setShowPreview(true)}
              disabled={!selectedCustomer}
              sx={{ borderRadius: 2 }}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              startIcon={createInvoiceMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleCreateInvoice}
              disabled={!selectedCustomer || createInvoiceMutation.isPending}
              sx={{ borderRadius: 2 }}
            >
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {errors.customer && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            border: "1px solid",
            borderColor: "error.main",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Alert severity="error" sx={{ borderRadius: 0 }}>{errors.customer}</Alert>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Invoice Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: "2px solid",
              borderColor: invoiceType === "TAX_INVOICE" ? "success.main" : invoiceType === "REIMBURSEMENT" ? "warning.main" : "info.main",
              borderRadius: 2,
              bgcolor: invoiceType === "TAX_INVOICE" ? "success.50" : invoiceType === "REIMBURSEMENT" ? "warning.50" : "info.50",
              position: "sticky",
              top: 78,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: 1,
                  }}
                >
                  <Calculate sx={{ color: invoiceType === "TAX_INVOICE" ? "success.main" : invoiceType === "REIMBURSEMENT" ? "warning.main" : "info.main", fontSize: 22 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Invoice Summary
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={invoiceType === "TAX_INVOICE" ? "Tax Invoice" : invoiceType === "REIMBURSEMENT" ? "Reimbursement" : invoiceType === "BILL_OF_SUPPLY" ? "Bill of Supply" : invoiceType || "Tax Invoice"}
                  size="small"
                  color={invoiceType === "TAX_INVOICE" ? "success" : invoiceType === "REIMBURSEMENT" ? "warning" : invoiceType === "BILL_OF_SUPPLY" ? "info" : "default"}
                  sx={{ fontWeight: "bold" }}
                />
                <Chip
                  label={invoiceStatus}
                  size="small"
                  color={invoiceStatus === "PAID" ? "success" : invoiceStatus === "PARTIAL" ? "warning" : "error"}
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                <Typography variant="body2">${calculateSubtotal().toFixed(2)}</Typography>
              </Box>

              {discount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Discount ({discountType === "percentage" ? `${discount}%` : `$${discount}`}):
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -${calculateDiscount().toFixed(2)}
                  </Typography>
                </Box>
              )}

              {/* Tax Display based on type */}
              {taxType === "PERCENTAGE" && invoiceType === "TAX_INVOICE" && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Tax ({taxRate}%):</Typography>
                  <Typography variant="body2">${calculateTax().toFixed(2)}</Typography>
                </Box>
              )}

              {taxType === "IGST" && invoiceType === "TAX_INVOICE" && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">IGST ({taxRate}%):</Typography>
                  <Typography variant="body2">${calculateTax().toFixed(2)}</Typography>
                </Box>
              )}

              {taxType === "CGST_SGST" && invoiceType === "TAX_INVOICE" && (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">CGST ({taxRate/2}%):</Typography>
                    <Typography variant="body2">${(calculateTax()/2).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">SGST ({taxRate/2}%):</Typography>
                    <Typography variant="body2">${(calculateTax()/2).toFixed(2)}</Typography>
                  </Box>
                </>
              )}

              {taxType === "CUSTOM" && invoiceType === "TAX_INVOICE" && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">{customTaxName || "Custom Tax"} ({customTaxRate}%):</Typography>
                  <Typography variant="body2">${calculateTax().toFixed(2)}</Typography>
                </Box>
              )}

              {(taxType === "EXEMPT" || taxType === "NONE" || invoiceType !== "TAX_INVOICE") && (
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, px: 1, bgcolor: "white", borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", fontSize: "12px" }}>
                    {invoiceType === "REIMBURSEMENT" ? "No tax (Reimbursement)" : invoiceType === "EXPORT" ? "No tax (Export)" : "No tax"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">$0.00</Typography>
                </Box>
              )}

              {calculateAdditionalCharges() > 0 && (
                <>
                  {shippingCharge > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Shipping:</Typography>
                      <Typography variant="body2">${Number(shippingCharge).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {freight > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Freight:</Typography>
                      <Typography variant="body2">${Number(freight).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {customDuty > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Custom Duty:</Typography>
                      <Typography variant="body2">${Number(customDuty).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {bankCharges > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Bank Charges:</Typography>
                      <Typography variant="body2">${Number(bankCharges).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {logisticCharges > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Logistics:</Typography>
                      <Typography variant="body2">${Number(logisticCharges).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {otherCharges > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">{otherChargesLabel || "Other Charges"}:</Typography>
                      <Typography variant="body2">${Number(otherCharges).toFixed(2)}</Typography>
                    </Box>
                  )}
                </>
              )}

              {enableRoundOff && roundOff !== 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Round Off:</Typography>
                  <Typography variant="body2">${Number(roundOff).toFixed(2)}</Typography>
                </Box>
              )}

              <Divider />

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mt: 1,
                  bgcolor: "white",
                  borderRadius: 1.5,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" fontWeight="bold">Total (USD):</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" color="text.secondary">Total (INR):</Typography>
                  <Typography variant="h6" fontWeight="bold" color="secondary.main">
                    ₹{calculateTotalINR().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>

              {amountPaid > 0 && (
                <>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                    <Typography variant="body2" color="success.main">-${amountPaid.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" fontWeight="bold">Balance Due:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color={calculateBalanceDue() > 0 ? "error.main" : "success.main"}>
                      ${calculateBalanceDue().toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Amount in Words */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "white", borderRadius: 1, border: "1px dashed", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Amount in Words (INR):
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5 }}>
                  {numberToWordsINR(calculateTotalINR())}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Form Sections */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Tabs for different sections */}
          <Paper elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab icon={<Person />} label="Customer" iconPosition="start" />
              <Tab icon={<Calculate />} label="Charges & Tax" iconPosition="start" />
              <Tab icon={<Description />} label="Details" iconPosition="start" />
              <Tab icon={<AccountBalance />} label="Payment" iconPosition="start" />
              <Tab icon={<Gavel />} label="Terms" iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Tab 0: Customer & Addresses */}
              {activeTab === 0 && (
                <Stack spacing={3}>
                  {/* Invoice Type Selection */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                      Invoice Type
                    </Typography>
                    <Autocomplete
                      freeSolo
                      size="small"
                      options={['TAX_INVOICE', 'REIMBURSEMENT', 'BILL_OF_SUPPLY']}
                      getOptionLabel={(option) => {
                        if (option === 'TAX_INVOICE') return 'Tax Invoice';
                        if (option === 'REIMBURSEMENT') return 'Reimbursement Invoice';
                        if (option === 'BILL_OF_SUPPLY') return 'Bill of Supply';
                        return option;
                      }}
                      value={invoiceType}
                      onChange={(e, newValue) => setInvoiceType(newValue || 'TAX_INVOICE')}
                      onInputChange={(e, newValue) => {
                        // Only update if user is typing custom value
                        if (newValue && newValue !== 'Tax Invoice' && newValue !== 'Reimbursement Invoice' && newValue !== 'Bill of Supply') {
                          setInvoiceType(newValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select or type custom invoice type"
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option}>
                          {option === 'TAX_INVOICE' ? 'Tax Invoice' : option === 'REIMBURSEMENT' ? 'Reimbursement Invoice' : option === 'BILL_OF_SUPPLY' ? 'Bill of Supply' : option}
                        </li>
                      )}
                    />
                  </Box>

                  {/* Customer Selection */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                      Select Customer
                    </Typography>
                    <Autocomplete
                      options={users}
                      getOptionLabel={(option) => `${option.name} (${option.user_id || option.customer_id || ""})`}
                      value={selectedCustomer}
                      onChange={(_, newValue) => setSelectedCustomer(newValue)}
                      loading={usersLoading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search by name or ID..."
                          error={!!errors.customer}
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option._id || option.customer_id}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.user_id || option.customer_id} - {option.company_details?.company_name || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  </Box>

                  {/* Bill To Section */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Business color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">Bill To</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Company Name"
                            value={billTo.company_name}
                            onChange={(e) => setBillTo({ ...billTo, company_name: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Attention"
                            value={billTo.attention}
                            onChange={(e) => setBillTo({ ...billTo, attention: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Address Line 1"
                            value={billTo.address_line1}
                            onChange={(e) => setBillTo({ ...billTo, address_line1: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Address Line 2"
                            value={billTo.address_line2}
                            onChange={(e) => setBillTo({ ...billTo, address_line2: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="City"
                            value={billTo.city}
                            onChange={(e) => setBillTo({ ...billTo, city: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="State"
                            value={billTo.state}
                            onChange={(e) => setBillTo({ ...billTo, state: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ZIP/Postal Code"
                            value={billTo.zip}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setBillTo({ ...billTo, zip: value });
                            }}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Autocomplete
                            options={COUNTRIES}
                            value={billTo.country}
                            onChange={(_, newValue) => setBillTo({ ...billTo, country: newValue || "" })}
                            renderInput={(params) => (
                              <TextField {...params} label="Country" size="small" />
                            )}
                            size="small"
                            freeSolo
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tax ID / GSTIN"
                            value={billTo.gstin}
                            onChange={(e) => setBillTo({ ...billTo, gstin: e.target.value })}
                            placeholder="e.g., 27AABCK1234L1Z5"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="PAN (Optional)"
                            value={billTo.pan}
                            onChange={(e) => setBillTo({ ...billTo, pan: e.target.value })}
                            placeholder="e.g., AABCK1234L"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Contact"
                            value={billTo.contact}
                            onChange={(e) => setBillTo({ ...billTo, contact: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Email"
                            type="email"
                            value={billTo.email}
                            onChange={(e) => setBillTo({ ...billTo, email: e.target.value })}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  {/* Ship To Section */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocalShipping color="secondary" />
                        <Typography variant="subtitle2" fontWeight="bold">Ship To</Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={sameAsBillTo}
                              onChange={(e) => setSameAsBillTo(e.target.checked)}
                              size="small"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                          label={<Typography variant="caption">Same as Bill To</Typography>}
                          sx={{ ml: 2 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {sameAsBillTo ? (
                        <Alert severity="info" sx={{ py: 0.5 }}>
                          Ship To address is same as Bill To address
                        </Alert>
                      ) : (
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Company Name"
                              value={shipTo.company_name}
                              onChange={(e) => setShipTo({ ...shipTo, company_name: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Attention"
                              value={shipTo.attention}
                              onChange={(e) => setShipTo({ ...shipTo, attention: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Address Line 1"
                              value={shipTo.address_line1}
                              onChange={(e) => setShipTo({ ...shipTo, address_line1: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Address Line 2"
                              value={shipTo.address_line2}
                              onChange={(e) => setShipTo({ ...shipTo, address_line2: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="City"
                              value={shipTo.city}
                              onChange={(e) => setShipTo({ ...shipTo, city: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="State"
                              value={shipTo.state}
                              onChange={(e) => setShipTo({ ...shipTo, state: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="ZIP/Postal Code"
                              value={shipTo.zip}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setShipTo({ ...shipTo, zip: value });
                              }}
                              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <Autocomplete
                              options={COUNTRIES}
                              value={shipTo.country}
                              onChange={(_, newValue) => setShipTo({ ...shipTo, country: newValue || "" })}
                              renderInput={(params) => (
                                <TextField {...params} label="Country" size="small" />
                              )}
                              size="small"
                              freeSolo
                            />
                          </Grid>
                        </Grid>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  {/* Company Details (Seller) */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Store color="success" />
                        <Typography variant="subtitle2" fontWeight="bold">Company Details (Seller)</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Company Name"
                            value={companyDetails.company_name}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, company_name: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="GSTIN"
                            value={companyDetails.gstin}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, gstin: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="PAN"
                            value={companyDetails.pan}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, pan: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Email"
                            value={companyDetails.email}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Address"
                            value={companyDetails.address_line1}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, address_line1: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="City"
                            value={companyDetails.city}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, city: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="State"
                            value={companyDetails.state}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, state: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ZIP"
                            value={companyDetails.zip}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, zip: e.target.value })}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Phone"
                            value={companyDetails.phone}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
              )}

              {/* Tab 1: Charges & Tax */}
              {activeTab === 1 && (
                <Stack spacing={3}>
                  {/* Tax Settings */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Tax Settings
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Tax Type</InputLabel>
                          <Select
                            value={taxType}
                            label="Tax Type"
                            onChange={(e) => setTaxType(e.target.value)}
                          >
                            <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                            <MenuItem value="IGST">IGST (India - Inter-State)</MenuItem>
                            <MenuItem value="CGST_SGST">CGST + SGST (India - Intra-State)</MenuItem>
                            <MenuItem value="CUSTOM">Custom / Others</MenuItem>
                            <MenuItem value="EXEMPT">Exempt</MenuItem>
                            <MenuItem value="NONE">No Tax</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {taxType !== "CUSTOM" && taxType !== "EXEMPT" && taxType !== "NONE" && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tax Rate (%)"
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                          />
                        </Grid>
                      )}
                      {taxType === "CUSTOM" && (
                        <>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Tax Name"
                              value={customTaxName}
                              onChange={(e) => setCustomTaxName(e.target.value)}
                              placeholder="e.g., VAT, Sales Tax, etc."
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Tax Rate (%)"
                              type="number"
                              value={customTaxRate}
                              onChange={(e) => setCustomTaxRate(Number(e.target.value))}
                              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                              inputProps={{ min: 0, max: 100, step: 0.5 }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>

                    {taxType !== "EXEMPT" && taxType !== "NONE" && invoiceType === "TAX_INVOICE" && (
                      <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
                        <Typography variant="caption">
                          {taxType === "IGST"
                            ? `IGST @ ${taxRate}% will be applied. Use for inter-state supplies in India.`
                            : taxType === "CGST_SGST"
                            ? `CGST @ ${taxRate/2}% + SGST @ ${taxRate/2}% will be applied. Use for intra-state supplies in India.`
                            : taxType === "CUSTOM"
                            ? `${customTaxName || 'Custom Tax'} @ ${customTaxRate}% will be applied.`
                            : `Tax @ ${taxRate}% will be applied.`
                          }
                        </Typography>
                      </Alert>
                    )}
                  </Box>

                  {/* Additional Charges */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Additional Charges
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Shipping"
                          type="number"
                          value={shippingCharge}
                          onChange={(e) => setShippingCharge(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={`≈ ₹${((shippingCharge || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Freight"
                          type="number"
                          value={freight}
                          onChange={(e) => setFreight(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={`≈ ₹${((freight || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Custom Duty"
                          type="number"
                          value={customDuty}
                          onChange={(e) => setCustomDuty(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={`≈ ₹${((customDuty || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Bank Charges"
                          type="number"
                          value={bankCharges}
                          onChange={(e) => setBankCharges(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={`≈ ₹${((bankCharges || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Logistics"
                          type="number"
                          value={logisticCharges}
                          onChange={(e) => setLogisticCharges(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={`≈ ₹${((logisticCharges || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={otherChargesLabel || "Other Charges (Optional)"}
                          type="number"
                          value={otherCharges}
                          onChange={(e) => setOtherCharges(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          placeholder="0"
                          helperText={`≈ ₹${((otherCharges || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Other Charges Label"
                          value={otherChargesLabel}
                          onChange={(e) => setOtherChargesLabel(e.target.value)}
                          placeholder="e.g., Handling Fee"
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={enableRoundOff}
                                onChange={(e) => setEnableRoundOff(e.target.checked)}
                                size="small"
                              />
                            }
                            label={<Typography variant="body2">Enable Round Off</Typography>}
                          />
                          {enableRoundOff && (
                            <TextField
                              size="small"
                              label="Round Off"
                              type="number"
                              value={roundOff}
                              onChange={(e) => setRoundOff(Number(e.target.value))}
                              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                              inputProps={{ step: 0.01 }}
                              sx={{ width: 150 }}
                              helperText={`≈ ₹${((roundOff || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                            />
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Discount */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Discount
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={discountType}
                            label="Type"
                            onChange={(e) => setDiscountType(e.target.value)}
                          >
                            <MenuItem value="percentage">Percentage (%)</MenuItem>
                            <MenuItem value="fixed">Fixed ($)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Discount Value"
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">{discountType === "percentage" ? "%" : "$"}</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", bgcolor: "success.50" }}>
                          <Typography variant="caption" color="text.secondary">Discount Amount</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                            -${calculateDiscount().toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Currency Settings */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Currency Settings
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Currency</InputLabel>
                          <Select
                            value={invoiceCurrency}
                            label="Currency"
                            onChange={(e) => setInvoiceCurrency(e.target.value)}
                          >
                            <MenuItem value="USD">USD ($)</MenuItem>
                            <MenuItem value="INR">INR (₹)</MenuItem>
                            <MenuItem value="EUR">EUR (€)</MenuItem>
                            <MenuItem value="GBP">GBP (£)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Exchange Rate Source</InputLabel>
                          <Select
                            value={exchangeRateSource}
                            label="Exchange Rate Source"
                            onChange={(e) => setExchangeRateSource(e.target.value)}
                          >
                            <MenuItem value="CUSTOM">Custom Rate</MenuItem>
                            <MenuItem value="RBI">RBI Reference</MenuItem>
                            <MenuItem value="AS_PER_BOE">As per BOE</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Exchange Rate (1 USD = ₹)"
                          type="number"
                          value={useCustomExchangeRate ? customExchangeRate : usdToInr}
                          onChange={(e) => {
                            setUseCustomExchangeRate(true);
                            setCustomExchangeRate(Number(e.target.value));
                          }}
                          inputProps={{ step: 0.01 }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              )}

              {/* Tab 2: Invoice Details */}
              {activeTab === 2 && (
                <Stack spacing={3}>
                  {/* Dates */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Dates & Terms
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Invoice Date"
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Payment Terms</InputLabel>
                          <Select
                            value={paymentTerms}
                            label="Payment Terms"
                            onChange={(e) => setPaymentTerms(e.target.value)}
                          >
                            <MenuItem value="100%PREPAID">100% Prepaid</MenuItem>
                            <MenuItem value="50%_ADVANCE">50% Advance</MenuItem>
                            <MenuItem value="NET_7">Net 7 Days</MenuItem>
                            <MenuItem value="NET_15">Net 15 Days</MenuItem>
                            <MenuItem value="NET_30">Net 30 Days</MenuItem>
                            <MenuItem value="NET_45">Net 45 Days</MenuItem>
                            <MenuItem value="NET_60">Net 60 Days</MenuItem>
                            <MenuItem value="NET_90">Net 90 Days</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Due Date"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Invoice Status</InputLabel>
                          <Select
                            value={invoiceStatus}
                            label="Invoice Status"
                            onChange={(e) => setInvoiceStatus(e.target.value)}
                          >
                            <MenuItem value="UNPAID">Unpaid</MenuItem>
                            <MenuItem value="PAID">Paid</MenuItem>
                            <MenuItem value="PARTIAL">Partial</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Document References */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Document References
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="PO Number"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          placeholder="Customer PO reference"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Quote Reference"
                          value={quoteReference}
                          onChange={(e) => setQuoteReference(e.target.value)}
                          placeholder="e.g., BYMAIL, QUO-00123"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="PI Number"
                          value={piNumber}
                          onChange={(e) => setPiNumber(e.target.value)}
                          placeholder="e.g., PI-00001"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          freeSolo
                          size="small"
                          options={invoiceTitleOptions}
                          value={invoiceTitle}
                          onChange={(e, newValue) => setInvoiceTitle(newValue || 'TAX INVOICE')}
                          onInputChange={(e, newValue) => setInvoiceTitle(newValue || 'TAX INVOICE')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Invoice Title"
                              placeholder="Title shown on invoice"
                              helperText="e.g., INVOICE, TAX INVOICE, BILL OF SUPPLY"
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="HSN/SAC Code"
                          value={hsnSac}
                          onChange={(e) => setHsnSac(e.target.value)}
                          placeholder="Header level HSN/SAC"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="AWB Number"
                          value={awbNumber}
                          onChange={(e) => setAwbNumber(e.target.value)}
                          placeholder="Air Waybill Number"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Flight fontSize="small" /></InputAdornment>,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Shipping Details */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Shipping Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Shipping Method</InputLabel>
                          <Select
                            value={shippingMethod}
                            label="Shipping Method"
                            onChange={(e) => setShippingMethod(e.target.value)}
                          >
                            <MenuItem value="BYAIR">By Air</MenuItem>
                            <MenuItem value="BY_SEA">By Sea</MenuItem>
                            <MenuItem value="BY_ROAD">By Road</MenuItem>
                            <MenuItem value="BY_RAIL">By Rail</MenuItem>
                            <MenuItem value="COURIER">Courier</MenuItem>
                            <MenuItem value="HAND_DELIVERY">Hand Delivery</MenuItem>
                            <MenuItem value="OTHER">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Shipping Carrier"
                          value={shippingCarrier}
                          onChange={(e) => setShippingCarrier(e.target.value)}
                          placeholder="e.g., FedEx, DHL"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Tracking Number"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Notes */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Notes
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Notes (Visible on Invoice)"
                          multiline
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes that will appear on the invoice"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Internal Notes"
                          multiline
                          rows={3}
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="Internal notes (not visible on invoice)"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              )}

              {/* Tab 3: Payment & Bank */}
              {activeTab === 3 && (
                <Stack spacing={3}>
                  {/* Payment Information */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Payment Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Amount Paid"
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(Number(e.target.value))}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={`≈ ₹${((amountPaid || 0) * effectiveExchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Payment Method</InputLabel>
                          <Select
                            value={paymentMethod}
                            label="Payment Method"
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <MenuItem value="">None</MenuItem>
                            <MenuItem value="Wire Transfer">Wire Transfer</MenuItem>
                            <MenuItem value="Credit Card">Credit Card</MenuItem>
                            <MenuItem value="Check">Check</MenuItem>
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="PayPal">PayPal</MenuItem>
                            <MenuItem value="UPI">UPI</MenuItem>
                            <MenuItem value="NEFT">NEFT</MenuItem>
                            <MenuItem value="RTGS">RTGS</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Payment Date"
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={amountPaid === 0}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Transaction Details */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Transaction Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Transaction Number / Reference ID"
                          placeholder="Enter transaction or reference number"
                          value={transactionNumber}
                          onChange={(e) => setTransactionNumber(e.target.value)}
                          disabled={amountPaid === 0}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Payment Receipt (Optional)
                          </Typography>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            disabled={amountPaid === 0}
                            sx={{ mr: 1 }}
                          >
                            Upload Receipt
                            <input
                              type="file"
                              hidden
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setReceiptFile(file);
                                  if (file.type.startsWith('image/')) {
                                    setReceiptPreview(URL.createObjectURL(file));
                                  } else {
                                    setReceiptPreview(null);
                                  }
                                }
                              }}
                            />
                          </Button>
                          {receiptFile && (
                            <Chip
                              label={receiptFile.name}
                              onDelete={() => {
                                setReceiptFile(null);
                                setReceiptPreview(null);
                              }}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Grid>
                      {receiptPreview && (
                        <Grid size={{ xs: 12 }}>
                          <Paper variant="outlined" sx={{ p: 1, maxWidth: 200 }}>
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'contain' }}
                            />
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Stack>
              )}

              {/* Tab 4: Terms & Conditions */}
              {activeTab === 4 && (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                      Terms & Conditions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Preset</InputLabel>
                          <Select
                            value={termsPreset}
                            label="Preset"
                            onChange={(e) => setTermsPreset(e.target.value)}
                          >
                            <MenuItem value="STANDARD">Standard Terms</MenuItem>
                            <MenuItem value="EXPORT">Export Terms</MenuItem>
                            <MenuItem value="CUSTOM">Custom Terms</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>

                  {termsPreset === "CUSTOM" ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Custom Terms & Conditions"
                      value={customTerms}
                      onChange={(e) => setCustomTerms(e.target.value)}
                      placeholder="Enter each term on a new line..."
                      helperText="Each line will be displayed as a separate term"
                    />
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        {termsPreset === "STANDARD" ? "Standard Terms" : "Export Terms"}
                      </Typography>
                      <Stack spacing={0.5}>
                        {termsAndConditions.map((term, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            {index + 1}. {term}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Product Search Dialog */}
      <Dialog
        open={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Add sx={{ color: "white", fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight="bold">Add Product</Typography>
            </Stack>
            <IconButton onClick={() => setShowProductSearch(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            options={products}
            getOptionLabel={(option) => `${option.product_name} (${option.part_number})`}
            value={searchProduct}
            onChange={(_, newValue) => setSearchProduct(newValue)}
            loading={productsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Product"
                placeholder="Search by name or part number..."
                autoFocus
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option._id || option.product_id}>
                <Box sx={{ width: "100%" }}>
                  <Typography variant="body2" fontWeight="medium">{option.product_name}</Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      {option.part_number} | HSN: {option.hsn_code || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="primary" fontWeight="medium">
                      ${(option.your_price || option.list_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          />

          {searchProduct && (
            <Paper
              variant="outlined"
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1.5,
                bgcolor: "success.50",
                borderColor: "success.main",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">{searchProduct.product_name}</Typography>
                  <Typography variant="body2" color="text.secondary">Part #: {searchProduct.part_number}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    HSN: {searchProduct.hsn_code || "N/A"} | Stock: {searchProduct.total_quantity || 0}
                  </Typography>
                </Box>
                <Chip
                  label={`$${(searchProduct.your_price || searchProduct.list_price || 0).toFixed(2)}`}
                  color="success"
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setShowProductSearch(false)} sx={{ borderRadius: 1.5 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={!searchProduct}
            startIcon={<Add />}
            sx={{ borderRadius: 1.5 }}
          >
            Add to Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Preview Dialog - Professional Print Design */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f5f5f5", py: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6" fontWeight="bold">Invoice Preview</Typography>
              <Chip
                label={invoiceStatus}
                size="small"
                color={invoiceStatus === "PAID" ? "success" : invoiceStatus === "PARTIAL" ? "warning" : "error"}
                sx={{ fontWeight: "bold" }}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<Print />}
                size="small"
                variant="contained"
                onClick={handlePrint}
                sx={{ borderRadius: 1.5 }}
              >
                Print
              </Button>
              <IconButton onClick={() => setShowPreview(false)} size="small">
                <Close />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: "#e8e8e8" }}>
          {/* Professional Print Preview - Inline Styles for Print */}
          <div
            id="invoice-preview-content"
            style={{
              width: "210mm",
              minHeight: "297mm",
              margin: "0 auto",
              padding: "12mm 15mm",
              backgroundColor: "#fff",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              color: "#333",
              boxSizing: "border-box",
              fontSize: "10px",
              lineHeight: 1.4,
            }}
          >
            {/* HEADER */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #1976d2",
              paddingBottom: "12px",
              marginBottom: "15px",
            }}>
              <Logo width={55} height={55} variant="print" />
              <div style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#1976d2",
                letterSpacing: "2px",
                textAlign: "center",
                flex: 1,
              }}>
                KB ENTERPRISES
              </div>
              <div style={{
                backgroundColor: "#1976d2",
                color: "#fff",
                padding: "8px 20px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "4px",
                letterSpacing: "1px",
              }}>
                {invoiceTitle || "TAX INVOICE"}
              </div>
            </div>

            {/* FROM / BILL TO ADDRESSES */}
            <div style={{ marginBottom: "15px" }}>
              <div style={{ display: "flex", gap: "20px" }}>
                {/* FROM */}
                <div style={{
                  flex: 1,
                  padding: "12px 15px",
                  backgroundColor: "#fafafa",
                  borderRadius: "6px",
                  border: "1px solid #e8e8e8",
                }}>
                  <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 600 }}>
                    From
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#333", marginBottom: "4px" }}>
                    {companyDetails.company_name}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>{companyDetails.address_line1}</div>
                  <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>{companyDetails.address_line2}</div>
                  <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5, marginTop: "6px" }}>
                    <span style={{ fontWeight: 600 }}>GSTIN:</span> {companyDetails.gstin}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Attn:</span> {companyDetails.attention}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Contact:</span> {companyDetails.phone}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Email:</span> {companyDetails.email}
                  </div>
                </div>

                {/* BILL TO */}
                <div style={{
                  flex: 1,
                  padding: "12px 15px",
                  backgroundColor: "#fafafa",
                  borderRadius: "6px",
                  border: "1px solid #e8e8e8",
                }}>
                  <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 600 }}>
                    Bill To
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#333", marginBottom: "4px" }}>
                    {billTo.company_name || selectedCustomer?.name || "-"}
                  </div>
                  {billTo.address_line1 && <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>{billTo.address_line1}</div>}
                  {(billTo.city || billTo.state) && (
                    <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                      {billTo.city}{billTo.state && `, ${billTo.state}`} {billTo.zip}
                    </div>
                  )}
                  {billTo.gstin && (
                    <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5, marginTop: "6px" }}>
                      <span style={{ fontWeight: 600 }}>GSTIN:</span> {billTo.gstin}
                    </div>
                  )}
                  {billTo.attention && (
                    <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>Attn:</span> {billTo.attention}
                    </div>
                  )}
                  {billTo.contact && (
                    <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>Contact:</span> {billTo.contact}
                    </div>
                  )}
                  {billTo.email && (
                    <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>Email:</span> {billTo.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* INFO ROW */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
              <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>Invoice No.</div>
                <div style={{ fontSize: "11px", color: "#333", fontWeight: 600 }}>(Auto-Generated)</div>
              </div>
              <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>Invoice Date</div>
                <div style={{ fontSize: "11px", color: "#333", fontWeight: 600 }}>{new Date(invoiceDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-")}</div>
              </div>
              <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>PO Number</div>
                <div style={{ fontSize: "11px", color: "#333", fontWeight: 600 }}>{poNumber || "-"}</div>
              </div>
              {piNumber && (
                <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                  <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>PI Number</div>
                  <div style={{ fontSize: "11px", color: "#333", fontWeight: 600 }}>{piNumber}</div>
                </div>
              )}
              <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>Due Date</div>
                <div style={{ fontSize: "11px", color: "#333", fontWeight: 600 }}>{dueDate ? new Date(dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-") : "-"}</div>
              </div>
              <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>Shipping Method</div>
                <div style={{ fontSize: "11px", color: "#333", fontWeight: 600 }}>{shippingMethod?.replace("_", " ") || "BY AIR"}</div>
              </div>
              <div style={{ flex: "1 1 calc(33.33% - 10px)", minWidth: "150px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: 600 }}>Status</div>
                <div style={{
                  display: "inline-block",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "4px",
                  backgroundColor: invoiceStatus === "PAID" ? "#4caf50" : invoiceStatus === "PARTIAL" ? "#ff9800" : "#f44336",
                  color: "#fff",
                }}>
                  {invoiceStatus}
                </div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            {invoiceItems.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", width: "35px" }}>S/N</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>Item Description</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", width: "100px" }}>Part Number</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", width: "50px" }}>Qty</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", width: "50px" }}>UOM</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", width: "60px" }}>HSN</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right", width: "100px" }}>Unit Price (INR)</th>
                    <th style={{ backgroundColor: "#f5f7fa", border: "1px solid #e0e0e0", padding: "10px 8px", fontSize: "9px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right", width: "110px" }}>Total Price (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => {
                    const unitPriceINR = (item.unit_price || 0) * effectiveExchangeRate;
                    const totalPriceINR = (item.quantity || 0) * unitPriceINR;
                    return (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "center", color: "#444" }}>{index + 1}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "left", color: "#333", fontWeight: 500 }}>{item.product_name}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "center", color: "#444" }}>{item.part_number || "-"}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "center", color: "#444" }}>{item.quantity}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "center", color: "#444" }}>{item.uom || "EA"}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "center", color: "#444" }}>{item.hsn_sac_code || "-"}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "right", color: "#333" }}>{unitPriceINR.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ border: "1px solid #e8e8e8", padding: "10px 8px", fontSize: "10px", textAlign: "right", color: "#333", fontWeight: 600 }}>{totalPriceINR.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* BOTTOM SECTION - Amount in words + Totals */}
            <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
              {/* LEFT - Amount in words */}
              <div style={{ flex: "1.5", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: 600 }}>
                  Amount in Words
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#333", lineHeight: 1.5 }}>
                  INR {numberToWordsINR(calculateTotalINR())}
                </div>
              </div>

              {/* RIGHT - Totals */}
              <div style={{ flex: "1", borderRadius: "6px", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                  <span style={{ color: "#666", fontWeight: 500 }}>Subtotal</span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{(calculateSubtotal() * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {taxType === "PERCENTAGE" && invoiceType === "TAX_INVOICE" && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                    <span style={{ color: "#e65100", fontWeight: 500 }}>Tax @ {taxRate}%</span>
                    <span style={{ color: "#e65100", fontWeight: 600 }}>{(calculateTax() * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {taxType === "IGST" && invoiceType === "TAX_INVOICE" && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                    <span style={{ color: "#e65100", fontWeight: 500 }}>IGST @ {taxRate}%</span>
                    <span style={{ color: "#e65100", fontWeight: 600 }}>{(calculateTax() * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {taxType === "CGST_SGST" && invoiceType === "TAX_INVOICE" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                      <span style={{ color: "#e65100", fontWeight: 500 }}>CGST @ {taxRate/2}%</span>
                      <span style={{ color: "#e65100", fontWeight: 600 }}>{((calculateTax()/2) * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                      <span style={{ color: "#e65100", fontWeight: 500 }}>SGST @ {taxRate/2}%</span>
                      <span style={{ color: "#e65100", fontWeight: 600 }}>{((calculateTax()/2) * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                {taxType === "CUSTOM" && invoiceType === "TAX_INVOICE" && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                    <span style={{ color: "#e65100", fontWeight: 500 }}>{customTaxName || "Custom Tax"} @ {customTaxRate}%</span>
                    <span style={{ color: "#e65100", fontWeight: 600 }}>{(calculateTax() * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {calculateAdditionalCharges() > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e8e8e8", fontSize: "10px" }}>
                    <span style={{ color: "#e65100", fontWeight: 500 }}>Other Charges</span>
                    <span style={{ color: "#e65100", fontWeight: 600 }}>{(calculateAdditionalCharges() * effectiveExchangeRate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#1976d2", color: "#fff", fontSize: "12px", fontWeight: 700 }}>
                  <span>Grand Total (INR)</span>
                  <span>₹{calculateTotalINR().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* BANK DETAILS */}
            {bankDetails.bank_name && (
              <div style={{ marginTop: "15px", padding: "12px 15px", backgroundColor: "#e3f2fd", borderRadius: "6px", border: "1px solid #bbdefb" }}>
                <div style={{ fontSize: "9px", color: "#1976d2", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: 700 }}>
                  Bank Details
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                  <div>
                    <div style={{ fontSize: "8px", color: "#666", textTransform: "uppercase" }}>Bank Name</div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#333" }}>{bankDetails.bank_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "8px", color: "#666", textTransform: "uppercase" }}>Account Number</div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#333" }}>{bankDetails.account_number}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "8px", color: "#666", textTransform: "uppercase" }}>IFSC Code</div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#333" }}>{bankDetails.ifsc_code}</div>
                  </div>
                  {bankDetails.swift_code && (
                    <div>
                      <div style={{ fontSize: "8px", color: "#666", textTransform: "uppercase" }}>SWIFT Code</div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "#333" }}>{bankDetails.swift_code}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TERMS & CONDITIONS */}
            {termsAndConditions.length > 0 && (
              <div style={{ marginTop: "15px", paddingTop: "10px", borderTop: "1px dashed #ccc" }}>
                <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: 600 }}>
                  Terms & Conditions
                </div>
                <div style={{ fontSize: "9px", color: "#666", lineHeight: 1.6 }}>
                  {termsAndConditions.map((term, index) => (
                    <div key={index}>{index + 1}. {term}</div>
                  ))}
                </div>
              </div>
            )}

            {/* SIGNATURE SECTION */}
            <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "center", width: "200px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#333", marginBottom: "50px" }}>
                  For KB ENTERPRISES
                </div>
                <div style={{ borderTop: "1px solid #333", paddingTop: "8px", fontSize: "10px", fontWeight: 600, color: "#555", letterSpacing: "0.5px" }}>
                  AUTHORIZED SIGNATORY
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "#f5f5f5" }}>
          <Button onClick={() => setShowPreview(false)} sx={{ borderRadius: 1.5 }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateInvoice}
            startIcon={createInvoiceMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Save />}
            disabled={createInvoiceMutation.isPending}
            sx={{ borderRadius: 1.5 }}
          >
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManualInvoice;
