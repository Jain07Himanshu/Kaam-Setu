# 🚀 Deploying Kaam Setu on Render (Unified Single-Site Setup)

Kaam Setu is now a **Single Unified Full-Stack Application**. You only need to deploy **ONE Web Service** on Render!

When you open your single URL (e.g. `https://kaamsetu-app.onrender.com`), you can access both **Customers** and **Workers** with complete styling, colors, and live real-time features.

---

## 🏗️ Architecture on Render

```
┌────────────────────────────────────────────────────────┐
│                   RENDER WEB SERVICE                   │
│                                                        │
│  • Unified Single Frontend (Customer & Worker Portals) │
│  • Express REST API Server                             │
│  • Socket.IO Real-Time Engine                          │
│                                                        │
│  Public URL: https://kaamsetu-app.onrender.com         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ Prisma ORM
                           ▼
┌────────────────────────────────────────────────────────┐
│              Managed PostgreSQL Database               │
│  Type: Render PostgreSQL (Free Tier)                   │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Create a PostgreSQL Database on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **PostgreSQL**.
3. Fill in:
   - **Name**: `kaamsetu-postgres`
   - **Database**: `kaamsetu`
   - **User**: `kaamsetu_user`
   - **Region**: Choose closest to your location (e.g., `Singapore`)
   - **Plan**: `Free`
4. Click **Create Database**.

---

### Step 2: Deploy the Unified Web Service (That's all you need!)

1. On the Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository: `https://github.com/Jain07Himanshu/KaamSetu.git` (or select from list).
3. Configure the settings:
   - **Name**: `kaamsetu-app`
   - **Region**: Same region as your database (e.g., `Singapore`)
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank / empty)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run deploy:prod --workspace=@hyperlocal/server
     ```
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
| `JWT_SECRET` | Any strong secret (e.g., `kaam-setu-super-secret-jwt-key-2026`) |
| `JWT_EXPIRES_IN` | `7d` |

6. Click **Create Web Service**.

---

## 🎉 How to Use Your Single Unified Site Once Deployed

Open your single Render link (e.g. `https://kaamsetu-app.onrender.com`):

1. **Brand Landing Page**:
   - Displays the authentic Kaam Setu brand mark, Indian value propositions, safety features, and pricing in Indian Rupees (`₹`).
2. **Login & Registration for Both Roles**:
   - **Customer Tab**: Sign in or register as a Customer to request services.
   - **Worker Pro Tab**: Sign in or register as a Worker Pro with your trade specialization, hourly rates in ₹, and experience.
3. **1-Click Demo Personas**:
   - Click **Aarav Sharma** or **Pooja Patel** to test as a Customer.
   - Click **Suresh Kumar** (Plumber), **Priya Sharma** (Electrician), **Rajesh Verma** (Cleaning), or **Anita Roy** (Appliance) to test as a Worker Pro.
4. **Header Role Switcher**:
   - In Customer view: Click **"Worker Pro View"** button to jump directly into the trade pro experience.
   - In Worker view: Click **"Customer View"** button to jump directly into the customer experience.
   - Or click the **Demo Switcher** pill in the top header to switch between any persona in 1 click!

---

## ⚡ 1-Click Render Blueprint Alternative

If you have already created a Blueprint:
1. Open Render Dashboard ➔ **Blueprints** ➔ **New Blueprint Instance**.
2. Select your repository.
3. Render reads `render.yaml` and deploys the PostgreSQL database and the unified Web Service in one click!
