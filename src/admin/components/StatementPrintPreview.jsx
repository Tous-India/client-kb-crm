import { forwardRef } from 'react';
import Logo from '../../components/Logo';

/**
 * StatementPrintPreview - Modern, clean, professional A4 account statement
 * Spacious layout for better readability
 */
const StatementPrintPreview = forwardRef(({
  statement,
  transactions,
  globalRate = 83.5,
  title = 'Account Statement',
  buyerName = null,
  periodStart = null,
  periodEnd = null
}, ref) => {

  const exchangeRate = statement?.exchange_rate || globalRate;
  const txnList = statement?.transactions || transactions || [];

  // Calculate totals
  const totalInflow = txnList.reduce((sum, txn) => sum + (txn.payments || 0), 0);
  const totalOutflow = txnList.reduce((sum, txn) => sum + (txn.charges || 0), 0);
  const netBalance = statement?.closing_balance ?? (totalOutflow - totalInflow);
  const openingBalance = statement?.opening_balance || 0;

  const company = {
    name: 'KB ENTERPRISES',
    address1: 'PLOT NO 145 GF',
    address2: 'POCKET 25 SECTOR 24 ROHINI EAST',
    city: 'DELHI 110085',
    gstin: '07CARPR7906M1ZR',
    contact: '9315151910',
    email: 'INFO@KBENTERPRISE.ORG'
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0.00';
    return parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
    return result.trim() + ' ONLY';
  };

  const totalInflowINR = totalInflow * exchangeRate;
  const totalOutflowINR = totalOutflow * exchangeRate;
  const netBalanceINR = netBalance * exchangeRate;

  const styles = {
    container: {
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm 12mm',
      backgroundColor: '#fff',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: '#333',
      boxSizing: 'border-box',
      fontSize: '11px',
      lineHeight: 1.5,
    },
  };

  return (
    <div ref={ref} style={styles.container}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '3px solid #1976d2',
        paddingBottom: '15px',
        marginBottom: '25px',
      }}>
        <Logo width={60} height={60} variant="print" />
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#1976d2',
          letterSpacing: '3px',
          textAlign: 'center',
          flex: 1,
        }}>
          KB ENTERPRISES
        </div>
        <div style={{
          backgroundColor: '#1976d2',
          color: '#fff',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '6px',
          letterSpacing: '1px',
        }}>
          STATEMENT
        </div>
      </div>

      {/* COMPANY & STATEMENT INFO */}
      <div style={{
        display: 'flex',
        gap: '25px',
        marginBottom: '25px',
      }}>
        {/* Company Info */}
        <div style={{
          flex: 1,
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1976d2', marginBottom: '12px' }}>{company.name}</div>
          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.8 }}>
            {company.address1}<br />
            {company.address2}<br />
            {company.city}
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#555', lineHeight: 1.8 }}>
            <div><span style={{ fontWeight: 600, color: '#333' }}>GSTIN:</span> {company.gstin}</div>
            <div><span style={{ fontWeight: 600, color: '#333' }}>Contact:</span> {company.contact}</div>
            <div><span style={{ fontWeight: 600, color: '#333' }}>Email:</span> {company.email}</div>
          </div>
        </div>

        {/* Statement Info */}
        <div style={{
          flex: 1,
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: 600 }}>Statement Date</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>{formatDate(statement?.statement_date || new Date())}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: 600 }}>Account</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: 700 }}>{statement?.customer_id || buyerName || 'Customer'}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: 600 }}>Period From</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>{formatDate(statement?.period_start || periodStart)}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: 600 }}>Period To</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>{formatDate(statement?.period_end || periodEnd)}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: 600 }}>Exchange Rate</div>
              <div style={{ fontSize: '13px', color: '#1976d2', fontWeight: 700 }}>$1 = ₹{exchangeRate.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px',
      }}>
        <div style={{
          flex: 1,
          padding: '18px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Opening Balance</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>${formatCurrency(openingBalance)}</div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>₹{formatCurrency(openingBalance * exchangeRate)}</div>
        </div>
        <div style={{
          flex: 1,
          padding: '18px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: '#e8f5e9',
          border: '1px solid #c8e6c9',
        }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#2e7d32', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Total Received (+)</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#2e7d32' }}>${formatCurrency(totalInflow)}</div>
          <div style={{ fontSize: '10px', color: '#4caf50', marginTop: '4px' }}>₹{formatCurrency(totalInflowINR)}</div>
        </div>
        <div style={{
          flex: 1,
          padding: '18px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
        }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#c62828', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Total Invoiced (-)</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#c62828' }}>${formatCurrency(totalOutflow)}</div>
          <div style={{ fontSize: '10px', color: '#f44336', marginTop: '4px' }}>₹{formatCurrency(totalOutflowINR)}</div>
        </div>
        <div style={{
          flex: 1,
          padding: '18px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: netBalance <= 0 ? '#e3f2fd' : '#fff3e0',
          border: `1px solid ${netBalance <= 0 ? '#bbdefb' : '#ffe0b2'}`,
        }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: netBalance <= 0 ? '#1565c0' : '#e65100', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            {netBalance <= 0 ? 'Credit Balance' : 'Balance Due'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: netBalance <= 0 ? '#1565c0' : '#e65100' }}>
            ${formatCurrency(Math.abs(netBalance))}
          </div>
          <div style={{ fontSize: '10px', color: netBalance <= 0 ? '#1976d2' : '#ff9800', marginTop: '4px' }}>
            ₹{formatCurrency(Math.abs(netBalanceINR))}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '25px',
      }}>
        <thead>
          <tr>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center',
              width: '40px',
            }}>S.No</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center',
              width: '85px',
            }}>Date</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center',
              width: '80px',
            }}>Type</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center',
              width: '100px',
            }}>Reference</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'left',
            }}>Description</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'right',
              width: '100px',
            }}>Debit ($)</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'right',
              width: '100px',
            }}>Credit ($)</th>
            <th style={{
              backgroundColor: '#f5f7fa',
              border: '1px solid #e0e0e0',
              padding: '14px 10px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'right',
              width: '110px',
            }}>Balance ($)</th>
          </tr>
        </thead>
        <tbody>
          {txnList.length === 0 ? (
            <tr>
              <td colSpan="8" style={{
                border: '1px solid #e8e8e8',
                padding: '40px',
                textAlign: 'center',
                color: '#888',
                fontSize: '12px',
              }}>
                No transactions found for this period
              </td>
            </tr>
          ) : (
            txnList.map((txn, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'center',
                  color: '#444',
                }}>{index + 1}</td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'center',
                  color: '#444',
                }}>{formatDate(txn.date)}</td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'center',
                }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '9px',
                    fontWeight: 600,
                    backgroundColor: txn.type === 'PAYMENT' ? '#e8f5e9' : '#e3f2fd',
                    color: txn.type === 'PAYMENT' ? '#2e7d32' : '#1565c0'
                  }}>
                    {txn.type === 'PAYMENT' ? 'PAYMENT' : 'INVOICE'}
                  </span>
                </td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'center',
                  color: '#444',
                }}>{txn.reference}</td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'left',
                  color: '#333',
                }}>{txn.description}</td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'right',
                  color: '#333',
                }}>
                  {txn.charges > 0 ? (
                    <>
                      <div style={{ fontWeight: 600 }}>${formatCurrency(txn.charges)}</div>
                      <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>₹{formatCurrency(txn.charges * exchangeRate)}</div>
                    </>
                  ) : <span style={{ color: '#ccc' }}>-</span>}
                </td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'right',
                  color: '#333',
                }}>
                  {txn.payments > 0 ? (
                    <>
                      <div style={{ fontWeight: 600, color: '#2e7d32' }}>${formatCurrency(txn.payments)}</div>
                      <div style={{ fontSize: '9px', color: '#4caf50', marginTop: '2px' }}>₹{formatCurrency(txn.payments * exchangeRate)}</div>
                    </>
                  ) : <span style={{ color: '#ccc' }}>-</span>}
                </td>
                <td style={{
                  border: '1px solid #e8e8e8',
                  padding: '12px 10px',
                  fontSize: '11px',
                  textAlign: 'right',
                  color: '#333',
                }}>
                  <div style={{ fontWeight: 600, color: txn.balance > 0 ? '#e65100' : '#1565c0' }}>
                    ${formatCurrency(txn.balance)}
                  </div>
                  <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>₹{formatCurrency(txn.balance * exchangeRate)}</div>
                </td>
              </tr>
            ))
          )}
          {/* TOTALS ROW */}
          {txnList.length > 0 && (
            <tr style={{ backgroundColor: '#f5f7fa' }}>
              <td colSpan="5" style={{
                border: '1px solid #e0e0e0',
                padding: '14px 10px',
                fontSize: '11px',
                fontWeight: 700,
                textAlign: 'right',
              }}>TOTALS</td>
              <td style={{
                border: '1px solid #e0e0e0',
                padding: '14px 10px',
                fontSize: '11px',
                textAlign: 'right',
                fontWeight: 700,
              }}>
                <div>${formatCurrency(totalOutflow)}</div>
                <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>₹{formatCurrency(totalOutflowINR)}</div>
              </td>
              <td style={{
                border: '1px solid #e0e0e0',
                padding: '14px 10px',
                fontSize: '11px',
                textAlign: 'right',
                fontWeight: 700,
                color: '#2e7d32',
              }}>
                <div>${formatCurrency(totalInflow)}</div>
                <div style={{ fontSize: '9px', color: '#4caf50', marginTop: '2px' }}>₹{formatCurrency(totalInflowINR)}</div>
              </td>
              <td style={{
                border: '1px solid #e0e0e0',
                padding: '14px 10px',
                fontSize: '11px',
                textAlign: 'right',
                fontWeight: 700,
                color: netBalance > 0 ? '#e65100' : '#1565c0',
              }}>
                <div>${formatCurrency(netBalance)}</div>
                <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>₹{formatCurrency(netBalanceINR)}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* BOTTOM SECTION */}
      <div style={{
        display: 'flex',
        gap: '25px',
        marginTop: '20px',
      }}>
        {/* LEFT - Notes */}
        <div style={{
          flex: 1.5,
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 600 }}>
            Closing Balance in Words
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '20px', lineHeight: 1.5 }}>
            INR {numberToWords(Math.round(Math.abs(netBalanceINR)))}
          </div>
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
            <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.8 }}>
              {netBalance <= 0
                ? '• Credit balance available. Will be adjusted against future invoices.'
                : '• Payment due. Please remit at the earliest convenience.'}
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '8px', lineHeight: 1.6 }}>
              • This is a computer-generated statement and does not require signature.
            </div>
            <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.6 }}>
              • For queries, contact: {company.email}
            </div>
          </div>
        </div>

        {/* RIGHT - Totals Summary */}
        <div style={{
          flex: 1,
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e8e8e8',
            fontSize: '11px',
          }}>
            <span style={{ color: '#666', fontWeight: 500 }}>Total Invoiced</span>
            <span style={{ color: '#c62828', fontWeight: 600 }}>${formatCurrency(totalOutflow)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e8e8e8',
            fontSize: '11px',
          }}>
            <span style={{ color: '#666', fontWeight: 500 }}>Total Received</span>
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>${formatCurrency(totalInflow)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: '#1976d2',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
          }}>
            <span>Closing Balance</span>
            <span>${formatCurrency(netBalance)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#f5f5f5',
            fontSize: '11px',
          }}>
            <span style={{ color: '#666', fontWeight: 500 }}>Balance (INR)</span>
            <span style={{ color: netBalance > 0 ? '#e65100' : '#1565c0', fontWeight: 700, fontSize: '12px' }}>₹{formatCurrency(netBalanceINR)}</span>
          </div>
        </div>
      </div>

      {/* SIGNATURE SECTION */}
      <div style={{
        marginTop: '40px',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <div style={{
          textAlign: 'center',
          width: '220px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '55px' }}>For KB ENTERPRISES</div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '10px', fontSize: '11px', fontWeight: 600, color: '#555', letterSpacing: '0.5px' }}>
            AUTHORIZED SIGNATORY
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '9px',
        color: '#888',
        borderTop: '1px solid #e0e0e0',
        paddingTop: '12px',
      }}>
        Statement generated on {formatDate(new Date())} | Total Transactions: {txnList.length} | Exchange Rate: $1 = ₹{exchangeRate.toFixed(2)}
      </div>
    </div>
  );
});

StatementPrintPreview.displayName = 'StatementPrintPreview';

export default StatementPrintPreview;
