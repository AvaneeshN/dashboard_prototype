# Nexus Portal — Dual-Dashboard Platform

An interactive, modern dual-dashboard web application replacing Google Forms and Google Drive with **Next.js**, **Tailwind CSS**, **Framer Motion / Skiper UI**, **Three.js / Spline 3D graphics**, and **Supabase (PostgreSQL + Auth + Realtime)**.

---

## Features
- **Client Portal (`/client`)**: Multi-step interactive intake wizard, draft auto-save, file uploads, abandonment tracking, and submission receipt hub.
- **Company Admin Dashboard (`/admin`)**: Executive growth KPIs, multi-step drop-off funnel analytics, searchable submissions table with detailed slide-over inspector, CSV data export, and security audit logs.
- **Auth Gateway (`/`)**: 3D interactive hero scene, Skiper UI tab switcher (Client Sign In, Client Registration, Admin Login), and live security telemetry.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Your `.env.local` is already configured with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://budhnvdyzrmoubuwjonc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bP73jhmdP0sMFLczy7HLbQ_Zk1G2TOR
```

### 3. Database Migration
Run the SQL queries in [`supabase/schema.sql`](./supabase/schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard/project/budhnvdyzrmoubuwjonc/sql).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

For full prerequisites and test scenarios, see [`REQUIREMENTS.md`](./REQUIREMENTS.md).
