# System Prerequisites & Local Setup Guide

This document contains everything needed to install dependencies, configure the Supabase database, and run the **Nexus Portal (Dual-Dashboard Platform)** locally.

---

## 💻 1. System Requirements

Ensure you have the following installed on your machine:

| Requirement | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.18.0` | `v20.x` or `v22.x` | `node -v` |
| **npm** | `>= 9.0.0` | `10.x+` | `npm -v` |
| **Operating System** | Windows, macOS, or Linux | Any modern 64-bit OS | - |
| **Browser** | Modern WebGL-enabled browser | Chrome, Edge, Brave, Firefox, Safari | - |

---

## 📦 2. Dependencies List

All dependencies are defined in [`package.json`](file:///e:/dashboard_prototype/package.json):

### Core Runtime Dependencies
- `next`: `^16.3.4` (React App Router framework)
- `react` & `react-dom`: `^19.2.8`
- `@supabase/supabase-js`: `^2.112.4` (Supabase client SDK)
- `@supabase/ssr`: `^0.12.5` (Server-side rendering auth helper)
- `framer-motion`: `^13.1.1` (Skiper UI motion transitions & animations)
- `three`: `^0.185.1` (Interactive 3D WebGL background scene)
- `@types/three`: `^0.185.4`
- `lucide-react`: `^1.39.0` (Modern icon set)
- `recharts`: `^3.10.1` (Data visualization charts)
- `canvas-confetti`: `^1.9.4` (Celebration confetti micro-interaction)
- `clsx` & `tailwind-merge`: Modern className composition

### Development & Styling
- `tailwindcss`: `^4` (Tailwind CSS styling engine)
- `@tailwindcss/postcss`: `^4`
- `typescript`: `^5` (Static type checking)

---

## ⚡ 3. Quick Local Installation Steps

### Step 1: Install Dependencies
In your project directory (`dashboard_prototype`), run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Verify that `.env.local` exists in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://budhnvdyzrmoubuwjonc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bP73jhmdP0sMFLczy7HLbQ_Zk1G2TOR
```

### Step 3: Run Database Schema in Supabase
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/budhnvdyzrmoubuwjonc/sql).
2. Copy and execute the contents of [`supabase/schema.sql`](file:///e:/dashboard_prototype/supabase/schema.sql).
3. This creates all 4 tables (`profiles`, `form_submissions`, `funnel_events`, `login_activity_logs`) with indexing, triggers, and RLS policies.

### Step 4: Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 4. Testing & Verification Scenarios

### Scenario A: Client Registration & Intake Form
1. On the landing page (`http://localhost:3000`), click **New Client** or use **Demo Client (Alex)**.
2. Complete Step 1 (Company Info), Step 2 (Services), and Step 3 (Budget).
3. Notice the live **Auto-Saving Draft** badge in the top right.
4. On Step 4, click **Submit Intake Form** to verify celebratory confetti and receipt status.

### Scenario B: Drop-Off / Abandonment Detection
1. Start filling Step 1 or Step 2 with a new client email.
2. Leave or close the page without completing Step 4.
3. Open the **Company Admin Dashboard** (`http://localhost:3000/admin`) to verify that the session is flagged as `Abandoned` with the exact drop-off step recorded.

### Scenario C: Company Admin Intelligence & Audit Logs
1. Switch to Admin view or sign in using `admin@company.com`.
2. Inspect the **Executive KPI Cards** (Submissions, Completion Rate, Drop-offs, Security Attempts).
3. Check the **Form Drop-Off Funnel Analysis** to see where clients are getting stuck.
4. Open the **Submissions Explorer** and click **Inspect** on any client to view their detailed responses.
5. Click **Export to CSV** to test downloading client records.
6. Verify failed/successful attempts in the **Security Audit Log**.
