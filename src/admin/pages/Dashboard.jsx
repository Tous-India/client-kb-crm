import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import purchaseOrdersData from "../../mock/purchaseOrders.json";
import quotationsData from "../../mock/quotations.json";
import ordersData from "../../mock/orders.json";
import invoicesData from "../../mock/invoices.json";
import productsData from "../../mock/products.json";

function Dashboard() {
  const [stats, setStats] = useState({
    pendingPOs: 0,
    activeQuotes: 0,
    openOrders: 0,
    unpaidInvoices: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    totalProducts: 0,
    dispatchedOrders: 0,
    inStockProducts: 0,
    totalOrders: 0,
    totalInvoices: 0,
  });

  useEffect(() => {
    const purchaseOrders = purchaseOrdersData.purchaseOrders || [];
    const quotations = quotationsData.quotations || [];
    const orders = ordersData.orders || [];
    const invoices = invoicesData.invoices || [];
    const products = productsData.products || [];

    const pendingPOs = purchaseOrders.filter(
      (po) => po.status === "PENDING"
    ).length;

    const activeQuotes = quotations.filter((q) => {
      if (q.status === "ACCEPTED") return false;
      const expiryDate = new Date(q.expiry_date);
      return expiryDate > new Date();
    }).length;

    const openOrders = orders.filter((o) => o.status === "OPEN").length;
    const dispatchedOrders = orders.filter(
      (o) => o.status === "DISPATCHED"
    ).length;
    const unpaidInvoices = invoices.filter((i) => i.status === "UNPAID").length;
    const paidInvoicesArray = invoices.filter((i) => i.status === "PAID");
    const lowStockProducts = products.filter(
      (p) => p.total_quantity < 50 && p.total_quantity > 0
    ).length;
    const inStockProducts = products.filter(
      (p) => p.stock_status === "In Stock"
    ).length;

    const totalRevenue = paidInvoicesArray.reduce(
      (sum, i) => sum + i.total_amount,
      0
    );

    setStats({
      pendingPOs,
      activeQuotes,
      openOrders,
      unpaidInvoices,
      lowStockProducts,
      totalRevenue,
      paidInvoices: paidInvoicesArray.length,
      totalProducts: products.length,
      dispatchedOrders,
      inStockProducts,
      totalOrders: orders.length,
      totalInvoices: invoices.length,
    });
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: "+12.5%",
      changeLabel: "from last month",
      color: "#10b981",
      statusColor: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/invoices",
    },
    {
      title: "Purchase Orders",
      value: stats.pendingPOs,
      subtitle: "Pending",
      color: "#ef4444",
      statusColor: "text-red-600",
      bgColor: "bg-red-50",
      link: "/admin/purchase-orders",
    },
    {
      title: "Active Quotations",
      value: stats.activeQuotes,
      subtitle: "Awaiting Response",
      color: "#8b5cf6",
      statusColor: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/admin/quotations",
    },
    {
      title: "Open Orders",
      value: stats.openOrders,
      subtitle: "Ready to Dispatch",
      color: "#f59e0b",
      statusColor: "text-amber-600",
      bgColor: "bg-amber-50",
      link: "/admin/orders",
    },
    {
      title: "Unpaid Invoices",
      value: stats.unpaidInvoices,
      subtitle: "Awaiting Payment",
      color: "#f97316",
      statusColor: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/admin/invoices",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts,
      subtitle: "Needs Restocking",
      color: "#dc2626",
      statusColor: "text-red-600",
      bgColor: "bg-red-50",
      link: "/admin/products",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      subtitle: `${stats.inStockProducts} In Stock`,
      color: "#06b6d4",
      statusColor: "text-cyan-600",
      bgColor: "bg-cyan-50",
      link: "/admin/products",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      subtitle: `${stats.dispatchedOrders} Dispatched`,
      color: "#84cc16",
      statusColor: "text-lime-600",
      bgColor: "bg-lime-50",
      link: "/admin/orders",
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices,
      subtitle: `${stats.paidInvoices} Paid`,
      color: "#6366f1",
      statusColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      link: "/admin/invoices",
    },
    {
      title: "Dispatched Today",
      value: stats.dispatchedOrders,
      subtitle: "Orders Shipped",
      color: "#22c55e",
      statusColor: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/orders",
    },
    {
      title: "Paid Invoices",
      value: stats.paidInvoices,
      subtitle: "Completed Payments",
      color: "#14b8a6",
      statusColor: "text-teal-600",
      bgColor: "bg-teal-50",
      link: "/admin/invoices",
    },
    {
      title: "Total Users",
      value: "24",
      subtitle: "Active Customers",
      color: "#64748b",
      statusColor: "text-slate-600",
      bgColor: "bg-slate-50",
      link: "/admin/users",
    },
  ];

  return (
    <div className="admin-dashboard-main-page">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0b0c1a] mb-2">
          Dashboard Overview
        </h1>
        <p className="text-base text-gray-600">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
        {statCards.map((stat, index) => {
          const cardContent = (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                {stat.title}
              </p>
              <h3 className="text-3xl font-medium text-gray-900 mb-1">
                {stat.value}
              </h3>
              {stat.subtitle && (
                <p className={`text-sm ${stat.statusColor || 'text-gray-600'}`}>
                  {stat.subtitle}
                </p>
              )}
              {stat.change && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="text-green-600" size={18} />
                  <span className="text-sm font-semibold text-green-600">
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-600">
                    {stat.changeLabel}
                  </span>
                </div>
              )}
            </div>
          );

          return stat.link ? (
            <Link
              key={index}
              to={stat.link}
              className="h-full bg-white rounded-lg border border-gray-200 transition-all duration-300 ease-in-out no-underline hover:-translate-y-2 hover:shadow-xl block"
              style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = stat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)";
              }}
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={index}
              className="h-full bg-white rounded-lg border border-gray-200"
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* Bottom Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {/* Order Fulfillment */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
          <h6 className="text-lg font-bold text-[#1a237e] mb-6">
            Order Fulfillment
          </h6>
          <hr className="mb-6 border-gray-200" />
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  Completed Orders
                </p>
                <p className="text-sm font-bold text-[#1a237e]">
                  {stats.dispatchedOrders}/{stats.totalOrders}
                </p>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg"
                  style={{
                    width: `${
                      stats.totalOrders > 0
                        ? (stats.dispatchedOrders / stats.totalOrders) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  Payment Collection
                </p>
                <p className="text-sm font-bold text-[#1a237e]">
                  {stats.paidInvoices}/{stats.totalInvoices}
                </p>
              </div>
              <div className="w-full h-2.5 bg-green-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-lg"
                  style={{
                    width: `${
                      stats.totalInvoices > 0
                        ? (stats.paidInvoices / stats.totalInvoices) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">
                  Stock Availability
                </p>
                <p className="text-sm font-bold text-[#1a237e]">
                  {stats.inStockProducts}/{stats.totalProducts}
                </p>
              </div>
              <div className="w-full h-2.5 bg-cyan-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-lg"
                  style={{
                    width: `${
                      stats.totalProducts > 0
                        ? (stats.inStockProducts / stats.totalProducts) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
          <h6 className="text-lg font-bold text-[#1a237e] mb-6">Quick Stats</h6>
          <hr className="mb-6 border-gray-200" />
          <div className="space-y-5">
            {[
              {
                label: "Pending POs",
                value: stats.pendingPOs,
                color: "#2196f3",
              },
              {
                label: "Active Quotes",
                value: stats.activeQuotes,
                color: "#9c27b0",
              },
              {
                label: "Open Orders",
                value: stats.openOrders,
                color: "#ff9800",
              },
              {
                label: "Unpaid Invoices",
                value: stats.unpaidInvoices,
                color: "#f44336",
              },
              {
                label: "Low Stock Items",
                value: stats.lowStockProducts,
                color: "#ff5722",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600">
                  {item.label}
                </p>
                <h6 className="text-xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </h6>
              </div>
            ))}
          </div>
        </div>

        {/* Business Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
          <h6 className="text-lg font-bold text-[#1a237e] mb-6">
            Business Summary
          </h6>
          <hr className="mb-6 border-gray-200" />
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Revenue
              </p>
              <h4 className="text-4xl font-bold text-[#4caf50]">
                $
                {stats.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h4>
            </div>
            <hr className="border-gray-200" />
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Average Order Value
              </p>
              <h5 className="text-2xl font-bold text-[#1a237e]">
                $
                {stats.totalOrders > 0
                  ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
                  : "0.00"}
              </h5>
            </div>
            <hr className="border-gray-200" />
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Inventory Value
              </p>
              <h5 className="text-2xl font-bold text-[#1a237e]">
                {stats.totalProducts} Products
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
