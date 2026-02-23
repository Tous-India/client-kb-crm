import React from "react";
import "./PdfModal.css";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import html2pdf from "html2pdf.js";

function PdfModal({ isOpen, onClose, orderData, type = "po" }) {
  const { user } = useAuth();
  const { usdToInr } = useCurrency();

  if (!isOpen) return null;

  const handlePrint = () => {
    const element = document.querySelector(".invoice-container");
    if (!element) {
      alert("Unable to print. Please try again.");
      return;
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Please allow pop-ups to print the document.");
      return;
    }

    // Get print-friendly styles
    const printStyles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          padding: 20px;
        }
        .invoice-container {
          background: white;
          max-width: 850px;
          margin: 0 auto;
          padding: 22px;
        }
        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #334155;
        }
        .doc-header-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .company-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .company-logo-img {
          width: 56px;
          height: 56px;
          object-fit: contain;
        }
        .company-info-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .company-tagline {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .company-contact p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }
        .doc-header-right {
          text-align: right;
        }
        .doc-title {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .doc-number {
          font-size: 16px;
          font-weight: 600;
          color: #3b82f6;
          margin-top: 8px;
        }
        .doc-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 14px;
        }
        .details-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .info-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .info-value {
          font-size: 13px;
          color: #0f172a;
          font-weight: 600;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .card-header {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 1px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .customer-name {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .customer-id {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .customer-address {
          font-size: 12px;
          color: #64748b;
        }
        .items-section {
          margin-bottom: 20px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          text-transform: uppercase;
        }
        .item-count {
          font-size: 13px;
          color: #64748b;
          background: #f1f5f9;
          padding: 6px 14px;
          font-weight: 500;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
        }
        .items-table th {
          background: #f1f5f9;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          border-bottom: 2px solid #cbd5e1;
        }
        .items-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        .items-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .col-num { text-align: center; width: 6%; }
        .col-qty { text-align: center; width: 11%; font-weight: 600; }
        .col-part { width: 15%; }
        .col-desc { width: auto; }
        .col-price { text-align: right; font-family: monospace; width: 13%; }
        .col-total { text-align: right; font-family: monospace; width: 14%; font-weight: 600; }
        .delivered { color: #059669; }
        .remaining { color: #d97706; }
        .part-number {
          font-family: monospace;
          font-size: 13px;
          color: #1e40af;
          background: #dbeafe;
          padding: 6px 12px;
          display: inline-block;
        }
        .summary-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 2px solid #e2e8f0;
          page-break-inside: avoid;
        }
        .summary-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .delivery-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px;
        }
        .delivery-summary h4 {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }
        .delivery-stats {
          display: flex;
          gap: 8px;
        }
        .stat {
          flex: 1;
          text-align: center;
          padding: 8px;
          background: white;
          border: 1px solid #e2e8f0;
        }
        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        .stat-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }
        .stat.delivered .stat-value { color: #059669; }
        .stat.remaining .stat-value { color: #d97706; }
        .notes-box {
          background: #fefce8;
          border: 1px solid #fde047;
          padding: 10px 12px;
        }
        .notes-box h4 {
          font-size: 11px;
          font-weight: 700;
          color: #854d0e;
          text-transform: uppercase;
          margin: 0 0 6px 0;
        }
        .notes-box p {
          font-size: 12px;
          color: #713f12;
          margin: 0 0 2px 0;
        }
        .notes-box .contact-note {
          margin-top: 4px;
          font-size: 11px;
          color: #854d0e;
        }
        .summary-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .totals-box {
          width: 100%;
          background: white;
          border: 1px solid #cbd5e1;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .total-label {
          font-size: 12px;
          color: #64748b;
        }
        .total-value {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          font-family: monospace;
        }
        .total-row.grand-total {
          background: #f1f5f9;
          border-top: 2px solid #334155;
          padding: 10px 12px;
        }
        .total-row.grand-total .total-label {
          color: #0f172a;
          font-weight: 700;
          font-size: 13px;
        }
        .total-row.grand-total .total-value {
          font-size: 14px;
          font-weight: 700;
        }
        .total-row.inr-total {
          background: #f0fdf4;
        }
        .total-row.inr-total .total-value.inr {
          color: #059669;
        }
        .signature-box {
          margin-top: 12px;
          text-align: center;
          width: 140px;
          page-break-inside: avoid;
        }
        .signature-logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
          margin-bottom: 8px;
          opacity: 0.8;
        }
        .signature-line {
          width: 100%;
          height: 1px;
          background: #334155;
          margin-bottom: 8px;
        }
        .signature-box p {
          font-size: 10px;
          color: #64748b;
          margin: 0;
          text-transform: uppercase;
        }
        .signature-box span {
          font-size: 12px;
          color: #0f172a;
          font-weight: 600;
        }
        .doc-footer {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 2px solid #334155;
          text-align: center;
          page-break-inside: avoid;
        }
        .doc-footer p {
          margin: 0;
          font-size: 11px;
          color: #64748b;
        }
        .doc-footer .footer-contact {
          margin-top: 4px;
          color: #0f172a;
          font-weight: 500;
        }
        @media print {
          body { padding: 0; }
          .invoice-container { padding: 20px; }
        }
      </style>
    `;

    // Write the print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getDocumentTitle()} - ${getDocumentNumber()}</title>
          ${printStyles}
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }, 500);
  };

  const handleDownload = () => {
    try {
      const element = document.querySelector(".invoice-container");
      if (!element) {
        alert("Unable to generate PDF. Please try again.");
        return;
      }

      const fileName =
        type === "po"
          ? `PO-${orderData?.po || orderData?.orderNumber || "Document"}.pdf`
          : type === "quote"
          ? `Quote-${orderData?.quote_id || "Document"}.pdf`
          : type === "invoice"
          ? `Invoice-${orderData?.invoice_number || "Document"}.pdf`
          : `Order-${orderData?.web_order_id || "Document"}.pdf`;

      // Store original styles
      const originalMaxWidth = element.style.maxWidth;
      const originalPadding = element.style.padding;
      const originalWidth = element.style.width;

      // Apply PDF-optimized styles
      element.style.maxWidth = "850px";
      element.style.padding = "22px";
      element.style.width = "850px";

      const opt = {
        margin: [5, 5, 5, 5],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          width: 850,
          windowWidth: 850
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: "avoid-all", before: ".page-break-before", after: ".page-break-after" },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // Restore original styles
          element.style.maxWidth = originalMaxWidth;
          element.style.padding = originalPadding;
          element.style.width = originalWidth;
        });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Error: " + error.message);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse currency string like "$2,450.00" to number
  const parseCurrencyString = (str) => {
    if (typeof str === "number") return str;
    if (!str) return 0;
    return parseFloat(str.replace(/[$,]/g, "")) || 0;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Sample items when no items provided (for demonstration)
  const sampleItems = [
    {
      product_id: "PROD001",
      part_number: "HYD-PUMP-500",
      product_name: "Aircraft Hydraulic Pump Assembly",
      quantity: 50,
      delivered: 30,
      unit_price: 25.0,
      total_price: 1250.0,
    },
    {
      product_id: "PROD002",
      part_number: "BRK-CYL-200",
      product_name: "Brake Master Cylinder Kit",
      quantity: 100,
      delivered: 60,
      unit_price: 12.0,
      total_price: 1200.0,
    },
  ];

  // Get items from order data or use sample items
  const rawItems = orderData?.items || [];
  const items = rawItems.length > 0 ? rawItems : sampleItems;

  // Calculate totals
  const subtotal =
    orderData?.subtotal ||
    parseCurrencyString(orderData?.totalAmount) ||
    items.reduce(
      (sum, item) => sum + (item.total_price || item.unit_price * item.quantity || 0),
      0
    );
  const tax = orderData?.tax || subtotal * 0.1;
  const shipping = orderData?.shipping || 30;
  const totalAmount = orderData?.total_amount || subtotal + tax + shipping;

  // Calculate delivery stats for PO
  const totalOrdered =
    orderData?.totalQuantity ||
    items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalDelivered =
    orderData?.delivered ||
    items.reduce((sum, item) => sum + (item.delivered || item.dispatched_quantity || 0), 0);
  const totalRemaining = orderData?.remaining || totalOrdered - totalDelivered;

  // Get document title
  const getDocumentTitle = () => {
    switch (type) {
      case "po":
        return "PURCHASE ORDER";
      case "quote":
        return "QUOTATION";
      case "invoice":
        return "TAX INVOICE";
      case "weborder":
        return "ENQUIRY";
      default:
        return "WEB ORDER";
    }
  };

  // Get document number
  const getDocumentNumber = () => {
    switch (type) {
      case "po":
        return orderData?.po || orderData?.order_id || orderData?.po_number || "N/A";
      case "quote":
        return orderData?.quote_id || "N/A";
      case "invoice":
        return orderData?.invoice_number || "N/A";
      default:
        return orderData?.web_order_id || "N/A";
    }
  };

  // Get status styling
  const getStatusStyle = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED" || s === "PAID" || s === "APPROVED" || s === "DELIVERED")
      return { color: "#059669", bg: "#ecfdf5" };
    if (s === "PENDING" || s === "IN_PROGRESS" || s === "IN PROGRESS" || s === "PROCESSING")
      return { color: "#d97706", bg: "#fffbeb" };
    if (s === "CANCELLED" || s === "REJECTED") return { color: "#dc2626", bg: "#fef2f2" };
    return { color: "#6b7280", bg: "#f3f4f6" };
  };

  const statusStyle = getStatusStyle(orderData?.status);

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pdf-modal-header">
          <h2 className="pdf-modal-title">
            {getDocumentTitle()} - {getDocumentNumber()}
          </h2>
          <div className="pdf-modal-actions">
            <button className="pdf-action-btn print-btn" onClick={handlePrint}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 14H6v8h12v-8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Print
            </button>
            <button className="pdf-action-btn download-btn" onClick={handleDownload}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download
            </button>
            <button className="pdf-close-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="pdf-viewer-container">
          <div className="invoice-container">
            {/* Document Header */}
            <div className="doc-header">
              <div className="doc-header-left">
                <div className="company-brand">
                  <img
                    src="/kb-offical-logo-black.png"
                    alt="KB Vista"
                    className="company-logo-img"
                  />
                  <div className="company-info-text">
                    <h1 className="company-name">KB VISTA</h1>
                    <p className="company-tagline">Aviation Parts Supplier</p>
                  </div>
                </div>
                <div className="company-contact">
                  <p>United States</p>
                  <p>info@kbvista.com</p>
                  <p>+1 (XXX) XXX-XXXX</p>
                </div>
              </div>
              <div className="doc-header-right">
                <h2 className="doc-title">{getDocumentTitle()}</h2>
                <div className="doc-number">#{getDocumentNumber()}</div>
              </div>
            </div>

            {/* Document Info Cards */}
            <div className="doc-info-grid">
              <div className="info-card details-card">
                <div className="info-row">
                  <span className="info-label">
                    {type === "quote"
                      ? "Quote Date"
                      : type === "invoice"
                      ? "Invoice Date"
                      : type === "weborder"
                      ? "Enquiry Date"
                      : "Order Date"}
                  </span>
                  <span className="info-value">
                    {formatDate(
                      orderData?.order_date ||
                        orderData?.quote_date ||
                        orderData?.invoice_date ||
                        orderData?.created_at
                    )}
                  </span>
                </div>
                {type === "po" && (
                  <div className="info-row">
                    <span className="info-label">Order ID</span>
                    <span className="info-value">
                      {orderData?.order_id || orderData?.orderNumber || "-"}
                    </span>
                  </div>
                )}
                {type === "quote" && (
                  <div className="info-row">
                    <span className="info-label">Valid Until</span>
                    <span className="info-value">
                      {formatDate(orderData?.expiry_date || orderData?.valid_until)}
                    </span>
                  </div>
                )}
                {type === "invoice" && (
                  <div className="info-row">
                    <span className="info-label">Due Date</span>
                    <span className="info-value">{formatDate(orderData?.due_date)}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span
                    className="status-badge"
                    style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                  >
                    {orderData?.status || "Pending"}
                  </span>
                </div>
                {type !== "weborder" && (
                  <div className="info-row">
                    <span className="info-label">Exchange Rate</span>
                    <span className="info-value" style={{ color: '#059669' }}>
                      1 USD = ₹{orderData?.exchange_rate || usdToInr}
                    </span>
                  </div>
                )}
              </div>
              <div className="info-card customer-card">
                <div className="card-header">{type === "weborder" ? "INFORMATION" : "BILL TO"}</div>
                <div className="customer-name">
                  {user?.name || orderData?.customer_name || "Customer"}
                </div>
                <div className="customer-id">
                  Customer ID: {user?.customer_id || orderData?.customer_id || "N/A"}
                </div>
                {(orderData?.billing_address || user?.address) && (
                  <div className="customer-address">
                    {orderData?.billing_address?.street || user?.address?.street || ""}
                    {orderData?.billing_address?.city && `, ${orderData.billing_address.city}`}
                    {orderData?.billing_address?.state && `, ${orderData.billing_address.state}`}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="items-section">
              <div className="section-header">
                <h3>Order Items</h3>
                <span className="item-count">
                  {orderData?.items_count || items.length} item
                  {(orderData?.items_count || items.length) !== 1 ? "s" : ""}
                </span>
              </div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th className="col-num">#</th>
                    <th className="col-part">Part Number</th>
                    <th className="col-desc">Description</th>
                    <th className="col-qty">{type === "po" ? "Ordered" : "Qty"}</th>
                    {type === "po" && <th className="col-qty">Delivered</th>}
                    {type === "po" && <th className="col-qty">Remaining</th>}
                    {type !== "weborder" && <th className="col-price">Unit Price (USD/INR)</th>}
                    {type !== "weborder" && <th className="col-total">Total (USD/INR)</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const delivered = item.delivered || item.dispatched_quantity || 0;
                    const remaining = (item.quantity || 0) - delivered;
                    const itemTotal = item.total_price || item.unit_price * item.quantity || 0;
                    return (
                      <tr key={item.product_id || index}>
                        <td className="col-num">{index + 1}</td>
                        <td className="col-part">
                          <span className="part-number">{item.part_number || "-"}</span>
                        </td>
                        <td className="col-desc">
                          {item.product_name || item.description || "-"}
                        </td>
                        <td className="col-qty">{item.quantity || 0}</td>
                        {type === "po" && <td className="col-qty delivered">{delivered}</td>}
                        {type === "po" && <td className="col-qty remaining">{remaining}</td>}
                        {type !== "weborder" && (
                          <td className="col-price">
                            <div>${formatCurrency(item.unit_price || 0)}</div>
                            <div style={{ color: '#059669', fontSize: '12px' }}>
                              ₹{formatCurrency((item.unit_price || 0) * (orderData?.exchange_rate || usdToInr))}
                            </div>
                          </td>
                        )}
                        {type !== "weborder" && (
                          <td className="col-total">
                            <div>${formatCurrency(itemTotal)}</div>
                            <div style={{ color: '#059669', fontSize: '12px' }}>
                              ₹{formatCurrency(itemTotal * (orderData?.exchange_rate || usdToInr))}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="summary-section">
              <div className="summary-left">
                {type === "po" && (
                  <div className="delivery-summary">
                    <h4>Delivery Summary</h4>
                    <div className="delivery-stats">
                      <div className="stat">
                        <span className="stat-value">{totalOrdered}</span>
                        <span className="stat-label">Ordered</span>
                      </div>
                      <div className="stat delivered">
                        <span className="stat-value">{totalDelivered}</span>
                        <span className="stat-label">Delivered</span>
                      </div>
                      <div className="stat remaining">
                        <span className="stat-value">{totalRemaining}</span>
                        <span className="stat-label">Remaining</span>
                      </div>
                    </div>
                  </div>
                )}
                {type !== "weborder" && (
                  <div className="notes-box">
                    <h4>Notes</h4>
                    <p>
                      {orderData?.notes ||
                        orderData?.customer_notes ||
                        "Thank you for your business!"}
                    </p>
                    <p className="contact-note">For inquiries: info@kbvista.com</p>
                  </div>
                )}
              </div>
              {type !== "weborder" && (
                <div className="summary-right">
                  <div className="totals-box">
                    <div className="total-row">
                      <span className="total-label">Subtotal</span>
                      <div className="total-value">
                        <div>${formatCurrency(subtotal)}</div>
                        <div style={{ color: '#059669', fontSize: '11px' }}>₹{formatCurrency(subtotal * (orderData?.exchange_rate || usdToInr))}</div>
                      </div>
                    </div>
                    <div className="total-row">
                      <span className="total-label">Tax (10%)</span>
                      <div className="total-value">
                        <div>${formatCurrency(tax)}</div>
                        <div style={{ color: '#059669', fontSize: '11px' }}>₹{formatCurrency(tax * (orderData?.exchange_rate || usdToInr))}</div>
                      </div>
                    </div>
                    <div className="total-row">
                      <span className="total-label">Shipping</span>
                      <div className="total-value">
                        <div>${formatCurrency(shipping)}</div>
                        <div style={{ color: '#059669', fontSize: '11px' }}>₹{formatCurrency(shipping * (orderData?.exchange_rate || usdToInr))}</div>
                      </div>
                    </div>
                    <div className="total-row grand-total">
                      <span className="total-label">Total Amount</span>
                      <div className="total-value">
                        <div>${formatCurrency(totalAmount)}</div>
                        <div style={{ color: '#059669', fontSize: '12px' }}>₹{formatCurrency(totalAmount * (orderData?.exchange_rate || usdToInr))}</div>
                      </div>
                    </div>
                  </div>
                  <div className="signature-box">
                    <img
                      src="/kb-offical-logo-black.png"
                      alt="KB Vista"
                      className="signature-logo"
                    />
                    <div className="signature-line"></div>
                    <p>Authorized Signature</p>
                    <span>KB Vista</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="doc-footer">
              <p>This is a computer-generated document. No signature required.</p>
              <p className="footer-contact">
                KB Vista | info@kbvista.com | +1 (XXX) XXX-XXXX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfModal;
