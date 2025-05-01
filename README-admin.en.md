# Admin System Documentation

This is the admin backend system for the Fashion Website e-commerce platform, providing administrator login, registration, and basic management features including store management, sales data analysis, and order management.

## Features

- Administrator login and registration
- Invitation code-based registration system
- Administrator permission verification
- Sales data analysis and chart visualization
- Store management
- Order processing and status management
- Login state persistence

## Usage Guide

### Administrator Login

1. Access the admin login page: `/html/admin/login.html`
2. Enter the default administrator credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click login, and upon success, you'll be redirected to the admin dashboard

### Administrator Registration

1. Access the one-time admin registration page: `/html/admin/register.html`
2. Fill in the form with username, email, password, and invitation code
3. The invitation code is: `6666`
4. Submit the form, and upon successful registration, you'll be redirected to the admin dashboard

### Dashboard Features

The admin dashboard provides the main management features for the e-commerce system:

1. **Sales Overview**: Displays total sales, best-selling products, and sales trend charts
2. **Store Management**: View and manage store information and inventory
3. **Order Management**: Process orders and update order status
4. **User Management**: View and manage user accounts (under development)

## File Structure

- `src/html/admin/` - Admin page HTML files
  - `login.html` - Admin login page
  - `register.html` - Admin registration page
  - `dashboard.html` - Admin dashboard
  - `stores.html` - Store management page
  - `store-detail.html` - Store details page
  - `orders.html` - Order management page
  - `sales.html` - Sales data analysis page
  - `invite.html` - Invitation code management page
  
- `src/js/api/admin/` - Admin API related JS files
  - `auth-interceptor.js` - Authentication interceptor
  - `sqlite-invites.js` - Invitation code management (SQLite version)
  - `invites.js` - Invitation code management

- `src/css/pages/admin.css` - Admin page styles

## Technical Implementation

This admin system is implemented using the following technologies:

1. **Frontend**:
   - Vanilla JavaScript
   - Chart.js (data visualization)
   - CSS3 Flexbox and Grid layout
   
2. **Backend**:
   - Invitation code verification (hardcoded as 6666)
   - localStorage-based session management
   - Simplified authentication interceptor

3. **Data Management**:
   - Mock API response handling
   - Local storage for admin information

## Security Features

The current system is a demo version with the following security features:

1. Admin page access restrictions (requires login)
2. Invitation code verification mechanism
3. Session state verification

## Pending Features

1. **User Management**:
   - Add user management page
   - User permission management
   - User activity logs

2. **Product Management**:
   - Add, edit, and delete products
   - Product category management
   - Price and inventory updates

3. **Permission System**:
   - Different admin level permissions
   - Operation auditing
   - Sensitive operation confirmation

4. **Data Synchronization**:
   - Synchronization with actual database
   - Real-time data updates
   - Data backup and recovery

## Invitation Code Information

- The system uses invitation codes to control admin registration
- The current invitation code is hardcoded as `6666`
- Invitation codes are verified during registration

## Important Notes

This is just a demo system. In a production environment, more comprehensive security measures should be implemented, such as:

1. Using HTTPS to ensure secure transmission
2. Implementing stricter permission controls
3. Using server-side session management
4. Implementing operation logs and auditing
5. Adding CSRF and XSS protection 