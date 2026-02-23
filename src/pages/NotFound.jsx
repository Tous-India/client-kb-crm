import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <div className="error-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="8 8"/>
            <path d="M70 85c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round"/>
            <path d="M110 85c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round"/>
            <path d="M70 120c0 16.569 13.431 30 30 30s30-13.431 30-30" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="85" cy="95" r="5" fill="#6b7280"/>
            <circle cx="115" cy="95" r="5" fill="#6b7280"/>
          </svg>
        </div>

        <div className="error-actions">
          <Link to="/" className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 9l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go to Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Back
          </button>
        </div>

        
      </div>
    </div>
  );
}

export default NotFound;
