# Fashion Website

A modern e-commerce fashion website built with vanilla JavaScript.

## Project Structure

```
fashion-website/
├── src/
│   ├── html/                     # HTML pages
│   │   ├── index.html           # Homepage
│   │   ├── shop.html            # Product listing page
│   │   ├── product-detail.html  # Product detail page
│   │   ├── cart.html            # Shopping cart page
│   │   ├── checkout.html        # Checkout page
│   │   ├── deals.html           # Special offers page
│   │   ├── auth/                # Authentication related pages
│   │   ├── user-center/         # User center pages
│   │   └── about-pages/         # About us and information pages
│   │   └── admin/               # Admin backend pages (partially implemented)
│   │
│   ├── css/                     # Style files
│   │   ├── main.css            # Main style file
│   │   ├── components/         # Component styles
│   │   └── pages/             # Page-specific styles
│   │
│   ├── js/                      # JavaScript files
│   │   ├── main.js            # Main entry file
│   │   ├── modules/           # Feature modules
│   │   │   ├── cart.js        # Shopping cart management
│   │   │   ├── product.js     # Product detail management
│   │   │   ├── shop.js        # Product listing management
│   │   │   ├── auth/          # Authentication related features
│   │   │   └── user/          # User center features
│   │   └── utils/             # Utility functions
│   │   └── lib/               # Third-party libraries (currently empty)
│   │
│   └── public/                  # Static resources
│       ├── images/            # Image resources
│       └── fonts/            # Font files
│
├── server.js                    # Simple backend server
├── package.json                 # Project dependencies configuration
├── start.sh                     # Startup script
├── dev.sh                       # Development environment script
└── README.md                    # Project documentation
```

## Feature Modules

### 1. Homepage (index.html)
- Carousel display
- New arrivals
- Popular categories
- Brand story
- Navigation menu

### 2. Product Display
- Product listing page (shop.html)
  - Category filtering
  - Price sorting
  - Pagination
  - Quick add to cart
- Product detail page (product-detail.html)
  - Image gallery
  - Specification selection
  - Quantity selection
  - Add to cart
  - Buy now
  - Product reviews
  - Share functionality
  - Favorite functionality

### 3. Shopping Cart System (cart.html)
- Product list display
- Quantity modification (increase/decrease)
- Product selection (single/multiple)
- Price calculation (original price, discount, total price)
- Clear cart
- Checkout functionality
- Cart icon quantity synchronization

### 4. Marketing Features (deals.html)
- Limited-time offers
- Coupon redemption
- Points mall
- Member-exclusive prices
- Promotional activities

### 5. User Center
- Personal information management
- Order management
- Shipping address management
- Favorites
- Points details

### 6. Authentication System
- User registration
- User login
- Password recovery
- Third-party login

## Recent Improvements

### Shopping Cart Improvements
- Fixed unresponsive increment/decrement buttons
- Improved price updates after product selection
- Enhanced select all functionality
- Optimized clear cart functionality
- Implemented real-time cart icon quantity updates across the site
- Optimized price calculation logic

### Product Detail Page Improvements
- Synchronized product detail page data with shop.js data
- Automatic cart icon updates after adding items
- Enhanced color and size selection functionality
- Optimized image browsing experience
- Implemented favorite functionality

## Page Relationships

1. Homepage (index.html)
   - → Product listing page (shop.html)
   - → Product detail page (product-detail.html)
   - → Special offers page (deals.html)
   - → Shopping cart (cart.html)
   - → User center
   - → Login/Registration pages

2. Product listing page (shop.html)
   - → Product detail page (product-detail.html)
   - → Shopping cart (cart.html)

3. Product detail page (product-detail.html)
   - → Shopping cart (cart.html)
   - → Checkout page (checkout.html)
   - → Comments section

4. Shopping cart (cart.html)
   - → Checkout page (checkout.html)
   - → Product detail page (product-detail.html)
   - → Product listing page (shop.html)

5. Checkout page (checkout.html)
   - → Payment page
   - → Shopping cart (cart.html)

6. Special offers page (deals.html)
   - → Product detail page (product-detail.html)
   - → Shopping cart (cart.html)
   - → Points mall

## Tech Stack

- Vanilla JavaScript (ES6+)
- CSS3 (Flexbox & Grid)
- HTML5
- Local Storage
- Modular development
- SQLite3 (for authentication system)
- Express.js (simple backend service)

## Data Storage

The project uses LocalStorage to store the following data:

1. Shopping cart items (`cart_items`)
2. User session information (`auth_token`)
3. User favorite items (`favorites`)
4. Browsing history (`view_history`)

## Pending Features

1. User System
   - Complete user personal center
   - Order management system
   - Shipping address management
   - Coupon management

2. Payment System
   - Order confirmation page
   - Payment process
   - Order status tracking

3. Search System
   - Product search
   - Search history
   - Popular search recommendations

4. Performance Optimization
   - Image lazy loading
   - Resource compression
   - Cache strategy
   - Performance monitoring

5. Admin Backend
   - Product management
   - Order management
   - User management
   - Marketing activity management

## Development Guide

1. Clone the project
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
./dev.sh
# or
npm run dev
```

4. Start authentication system
```bash
./start.sh
# or
node server.js
```

## Browser Support

- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

## Authentication System

Detailed authentication system documentation can be found in [README-auth.md](./README-auth.md)

## Admin System

The project now includes an admin backend system that supports:
- Admin login authentication
- Registration via invitation code
- Sales data analysis
- Store and order management

Detailed admin system documentation can be found in [README-admin.md](./README-admin.md)

## License 