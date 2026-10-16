# Smart Agricultural Farm Management System (DA3 Implementation)

A production-grade full-stack agricultural management platform transitioning an Oracle SQL database (DA2) to high-performance in-memory Redis Hashes and Sets (DA3).

---

## 🌾 Overview & Domain Architecture

The **Agricultural Farm Management System** manages modern farming operations across **28 distinct entities**:
1. **Land & Infrastructure:** Farmers, Farmer Phones, Farms, Fields, Soil Tests, Water Sources, Irrigation Systems
2. **Crop Lifecycle:** Crops, Crop Varieties, Agricultural Seasons, Crop Seasons, Harvest Lots
3. **Supply & Inventory:** Suppliers, Supplier Phones, Inventory Items, Seed Batches, Fertilizer Formulations, Pesticide Batches
4. **Labor & Machinery:** Agricultural Workers, Worker Phones, Attendance Logs, Machinery & Equipment, Maintenance History, Worker Equipment Assignments
5. **Commerce & Finance:** Customers, Customer Phones, Commodity Sales, Financial Settlements & Payments

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Hook Form, Zod.
- **Backend:** Node.js 20/24, Express, TypeScript, ioredis, Zod, Helmet, CORS, Morgan, Cookie Parser, Rate Limiting.
- **Database:** Redis 7+ (In-Memory Key-Value store utilizing Hashes, Sets, and Atomic Pipelines).
- **Containerization & Ops:** Docker, Docker Compose with persistent named volumes and automated health checks.

---

## 📂 Project Structure

```
├── backend/                  # Express REST API (TypeScript + ioredis)
│   ├── src/
│   │   ├── config/          # Environment & Redis connection config
│   │   ├── middleware/      # Auth, rate limiting, error handling, validation
│   │   ├── repositories/    # Redis base repository, atomic pipeline operations
│   │   ├── routes/          # REST endpoints for all 28 entities + stats + auth
│   │   ├── services/        # Business logic & dependency validation
│   │   ├── utils/           # Atomic ID counters & response helpers
│   │   └── validation/      # Zod request validation schemas
│   ├── .env.example
│   ├── Dockerfile
│   └── test-suite.ts        # Automated integration test suite
│
├── frontend/                 # Next.js 16 Responsive SaaS Application
│   ├── src/
│   │   ├── app/             # App router pages, globals.css, layout
│   │   ├── components/      # Sidebar, Header, Dashboard, EntityCrud, Reports
│   │   └── lib/             # Typed API client, entity schema metadata
│   ├── .env.example
│   └── public/
│
├── database/                 # Seeding and Migration Engine
│   └── seed.ts              # Idempotent seed script with dry-run support
│
├── docker-compose.yml        # Development & Deployment orchestration
├── package.json              # Root project management scripts
├── API_DOCUMENTATION.md      # Complete REST API reference
├── REDIS_SCHEMA.md           # Oracle DA2 to Redis DA3 schema documentation
├── DEPLOYMENT.md             # Production cloud deployment guide (Vercel + Render + Redis Cloud)
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** v20+ or v24+
- **Docker & Docker Compose** (or a local Redis server running on port 6379)

### 1. Redis Database Setup
If using the local Docker container (already populated):
```bash
# Check if container is running
docker ps --filter "name=redis"

# If starting fresh via Docker:
docker run -d --name redis -p 6379:6379 redis:latest
```

### 2. Backend API Setup
```bash
cd backend
npm install
npm run build
npm start
# Server starts on http://localhost:4000
```
Or start in development hot-reload mode:
```bash
npm run dev
```

Verify backend health:
```bash
curl http://localhost:4000/api/health
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000 in your browser
```

### 4. Running the Complete System via Root Scripts
From the root repository directory:
```bash
# Start backend
npm run dev:backend

# In another terminal, start frontend
npm run dev:frontend

# Run safe idempotent seed (preserves existing records)
npm run seed

# Run dry-run seed
npm run seed:dry-run
```

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

The system features an enterprise-grade authentication, authorization, and audit logging architecture backed by Redis:

### 1. Security Architecture
- **Password Protection:** Passwords securely hashed with **bcrypt (12 salt rounds)**. Plaintext passwords and hashes are never exposed in API responses or frontend state.
- **Session Management:** Stateful Redis sessions (`auth:session:<id>`) with 24-hour TTL, cross-checked on every request. Instant revocation upon user logout or account deactivation.
- **CSRF Defense:** State-changing API mutations protected via dual-cookie/header validation (`X-CSRF-Token` / `X-Requested-With`).
- **Brute-Force Protection:** Automatically tracks failed login attempts in Redis (`auth:login_attempts:<email>`). Enforces a 15-minute account lockout after 5 consecutive failed attempts.
- **Security Audit Logging:** Immutable audit trail recorded in Redis (`auth:audit:<id>`) indexed by sorted set timestamps. Automatically logs all logins, logouts, administrative changes, and entity mutations with actor metadata and sanitized payloads.
- **Namespace Isolation:** All authentication and security records reside under the strictly isolated `auth:*` key space, guaranteeing complete zero-interference with all 28 existing farm management entity records.

### 2. Role-Based Access Control (RBAC) Matrix

| Resource Category | Operations | Admin | Farm Manager | Inventory Manager | Worker |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **User Directory** | CRUD, Role, Status | Full (`*`) | Denied | Denied | Denied |
| **Audit Logs** | Security Trail | Read | Denied | Denied | Denied |
| **System Settings** | Architecture & Keys | Full (`*`) | Denied | Denied | Denied |
| **Land & Farms** | Farmers, Farms, Fields, Soil, Water | Full (`*`) | Full CRUD | Read-only | Read-only |
| **Crops & Seasons** | Crops, Varieties, Seasons, Harvests | Full (`*`) | Full CRUD | Read-only | Read-only |
| **Supplies & Stock** | Suppliers, Seeds, Fertilizer, Pesticide | Full (`*`) | Read-only | Full CRUD | Denied |
| **Workforce** | Workers, Attendance, Assignments | Full (`*`) | Full CRUD | Assigned Tools | Log Check-in |
| **Machinery** | Equipment & Maintenance | Full (`*`) | Read-only | Full CRUD | Read assigned |
| **Sales & Billing** | Customers, Invoices, Payments | Full (`*`) | Create/Edit (No Delete) | Denied | Denied |

### 3. Demo Role Accounts

For quick local testing and evaluation, the login screen provides 1-click quick-fill cards for the 4 role tiers:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@agrifarm.local` | `AdminPassword123!` | System administrator (full access, user directory, audit logs) |
| **Farm Manager** | `manager@agrifarm.local` | `ManagerPassword123!` | Farm operations, land, crops, workforce, harvests, sales |
| **Inventory Manager** | `inventory@agrifarm.local` | `InventoryPassword123!` | Suppliers, inventory batches, fertilizers, seeds, machinery |
| **Worker** | `worker@agrifarm.local` | `WorkerPassword123!` | Field tasks, view assigned equipment, check-in attendance |

Seed demo accounts with zero data overwrite:
```bash
npm run seed:users
```

Or bootstrap a custom primary administrator:
```bash
ADMIN_EMAIL="custom.admin@domain.com" ADMIN_PASSWORD="YourSecurePassword123!" npm run bootstrap:admin
```

---

## 🧪 Verification & Automated Testing

### 1. Authentication & RBAC Test Suite (50 Automated Checks)
Validates password hashing, brute-force lockout, session invalidation, account deactivation, last-admin protection, permission enforcement, and key isolation:
```bash
npm run test:auth
```

### 2. Entity Integration Test Suite (13 Automated Checks)
Validates referential integrity, foreign key relations, and CRUD pipeline operations across farm management entities:
```bash
cd backend
npx tsx test-suite.ts
```

---

## 🛡️ Security & Environment Configuration

### Environment Variables

#### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `4000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` or `redis://default:pw@host:port` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000` |
| `JWT_SECRET` | Secret key for JWT tokens | `supersecret_change_in_prod` |
| `JWT_EXPIRES_IN` | Token expiration period | `1d` |

#### Frontend (`frontend/.env.local`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Public URL of Backend API | `http://localhost:4000/api` |

---

## 📊 Dashboards & Analytical Reports

- **Real Redis Metrics:** Displays active counts for all 28 entities computed via Redis `SCARD` over index sets.
- **Harvest by Crop:** Bar charts displaying output volumes by crop type.
- **Asset Allocation:** Pie chart showing proportion of inventory batches vs. farm equipment.
- **Invoices & Settlements:** Real billing balances comparing sales invoices with payment receipts.
- **Relational Integrity:** Farmers to Farms, Farms to Fields, Crops to Varieties, Equipment to Maintenance logs.

---

## 📄 License & Credits
Developed for College DBMS DA3 Project. Preserves and extends original Oracle DA2 schema specifications.
