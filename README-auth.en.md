# Authentication System Documentation

This is a simple login and registration system based on SQLite3, currently without email verification. The system is integrated with the Fashion Website e-commerce project.

## Features

- User registration and login
- Encrypted password storage
- Session management
- SQLite3 database for user information storage
- Secure JSON parsing and error handling
- CORS support and OPTIONS request handling
- Login state persistence
- User center page
- Logout functionality
- Shopping cart system integration

## System Requirements

- Node.js (14.x or higher)
- npm (6.x or higher)

## Installation and Running

1. Ensure Node.js and npm are installed
2. Clone or download the project
3. Run the following commands in the project root directory:

```bash
# Run the startup script
./start.sh
```

Or manually execute:

```bash
# Install dependencies
npm install

# Start the server
node server.js
```

4. The server will start at http://localhost:3000
5. Access the following URLs in your browser:
   - Registration page: http://localhost:3000/html/auth/register.html
   - Login page: http://localhost:3000/html/auth/login.html
   - User center: http://localhost:3000/html/user-center/index.html (login required)

## Integration with E-commerce Website

The authentication system integrates with the e-commerce website in several ways:

1. **Navigation Bar User Status**: All page headers display different content based on user login status
2. **Shopping Cart Sync**: Logged-in users' shopping cart information automatically syncs
3. **Product Favorites**: Logged-in users can favorite products and view them in the user center
4. **Order Management**: Logged-in users can view and manage orders
5. **Personal Information**: Users can manage personal information in the user center

## File Structure

- `server.js` - Express server and SQLite3 database configuration
- `src/html/auth/` - Login and registration pages
- `src/js/modules/auth/` - Frontend authentication-related JS files
  - `api.js` - API requests and session management
  - `validation.js` - Form validation and submission handling
  - `session.js` - Session state management and navigation bar updates
- `src/html/user-center/` - User center pages
- `users.db` - SQLite3 database file (automatically created on first run)

## Account Registration Process

1. Visit the registration page
2. Fill in username, email, and password
3. Click the register button
4. Redirect to login page upon success

## Login Process

1. Visit the login page
2. Enter email and password
3. Click the login button
4. Redirect to user center page upon success

## User Center and Logout Functionality

1. Successful login redirects to the user center page
2. User center displays user information and function menu
3. Click "Logout" button in user center to log out
4. Logout clears session information and redirects to homepage
5. Session state persists across all pages (using localStorage)

## Security Notes

- Passwords are stored using PBKDF2 encryption
- Random salt values enhance security
- Simple session management (using localStorage)
- Secure JSON parsing and error handling
- CORS support and preflight request handling
- User center page login state verification

## Troubleshooting Guide

### Handling "Unexpected end of JSON input" Error

Possible causes:
1. Server not returning valid JSON
2. Server not setting correct Content-Type header
3. Network errors causing incomplete responses

Solutions:
- Force server to set Content-Type header as application/json
- Use safeParseJSON function for secure JSON parsing
- Add comprehensive error catching and logging

### Handling "405 Method Not Allowed" Error

Possible causes:
1. Frontend HTTP method doesn't match server expectations
2. Server not properly handling preflight (OPTIONS) requests
3. Inconsistent API call methods in frontend code

Solutions:
- Add CORS middleware for preflight requests
- Explicitly specify API request methods (GET, POST, etc.)
- Standardize frontend API calls, avoid mixing direct fetch and API modules
- Add request logging for debugging

### Handling Unresponsive Logout Button

Possible causes:
1. Event listener binding errors
2. Nested DOMContentLoaded events causing timing issues
3. JavaScript errors interrupting execution

Solutions:
- Remove nested DOMContentLoaded events
- Use direct onclick attribute for event binding
- Add debug logs to track execution flow
- Ensure DOM elements exist before binding events

### Handling Login State Persistence Issues

Possible causes:
1. Pages not sharing login state check logic
2. localStorage storage or retrieval errors
3. Navigation bar status not updating correctly

Solutions:
- Create unified session management module
- Use same state check logic across all pages
- Add navigation bar user status update function
- Ensure correct localStorage session information storage

## Important Notes

This is just a demo system. In a production environment, more comprehensive security measures should be implemented, such as:

1. Using HTTPS to ensure secure transmission
2. Implementing login attempt limits
3. Adding two-factor authentication
4. Implementing password complexity requirements
5. Using more secure server-side session management
6. Adding CSRF and XSS protection

## Administrator Authentication

The administrator login and registration system is separate from the user authentication system and provides stricter permission controls.
- Administrator registration requires an invitation code
- Administrators can access the management backend after login

For details, please refer to [README-admin.md](./README-admin.md) 