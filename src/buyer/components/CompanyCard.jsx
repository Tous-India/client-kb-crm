import React from 'react';
import { Link } from 'react-router-dom';
import './CompanyCard.css';

function CompanyCard({ company }) {
  return (
    <div className="company-card">
      <div className="company-logo">
        {company.logo ? (
          <img src={company.logo} alt={company.name} />
        ) : (
          <div className="company-logo-placeholder">
            {company.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="company-info">
        <h3 className="company-name">{company.name}</h3>
        {company.category && (
          <span className="company-category">{company.category}</span>
        )}
        {company.products && (
          <p className="company-products">{company.products} products</p>
        )}
      </div>
      <Link to={`/companies/${company.id}`} className="company-view-btn">
        View
      </Link>
    </div>
  );
}

export default CompanyCard;
