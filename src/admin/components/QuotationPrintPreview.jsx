import { forwardRef } from 'react';
import Logo from '../../components/Logo';

const QuotationPrintPreview = forwardRef(({ quotation, companyDetails, bankDetails, globalRate = 83.5 }, ref) => {
  const exchangeRate = quotation?.exchange_rate || globalRate;

  const company = companyDetails || {
    name: 'KB ENTERPRISES',
    address1: 'PLOT NO 145 GF, POCKET 25',
    address2: 'SECTOR 24 ROHINI EAST DELHI 110085',
    gstin: '07CARPR7906M1ZR',
    contact: '+91-9315151910',
    email: 'INFO@KBENTERPRISE.ORG'
  };

  const bank = bankDetails || {
    bankName: 'ICICI BANK LTD',
    accountNo: '036705501190',
    ifsc: 'ICIC0000367',
    branch: 'SEC 11 ROHINI DELHI'
  };

  const terms = quotation?.terms_conditions || [
    'Quotation valid for 30 days, subject to stock availability and prior sale.',
    'Estimated delivery 7-12 days from receipt of Purchase Order.',
    'Prices quoted in USD, Ex-Works (EXW) Manufacturer/Supplier.',
    'USD-INR conversion as per document exchange rate.',
    'Freight, customs, GST and transportation charged extra at actual.'
  ];

  const items = quotation?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0);
  const charges = (quotation?.logistic_charges || 0) + (quotation?.custom_duty || 0) + (quotation?.debet_note || 0) + (quotation?.bank_charges || 0);
  const tax = quotation?.tax || 0;
  const shipping = quotation?.shipping || 0;
  const grandTotal = subtotal + charges + tax + shipping;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (currency === 'INR') {
      return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + amount.toFixed(2);
  };

  const customer = {
    name: quotation?.customer_name || quotation?.customer_id || 'Customer',
    address: quotation?.customer_address || quotation?.customer_address1 || '',
    gstin: quotation?.customer_gstin || '',
    contact: quotation?.customer_contact || '',
    email: quotation?.customer_email || ''
  };

  // Inline styles for print compatibility - NO dark backgrounds
  const styles = {
    container: {
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 15mm',
      backgroundColor: '#fff',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      color: '#2c3e50',
      boxSizing: 'border-box',
      lineHeight: 1.5,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '16px',
      borderBottom: '3px solid #2c3e50',
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    logoContainer: {
      width: '52px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    companyName: {
      fontSize: '22px',
      fontWeight: 700,
      color: '#2c3e50',
      letterSpacing: '0.5px',
      margin: 0,
    },
    companyTagline: {
      fontSize: '9px',
      color: '#7f8c8d',
      letterSpacing: '0.3px',
      margin: 0,
    },
    titleSection: {
      textAlign: 'right',
    },
    title: {
      fontSize: '28px',
      fontWeight: 300,
      color: '#2c3e50',
      letterSpacing: '3px',
      margin: 0,
    },
    quoteNumber: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#27ae60',
      marginTop: '4px',
    },
    infoBar: {
      display: 'flex',
      marginTop: '16px',
      border: '1px solid #ddd',
    },
    infoBox: {
      flex: 1,
      padding: '12px',
      borderRight: '1px solid #ddd',
    },
    infoBoxLast: {
      flex: 1.2,
      padding: '12px',
      border: '2px solid #27ae60',
    },
    infoLabel: {
      fontSize: '8px',
      color: '#95a5a6',
      textTransform: 'uppercase',
      fontWeight: 600,
      margin: 0,
    },
    infoLabelGreen: {
      fontSize: '8px',
      color: '#27ae60',
      textTransform: 'uppercase',
      fontWeight: 600,
      margin: 0,
    },
    infoValue: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#2c3e50',
      margin: 0,
    },
    infoValueRed: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#e74c3c',
      margin: 0,
    },
    infoValueGreen: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#27ae60',
      margin: 0,
    },
    addressSection: {
      display: 'flex',
      gap: '32px',
      marginTop: '24px',
      marginBottom: '24px',
    },
    addressBox: {
      flex: 1,
    },
    addressLabel: {
      fontSize: '9px',
      color: '#95a5a6',
      textTransform: 'uppercase',
      fontWeight: 600,
      marginBottom: '8px',
      letterSpacing: '1px',
    },
    addressName: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#2c3e50',
      margin: 0,
    },
    addressText: {
      fontSize: '10px',
      color: '#7f8c8d',
      margin: '4px 0 0 0',
    },
    table: {
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '24px',
    },
    tableHeader: {
      display: 'flex',
      border: '2px solid #2c3e50',
      padding: '10px 12px',
      fontWeight: 700,
    },
    tableRow: {
      display: 'flex',
      padding: '10px 12px',
      borderBottom: '1px solid #ddd',
      alignItems: 'center',
    },
    tableRowAlt: {
      display: 'flex',
      padding: '10px 12px',
      borderBottom: '1px solid #ddd',
      alignItems: 'center',
      backgroundColor: '#fafafa',
    },
    colNum: { width: '5%', fontSize: '9px', fontWeight: 600 },
    colDesc: { width: '30%', fontSize: '9px', fontWeight: 600 },
    colPart: { width: '15%', fontSize: '9px', fontWeight: 600 },
    colQty: { width: '8%', fontSize: '9px', fontWeight: 600, textAlign: 'center' },
    colRate: { width: '10%', fontSize: '9px', fontWeight: 600, textAlign: 'right' },
    colUSD: { width: '14%', fontSize: '9px', fontWeight: 600, textAlign: 'right' },
    colINR: { width: '18%', fontSize: '9px', fontWeight: 600, textAlign: 'right' },
    totalsSection: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '24px',
      marginBottom: '24px',
    },
    termsInTotals: {
      flex: 1,
      maxWidth: '45%',
    },
    totalsBox: {
      width: '320px',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid #ddd',
    },
    totalLabel: {
      fontSize: '11px',
      color: '#7f8c8d',
    },
    totalValues: {
      display: 'flex',
      gap: '16px',
    },
    totalUSD: {
      fontSize: '11px',
      color: '#2c3e50',
      width: '90px',
      textAlign: 'right',
    },
    totalINR: {
      fontSize: '11px',
      color: '#27ae60',
      width: '100px',
      textAlign: 'right',
    },
    grandTotalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px',
      border: '2px solid #2c3e50',
      marginTop: '8px',
    },
    grandTotalLabel: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#2c3e50',
    },
    grandTotalUSD: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#2c3e50',
      width: '90px',
      textAlign: 'right',
    },
    grandTotalINR: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#27ae60',
      width: '100px',
      textAlign: 'right',
    },
    bottomSection: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #ddd',
    },
    sectionLabel: {
      fontSize: '9px',
      color: '#95a5a6',
      textTransform: 'uppercase',
      fontWeight: 600,
      marginBottom: '8px',
      letterSpacing: '1px',
    },
    termItem: {
      fontSize: '9px',
      color: '#7f8c8d',
      marginBottom: '3px',
      paddingLeft: '12px',
    },
    bankBox: {
      width: '200px',
    },
    bankDetails: {
      border: '1px solid #ddd',
      padding: '12px',
      borderRadius: '4px',
    },
    bankName: {
      fontSize: '10px',
      fontWeight: 600,
      color: '#2c3e50',
      margin: 0,
    },
    bankText: {
      fontSize: '9px',
      color: '#7f8c8d',
      margin: '4px 0 0 0',
    },
    signatureBox: {
      width: '140px',
      textAlign: 'center',
    },
    signatureLogo: {
      width: '110px',
      height: '110px',
      border: '2px solid #1a237e',
      borderRadius: '50%',
      margin: '0 auto 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5px',
    },
    signatureLogoInner: {
      width: '100px',
      height: '100px',
      border: '1px solid #1a237e',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    },
    signatureText: {
      fontSize: '7px',
      fontWeight: 700,
      color: '#1a237e',
      textAlign: 'center',
      lineHeight: 1.2,
    },
    signatureName: {
      fontSize: '9px',
      color: '#7f8c8d',
    },
    footer: {
      marginTop: '24px',
      paddingTop: '12px',
      borderTop: '2px solid #2c3e50',
      textAlign: 'center',
    },
    footerText: {
      fontSize: '9px',
      color: '#7f8c8d',
      margin: 0,
    },
    footerSubtext: {
      fontSize: '8px',
      color: '#bdc3c7',
      marginTop: '4px',
    },
  };

  return (
    <div ref={ref} style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoContainer}>
            <Logo width={52} height={52} variant="print" />
          </div>
          <div>
            <p style={styles.companyName}>KB ENTERPRISES</p>
            <p style={styles.companyTagline}>Aviation & Industrial Parts Supplier</p>
          </div>
        </div>
        <div style={styles.titleSection}>
          <p style={styles.title}>QUOTATION</p>
          <p style={styles.quoteNumber}>{quotation?.quote_number || 'Q-2024-001'}</p>
        </div>
      </div>

      {/* INFO BAR */}
      <div style={styles.infoBar}>
        <div style={styles.infoBox}>
          <p style={styles.infoLabel}>Quote Date</p>
          <p style={styles.infoValue}>{formatDate(quotation?.quote_date)}</p>
        </div>
        <div style={styles.infoBox}>
          <p style={styles.infoLabel}>Valid Until</p>
          <p style={styles.infoValueRed}>{formatDate(quotation?.expiry_date)}</p>
        </div>
        <div style={styles.infoBox}>
          <p style={styles.infoLabel}>Payment Terms</p>
          <p style={styles.infoValue}>{quotation?.payment_terms || '100% Advance'}</p>
        </div>
        <div style={styles.infoBoxLast}>
          <p style={styles.infoLabelGreen}>Exchange Rate</p>
          <p style={styles.infoValueGreen}>$1 = ₹{exchangeRate.toFixed(2)}</p>
        </div>
      </div>

      {/* ADDRESSES */}
      <div style={styles.addressSection}>
        <div style={styles.addressBox}>
          <p style={styles.addressLabel}>From</p>
          <p style={styles.addressName}>{company.name}</p>
          <p style={styles.addressText}>{company.address1}</p>
          <p style={styles.addressText}>{company.address2}</p>
          <p style={styles.addressText}>GSTIN: {company.gstin}</p>
          <p style={styles.addressText}>{company.contact} | {company.email}</p>
        </div>
        <div style={styles.addressBox}>
          <p style={styles.addressLabel}>To</p>
          <p style={styles.addressName}>{customer.name}</p>
          {customer.address && <p style={styles.addressText}>{customer.address}</p>}
          {customer.gstin && <p style={styles.addressText}>GSTIN: {customer.gstin}</p>}
          {customer.contact && <p style={styles.addressText}>{customer.contact}</p>}
          {customer.email && <p style={styles.addressText}>{customer.email}</p>}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={styles.colNum}>#</span>
          <span style={styles.colDesc}>ITEM DESCRIPTION</span>
          <span style={styles.colPart}>PART NUMBER</span>
          <span style={styles.colQty}>QTY</span>
          <span style={styles.colRate}>RATE</span>
          <span style={styles.colUSD}>AMOUNT (USD)</span>
          <span style={styles.colINR}>AMOUNT (INR)</span>
        </div>
        {items.map((item, index) => {
          const total = item.total_price || item.unit_price * item.quantity;
          return (
            <div key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <span style={{ ...styles.colNum, color: '#95a5a6', fontSize: '10px' }}>{index + 1}</span>
              <span style={{ ...styles.colDesc, fontSize: '11px', fontWeight: 500, color: '#2c3e50' }}>{item.product_name || item.description}</span>
              <span style={{ ...styles.colPart, fontSize: '10px', fontFamily: 'monospace', color: '#7f8c8d' }}>{item.part_number}</span>
              <span style={{ ...styles.colQty, fontSize: '11px', fontWeight: 600 }}>{item.quantity}</span>
              <span style={{ ...styles.colRate, fontSize: '10px', color: '#7f8c8d' }}>${item.unit_price?.toFixed(2)}</span>
              <span style={{ ...styles.colUSD, fontSize: '11px', fontWeight: 600, color: '#2c3e50' }}>${total.toFixed(2)}</span>
              <span style={{ ...styles.colINR, fontSize: '11px', fontWeight: 600, color: '#27ae60' }}>{formatCurrency(total * exchangeRate, 'INR')}</span>
            </div>
          );
        })}
        {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
          <div key={`empty-${i}`} style={(items.length + i) % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <span style={{ width: '100%' }}>&nbsp;</span>
          </div>
        ))}
      </div>

      {/* TOTALS WITH T&C */}
      <div style={styles.totalsSection}>
        {/* T&C on Left */}
        <div style={styles.termsInTotals}>
          <p style={styles.sectionLabel}>Terms & Conditions</p>
          {(Array.isArray(terms) ? terms : terms.split('\n')).slice(0, 5).map((term, i) => (
            <p key={i} style={styles.termItem}>• {term.replace(/^\d+\.\s*/, '')}</p>
          ))}
        </div>

        {/* Totals on Right */}
        <div style={styles.totalsBox}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Subtotal</span>
            <div style={styles.totalValues}>
              <span style={styles.totalUSD}>{formatCurrency(subtotal)}</span>
              <span style={styles.totalINR}>{formatCurrency(subtotal * exchangeRate, 'INR')}</span>
            </div>
          </div>
          {charges > 0 && (
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Additional Charges</span>
              <div style={styles.totalValues}>
                <span style={styles.totalUSD}>{formatCurrency(charges)}</span>
                <span style={styles.totalINR}>{formatCurrency(charges * exchangeRate, 'INR')}</span>
              </div>
            </div>
          )}
          {tax > 0 && (
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Tax</span>
              <div style={styles.totalValues}>
                <span style={styles.totalUSD}>{formatCurrency(tax)}</span>
                <span style={styles.totalINR}>{formatCurrency(tax * exchangeRate, 'INR')}</span>
              </div>
            </div>
          )}
          {shipping > 0 && (
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Shipping</span>
              <div style={styles.totalValues}>
                <span style={styles.totalUSD}>{formatCurrency(shipping)}</span>
                <span style={styles.totalINR}>{formatCurrency(shipping * exchangeRate, 'INR')}</span>
              </div>
            </div>
          )}
          <div style={styles.grandTotalRow}>
            <span style={styles.grandTotalLabel}>GRAND TOTAL</span>
            <div style={styles.totalValues}>
              <span style={styles.grandTotalUSD}>{formatCurrency(grandTotal)}</span>
              <span style={styles.grandTotalINR}>{formatCurrency(grandTotal * exchangeRate, 'INR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div style={styles.bottomSection}>
        <div style={styles.bankBox}>
          <p style={styles.sectionLabel}>Bank Details</p>
          <div style={styles.bankDetails}>
            <p style={styles.bankName}>{bank.bankName}</p>
            <p style={styles.bankText}>A/C: {bank.accountNo}</p>
            <p style={styles.bankText}>IFSC: {bank.ifsc}</p>
            <p style={styles.bankText}>Branch: {bank.branch}</p>
          </div>
        </div>
        <div style={styles.signatureBox}>
          <p style={styles.sectionLabel}>Authorized Signatory</p>
          <div style={styles.signatureLogo}>
            <div style={styles.signatureLogoInner}>
              <span style={{ ...styles.signatureText, fontSize: '6px', letterSpacing: '0.5px' }}>KB</span>
              <span style={{ ...styles.signatureText, fontSize: '8px', fontWeight: 800 }}>ENTERPRISES</span>
              <span style={{ ...styles.signatureText, fontSize: '9px', fontWeight: 800, margin: '2px 0' }}>ROHINI</span>
              <span style={{ ...styles.signatureText, fontSize: '7px' }}>DELHI</span>
            </div>
          </div>
          <p style={styles.signatureName}>KB Enterprises</p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>Thank you for your business! | {company.email} | {company.contact}</p>
        <p style={styles.footerSubtext}>This quotation was generated with exchange rate: $1 = ₹{exchangeRate.toFixed(2)}</p>
      </div>
    </div>
  );
});

QuotationPrintPreview.displayName = 'QuotationPrintPreview';

export default QuotationPrintPreview;
