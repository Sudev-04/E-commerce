# 🛍️ ShopNext — Full Stack E-Commerce Store

A full-stack e-commerce store built with **Next.js 14** (App Router, SSR, SSG + ISR) and **Node.js + Express** (JWT auth, middleware). Prices are in Indian Rupees (₹, GST inclusive).

---

## 🏗️ Architecture Overview

```
Browser ──► Next.js (frontend) ──► Express API (backend)
             │  pages (SSR/SSG)      │  products, cart, orders, users
             │  /api/auth/*  ───────►│  /api/auth/*  (login, refresh…)
             │  /api/proxy/* ───────►│  /api/*       (Bearer token added)
             │  middleware.ts: verifies the signed JWT for protected pages
             └─ session tokens live in httpOnly cookies (never in JS/localStorage)
```

```
backend/
├── server.js                 # Middleware, rate limits, routes, error handler
├── controllers/              # auth, product, cart (incl. guest-cart merge), order
├── middleware/               # protect(), authorize(), errorHandler, validate()
├── models/store.js           # In-memory store: 54 products, 2 users, carts, orders
├── routes/                   # auth, products, cart, orders, users
└── utils/                    # jwt, pricing (₹ shipping rules), apiResponse

frontend/
├── middleware.ts             # Route protection; role read from the signed JWT
├── lib/
│   ├── session.ts            # Cookie names, JWT verification (jose)
│   ├── bff.ts                # Helpers for the Next.js → backend route handlers
│   ├── api.ts                # serverFetch (SSR) + clientFetch (via /api/proxy)
│   ├── auth.ts               # login / register / logout / session calls
│   └── format.ts             # ₹ formatting, category names, plurals, totals
└── app/
    ├── api/auth/*            # login, register, logout, session (set httpOnly cookies)
    ├── api/proxy/[...path]   # Forwards browser API calls with the session token
    ├── page.tsx              # Home: categories, featured, deals, new, top rated
    ├── products/             # Listing (SSR + filters) and detail (SSG + ISR)
    ├── cart/                 # Works for guests; merges into account on sign-in
    ├── checkout/             # Address + payment method → places an order
    ├── orders/               # Order history and confirmation
    ├── dashboard/            # Account dashboard; admin/ = product CRUD + users
    └── about, contact, privacy, terms
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Start the Backend

```bash
cd backend
npm install
cp .env.example .env    # optional for local dev; required in production
npm run dev
```
Backend runs on **http://localhost:5000**

### 2. Start the Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # optional for local dev
npm run dev
```
Frontend runs on **http://localhost:3000**

Or run `start.bat` on Windows to start both.

### Environment variables

| Where    | Variable             | Purpose |
|----------|----------------------|---------|
| backend  | `JWT_SECRET`         | Signs access tokens. **Required in production.** |
| backend  | `JWT_REFRESH_SECRET` | Signs refresh tokens. **Required in production.** |
| backend  | `FRONTEND_URL`       | Allowed CORS origin |
| frontend | `BACKEND_URL`        | URL of the Express API (server-side only) |
| frontend | `JWT_SECRET`         | **Same value as the backend's `JWT_SECRET`.** Used by the middleware to verify sessions. If it is missing in production, every protected page redirects to sign-in. |

In local development both apps fall back to a shared dev secret, so no `.env` files are needed.

---

## 🔐 Demo Accounts

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Admin | admin@example.com   | admin123    |
| User  | john@example.com    | password123 |

> Or use the demo buttons on the sign-in page.

---

## ✨ Key Features

### Frontend (Next.js 14)
| Feature | Implementation |
|---------|----------------|
| **Server Components + SSR** | Home and product listing fetch on the server and stream with Suspense |
| **SSG + ISR** | All product pages pre-rendered; revalidated every 5 min and on admin edits |
| **Secure sessions** | httpOnly, SameSite=Lax cookies set by Next.js route handlers |
| **Middleware** | Verifies the JWT signature; admin role comes from the token, not a cookie |
| **Guest cart** | Stored in the browser, merged into the account after sign-in |
| **Checkout & orders** | Address form (Indian states, PIN code), COD / UPI / card (demo), order history |
| **Admin panel** | Add, edit and delete products; view users |
| **Accessibility** | Labelled icon buttons, form labels, live regions, real 404 status |

### Backend (Node.js + Express)
| Feature | Implementation |
|---------|----------------|
| **JWT Auth** | Access token (7d) + rotating refresh token (30d) |
| **Custom Middleware** | `protect()`, `authorize()`, `optionalAuth()` |
| **Error Handling** | `AppError` class + global `errorHandler` middleware |
| **Validation** | express-validator on auth, cart, products and orders |
| **Rate Limiting** | Per shopper IP (forwarded by the frontend) |
| **Pricing** | Free delivery ≥ ₹499, else ₹49; prices include 18% GST |

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/register     Create account
POST   /api/auth/login        Login + tokens
POST   /api/auth/refresh      Rotate tokens
POST   /api/auth/logout       Revoke refresh token
GET    /api/auth/me           Current user (🔒)
```

### Products
```
GET    /api/products          List (category, search, sort, minPrice, maxPrice, featured, page, limit)
GET    /api/products/featured All featured products
GET    /api/products/categories
GET    /api/products/:id
POST   /api/products          Create (🔒 admin)
PUT    /api/products/:id      Update (🔒 admin)
DELETE /api/products/:id      Delete (🔒 admin)
```
Sort values: `price_asc`, `price_desc`, `rating`, `discount`, `newest`.

### Cart (🔒)
```
GET    /api/cart
POST   /api/cart/add          { productId, quantity }
POST   /api/cart/merge        { items: [{ productId, quantity }] }  (guest cart → account)
PUT    /api/cart/update       { productId, quantity }
DELETE /api/cart/remove/:id
DELETE /api/cart/clear
```

### Orders (🔒)
```
POST   /api/orders            { shippingAddress, paymentMethod: cod | upi | card }
GET    /api/orders            Your orders
GET    /api/orders/:id
```

---

## 🛠️ Next Steps for Production

1. **Replace the in-memory store** with MongoDB or PostgreSQL (data resets when the server restarts)
2. **Integrate a real payment gateway** (e.g. Razorpay) for UPI and cards
3. **Email verification** and order confirmation emails
4. **Product reviews** written by customers
5. **Image uploads** with Cloudinary or S3
