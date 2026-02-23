import React from 'react';
import './Card.css';

function Card({ title, value, icon, subtitle, trend, onClick, className = '' }) {
  return (
    <div className={`stat-card ${className}`} onClick={onClick}>
      <div className="card-header">
        <div className="card-title-section">
          {icon && <div className="card-icon">{icon}</div>}
          <h3 className="card-title">{title}</h3>
        </div>
        {trend && (
          <div className={`card-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
      <div className="card-body">
        <p className="card-value">{value}</p>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

export default Card;
