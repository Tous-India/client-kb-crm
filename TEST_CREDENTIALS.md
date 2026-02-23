# Test Login Credentials

## Buyer Accounts

### Buyer 1
- **Email:** john.smith@techcorp.com
- **Password:** hashed_password_123
- **Name:** John Smith
- **Company:** TechCorp Industries

### Buyer 2
- **Email:** sarah.j@aerospace.com
- **Password:** hashed_password_456
- **Name:** Sarah Johnson
- **Company:** Aerospace Solutions Ltd

### Buyer 3
- **Email:** m.chen@manufacturing.com
- **Password:** hashed_password_789
- **Name:** Michael Chen
- **Company:** Manufacturing Pro Inc

### Buyer 4
- **Email:** emily.r@aviation-services.com
- **Password:** hashed_password_321
- **Name:** Emily Rodriguez
- **Company:** Aviation Services Group

### Buyer 5
- **Email:** robert.t@logistics.com
- **Password:** hashed_password_654
- **Name:** Robert Taylor
- **Company:** Logistics Express Inc

## Admin Accounts

### Admin 1
- **Email:** admin@portal.com
- **Password:** hashed_admin_password_001
- **Name:** Admin User
- **Role:** Administrator

### Admin 2
- **Email:** jessica.t@portal.com
- **Password:** hashed_admin_password_002
- **Name:** Jessica Thompson
- **Role:** Administrator

## Usage Notes

- Buyers can only access buyer routes (home page, products, cart, etc.)
- Admins can only access admin routes (/admin/*)
- Users are redirected to their appropriate dashboard based on their role after login
- All routes are protected and require authentication
- Attempting to access routes without proper role will redirect to the appropriate dashboard
