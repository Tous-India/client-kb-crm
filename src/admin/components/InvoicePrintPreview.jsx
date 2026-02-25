import { forwardRef } from 'react';
import Logo from '../../components/Logo';

const InvoicePrintPreview = forwardRef(({ invoice, companyDetails, bankDetails, globalRate = 83.5 }, ref) => {
  const exchangeRate = invoice?.exchange_rate || globalRate;

  const company = companyDetails || {
    name: 'KB ENTERPRISES',
    address1: 'PLOT NO 145 GF',
    address2: 'POCKET 25 SECTOR 24 ROHINI EAST DELHI 110085',
    gstin: '07CARPR7906M1ZR',
    attn: 'MR. NITIN',
    contact: '+91-9315151910',
    email: 'INFO@KBENTERPRISE.ORG'
  };

  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal || items.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0);

  // All amounts in INR
  const totalINR = subtotal * exchangeRate;
  const igst5 = invoice?.igst_5 || 0;
  const duty = invoice?.duty || 0;
  const freight = invoice?.freight || 0;
  const grandTotalINR = invoice?.grand_total_inr || (totalINR + igst5 + duty + freight);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0.00';
    return parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const numberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    if (num === 0) return 'ZERO';

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = Math.floor(num % 1000);
    const paise = Math.round((num % 1) * 100);

    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' CRORE ';
    if (lakh) result += convertLessThanThousand(lakh) + ' LAKH ';
    if (thousand) result += convertLessThanThousand(thousand) + ' THOUSAND ';
    if (remainder) result += convertLessThanThousand(remainder);

    result = result.trim();
    if (paise > 0) {
      result += ' AND ' + convertLessThanThousand(paise) + ' PAISA';
    }

    return result + ' ONLY';
  };

  const styles = {
    container: {
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 15mm',
      backgroundColor: '#fff',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: '#333',
      boxSizing: 'border-box',
      fontSize: '10px',
      lineHeight: 1.4,
    },
    // Header styles
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '2px solid #1976d2',
      paddingBottom: '12px',
      marginBottom: '15px',
    },
    companyName: {
      fontSize: '26px',
      fontWeight: 700,
      color: '#1976d2',
      letterSpacing: '2px',
      textAlign: 'center',
      flex: 1,
    },
    invoiceTag: {
      backgroundColor: '#1976d2',
      color: '#fff',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: '4px',
      letterSpacing: '1px',
    },
    // Section styles
    section: {
      marginBottom: '15px',
    },
    addressGrid: {
      display: 'flex',
      gap: '20px',
    },
    addressBox: {
      flex: 1,
      padding: '12px 15px',
      backgroundColor: '#fafafa',
      borderRadius: '6px',
      border: '1px solid #e8e8e8',
    },
    addressLabel: {
      fontSize: '9px',
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '6px',
      fontWeight: 600,
    },
    addressName: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#333',
      marginBottom: '4px',
    },
    addressLine: {
      fontSize: '10px',
      color: '#555',
      lineHeight: 1.5,
    },
    // Info row styles
    infoGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '15px',
    },
    infoItem: {
      flex: '1 1 calc(33.33% - 10px)',
      minWidth: '150px',
      padding: '10px 12px',
      backgroundColor: '#fff',
      borderRadius: '4px',
      border: '1px solid #e0e0e0',
    },
    infoLabel: {
      fontSize: '8px',
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px',
      fontWeight: 600,
    },
    infoValue: {
      fontSize: '11px',
      color: '#333',
      fontWeight: 600,
    },
    // Table styles
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '15px',
    },
    th: {
      backgroundColor: '#f5f7fa',
      border: '1px solid #e0e0e0',
      padding: '10px 8px',
      fontSize: '9px',
      fontWeight: 700,
      color: '#555',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      textAlign: 'center',
    },
    td: {
      border: '1px solid #e8e8e8',
      padding: '10px 8px',
      fontSize: '10px',
      textAlign: 'center',
      verticalAlign: 'middle',
      color: '#444',
    },
    tdLeft: {
      border: '1px solid #e8e8e8',
      padding: '10px 8px',
      fontSize: '10px',
      textAlign: 'left',
      verticalAlign: 'middle',
      color: '#333',
      fontWeight: 500,
    },
    tdRight: {
      border: '1px solid #e8e8e8',
      padding: '10px 8px',
      fontSize: '10px',
      textAlign: 'right',
      verticalAlign: 'middle',
      color: '#333',
    },
    // Bottom section
    bottomGrid: {
      display: 'flex',
      gap: '20px',
      marginTop: '15px',
    },
    amountWords: {
      flex: '1.5',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
    },
    totalsBox: {
      flex: '1',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '10px',
    },
    totalLabel: {
      color: '#666',
      fontWeight: 500,
    },
    totalValue: {
      color: '#333',
      fontWeight: 600,
    },
    grandTotalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px',
      backgroundColor: '#1976d2',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 700,
    },
    // Signature section
    signatureSection: {
      marginTop: '30px',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    signatureBox: {
      textAlign: 'center',
      width: '200px',
    },
    signatureLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#333',
      marginBottom: '50px',
    },
    signatureLine: {
      borderTop: '1px solid #333',
      paddingTop: '8px',
      fontSize: '10px',
      fontWeight: 600,
      color: '#555',
      letterSpacing: '0.5px',
    },
  };

  return (
    <div ref={ref} style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <Logo width={55} height={55} variant="print" />
        <div style={styles.companyName}>KB ENTERPRISES</div>
        <div style={styles.invoiceTag}>{invoice?.invoice_title || 'INVOICE'}</div>
      </div>

      {/* FROM / TO ADDRESSES */}
      <div style={styles.section}>
        <div style={styles.addressGrid}>
          {/* FROM */}
          <div style={styles.addressBox}>
            <div style={styles.addressLabel}>From</div>
            <div style={styles.addressName}>{company.name}</div>
            <div style={styles.addressLine}>{company.address1}</div>
            <div style={styles.addressLine}>{company.address2}</div>
            <div style={{ ...styles.addressLine, marginTop: '6px' }}>
              <span style={{ fontWeight: 600 }}>GSTIN:</span> {company.gstin}
            </div>
            <div style={styles.addressLine}>
              <span style={{ fontWeight: 600 }}>Attn:</span> {company.attn}
            </div>
            <div style={styles.addressLine}>
              <span style={{ fontWeight: 600 }}>Contact:</span> {company.contact}
            </div>
            <div style={styles.addressLine}>
              <span style={{ fontWeight: 600 }}>Email:</span> {company.email}
            </div>
          </div>

          {/* TO */}
          <div style={styles.addressBox}>
            <div style={styles.addressLabel}>Bill To</div>
            <div style={styles.addressName}>{invoice?.customer_name || invoice?.customer_id || 'Customer'}</div>
            {invoice?.billing_address && (
              <>
                <div style={styles.addressLine}>{invoice.billing_address.street}</div>
                <div style={styles.addressLine}>{invoice.billing_address.city}, {invoice.billing_address.state} {invoice.billing_address.zip}</div>
              </>
            )}
            {invoice?.customer_gstin && (
              <div style={{ ...styles.addressLine, marginTop: '6px' }}>
                <span style={{ fontWeight: 600 }}>GSTIN:</span> {invoice.customer_gstin}
              </div>
            )}
            {invoice?.customer_attn && (
              <div style={styles.addressLine}>
                <span style={{ fontWeight: 600 }}>Attn:</span> {invoice.customer_attn}
              </div>
            )}
            {invoice?.customer_contact && (
              <div style={styles.addressLine}>
                <span style={{ fontWeight: 600 }}>Contact:</span> {invoice.customer_contact}
              </div>
            )}
            {invoice?.customer_email && (
              <div style={styles.addressLine}>
                <span style={{ fontWeight: 600 }}>Email:</span> {invoice.customer_email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INFO ROW */}
      <div style={styles.infoGrid}>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Invoice No.</div>
          <div style={styles.infoValue}>{invoice?.invoice_number || invoice?.invoice_id || '-'}</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Invoice Date</div>
          <div style={styles.infoValue}>{formatDate(invoice?.invoice_date)}</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Order Ref.</div>
          <div style={styles.infoValue}>{invoice?.order_ref || 'BY MAIL'}</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Order Date</div>
          <div style={styles.infoValue}>{formatDate(invoice?.order_date)}</div>
        </div>
        {(invoice?.proforma_invoice_number || invoice?.pi_number) && (
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>PI Number</div>
            <div style={styles.infoValue}>{invoice?.proforma_invoice_number || invoice?.pi_number}</div>
          </div>
        )}
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Shipping Method</div>
          <div style={styles.infoValue}>{invoice?.shipping_method || 'BY AIR'}</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Payment Terms</div>
          <div style={styles.infoValue}>{invoice?.payment_terms || 'Per email dtd.'} {formatDate(invoice?.payment_date)}</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>HSS NO.</div>
          <div style={styles.infoValue}>{invoice?.hsn_sac || invoice?.shipping_info?.hsn_code || '-'}</div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '35px' }}>S/N</th>
            <th style={{ ...styles.th, textAlign: 'left' }}>Item Description</th>
            <th style={{ ...styles.th, width: '100px' }}>Part Number</th>
            <th style={{ ...styles.th, width: '50px' }}>Qty</th>
            <th style={{ ...styles.th, width: '50px' }}>UOM</th>
            <th style={{ ...styles.th, width: '100px' }}>Unit Price (INR)</th>
            <th style={{ ...styles.th, width: '110px' }}>Total Price (INR)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const unitPriceINR = (item.unit_price || 0) * exchangeRate;
            const totalPriceINR = (item.total_price || item.unit_price * item.quantity) * exchangeRate;
            return (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.tdLeft}>{item.product_name || item.description}</td>
                <td style={styles.td}>{item.part_number}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>{item.uom || 'EA'}</td>
                <td style={styles.tdRight}>{formatCurrency(unitPriceINR)}</td>
                <td style={{ ...styles.tdRight, fontWeight: 600 }}>{formatCurrency(totalPriceINR)}</td>
              </tr>
            );
          })}
          {/* Minimum rows for visual consistency */}
          {items.length < 3 && Array(3 - items.length).fill(0).map((_, i) => (
            <tr key={`empty-${i}`} style={{ backgroundColor: (items.length + i) % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={styles.td}>&nbsp;</td>
              <td style={styles.tdLeft}>&nbsp;</td>
              <td style={styles.td}>&nbsp;</td>
              <td style={styles.td}>&nbsp;</td>
              <td style={styles.td}>&nbsp;</td>
              <td style={styles.tdRight}>&nbsp;</td>
              <td style={styles.tdRight}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* BOTTOM SECTION - Amount in words + Totals */}
      <div style={styles.bottomGrid}>
        {/* LEFT - Amount in words */}
        <div style={styles.amountWords}>
          <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>
            Amount in Words
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', lineHeight: 1.5 }}>
            INR {numberToWords(grandTotalINR)}
          </div>
        </div>

        {/* RIGHT - Totals */}
        <div style={styles.totalsBox}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Subtotal</span>
            <span style={styles.totalValue}>{formatCurrency(totalINR)}</span>
          </div>
          <div style={styles.totalRow}>
            <span style={{ ...styles.totalLabel, color: '#e65100' }}>IGST @ 5%</span>
            <span style={{ ...styles.totalValue, color: '#e65100' }}>{formatCurrency(igst5)}</span>
          </div>
          <div style={styles.totalRow}>
            <span style={{ ...styles.totalLabel, color: '#e65100' }}>Duty</span>
            <span style={{ ...styles.totalValue, color: '#e65100' }}>{formatCurrency(duty)}</span>
          </div>
          <div style={styles.totalRow}>
            <span style={{ ...styles.totalLabel, color: '#e65100' }}>Freight</span>
            <span style={{ ...styles.totalValue, color: '#e65100' }}>{formatCurrency(freight)}</span>
          </div>
          <div style={styles.grandTotalRow}>
            <span>Grand Total</span>
            <span>{formatCurrency(grandTotalINR)}</span>
          </div>
        </div>
      </div>

      {/* SIGNATURE SECTION */}
      <div style={styles.signatureSection}>
        <div style={styles.signatureBox}>
          <div style={styles.signatureLabel}>For KB ENTERPRISES</div>
          <div style={styles.signatureLine}>AUTHORIZED SIGNATORY</div>
        </div>
      </div>
    </div>
  );
});

InvoicePrintPreview.displayName = 'InvoicePrintPreview';

export default InvoicePrintPreview;
