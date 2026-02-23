import { forwardRef } from 'react';
import Logo from '../../components/Logo';

const PerformaInvoicePrintPreview = forwardRef(({ performaInvoice, companyDetails, bankDetails, globalRate = 83.5 }, ref) => {
  const exchangeRate = performaInvoice?.exchange_rate || globalRate;

  const company = companyDetails || {
    name: 'KB ENTERPRISES',
    address1: 'PLOT NO 145 GF',
    address2: 'POCKET 25 SECTOR 24 ROHINI EAST',
    city: 'DELHI 110085',
    gstin: '07CARPR7906M1ZR',
    pan: 'CARPR7906M',
    iec: 'IN-DL42659961966116Y',
    attn: 'MR. NITIN',
    contact: '9315151910',
    email: 'INFO@KBENTERPRISE.ORG'
  };

  const bank = bankDetails || {
    bankName: 'ICICI BANK LTD',
    accountNo: '036705501190',
    ifsc: 'ICIC0000367',
    branch: 'SEC 11 ROHINI DELHI'
  };

  const items = performaInvoice?.items || [];
  const subtotal = performaInvoice?.subtotal || items.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0);
  const tax = performaInvoice?.tax || 0;
  const shipping = performaInvoice?.shipping || 0;
  const grandTotal = performaInvoice?.total_amount || (subtotal + tax + shipping);

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

    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' CRORE ';
    if (lakh) result += convertLessThanThousand(lakh) + ' LAKH ';
    if (thousand) result += convertLessThanThousand(thousand) + ' THOUSAND ';
    if (remainder) result += convertLessThanThousand(remainder);

    return result.trim();
  };

  const totalINR = subtotal * exchangeRate;
  const grandTotalINR = grandTotal * exchangeRate;

  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Inline styles - NO DARK BACKGROUND COLORS for print compatibility
  const styles = {
    container: {
      width: '210mm',
      minHeight: '297mm',
      padding: '6mm 8mm',
      backgroundColor: '#fff',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      boxSizing: 'border-box',
      fontSize: '9px',
      lineHeight: 1.2,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '2px',
      borderBottom: '2px solid #000',
      paddingBottom: '4px',
    },
    logoContainer: {
      width: '45px',
      height: '45px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '15px',
      flexShrink: 0,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: '22px',
      fontWeight: 700,
      color: '#1565c0',
      letterSpacing: '2px',
    },
    mainTable: {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1px solid #000',
    },
    cell: {
      border: '1px solid #000',
      padding: '3px 5px',
      fontSize: '8px',
      verticalAlign: 'top',
    },
    addressCell: {
      border: '1px solid #000',
      padding: '4px 6px',
      fontSize: '8px',
      verticalAlign: 'top',
      lineHeight: 1.4,
    },
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      border: '1px solid #000',
      padding: '4px 3px',
      fontWeight: 700,
      fontSize: '8px',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    td: {
      border: '1px solid #000',
      padding: '4px 3px',
      fontSize: '8px',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    tdLeft: {
      border: '1px solid #000',
      padding: '4px 3px',
      fontSize: '8px',
      textAlign: 'left',
      verticalAlign: 'middle',
    },
    tdRight: {
      border: '1px solid #000',
      padding: '4px 3px',
      fontSize: '8px',
      textAlign: 'right',
      verticalAlign: 'middle',
    },
    bottomTable: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    termItem: {
      fontSize: '7px',
      margin: '1px 0',
      lineHeight: 1.3,
    },
    bankRow: {
      display: 'flex',
      fontSize: '9px',
      marginBottom: '2px',
    },
    bankLabel: {
      width: '50px',
      fontWeight: 700,
    },
    bankValue: {
      fontWeight: 600,
    },
    stamp: {
      width: '110px',
      height: '110px',
      border: '2px solid #1a237e',
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '5px',
    },
    stampInner: {
      width: '100px',
      height: '100px',
      border: '1px solid #1a237e',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    },
    stampText: {
      fontSize: '7px',
      fontWeight: 700,
      textAlign: 'center',
      color: '#1a237e',
      lineHeight: 1.2,
    },
    statusBadge: {
      padding: '2px 8px',
      border: '2px solid #1565c0',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 700,
      color: '#1565c0',
      display: 'inline-block',
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#2e7d32';
      case 'PENDING': return '#ed6c02';
      case 'REJECTED': return '#d32f2f';
      case 'EXPIRED': return '#757575';
      default: return '#1565c0';
    }
  };

  return (
    <div ref={ref} style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo width={45} height={45} variant="print" />
        </div>
        <div style={styles.title}>PROFORMA INVOICE</div>
        <div style={{ ...styles.statusBadge, borderColor: getStatusColor(performaInvoice?.status), color: getStatusColor(performaInvoice?.status) }}>
          {performaInvoice?.status || 'PENDING'}
        </div>
      </div>

      {/* MAIN CONTENT TABLE */}
      <table style={styles.mainTable}>
        <tbody>
          {/* ADDRESS ROW */}
          <tr>
            <td style={{ ...styles.addressCell, width: '33%' }}>
              <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '2px' }}>FROM:-</div>
              <div style={{ fontWeight: 700 }}>{company.name}</div>
              <div>{company.address1}</div>
              <div>{company.address2}</div>
              <div>{company.city}</div>
              <div>GSTIN – {company.gstin}</div>
              <div>ATTN:- {company.attn}, {company.contact}</div>
              <div>EMAIL:- {company.email}</div>
            </td>
            <td style={{ ...styles.addressCell, width: '33%' }}>
              <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '2px' }}>BILL TO:-</div>
              <div style={{ fontWeight: 700 }}>{performaInvoice?.buyer_name || performaInvoice?.customer_name || performaInvoice?.customer_id || 'Customer'}</div>
              {performaInvoice?.billing_address && (
                <>
                  <div>{performaInvoice.billing_address.street}</div>
                  <div>{performaInvoice.billing_address.city}, {performaInvoice.billing_address.state} {performaInvoice.billing_address.zip}</div>
                  <div>{performaInvoice.billing_address.country}</div>
                </>
              )}
              {performaInvoice?.customer_gstin && <div>GSTIN- {performaInvoice.customer_gstin}</div>}
              {performaInvoice?.customer_contact && <div>CONTACT:- {performaInvoice.customer_contact}</div>}
              {(performaInvoice?.buyer_email || performaInvoice?.customer_email) && <div>EMAIL:- {performaInvoice.buyer_email || performaInvoice.customer_email}</div>}
            </td>
            <td style={{ ...styles.addressCell, width: '34%' }}>
              <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '2px' }}>SHIP TO:-</div>
              <div style={{ fontWeight: 700 }}>{performaInvoice?.ship_to_name || performaInvoice?.buyer_name || performaInvoice?.customer_name || 'Customer'}</div>
              {(performaInvoice?.shipping_address || performaInvoice?.billing_address) && (
                <>
                  <div>{(performaInvoice.shipping_address || performaInvoice.billing_address).street}</div>
                  <div>{(performaInvoice.shipping_address || performaInvoice.billing_address).city}, {(performaInvoice.shipping_address || performaInvoice.billing_address).state} {(performaInvoice.shipping_address || performaInvoice.billing_address).zip}</div>
                  <div>{(performaInvoice.shipping_address || performaInvoice.billing_address).country}</div>
                </>
              )}
            </td>
          </tr>

          {/* INFO ROW 1 */}
          <tr>
            <td colSpan="2" style={styles.cell}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 4px', fontWeight: 700, width: '40px' }}>HSS:-</td>
                    <td style={{ padding: '2px 4px' }}>{company.iec}</td>
                    <td style={{ padding: '2px 4px', fontWeight: 700, width: '70px' }}>Quotation:-</td>
                    <td style={{ padding: '2px 4px' }}>{performaInvoice?.quote_number || performaInvoice?.quotation_id || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ ...styles.cell, fontWeight: 700 }}>USD RATE AS PER BOE</td>
          </tr>

          {/* INFO ROW 2 */}
          <tr>
            <td style={styles.cell}>
              <span style={{ fontWeight: 700 }}>PI No.:-</span> <strong>{performaInvoice?.proforma_number || performaInvoice?.performa_invoice_number || '-'}</strong>
            </td>
            <td style={styles.cell}>
              <span style={{ fontWeight: 700 }}>Issue Date:-</span> {formatDate(performaInvoice?.issue_date || performaInvoice?.createdAt)}
            </td>
            <td style={styles.cell}>
              <span style={{ fontWeight: 700 }}>Shipping:-</span> {performaInvoice?.shipping_method || 'BYAIR'}
            </td>
          </tr>

          {/* INFO ROW 3 */}
          <tr>
            <td style={styles.cell}>
              <span style={{ fontWeight: 700 }}>Valid Until:-</span> {formatDate(performaInvoice?.valid_until)}
            </td>
            <td style={styles.cell}>
              <span style={{ fontWeight: 700 }}>Payment Terms:-</span> {performaInvoice?.payment_terms || '100% Advance'}
            </td>
            <td style={styles.cell}>
              <span style={{ fontWeight: 700 }}>Currency:-</span> {performaInvoice?.currency || 'USD'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ITEMS TABLE */}
      <table style={styles.itemsTable}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '25px' }}>S/n.</th>
            <th style={{ ...styles.th, width: '180px' }}>Item Description</th>
            <th style={{ ...styles.th, width: '90px' }}>Part Number</th>
            <th style={{ ...styles.th, width: '50px' }}>Qty</th>
            <th style={{ ...styles.th, width: '35px' }}>UOM</th>
            <th style={{ ...styles.th, width: '80px' }}>UNIT PRICE USD</th>
            <th style={{ ...styles.th, width: '90px' }}>TOTAL USD</th>
            <th style={{ ...styles.th, width: '100px' }}>TOTAL INR</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const unitPrice = item.unit_price || 0;
            const totalUSD = item.total_price || unitPrice * item.quantity;
            const totalItemINR = totalUSD * exchangeRate;
            return (
              <tr key={index}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.tdLeft}>{item.product_name || item.description}</td>
                <td style={styles.td}>{item.part_number}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>{item.uom || 'EA'}</td>
                <td style={styles.tdRight}>${formatCurrency(unitPrice)}</td>
                <td style={styles.tdRight}>${formatCurrency(totalUSD)}</td>
                <td style={styles.tdRight}>₹{formatCurrency(totalItemINR)}</td>
              </tr>
            );
          })}
          {/* TOTAL ROW */}
          <tr>
            <td style={styles.td}></td>
            <td style={styles.tdLeft}></td>
            <td style={{ ...styles.td, fontWeight: 700 }}>TOTAL</td>
            <td style={{ ...styles.td, fontWeight: 700 }}>{totalQty}</td>
            <td style={styles.td}></td>
            <td style={styles.td}></td>
            <td style={{ ...styles.tdRight, fontWeight: 700 }}>${formatCurrency(subtotal)}</td>
            <td style={{ ...styles.tdRight, fontWeight: 700 }}>₹{formatCurrency(totalINR)}</td>
          </tr>
        </tbody>
      </table>

      {/* BOTTOM SECTION */}
      <table style={styles.bottomTable}>
        <tbody>
          <tr>
            {/* LEFT - Amount & Terms & Bank */}
            <td style={{ ...styles.cell, width: '60%', verticalAlign: 'top' }}>
              {/* Amount in words */}
              <div style={{ borderBottom: '1px solid #000', padding: '4px 0', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '9px' }}>Amount (INR):- </span>
                <span style={{ fontWeight: 600, fontSize: '9px' }}>
                  {numberToWords(Math.round(grandTotalINR))} AND {Math.round((grandTotalINR % 1) * 100) || 'Zero'} paisa only
                </span>
              </div>

              {/* Terms */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, textDecoration: 'underline', fontSize: '9px', marginBottom: '4px' }}>Proforma Invoice Terms:-</div>
                <div style={styles.termItem}>1. Proforma is valid for {performaInvoice?.validity_period === '7_DAYS' ? '7 days' : performaInvoice?.validity_period === '15_DAYS' ? '15 days' : '30 days'} only (In terms of price only)</div>
                <div style={styles.termItem}>2. Custom Clearance (CHA) charges extra @actual third party invoices,</div>
                <div style={styles.termItem}>3. Freight charges extra @actual as per freight carrier invoices,</div>
                <div style={styles.termItem}>4. BCD & BOE charges (extra) to be paid by customer directly at the ICE gate or to the CHA</div>
                <div style={styles.termItem}>4. Typo errors are subjected to correction and then considerable,</div>
                <div style={styles.termItem}>5. USD1=INR{Math.round(exchangeRate)}, any difference in USD to INR convertion is subjected to change extra</div>
                <div style={{ ...styles.termItem, marginLeft: '12px' }}>and final calculated at the time of swift payment to USA.</div>
              </div>

              {/* Bank Details - Table Format */}
              <table style={{ borderCollapse: 'collapse', fontSize: '9px', marginTop: '8px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 8px', fontWeight: 700 }}>Bank</td>
                    <td style={{ padding: '3px 8px', fontWeight: 600 }}>{bank.bankName}</td>
                    <td style={{ padding: '3px 8px', fontWeight: 700 }}>Branch</td>
                    <td style={{ padding: '3px 8px', fontWeight: 600 }}>{bank.branch}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px', fontWeight: 700 }}>Acc no</td>
                    <td style={{ padding: '3px 8px', fontWeight: 600 }}>{bank.accountNo}</td>
                    <td style={{ padding: '3px 8px', fontWeight: 700 }}>IFSC</td>
                    <td style={{ padding: '3px 8px', fontWeight: 600 }}>{bank.ifsc}</td>
                  </tr>
                </tbody>
              </table>
            </td>

            {/* RIGHT - Totals & Signature */}
            <td style={{ ...styles.cell, width: '40%', verticalAlign: 'top', padding: 0 }}>
              {/* Totals */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '9px' }}>Total:-</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', width: '100px', fontSize: '9px' }}>{formatCurrency(totalINR)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '9px' }}>IGST@18%:-</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(performaInvoice?.igst_18 || 0)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '9px' }}>IGST@28%:-</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(performaInvoice?.igst_28 || 0)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 600, textAlign: 'right', fontSize: '9px' }}>Bank Charges</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(performaInvoice?.bank_charges || 0)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '9px' }}>Custom Duty:-</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(performaInvoice?.custom_duty || performaInvoice?.duty || 0)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '9px' }}>Logistic/Freight:-</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(performaInvoice?.logistic_charges || performaInvoice?.freight || 0)}</td>
                  </tr>
                  {(performaInvoice?.other_charges > 0) && (
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '9px' }}>Other Charges:-</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(performaInvoice?.other_charges || 0)}</td>
                  </tr>
                  )}
                  <tr>
                    <td style={{ padding: '5px 8px', borderBottom: '2px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '10px' }}>Grand Total:-</td>
                    <td style={{ padding: '5px 8px', borderBottom: '2px solid #000', fontWeight: 700, textAlign: 'right', fontSize: '10px' }}>{formatCurrency(grandTotalINR)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signature */}
              <div style={{ padding: '20px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '40px', color: '#000' }}>For KB ENTERPRISES</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#000', letterSpacing: '0.5px' }}>AUTH. SIGNATORY</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
});

PerformaInvoicePrintPreview.displayName = 'PerformaInvoicePrintPreview';

export default PerformaInvoicePrintPreview;
