# REST API Documentation

The Agricultural Farm Management System API provides CRUD operations for all 28 domain entities, along with real-time analytics and authentication.

Base URL (Local): `http://localhost:4000/api`  
Content-Type: `application/json`

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Cannot delete farmer: associated farms exist",
  "details": []
}
```

---

## System Endpoints

### 1. Health Check
- **Endpoint:** `GET /health`
- **Description:** Verifies server uptime and Redis connection status.
- **Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-13T05:39:09.443Z",
    "uptime": "120s",
    "redis": {
      "connected": true,
      "ping": "PONG"
    }
  }
}
```

### 2. Dashboard Statistics
- **Endpoint:** `GET /dashboard/stats`
- **Description:** Returns aggregate entity counts computed via Redis `SCARD` over index sets and calculated ledger metrics.
- **Response:**
```json
{
  "success": true,
  "data": {
    "entityCounts": {
      "farmers": 1,
      "farms": 1,
      "fields": 1,
      "crops": 1,
      "crop_seasons": 1,
      "harvests": 1,
      "inventory_items": 1,
      "suppliers": 1,
      "workers": 1,
      "equipment": 1,
      "customers": 2,
      "sales": 1,
      "payments": 1
    },
    "summary": {
      "totalRevenue": 17500,
      "totalHarvestQuantity": 2500,
      "activeFarms": 1,
      "totalWorkers": 1,
      "totalEquipment": 1
    }
  }
}
```

---

## Authentication Endpoints

### 1. User Login
- **Endpoint:** `POST /api/auth/login`
- **Body:**
```json
{
  "email": "admin@agrifarm.local",
  "password": "AdminPassword123!"
}
```
- **Returns:** User profile, CSRF token, and HttpOnly session cookie (`token`).
- **Protection:** Brute-force lockout (5 failed attempts locks account for 15 minutes).

### 2. Current User Profile & CSRF Token
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Cookie: token=<jwt>` or `Authorization: Bearer <jwt>`
- **Returns:** Current authenticated user object and CSRF token.

### 3. CSRF Token Retrieval
- **Endpoint:** `GET /api/auth/csrf-token`
- **Returns:** New or active CSRF token for state-changing operations.

### 4. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Behavior:** Destroys active session in Redis, clears cookie, and records audit trail.

---

## User Management Endpoints (Admin Only)

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/users` | `GET` | List users with pagination, role filter, status filter, and search |
| `/api/users` | `POST` | Create a new user with assigned role (worker by default) |
| `/api/users/:id` | `GET` | Retrieve specific user by ID |
| `/api/users/:id/role` | `PATCH` | Update user role (`admin`, `farm_manager`, `inventory_manager`, `worker`). Protected: cannot demote last admin |
| `/api/users/:id/status` | `PATCH` | Update account status (`active` / `inactive`). Immediately revokes all active sessions if inactive |
| `/api/users/:id` | `DELETE` | Permanently remove user. Protected: cannot delete only remaining admin |

---

## Audit Logs (Admin Only)

- **Endpoint:** `GET /api/audit-logs`
- **Query Parameters:** `?page=1&limit=20&action=USER_LOGIN&entityType=farm`
- **Description:** Returns paginated, immutable security and operational audit records stored in Redis.

---

## Entity CRUD Endpoints (All 28 Entities)

All list endpoints support:
- `?page=1&limit=20` (Pagination)
- `?search=query` (Case-insensitive substring search)
- `?sortBy=name&sortOrder=asc` (Sorting)

| Entity Route | Methods | Supported Query / Relational Sub-routes |
|:---|:---|:---|
| `/farmers` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /farmers/:id/farms` |
| `/farms` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /farms/:id/fields` |
| `/fields` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `farm_id` |
| `/soil-tests` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `field_id` |
| `/water-sources` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `farm_id` |
| `/irrigation` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `field_id` |
| `/crops` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `category` |
| `/crop-varieties` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `crop_id` |
| `/seasons` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Search by `season_name` |
| `/crop-seasons` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `crop_id`, `farm_id` |
| `/suppliers` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /suppliers/:id/items` |
| `/inventory` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `category`, `supplier_id` |
| `/seeds` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `crop_id`, `inventory_item_id` |
| `/fertilizers` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `inventory_item_id` |
| `/pesticides` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `inventory_item_id` |
| `/workers` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /workers/:id/attendance` |
| `/attendance` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `worker_id`, `date` |
| `/equipment` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /equipment/:id/maintenance` |
| `/maintenance` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `equipment_id` |
| `/worker-equipment` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `worker_id`, `equipment_id` |
| `/customers` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /customers/:id/sales` |
| `/harvests` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `crop_season_id`, `field_id` |
| `/sales` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | `GET /sales/:id/payments` |
| `/payments` | `GET`, `POST`, `GET :id`, `PUT :id`, `DELETE :id` | Filtering by `sale_id`, `status` |
| `/phones/farmer` | `GET`, `POST`, `DELETE :id` | Multi-valued phone records for Farmers |
| `/phones/supplier` | `GET`, `POST`, `DELETE :id` | Multi-valued phone records for Suppliers |
| `/phones/worker` | `GET`, `POST`, `DELETE :id` | Multi-valued phone records for Workers |
| `/phones/customer` | `GET`, `POST`, `DELETE :id` | Multi-valued phone records for Customers |
