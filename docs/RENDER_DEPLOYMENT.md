# 🚀 Deploying Kaam Setu on Render

This guide provides step-by-step instructions and all configuration details required to deploy **Kaam Setu** on [Render](https://render.com).

---

## 🏗️ Architecture on Render

Kaam Setu runs on Render as a connected multi-service setup:

```
┌────────────────────────────────────────────────────────┐
│                   KAAM SETU ON RENDER                  │
├──────────────────────────┬─────────────────────────────┤
│  Customer Web Portal     │  Worker Pro Web Portal      │
│  Type: Static Site       │  Type: Static Site          │
│  Publish: apps/customer  │  Publish: apps/worker       │
└────────────┬─────────────┴──────────────┬──────────────┘
             │                            │
             │ HTTPS / WSS API & Sockets  │
             ▼                            ▼
┌────────────────────────────────────────────────────────┐
│              Backend API & WebSocket Server            │
│  Type: Web Service (Node.js)                           │
│  Port: Auto-assigned by Render ($PORT)                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ Prisma ORM (PostgreSQL)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Managed PostgreSQL Database               │
│  Type: Render PostgreSQL Database                      │
│  Plan: Free Tier                                       │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Quick Reference Table

| Component | Render Service Type | Root Directory | Build Command | Start / Publish Command | Health Check Path |
|---|---|---|---|---|---|
| **Database** | PostgreSQL | — | — | — | — |
| **Backend API** | Web Service | `.` (or blank) | `npm install --include=dev && npm run build:server` | `npm run deploy:prod --workspace=@hyperlocal/server` | `/api/health` |
| **Customer App** | Static Site | `.` (or blank) | `npm install --include=dev && npm run build:customer` | `apps/customer/dist` | — |
| **Worker Pro App** | Static Site | `.` (or blank) | `npm install --include=dev && npm run build:worker` | `apps/worker/dist` | — |

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Create a PostgreSQL Database on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **PostgreSQL**.
3. Fill in the details:
   - **Name**: `kaamsetu-postgres`
   - **Database**: `kaamsetu`
   - **User**: `kaamsetu_user`
   - **Region**: Choose closest to your users (e.g. `Singapore` or `Oregon`)
   - **Plan**: `Free`
4. Click **Create Database**.
5. Once created, keep the page open or copy the **Internal Database URL** (e.g., `postgresql://kaamsetu_user:...@dpg-...-a/kaamsetu`).

---

### Step 2: Deploy the Backend Web Service

1. On the Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository: `https://github.com/Jain07Himanshu/KaamSetu.git` (or select from list).
3. Configure the service settings:
   - **Name**: `kaamsetu-api`
   - **Region**: Same region as your database (e.g. `Singapore`)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (monorepo root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build:server
     ```
   - **Start Command**:
     ```bash
     npm run deploy:prod --workspace=@hyperlocal/server
     ```
     *(This automatically syncs PostgreSQL Prisma schema, pushes database tables, runs initial idempotent seed, and starts the server)*
   - **Plan**: `Free`
4. Expand **Advanced** and set **Health Check Path** to:
   ```
   /api/health
   ```
5. Add the following **Environment Variables**:

| Variable Key | Value / Source |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Select **"Add from database"** ➔ `kaamsetu-postgres` (or paste your **Internal Database URL**) |
| `JWT_SECRET` | Any strong secret (e.g., `kaam-setu-super-secret-jwt-key-2026-render`) |
| `JWT_EXPIRES_IN` | `7d` |

6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to finish. Once live, note your backend URL:
   - **Backend URL**: `https://kaamsetu-api.onrender.com` (example)
   - Test it by opening: `https://kaamsetu-api.onrender.com/api/health`

---

### Step 3: Deploy the Customer Web App (Static Site)

1. On the Render Dashboard, click **New +** ➔ **Static Site**.
2. Connect your repository.
3. Configure the settings:
   - **Name**: `kaamsetu-customer`
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build:customer
     ```
   - **Publish Directory**:
     ```
     apps/customer/dist
     ```
4. Add the following **Environment Variables**:

| Variable Key | Value |
|---|---|
| `VITE_API_URL` | `https://kaamsetu-api.onrender.com/api` *(use your actual backend URL from Step 2)* |
| `VITE_SOCKET_URL` | `https://kaamsetu-api.onrender.com` *(use your actual backend URL from Step 2)* |

5. **CRITICAL: SPA Redirect/Rewrite Rule**:
   - Scroll down to **Redirects / Rewrites**.
   - Click **Add Rule**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
   - *(This ensures page refreshes on subroutes like `/bookings` or `/jobs/:id` route correctly in React)*
6. Click **Create Static Site**.

---

### Step 4: Deploy the Worker Pro Web App (Static Site)

1. On the Render Dashboard, click **New +** ➔ **Static Site**.
2. Connect your repository.
3. Configure the settings:
   - **Name**: `kaamsetu-worker`
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build:worker
     ```
   - **Publish Directory**:
     ```
     apps/worker/dist
     ```
4. Add the following **Environment Variables**:

| Variable Key | Value |
|---|---|
| `VITE_API_URL` | `https://kaamsetu-api.onrender.com/api` *(use your actual backend URL from Step 2)* |
| `VITE_SOCKET_URL` | `https://kaamsetu-api.onrender.com` *(use your actual backend URL from Step 2)* |

5. **SPA Redirect/Rewrite Rule**:
   - Under **Redirects / Rewrites**, click **Add Rule**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## ⚡ Alternative: 1-Click Render Blueprint (`render.yaml`)

If you prefer deploying everything at once via Render Blueprints:

1. In Render Dashboard, click **Blueprints** (left sidebar).
2. Click **New Blueprint Instance**.
3. Select your repository.
4. Render will parse [`render.yaml`](../render.yaml) and prompt for:
   - `VITE_API_URL`: `https://kaamsetu-api.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://kaamsetu-api.onrender.com`
5. Click **Apply**. Render will automatically provision:
   - The PostgreSQL database
   - The Node.js Web Service
   - Both Customer and Worker Static Sites with rewrite rules!

---

## 💡 Important Tips & Troubleshooting for Render

1. **Free Tier Cold Starts**:
   - On the Render Free Tier, Web Services spin down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to boot up.
   - You can keep it warm by visiting the `/api/health` endpoint or using a free pinging service like Cron-Job.org / UptimeRobot.
2. **WebSocket Support**:
   - Render natively supports WebSockets on all Web Services without extra setup.
   - Our backend Socket.IO configuration supports both `websocket` and `polling` transports automatically.
3. **Database Schema & Data Persistence**:
   - The startup script `npm run deploy:prod` automatically runs `prepare-prisma.js` which detects PostgreSQL, pushes all tables via `prisma db push`, and seeds standard categories and initial test data safely without wiping live data on restarts.
4. **CORS Configuration**:
   - The server has wildcard CORS enabled (`origin: '*'`), allowing requests from any Render static site domain without needing manual CORS changes.
