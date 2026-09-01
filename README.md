# ✦ Apprenticeship Operations & DBT Subsidy Management Console

An enterprise-grade B2B client portal and administrative operations console designed for **Third-Party Aggregators (TPAs)** and enterprises to manage apprentice workforce intake, statutory quota allocation, monthly stipend payroll, tripartite legal contracts, and **Direct Benefit Transfer (DBT) government subsidy claims** under frameworks like NAPS / NATS.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Supabase.

---

## 🚀 Key Features

### 🏢 1. Enterprise Client Intake Application (4-Section Wizard)
* **Section 01: Organization & Quota Requirements**
  * Company Name, Primary Contact, Work Email, and **Mandatory Contact Phone Number**.
  * Total Apprentice Quota allocation and requirement specifications.
  * **Categorized Apprentice Role Catalog (35+ Roles)** across:
    * *Technology & Engineering* (Full-Stack, Cloud/DevOps, AI/ML, Cyber, QA, Mobile, Data)
    * *Management & Operations* (Product Management, Scrum Master, Supply Chain, Business Analyst)
    * *Design & Creative* (UI/UX, Visual Graphic Design, Motion Design, Technical Writing)
    * *Finance, Accounts & Legal* (Financial Analyst, Junior Accountant, Tax & Audit)
    * *Sales, Marketing & Growth* (Digital Marketing, SEO, Growth, B2B Sales)
    * *Human Resources & Talent* (HR Generalist, Tech Talent Acquisition)
    * *Manufacturing & Industrial* (Industrial Automation, Quality Control, Electrical)
    * *Customer Success & Support* (CS Specialist, Technical Support)
  * **Live Search & Category Filter Pills** for rapid role discovery.
  * **"Others" / Custom Role Addition** with immediate shortcut adding.
  * Removable selected role chip tray with real-time selection counter.
* **Section 02: Payroll, Stipend & DBT Structure**
  * Benchmark stipend configuration (₹15,000 – ₹25,000/mo).
  * Direct Benefit Transfer (DBT) government subsidy opt-in (₹4,500/month per candidate).
  * Proposed Target Joining Date.
  * **Training & Work Location Mode Dropdown**:
    * *Hybrid (Office + Remote Work)*
    * *On-Premise / Corporate Office (Full-Time In-Person)*
    * *Remote / Work From Home (100% Virtual)*
    * *Plant / Industrial Manufacturing Facility*
    * *Client Site / Field Deployment*
    * *Multi-Location / Regional Branch Rotational*
    * *Specialized Tech Park / Innovation Center*
* **Section 03: Legal Contract Template & Compliance Officers**
  * Template selection (Standard Tripartite / Dual-Signed / Corporate Customized).
  * Designated Compliance Officer details & audit notes.
* **Section 04: Mandatory Corporate Compliance Document Uploads**
  * **Company GSTIN Number** & **EPFO / ESIC Establishment Code**.
  * Dedicated document upload slots:
    * Certificate of Incorporation (COI)
    * Company PAN & GST Certificate
    * Authorized Signatory Authorization Letter
    * Cancelled Company Cheque / Bank Account Proof

---

### 👤 2. Interactive Client Dashboard
* **Dynamic Quota & Zero-State Engine**
  * Real-time capacity utilization gauges: Total Capacity, Onboarded Count, and Remaining Slots.
  * Clean zero-state initialization (0 candidates automatically enrolled upon intake).
* **Live Candidate Onboarding ("Add Apprentice" Modal)**
  * Capture Candidate Full Name, Email, Phone, **Aadhaar Number**, Designated Role, Qualification, Monthly Stipend (₹), DBT Subsidy (₹4,500), Joining Date, and **Aadhaar-seeded Bank Details**.
  * Dynamic quota deduction: increments onboarded count and decrements remaining slots in real time.
* **Monthly Stipend Payroll Processing**
  * 1-Click **"Run Monthly Payroll Cycle"** to calculate pro-rated candidate stipends.
  * Real-time financial split: **Company Payout Share** vs. **Government DBT Subsidy Share**.
* **Government DBT Reimbursement Claiming**
  * 1-Click **"File DBT Subsidy Claim"** to submit monthly subsidy claims to the government portal.
  * Generates trackable reference IDs (e.g. `NAPS-PFMS-XXXXXX`) and updates the DBT reimbursement history log.
* **Tripartite Legal Contract Generation**
  * 1-Click preview of the formal **Tripartite Apprenticeship Agreement (Schedule-V)** with candidate stipend breakdown, employer details, legal terms, and a `Mark as Signed` action.
* **CN (Compliance & Credit Note) Audit Remarks**
  * Direct visibility into monthly compliance audit remarks and resolution steps.

---

### 🛡️ 3. Administrative Operations Console
* **Client Intake Registry & Funnel Telemetry**
  * Review, filter, and manage incoming enterprise client intake applications.
  * 1-Click status approvals: `Submitted`, `Under Review`, `Approved`, `In Progress`, `Abandoned`.
* **Multi-Tab Deep Inspector Drawer**
  * **Intake Application Tab**: Full requirements, stipend structure, and compliance officers.
  * **Company Documents Tab**: Inspect uploaded COI, GST, Signatory Authorization, and Cancelled Cheques.
  * **Apprentices Tab**: Inspect the client's live candidate roster with Aadhaar numbers, roles, and stipends.
  * **DBT Claims Tab**: Review and track government DBT reimbursement claims filed by the client.
* **Security & Audit Logs**
  * Real-time IP address logs, timestamps, user-agent tracking, and database sync status.

---

### 🎨 4. Design & Motion System
* **Devlab Swiss Minimal Editorial Theme**: Clean paper backgrounds (`#fafafa`), hairline borders (`#e4e4e7`), solid black capsule pill CTAs, Google Fonts typography (`Plus Jakarta Sans` for geometric headings & `JetBrains Mono` for dates/metrics).
* **Render-Style Website Sweep Transition**: Smooth login mode toggle with directional blur de-focus (`filter: blur(8px)` → `0`), spring inertia, and a luminous leading-edge sheen wipe.
* **Subtle Interactive Particle Field**: Physics-driven background particles with connecting node lines.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16.3 (App Router & Turbopack)
* **Language**: TypeScript 5
* **Styling**: Tailwind CSS v4
* **Motion & Animations**: Framer Motion
* **Charts & Analytics**: Recharts
* **Icons**: Lucide React
* **Database & Auth**: Supabase (PostgreSQL) with full offline-first local fallback

---

## ⚡ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AvaneeshN/dashboard_prototype.git
cd dashboard_prototype
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://budhnvdyzrmoubuwjonc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bP73jhmdP0sMFLczy7HLbQ_Zk1G2TOR
```

### 3. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Kit & Credentials

### Default Administrator Login
* **URL**: [http://localhost:3000](http://localhost:3000) (Toggle to Admin Access)
* **Email**: `admin@company.com`
* **Password**: `admin123`

### Sample Test Documents
Sample compliance documents are provided in [`sample_test_files/`](sample_test_files/) for testing file uploads in Section 4:
* `sample_test_files/Certificate_of_Incorporation_Sample.txt`
* `sample_test_files/GST_Registration_Certificate_Sample.txt`
* `sample_test_files/Signatory_Authorization_Letter_Sample.txt`
* `sample_test_files/Company_Cancelled_Cheque_Sample.txt`
* `sample_test_files/Candidate_Aadhaar_Priya_Sharma.txt`

---

## 📄 License
MIT License.
