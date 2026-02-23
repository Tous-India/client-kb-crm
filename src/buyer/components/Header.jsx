import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useCartStore from "../../stores/useCartStore";
import Logo from "../../components/Logo";
import "./Header.css";

function Header({ onNotificationSettingsClick }) {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Get cart item count from store
  const cartCount = useCartStore((state) => state.getItemCount());

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${searchTerm}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCartClick = () => {
    navigate("/cart");
  };

  return (
    <header className="buyer-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo-section">
            <Logo width={40} height={40} variant="default" className="logo-img" />
            <span className="logo-text">KB Vista</span>
          </Link>

          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="Search in Products, Companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>

        <div className="header-right">
          {/* <button className="header-icon-btn" title="Refresh">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M1 4v6h6M19 16v-6h-6M2.51 9A9 9 0 0 1 17 4.44M17.49 11A9 9 0 0 1 3 15.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button> */}

          {/* <button className="header-icon-btn add-btn" title="New">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button> */}

          {/* Notification Settings Button */}
          <button
            className="header-icon-btn"
            title="Notification Settings"
            onClick={onNotificationSettingsClick}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 6.5A5 5 0 1 0 5 6.5c0 6-3 7.5-3 7.5h16s-3-1.5-3-7.5zM11.73 18a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className="header-icon-btn cart-btn"
            title="Cart"
            onClick={handleCartClick}
          >
            <svg width="30" height="20" viewBox="0 0 20 20" fill="none">
              <circle
                cx="8"
                cy="18"
                r="1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="16"
                cy="18"
                r="1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M1 1h3l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L22 6H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          <Link to="/profile" className="user-profile">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="user-name">{user?.name || "User"}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <button
            className="header-icon-btn"
            title="Logout"
            onClick={handleLogout}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7 19H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h4M14 15l5-5-5-5M19 10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
