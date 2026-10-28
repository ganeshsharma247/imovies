# IMovies — Cinema Ticket Booking & Management System

**IMovies** is a full-stack, production-ready cinema reservation and theatre management platform built on the MERN stack (MongoDB, Express, React, Node.js + Socket.IO). It features interactive seat maps, race-condition-safe atomic ticket booking, real-time availability synchronization, QR-code ticket passes, and an administrative control panel.

---

## Key Features

1. **Movie Discovery & Catalog**:
   - Filter by release status (`Now Showing`, `Coming Soon`), genre, and language.
   - Real-time keyword search across movie titles and descriptions.
   - Comprehensive movie synopsis, trailers, certification tags, and runtime indicators.

2. **Theatres & Showtimes**:
   - Multi-auditorium configurations (IMAX Laser 3D, Dolby Atmos, 4DX, Standard 2D).
   - Date selector (Today, Tomorrow, Day 3) with dynamic showtimes and price tier indicators.
   - Automated screening collision detection prevents overlapping shows on the same auditorium screen.

3. **Real-Time Seat Booking & Double-Booking Prevention**:
   - Interactive SVG/CSS cinema seat grid with curved screen perspective ("All Eyes This Way").
   - Pricing tiers: **Silver**, **Gold**, **Platinum**.
   - **Atomic Two-Phase Locking**: Conditional MongoDB queries ensure race-free reservations under concurrent load.
   - **10-Minute Hold Window**: Live hold countdown timer with lazy and periodic TTL expiration.
   - **Socket.IO Synchronization**: Broadcasts seat locks, releases, and commitments in real time across all open client tabs.

4. **Booking Confirmation & QR-Code Tickets**:
   - Safe mock payment gateway supporting Card, UPI, and Net Banking simulations (no real card details or CVVs are ever requested, processed, or persisted).
   - Instant ticket issuance with a cryptographically unique booking reference (`IMV-XXXXXX`) and a scannable QR pass.
   - Printable / saveable digital cinema pass view.

5. **Customer Booking History & Cancellations**:
   - User ticket wallet displaying upcoming admissions and historical receipts.
   - Safe self-service cancellation with automated seat release and mock refund processing (enforcing a 2-hour pre-show cutoff policy).

6. **Admin Dashboard & Cinema Operations**:
   - High-level KPIs: Gross Revenue, Tickets Issued, Confirmed Bookings, and Scheduled Shows.
   - Movie management: Create, update, and manage movie titles and release statuses.
   - Showtime scheduler: Schedule shows with automatic seat matrix generation and collision detection.
   - Booking audit: Platform-wide audit table with search and filtering.

7. **Security & Resiliency**:
   - Salted and hashed passwords using `bcryptjs` (salt rounds: 10).
   - JWT tokens signed with `JWT_SECRET` (`7d` expiration) delivered via Bearer headers.
   - Role-Based Access Control (`user` vs `admin`).
   - Rate limiting via `express-rate-limit` on sensitive endpoints.
   - Automatic in-memory MongoDB fallback (`mongodb-memory-server`) for zero-config local runs, with full support for MongoDB Atlas and persistent `mongod`.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v7, Socket.IO Client.
- **Backend**: Node.js v22, Express.js, Socket.IO, Mongoose, Dotenv, Morgan, Cors, QRCode, Express Rate Limit, Bcryptjs, JsonWebToken.
- **Database**: MongoDB with Mongoose ODM (supports both external clusters and embedded in-memory mode).
- **Testing**: Node.js built-in test runner (`node:test`) and strict assertions.

---

## Directory Structure

```
imovies/
├── client/                             # React 18 + Vite Frontend
│   ├── src/
│   │   ├── api/client.js               # Centralized Axios client with JWT interceptors
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── common/Navbar.jsx       # Header with live Socket.IO status badge
│   │   │   └── movies/MovieCard.jsx    # Movie card with rating and quick-book CTA
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User identity, token persistence & RBAC
│   │   │   └── SocketContext.jsx       # Real-time WebSocket connection
│   │   ├── pages/
│   │   │   ├── public/HomePage.jsx     # Hero spotlight, filters & movie grid
│   │   │   ├── public/MovieDetailPage.jsx # Synopsis, dates & showtime chips
│   │   │   ├── public/TheatresPage.jsx # Theatre locations & amenities
│   │   │   ├── user/SeatSelectionPage.jsx # Interactive seat grid & 10m countdown
│   │   │   ├── user/CheckoutPage.jsx   # Order summary & mock payment
│   │   │   ├── user/BookingConfirmationPage.jsx # QR ticket pass & print view
│   │   │   ├── user/BookingHistoryPage.jsx # Ticket wallet & cancellation modal
│   │   │   ├── admin/AdminDashboard.jsx # KPIs, movie CRUD, show scheduler & audit
│   │   │   └── auth/LoginPage.jsx      # Sign in with instant demo fill buttons
│   │   ├── App.jsx                     # Route architecture & route guards
│   │   └── index.css                   # Tailwind CSS styling
│   ├── index.html
│   └── vite.config.js
│
├── server/                             # Express.js + Socket.IO Backend
│   ├── src/
│   │   ├── config/                     # DB, Socket, Env configurations
│   │   ├── controllers/                # Auth, Movie, Theatre, Show, Booking, Admin
│   │   ├── middlewares/                # Error handling, Auth JWT, RBAC, Rate limiter
│   │   ├── models/                     # User, Movie, Theatre, Show, Booking, Payment, Notification
│   │   ├── routes/                     # REST API route handlers
│   │   ├── services/                   # Atomic SeatLockService, QRService
│   │   └── server.js                   # HTTP + Socket.IO bootstrap & graceful shutdown
│   ├── seed/
│   │   └── seeder.js                   # Idempotent cinema seed script
│   └── tests/                          # 58 automated tests
│       ├── health.test.js
│       ├── models.test.js
│       ├── auth.test.js
│       ├── moviesAndShows.test.js
│       ├── bookingWorkflow.test.js     # Concurrency double-booking race condition test
│       ├── adminOperations.test.js
│       └── rateLimiter.test.js
│
├── Dockerfile                          # Multi-stage production container build
├── docker-compose.yml                  # Full stack compose with MongoDB 7 service
├── render.yaml                         # Cloud blueprint for Render
├── package.json                        # Root monorepo script runner
└── README.md
```

---

## Quick Start & Installation

### Prerequisites
- Node.js >= 18.0.0 (Node 22 recommended)
- npm >= 9.0.0
- (Optional) Local `mongod` or MongoDB Atlas URI. If no external MongoDB daemon is active, an in-memory MongoDB instance automatically boots up.

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Environment Variables
Both `server/` and `client/` have `.env.example` templates and pre-configured default `.env` files for immediate local development.

- **`server/.env`**:
  ```env
  PORT=5001
  NODE_ENV=development
  MONGODB_URI=mongodb://127.0.0.1:27017/imovies
  USE_MEMORY_DB_FALLBACK=true
  CLIENT_URL=http://localhost:5173
  JWT_SECRET=imovies_development_secret_key_change_in_production_2026
  JWT_EXPIRES_IN=7d
  SEAT_HOLD_DURATION_MINUTES=10
  ```

- **`client/.env`**:
  ```env
  VITE_API_URL=http://localhost:5001/api/v1
  VITE_SOCKET_URL=http://localhost:5001
  ```

### 3. Seed Database
To populate movies, theatres, and shows with seat inventories:
```bash
npm run seed
```

> [!NOTE]
> **Demo Credentials**:
> - **Admin**: `admin@imovies.com` / `AdminPassword123!`
> - **Customer**: `user@imovies.com` / `UserPassword123!`
> Both can be filled with a single click using the "Instant Demo Logins" buttons on the Sign In page.

### 4. Run Development Servers
From the root directory:
```bash
# Starts both Express (port 5001) and Vite (port 5173) concurrently
npm run dev
```

### 5. Running Automated Tests & Production Build
```bash
# Run all 58 backend tests (including double-booking concurrency test)
npm test

# Verify frontend production bundle
npm run build:client
```

---

## Complete API Reference

Base URL: `http://localhost:5001/api/v1`

### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new user; issues JWT |
| `POST` | `/auth/login` | Public | Authenticate credentials; issues JWT |
| `GET` | `/auth/me` | Authenticated | Retrieve profile |
| `PUT` | `/auth/profile` | Authenticated | Update profile details or password |
| `GET` | `/auth/admin-check` | Admin only | RBAC verification check |

### Movies (`/movies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/movies` | Public | List movies (`status`, `genre`, `search`, `page`, `limit`) |
| `GET` | `/movies/:id` | Public | Retrieve single movie details |
| `GET` | `/movies/:id/shows`| Public | Retrieve shows for movie (`date`, `city`) |

### Theatres (`/theatres`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/theatres` | Public | List theatres (`city`, `amenity`) |
| `GET` | `/theatres/:id` | Public | Retrieve single theatre |
| `GET` | `/theatres/:id/shows` | Public | Retrieve shows at theatre |

### Shows (`/shows`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/shows/:id` | Public | Show metadata and pricing tiers |
| `GET` | `/shows/:id/seats` | Public / Optional Auth | Live seat matrix; lazily cleans expired holds |

### Bookings (`/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/bookings/lock-seats` | Authenticated | Atomically hold seats for 10 minutes |
| `POST` | `/bookings/release-seats`| Authenticated | Manually release held seats |
| `POST` | `/bookings/confirm` | Authenticated | Commit lock, execute mock payment, generate QR ticket |
| `GET` | `/bookings/my-bookings` | Authenticated | Customer booking history (paginated) |
| `GET` | `/bookings/:id` | Owner / Admin | Ticket pass details |
| `POST` | `/bookings/:id/cancel` | Owner / Admin | Cancel booking, release seats, initiate refund |

### Admin (`/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | Admin only | Aggregated platform KPIs |
| `POST` | `/admin/movies` | Admin only | Add new movie |
| `PUT` | `/admin/movies/:id` | Admin only | Update movie |
| `DELETE` | `/admin/movies/:id` | Admin only | Delete movie |
| `POST` | `/admin/theatres` | Admin only | Add theatre |
| `PUT` | `/admin/theatres/:id` | Admin only | Update theatre |
| `POST` | `/admin/shows` | Admin only | Schedule show with collision detection |
| `DELETE` | `/admin/shows/:id` | Admin only | Cancel show with refund cascade |
| `GET` | `/admin/bookings` | Admin only | Platform-wide bookings audit |

---

## Deployment Guide

### Option 1: Docker & Docker Compose
To run the entire system with a persistent MongoDB container:
```bash
docker-compose up --build
```
The application will be accessible on `http://localhost:5001`.

### Option 2: Render / Railway / Fly.io (Single Container or Web Service)
1. In production (`NODE_ENV=production`), the Express backend automatically serves the pre-compiled React application from `client/dist`.
2. Connect your repository to Render or Railway using the provided `render.yaml` or standard Node service.
3. Configure environment variables in the cloud provider's dashboard:
   - `NODE_ENV=production`
   - `PORT=10000` (or host provided port)
   - `MONGODB_URI=<your_mongodb_atlas_connection_string>`
   - `JWT_SECRET=<strong_secret_key>`
   - `SEAT_HOLD_DURATION_MINUTES=10`
   - `USE_MEMORY_DB_FALLBACK=false`
