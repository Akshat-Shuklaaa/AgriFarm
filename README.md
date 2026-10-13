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

## 🧪 Verification & Automated Testing

The repository includes a 13-point automated integration test suite validating:
- Redis connectivity
- Health endpoint response
- Canonical records preservation (Farmer 101, Farm 201, Crop 701, etc.)
- Full CRUD lifecycle (POST -> GET -> PUT -> DELETE)
- Referential integrity protection (blocking deletions of parents with active dependents)
- Validation failure handling (400 Bad Request)
- Missing record responses (404 Not Found)
- Dashboard metric computations from live Redis data

To execute the test suite:
```bash
cd backend
npx tsx test-suite.ts
```

Output:
```
======================================================
 AGRICULTURAL FARM MANAGEMENT SYSTEM - VERIFICATION  
======================================================

[PASS] Step 1: Backend connects to Redis
[PASS] Step 2: GET /api/health returns 200 OK and valid status
[PASS] Step 3: GET /api/farmers returns actual records from Redis
[PASS] Step 4: POST /api/farmers creates a new Redis record with unique ID
[PASS] Step 5: GET /api/farmers/:id retrieves the created record
[PASS] Step 6: PUT /api/farmers/:id updates the record in Redis
[PASS] Step 7: DELETE /api/farmers/:id deletes record cleanly
[PASS] Step 8: Related farmer/farm relationships remain consistent
[PASS] Step 9: Invalid data is rejected with 400 Bad Request
[PASS] Step 10: Missing records produce 404 Not Found
[PASS] Step 11: Deletion of farmer with dependent farms is blocked
[PASS] Step 12: Dashboard statistics compute real Redis metrics
[PASS] Step 13: Existing canonical Redis records remain intact

======================================================
               TEST RESULTS SUMMARY                   
======================================================
Passed: 13 / 13
ALL VERIFICATION CRITERIA SATISFIED SUCCESSFULLY!
======================================================
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
