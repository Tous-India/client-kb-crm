import { forwardRef } from 'react';
import Logo from '../../components/Logo';

/**
 * DispatchPrintPreview - Professional A4 dispatch document preview
 * Matches the styling of InvoicePrintPreview for consistent branding
 */
const DispatchPrintPreview = forwardRef(({ dispatch, globalRate = 83.5 }, ref) => {
  if (!dispatch) return null;

  const exchangeRate = dispatch.exchange_rate || globalRate;
  const items = dispatch.items || [];

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0);
  const tax = dispatch.tax || 0;
  const shipping = dispatch.shipping || 0;
  const totalAmount = dispatch.total_amount || subtotal + tax + shipping;

  // Bank details
  const bank = dispatch.bank_details || {
    bank_name: 'HDFC Bank',
    account_number: '50100123456789',
    ifsc_code: 'HDFC0001234',
    branch: 'Mumbai Main Branch'
  };

  // Format currency
  const formatCurrency = (amount, showSymbol = true) => {
    const formatted = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return showSymbol ? formatted : formatted;
  };

  // Company info
  const company = {
    name: 'KB ENTERPRISES',
    address: 'B-123, Sector 5, Rohini',
    city: 'Delhi - 110085, India',
    phone: '+91 11 2345 6789',
    email: 'sales@kbenterprises.com',
    gstin: '07AABCK1234L1ZD'
  };

  // Buyer info
  const buyer = {
    name: dispatch.customer_name || dispatch.customer_id || 'Customer',
    address: dispatch.shipping_address || {},
  };

  const styles = {
    container: {
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '10mm',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: '11px',
      lineHeight: 1.4,
      color: '#000',
      backgroundColor: '#fff',
      boxSizing: 'border-box',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: '2px solid #e0e0e0',
      paddingBottom: '10px',
      marginBottom: '15px',
    },
    logoContainer: {
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    companyInfo: {
      flex: 1,
      marginLeft: '15px',
    },
    companyName: {
      fontSize: '20px',
      fontWeight: 800,
      color: '#333',
      margin: 0,
    },
    companyDetails: {
      fontSize: '10px',
      color: '#666',
      margin: '2px 0',
    },
    documentTitle: {
      textAlign: 'right',
    },
    title: {
      fontSize: '24px',
      fontWeight: 800,
      color: '#333',
      margin: 0,
      letterSpacing: '1px',
    },
    docNumber: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#333',
      marginTop: '5px',
    },
    infoTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '15px',
    },
    infoCell: {
      padding: '8px',
      verticalAlign: 'top',
      border: '1px solid #e0e0e0',
    },
    label: {
      fontSize: '9px',
      color: '#666',
      fontWeight: 600,
      textTransform: 'uppercase',
      marginBottom: '3px',
    },
    value: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#000',
    },
    trackingBox: {
      backgroundColor: '#fafafa',
      border: '2px solid #999',
      borderRadius: '4px',
      padding: '12px',
      marginBottom: '15px',
      textAlign: 'center',
    },
    trackingLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: '#666',
      marginBottom: '5px',
    },
    trackingNumber: {
      fontSize: '18px',
      fontWeight: 800,
      color: '#000',
      letterSpacing: '2px',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: '#f5f5f5',
      color: '#333',
      border: '1px solid #999',
    },
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '15px',
    },
    th: {
      backgroundColor: '#f5f5f5',
      color: '#000',
      padding: '8px 6px',
      fontSize: '10px',
      fontWeight: 700,
      textAlign: 'center',
      border: '1px solid #e0e0e0',
    },
    td: {
      padding: '6px',
      fontSize: '10px',
      textAlign: 'center',
      borderBottom: '1px solid #e0e0e0',
      borderLeft: '1px solid #e0e0e0',
      borderRight: '1px solid #e0e0e0',
    },
    tdLeft: {
      padding: '6px',
      fontSize: '10px',
      textAlign: 'left',
      borderBottom: '1px solid #e0e0e0',
      borderLeft: '1px solid #e0e0e0',
      borderRight: '1px solid #e0e0e0',
    },
    tdRight: {
      padding: '6px',
      fontSize: '10px',
      textAlign: 'right',
      borderBottom: '1px solid #e0e0e0',
      borderLeft: '1px solid #e0e0e0',
      borderRight: '1px solid #e0e0e0',
    },
    bottomTable: {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1px solid #000',
    },
    cell: {
      padding: '8px',
      verticalAlign: 'top',
      borderRight: '1px solid #000',
    },
    bankRow: {
      display: 'flex',
      fontSize: '10px',
      marginBottom: '3px',
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
      border: '2px solid #333',
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
      border: '1px solid #333',
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
      color: '#333',
      lineHeight: 1.2,
    },
    footer: {
      marginTop: '10px',
      padding: '8px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      textAlign: 'center',
      backgroundColor: '#fafafa',
    },
    footerText: {
      fontSize: '9px',
      color: '#666',
      margin: 0,
    },
  };

  return (
    <div ref={ref} style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo width={60} height={60} variant="print" />
        </div>
        <div style={styles.companyInfo}>
          <h1 style={styles.companyName}>{company.name}</h1>
          <p style={styles.companyDetails}>{company.address}</p>
          <p style={styles.companyDetails}>{company.city}</p>
          <p style={styles.companyDetails}>Tel: {company.phone} | Email: {company.email}</p>
          <p style={styles.companyDetails}>GSTIN: {company.gstin}</p>
        </div>
        <div style={styles.documentTitle}>
          <h2 style={styles.title}>DISPATCH NOTE</h2>
          <p style={styles.docNumber}>{dispatch.order_id || dispatch.invoice_number || 'DN-001'}</p>
          <div style={{ marginTop: '8px' }}>
            <span style={styles.statusBadge}>DISPATCHED</span>
          </div>
        </div>
      </div>

      {/* INFO TABLE */}
      <table style={styles.infoTable}>
        <tbody>
          <tr>
            <td style={{ ...styles.infoCell, width: '50%' }}>
              <div style={styles.label}>Ship To</div>
              <div style={styles.value}>{buyer.name}</div>
              {buyer.address.street && <div style={{ fontSize: '10px' }}>{buyer.address.street}</div>}
              {buyer.address.city && (
                <div style={{ fontSize: '10px' }}>
                  {buyer.address.city}, {buyer.address.state} {buyer.address.zip}
                </div>
              )}
              {buyer.address.country && <div style={{ fontSize: '10px' }}>{buyer.address.country}</div>}
            </td>
            <td style={{ ...styles.infoCell, width: '25%' }}>
              <div style={styles.label}>Dispatch Date</div>
              <div style={styles.value}>
                {new Date(dispatch.dispatch_info?.dispatch_date || dispatch.order_date || new Date()).toLocaleDateString('en-GB')}
              </div>
              <div style={{ ...styles.label, marginTop: '10px' }}>Est. Delivery</div>
              <div style={styles.value}>
                {dispatch.estimated_delivery ? new Date(dispatch.estimated_delivery).toLocaleDateString('en-GB') : '-'}
              </div>
            </td>
            <td style={{ ...styles.infoCell, width: '25%' }}>
              <div style={styles.label}>Courier Service</div>
              <div style={styles.value}>{dispatch.dispatch_info?.courier_service || dispatch.courier_service || '-'}</div>
              <div style={{ ...styles.label, marginTop: '10px' }}>Payment Status</div>
              <div style={{
                ...styles.value,
                color: dispatch.payment_status === 'PAID' ? '#000' : '#666'
              }}>
                {dispatch.payment_status || 'PENDING'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* TRACKING NUMBER */}
      {(dispatch.tracking_number || dispatch.dispatch_info?.tracking_number) && (
        <div style={styles.trackingBox}>
          <div style={styles.trackingLabel}>TRACKING NUMBER</div>
          <div style={styles.trackingNumber}>
            {dispatch.tracking_number || dispatch.dispatch_info?.tracking_number}
          </div>
        </div>
      )}

      {/* ITEMS TABLE */}
      <table style={styles.itemsTable}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '25px' }}>S/n.</th>
            <th style={{ ...styles.th, width: '140px' }}>Item Description</th>
            <th style={{ ...styles.th, width: '70px' }}>Part Number</th>
            <th style={{ ...styles.th, width: '40px' }}>Qty</th>
            <th style={{ ...styles.th, width: '30px' }}>UOM</th>
            <th style={{ ...styles.th, width: '60px' }}>Unit ($)</th>
            <th style={{ ...styles.th, width: '70px' }}>Total ($)</th>
            <th style={{ ...styles.th, width: '70px' }}>Unit (₹)</th>
            <th style={{ ...styles.th, width: '80px' }}>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const unitPrice = item.unit_price || 0;
            const qty = item.quantity || 0;
            const totalPrice = item.total_price || unitPrice * qty;
            return (
              <tr key={index}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.tdLeft}>{item.product_name || item.description}</td>
                <td style={styles.td}>{item.part_number}</td>
                <td style={styles.td}>{qty}</td>
                <td style={styles.td}>{item.uom || 'EA'}</td>
                <td style={styles.tdRight}>${formatCurrency(unitPrice, false)}</td>
                <td style={styles.tdRight}>${formatCurrency(totalPrice, false)}</td>
                <td style={styles.tdRight}>₹{formatCurrency(unitPrice * exchangeRate, false)}</td>
                <td style={styles.tdRight}>₹{formatCurrency(totalPrice * exchangeRate, false)}</td>
              </tr>
            );
          })}
          {/* TOTAL ROW */}
          <tr>
            <td colSpan="3" style={{ ...styles.td, fontWeight: 700, textAlign: 'right' }}>TOTAL</td>
            <td style={{ ...styles.td, fontWeight: 700 }}>
              {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </td>
            <td style={styles.td}></td>
            <td style={styles.td}></td>
            <td style={{ ...styles.tdRight, fontWeight: 700 }}>${formatCurrency(subtotal, false)}</td>
            <td style={styles.td}></td>
            <td style={{ ...styles.tdRight, fontWeight: 700 }}>₹{formatCurrency(subtotal * exchangeRate, false)}</td>
          </tr>
        </tbody>
      </table>

      {/* BOTTOM SECTION */}
      <table style={styles.bottomTable}>
        <tbody>
          <tr>
            {/* LEFT - Notes */}
            <td style={{ ...styles.cell, width: '60%' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '8px', color: '#000' }}>
                DISPATCH NOTES
              </div>
              <div style={{ fontSize: '10px', lineHeight: 1.5 }}>
                {dispatch.dispatch_info?.dispatch_notes || dispatch.notes || 'No special instructions'}
              </div>
              <div style={{ marginTop: '15px', fontSize: '10px', fontWeight: 700, color: '#000' }}>
                SHIPPING ADDRESS
              </div>
              <div style={{ fontSize: '10px', lineHeight: 1.5 }}>
                {buyer.address.street && <div>{buyer.address.street}</div>}
                {buyer.address.city && <div>{buyer.address.city}, {buyer.address.state} {buyer.address.zip}</div>}
                {buyer.address.country && <div>{buyer.address.country}</div>}
              </div>
            </td>

            {/* RIGHT - Totals & Signature */}
            <td style={{ ...styles.cell, width: '40%', padding: 0, borderRight: 'none' }}>
              {/* Totals */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>Subtotal:</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', width: '80px' }}>${formatCurrency(subtotal, false)}</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', width: '90px' }}>₹{formatCurrency(subtotal * exchangeRate, false)}</td>
                  </tr>
                  {tax > 0 && (
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>Tax:</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>${formatCurrency(tax, false)}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>₹{formatCurrency(tax * exchangeRate, false)}</td>
                    </tr>
                  )}
                  {shipping > 0 && (
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>Shipping:</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>${formatCurrency(shipping, false)}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right' }}>₹{formatCurrency(shipping * exchangeRate, false)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', color: '#000', fontWeight: 600 }}>Rate (₹/$):</td>
                    <td colSpan="2" style={{ padding: '4px 8px', borderBottom: '1px solid #000', textAlign: 'right', color: '#000', fontWeight: 600 }}>₹{exchangeRate.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', borderBottom: '2px solid #000', fontWeight: 700, textAlign: 'right' }}>Grand Total:</td>
                    <td style={{ padding: '6px 8px', borderBottom: '2px solid #000', fontWeight: 700, textAlign: 'right' }}>${formatCurrency(totalAmount, false)}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '2px solid #000', fontWeight: 700, textAlign: 'right', color: '#000' }}>₹{formatCurrency(totalAmount * exchangeRate, false)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Bank Details */}
              <div style={{ padding: '8px', borderBottom: '1px solid #000' }}>
                <div style={styles.bankRow}>
                  <span style={styles.bankLabel}>Bank</span>
                  <span style={styles.bankValue}>{bank.bank_name}</span>
                </div>
                <div style={styles.bankRow}>
                  <span style={styles.bankLabel}>A/C</span>
                  <span style={styles.bankValue}>{bank.account_number}</span>
                </div>
                <div style={styles.bankRow}>
                  <span style={styles.bankLabel}>IFSC</span>
                  <span style={styles.bankValue}>{bank.ifsc_code}</span>
                </div>
                <div style={styles.bankRow}>
                  <span style={styles.bankLabel}>Branch</span>
                  <span style={styles.bankValue}>{bank.branch}</span>
                </div>
              </div>

              {/* Signature */}
              <div style={{ padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '8px', color: '#000' }}>For KB ENTERPRISES</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <div style={styles.stamp}>
                    <div style={styles.stampInner}>
                      <span style={{ ...styles.stampText, fontSize: '6px', letterSpacing: '0.5px' }}>KB</span>
                      <span style={{ ...styles.stampText, fontSize: '8px', fontWeight: 800 }}>ENTERPRISES</span>
                      <span style={{ ...styles.stampText, fontSize: '9px', fontWeight: 800, margin: '2px 0' }}>ROHINI</span>
                      <span style={{ ...styles.stampText, fontSize: '7px' }}>DELHI</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#000', letterSpacing: '0.5px' }}>AUTH. SIGNATORY</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Thank you for your business! For any queries, please contact us at {company.email}
        </p>
        <p style={{ ...styles.footerText, marginTop: '4px', fontSize: '8px' }}>
          Exchange Rate: $1 = ₹{exchangeRate.toFixed(2)} | Generated on: {new Date().toLocaleDateString('en-GB')}
        </p>
      </div>
    </div>
  );
});

DispatchPrintPreview.displayName = 'DispatchPrintPreview';

export default DispatchPrintPreview;
