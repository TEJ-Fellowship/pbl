# AG E-commerce Frontend

A modern, scalable, and high-performance e-commerce frontend built with React, TailwindCSS, and Vite.

## Features

- 🎨 **Modern Design System**: Premium AG brand identity with consistent UI components
- 🚀 **Performance Optimized**: Code splitting, lazy loading, and optimized builds
- 📱 **Fully Responsive**: Mobile-first design that works on all devices
- ♿ **Accessible**: WCAG compliant with proper ARIA labels and keyboard navigation
- 🛒 **Complete E-commerce Flow**: Products, cart, checkout, and order management
- 🔄 **Real-time Cart**: Session-based cart with persistent state

## Tech Stack

- **React 19** - UI library
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
```
VITE_API_URL=http://localhost:3001/api
```

3. Start development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Navbar, Footer, Container)
│   ├── products/       # Product-related components
│   └── ui/            # Base UI components (Button, Card, Input, etc.)
├── contexts/           # React contexts (CartContext)
├── lib/               # Utilities and API client
│   ├── api.js        # API client and endpoints
│   └── utils.js      # Utility functions
├── pages/             # Page components
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── Orders.jsx
│   └── OrderDetail.jsx
└── App.jsx            # Main app component with routing
```

## Features Overview

### Home Page
- Hero section with call-to-action
- Featured products showcase
- Category browsing
- Responsive design

### Products Page
- Product grid with pagination
- Advanced filtering (category, price range)
- Search functionality
- Sorting options
- Responsive filters panel

### Product Detail Page
- High-quality image gallery
- Product information
- Stock status indicators
- Quantity selector
- Add to cart functionality

### Cart Page
- Cart items management
- Quantity updates
- Order summary
- Checkout flow with shipping form

### Orders Page
- Order history
- Status filtering
- Order details view
- Cancel order functionality

## Design System

### Colors
- **Primary**: Blue tones (#0ea5e9) - Main brand color
- **Accent**: Purple tones (#a855f7) - Secondary brand color
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, tight tracking
- **Body**: Regular weight, optimized for readability

### Components
All components follow a consistent design pattern with:
- Proper spacing scale
- Smooth transitions
- Focus states for accessibility
- Responsive breakpoints

## Performance

- **Code Splitting**: Pages are lazy-loaded
- **Image Optimization**: Lazy loading and proper sizing
- **Bundle Optimization**: Vendor chunks separated
- **Caching**: API responses cached where appropriate

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Linting

```bash
npm run lint
```

### Environment Variables

- `VITE_API_URL`: Backend API base URL (default: http://localhost:3001/api)

## API Integration

The frontend integrates with the backend API endpoints:

- `/api/products` - Product listings and details
- `/api/cart` - Cart management
- `/api/orders` - Order processing

Session management is handled automatically via cookies and headers.

## License

ISC
