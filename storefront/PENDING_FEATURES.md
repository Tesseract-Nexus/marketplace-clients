# Storefront Feature Status

This document tracks the implementation status of storefront features.

---

## Completed Features

### Customer Authentication
- [x] Login page (`/[slug]/login`)
- [x] Registration page (`/[slug]/register`)
- [x] Forgot password flow (`/[slug]/forgot-password`)
- [x] Auth store (Zustand) for session management
- [x] API client integration with `customers-service`
- [x] Protected routes for account pages
- [x] JWT token handling

### Checkout & Payment Integration
- [x] Integration with `payment-service` for Razorpay payments
- [x] Create real orders in `orders-service`
- [x] Handle payment success/failure callbacks
- [x] Guest checkout support
- [x] Redirect to success page after payment

### Account Management
- [x] Profile page with real customer data and edit functionality
- [x] Settings page with password change and marketing preferences
- [x] Order history with real data
- [x] Customer type badges (VIP, Wholesale, Retail)
- [x] Total orders and total spent display
- [x] Payment methods page (shows Razorpay info)
- [x] Saved addresses CRUD functionality

### Routing & Multi-Tenancy
- [x] Hostname-based tenant routing (`[slug].mark8ly.app`)
- [x] Middleware rewrites subdomain to path (`demo-store.mark8ly.app/` → `/demo-store`)
- [x] Dynamic tenant validation via `tenant-router-service`
- [x] Removed hardcoded tenant list - uses live API
- [x] 404 for invalid tenant slugs
- [x] Theme settings fetched from `settings-service`
- [x] Path-based routing preserved for localhost development

### Product Reviews
- [x] Reviews API integration with `reviews-service`
- [x] Submit review form (authenticated users only)
- [x] Review moderation status handling
- [x] Verified purchase badge display
- [x] Review helpfulness voting

### Inventory & Stock
- [x] Stock validation on add to cart
- [x] Show "Out of Stock" badges on product cards
- [x] Show "Low Stock" badges on product cards
- [x] Disable add to cart for out of stock items
- [x] Stock status display on product detail page

### Cart Persistence
- [x] Cart sync to backend for logged-in users
- [x] Merge guest cart on login
- [x] Cart API endpoints in `customers-service`
- [x] Local storage fallback for guest users

### Wishlist Persistence
- [x] Wishlist sync to backend for logged-in users
- [x] Wishlist API endpoints in `customers-service`
- [x] Add/remove items with backend sync
- [x] Local storage fallback for guest users

---

## Remaining Features (Lower Priority)

### Advanced Inventory
- [ ] Reserve stock on checkout (requires inventory-service API)
- [ ] Back-in-stock email notifications (requires notification service)
- [ ] Real-time inventory updates via WebSocket

---

## Architecture Reference

### Service URLs (Development)
```
products-service:        http://localhost:3107
customers-service:       http://localhost:8089
orders-service:          http://localhost:3108
settings-service:        http://localhost:8085
payment-service:         http://localhost:8086
reviews-service:         http://localhost:8084
tenant-router-service:   http://localhost:8080
```

### Backend Endpoints Added

#### Cart Endpoints (customers-service)
```
GET    /api/v1/customers/:id/cart           - Get cart
POST   /api/v1/customers/:id/cart           - Add item to cart
PUT    /api/v1/customers/:id/cart           - Sync entire cart
DELETE /api/v1/customers/:id/cart           - Clear cart
PUT    /api/v1/customers/:id/cart/items/:id - Update item quantity
DELETE /api/v1/customers/:id/cart/items/:id - Remove item
POST   /api/v1/customers/:id/cart/merge     - Merge guest cart
```

#### Wishlist Endpoints (customers-service)
```
GET    /api/v1/customers/:id/wishlist             - Get wishlist
POST   /api/v1/customers/:id/wishlist             - Add to wishlist
PUT    /api/v1/customers/:id/wishlist             - Sync wishlist
DELETE /api/v1/customers/:id/wishlist             - Clear wishlist
DELETE /api/v1/customers/:id/wishlist/:productId  - Remove item
```

### Key Files
```
Authentication:
- store/auth.ts
- lib/api/auth.ts
- app/[slug]/login/page.tsx
- app/[slug]/register/page.tsx

Cart:
- store/cart.ts (with backend sync)
- lib/api/cart.ts

Wishlist (unified into Lists):
- store/lists.ts (multi-list with default list, backend sync)
- /api/lists (REST routes for list CRUD + items)

Reviews:
- lib/api/reviews.ts
- components/product/ProductReviews.tsx

Account:
- app/[slug]/account/page.tsx (profile)
- app/[slug]/account/settings/page.tsx
- app/[slug]/account/addresses/page.tsx
- app/[slug]/account/payment/page.tsx
- app/[slug]/account/orders/page.tsx
```

---

Last Updated: 2025-12-22
