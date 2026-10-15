# Production Deployment Guide

This guide details the exact production deployment steps for the **Agricultural Farm Management System** across:
- **Frontend:** Vercel
- **Backend:** Render (or Railway / AWS / DigitalOcean)
- **Database:** Redis Cloud (Managed Redis)

---

## 🗄️ Phase 1: Database Setup on Redis Cloud

1. **Sign Up / Login:** Navigate to [Redis Cloud Console](https://app.redislabs.com/).
2. **Create a Subscription:**
   - Choose the cloud provider (AWS, Google Cloud, or Azure) and desired region (e.g. `ap-south-1` Mumbai or closest to your users).
   - Select the Free Tier (30MB) or a standard production plan with High Availability and automated daily snapshots.
3. **Create Database:**
   - Protocol: `Redis`
   - Data Access Control: Create a secure user password.
4. **Obtain Connection String:**
   - Under database configuration, copy the **Public Endpoint** and **Port**.
   - Your production `REDIS_URL` will look like:
     ```
     redis://default:YOUR_PASSWORD@redis-12345.c123.ap-south-1-1.ec2.redislabs.com:12345
     ```
5. **Initial Seeding / Verification for Production:**
   - Test the connection safely without writing any data using dry-run mode:
     ```bash
     # From root or backend directory:
     REDIS_URL="redis://default:YOUR_PASSWORD@..." npm run seed:dry-run
     ```
   - Run the safe idempotent seed script pointing to your Redis Cloud URL to establish schema indexes:
     ```bash
     # From root or backend directory:
     REDIS_URL="redis://default:YOUR_PASSWORD@..." npm run seed
     ```
     *(Note: Existing keys are safely preserved and never deleted or overwritten by default).*

---

## 🖥️ Phase 2: Backend Deployment on Render

1. **Create Web Service:**
   - Connect your GitHub repository to [Render Dashboard](https://dashboard.render.com/).
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
2. **Configure Environment Variables:**
   Under **Environment** in the Render settings, add:
   ```env
   NODE_ENV=production
   PORT=10000
   REDIS_URL=redis://default:YOUR_PASSWORD@...
   CORS_ORIGINS=https://your-agrifarm-frontend.vercel.app
   JWT_SECRET=production_generated_high_entropy_secret_key_32_chars_minimum
   JWT_EXPIRES_IN=1d
   ```
3. **Health Check Path:**
   - Set health check path to `/api/health`.
4. **Deploy:** Click **Create Web Service**. Note the assigned URL, e.g., `https://agrifarm-backend.onrender.com`.

---

## 🌐 Phase 3: Frontend Deployment on Vercel

1. **Import Project:**
   - Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
   - Select your Git repository.
   - Root Directory: Choose `frontend`.
2. **Framework Preset:** Select `Next.js`.
3. **Configure Environment Variables:**
   Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://agrifarm-backend.onrender.com/api
   ```
4. **Deploy:** Click **Deploy**. Vercel will build the production Next.js app and provide an HTTPS production URL.

---

## 📋 Production Environment Variables Checklist

- [x] `NEXT_PUBLIC_API_URL` uses HTTPS and points to the live backend URL.
- [x] `REDIS_URL` uses secure credentials and is never exposed with `NEXT_PUBLIC_` prefix.
- [x] `CORS_ORIGINS` explicitly matches the deployed Vercel domain (disallowing wildcard `*` with credentials).
- [x] `JWT_SECRET` is at least 32 characters long and not committed to Git.
- [x] Redis persistence (`AOF` and `RDB`) is enabled in Redis Cloud settings.
- [x] Backend automated restart and health checks are configured to monitor `/api/health`.
