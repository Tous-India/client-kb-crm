import Card from "../components/Card";
import "./Dashboard.css";
import whatsapp from "../../../public/whatsapp-color-svgrepo-com.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import PdfModal from "../components/PdfModal";
import ContactModal from "../components/ContactModal";
import { useBuyerDashboardStats } from "../../hooks/useDashboard";
import useCartStore from "../../stores/useCartStore";
import { CircularProgress } from "@mui/material";

import ActuatorKit from "../../../public/category/Actuator Kits.webp";
import AeroShell from "../../../public/category/Aero Shell.webp";
import CamGuard from "../../../public/category/Cam Guard.webp";
import Corrosion from "../../../public/category/Corrosion.webp";
import Nuts from "../../../public/category/Nuts.webp";
import ParkingBreak from "../../../public/category/Parking Break.webp";
import Philips66 from "../../../public/category/Philips 66.webp";
import RCAllenInstrument from "../../../public/category/RC Allen Instrument.webp";
import Rivets from "../../../public/category/Rivets.webp";
import ShimmyDamper from "../../../public/category/Shimmy Damper.webp";
import Spacers from "../../../public/category/Spacers.webp";
import StrutServiceKits from "../../../public/category/Strut Service Kits.webp";
import SynTech from "../../../public/category/Syn-Tech.webp";
import TyRap from "../../../public/category/Ty Rap.webp";
import GroundSupportEquipment from "../../../public/category/Ground Support Equipment.webp";
import HandTools from "../../../public/category/Hand Tools.webp";
import CotterPin from "../../../public/category/Cotter Pin.webp";
import Drills from "../../../public/category/Drills.webp";
import EZTurn from "../../../public/category/EZ Turn.webp";
import Fittings from "../../../public/category/Fittings.webp";
import FuelStrainer from "../../../public/category/Fuel Strainer.webp";
import FuelTreatment from "../../../public/category/Fuel Treatment.webp";
import BatteryAnalyzer from "../../../public/category/Battery Analyzer.webp";
import BattteryCCharger from "../../../public/category/Batttery CCharger.webp";
import BreakMasterKit from "../../../public/category/Break Master Kit.webp";
import CableTensiometer from "../../../public/category/Cable Tensiometer.webp";

const categories = [
  { name: "Safety / Survival", image: "/ss/Screenshot 2025-12-18 121622.png" },
  { name: "Cotter Pins", image: CotterPin },
  { name: "Fittings", image: Fittings },
  { name: "Nuts", image: Nuts },
  { name: "Rivets", image: Rivets },
  { name: "Spacers", image: Spacers },
  { name: "EZ Turn", image: EZTurn },
  {
    name: "Corrosion Technologies",
    image: Corrosion,
  },
  { name: "Syn-Tech Ltd", image: SynTech },
  { name: "Fuel Treatment", image: FuelTreatment },
  { name: "Probes and Senders", image: "/ss/Screenshot 2025-12-18 121622.png" },
  { name: "Alcor Instruments", image: "/ss/Screenshot 2025-12-18 121622.png" },
  {
    name: "RC Allen Instruments",
    image: RCAllenInstrument,
  },
  { name: "CamGuard", image: CamGuard },
  { name: "AeroShell", image: AeroShell },
  { name: "Phillips 66", image: Philips66 },
  { name: "EZ Turn lubricant", image: EZTurn },
  { name: "Actuator Kits", image: ActuatorKit },
  {
    name: "Brake master cylinder kits",
    image: BreakMasterKit,
  },
  {
    name: "Fuel Strainer and selector valve kits",
    image: FuelStrainer,
  },
  {
    name: "Parking Brake Valve Kits",
    image: ParkingBreak,
  },
  { name: "Shimmy Damper Kits", image: ShimmyDamper },
  { name: "Strut Service kits", image: StrutServiceKits },
  {
    name: "Battery Charger, maintainer, desulfators",
    image: BattteryCCharger,
  },
  { name: "Battery analyzers", image: BatteryAnalyzer },
  { name: "Drills", image: Drills },
  { name: "Hand tools", image: HandTools },
  { name: "Cable Tensiometer", image: CableTensiometer },
  {
    name: "Ground support equipment",
    image: GroundSupportEquipment,
  },
  { name: "Ty-rap", image: TyRap },
];

// Recent Orders Component
const RecentOrders = ({ orders = [], onViewClick, isLoading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return `$${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <div className="orders-section">
        <h2 className="section-heading">Recent Orders</h2>
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <CircularProgress size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="orders-section">
      <h2 className="section-heading">Recent Orders</h2>
      <div className="orders-table-container">
        {orders.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No orders found. Start by requesting a quote!
          </p>
        ) : (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ORDER DATE</th>
                  <th>ORDER NUMBER</th>
                  <th>CUSTOMER PO</th>
                  <th>TOTAL ITEMS</th>
                  <th>TOTAL AMOUNT</th>
                  <th>TOTAL QTY</th>
                  <th>DELIVERED</th>
                  <th>REMAINING</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.order_id || index}>
                    <td>{formatDate(order.date)}</td>
                    <td>{order.order_id}</td>
                    <td>
                      <a href="#" className="po-link">
                        {order.po_number || "-"}
                      </a>
                    </td>
                    <td>{order.total_items}</td>
                    <td className="amount-cell">{formatCurrency(order.total_amount)}</td>
                    <td>{order.total_quantity}</td>
                    <td className="remaining-green">{order.dispatched_quantity || 0}</td>
                    <td className="remaining-red">{order.remaining_quantity || 0}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() =>
                          onViewClick({
                            orderNumber: order.order_id,
                            po: order.po_number,
                          })
                        }
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="8"
                            cy="8"
                            r="2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="table-footer">
              Showing 1 - {orders.length} of {orders.length} orders
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// Browse by Category Component
const BrowseByCategory = ({ categories, onCategoryClick }) => {
  return (
    <div className="categories-section">
      <h2 className="section-heading">Browse by Category</h2>
      <div className="categories-grid">
        {categories.map((category, index) => (
          <div
            className="category-card"
            key={index}
            onClick={() => onCategoryClick(category.name)}
            style={{ cursor: "pointer" }}
          >
            <div className="category-image-wrapper">
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
              />
            </div>
            <h3 className="category-name">{category.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Fetch dashboard stats from API
  const { data: dashboardData, isLoading: statsLoading } = useBuyerDashboardStats();

  // Get cart items count from cart store
  const { getItemCount } = useCartStore();
  const cartItemCount = getItemCount();

  // Extract data from API response
  const stats = dashboardData?.stats || {};
  const creditInfo = dashboardData?.creditInfo || {};
  const customerId = dashboardData?.customerId || user?.user_id || "N/A";
  const recentOrders = dashboardData?.recentOrders || [];

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleViewClick = (order) => {
    setSelectedOrder(order);
    setShowPdfModal(true);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrder(null);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0.00";
    return `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="buyer-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Hello, {user?.name || "User"}</h1>
          <p className="dashboard-subtitle">Customer-Code: {customerId}</p>
        </div>
        <div className="dashboard-tabs">
          <button className="tab-btn active">Dashboard</button>
        </div>
      </div>

      <div className="welcome-banner">
        <div>
          <h3 className="credit-title">Credit Information</h3>
          <div className="credit-details">
            <div className="detail-item">
              <span className="detail-label">Terms:</span>
              <span className="detail-value">
                {creditInfo.payment_terms || "WIRE TRANSFER"}
                {creditInfo.credit_days ? ` (${creditInfo.credit_days})` : ""}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Disc.Cd:</span>
              <span className="detail-value">{creditInfo.discount_code || "-"}</span>
            </div>
          </div>
        </div>
        <div className="contact-buttons">
          <p className="contact-text">Contact your sales representative</p>
          <div>
            <button
              onClick={() => setShowContactModal(true)}
              className="contact-btn email-btn"
              style={{ border: "none", cursor: "pointer" }}
            >
              <span className="btn-icon">✉</span>
              Send Email
            </button>
            <a
              href="https://wa.me/"
              className="contact-btn whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="btn-icon">
                <img src={whatsapp} width={20} height={20} alt="whatsapp" />
              </span>
              Text me on Whatsapp
            </a>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <Card
          title="Pending Quotations"
          value={statsLoading ? "..." : String(stats.pendingQuotations || 0)}
          icon={
            <svg width="12" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
        />
        <Card
          title="Open Orders"
          value={statsLoading ? "..." : String(stats.openOrders || 0)}
          icon={
            <svg width="20" height="12" viewBox="0 0 20 20" fill="none">
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
        />
        <Card
          title="Cart Items"
          value={String(cartItemCount)}
          icon={
            <svg width="20" height="12" viewBox="0 0 20 20" fill="none">
              <circle
                cx="9"
                cy="21"
                r="1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="20"
                cy="21"
                r="1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
        />
        <Card
          title="Total Invoices"
          value={statsLoading ? "..." : formatCurrency(stats.totalInvoiceAmount || 0)}
          icon={
            <svg width="12" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
        />
      </div>

      {/* Browse by Category Section */}
      <BrowseByCategory
        categories={categories}
        onCategoryClick={handleCategoryClick}
      />

      {/* Recent Orders Section */}
      <RecentOrders
        orders={recentOrders}
        onViewClick={handleViewClick}
        isLoading={statsLoading}
      />
      {/* PDF Modal */}
      <PdfModal
        isOpen={showPdfModal}
        onClose={handleClosePdfModal}
        orderData={selectedOrder}
        type="po"
      />

      {/* Contact Modal - Send email via CRM */}
      <ContactModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSuccess={() => setShowContactModal(false)}
      />
    </div>
  );
}

export default Dashboard;
