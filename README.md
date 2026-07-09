# Smart Traffic Management System for Tamil Nadu (Urban Congestion Control)

A complete, high-fidelity, production-ready Full-Stack Smart Traffic Management System engineered specifically to monitor, analyze, and control urban congestion patterns across major cities in Tamil Nadu (Chennai, Coimbatore, Madurai, Trichy). 

This platform replaces simple prototype grids with a unified, modern government-grade command-and-control dashboard with advanced GIS map simulations, real-time telemetry overrides, AI-powered diurnal forecasting, and priority emergency routing corridors.

---

## 🏛️ System Architecture

The application is structured using a robust multi-tiered full-stack architecture, offering both a fully integrated local developer workflow and clear modular subfolders for a production-ready export to external clouds:

1. **Enterprise Frontend Client (`/src`):**
   - Developed in **React (Vite) + TypeScript** styled with a bespoke off-black/neon-blue glassmorphic command center aesthetic.
   - Built-in responsive GIS simulated map showing active sensor junctions and emergency priority vehicles with radial ping waves.
   - Live interactive charting widgets powered by **Recharts** detailing hourly congestion curves, speed metrics, and volume shares.
   - AI Copilot prediction console querying the backend Gemini 3.5 AI model.

2. **Unified Node.js Developer Backend (`server.ts`):**
   - Configured with **Express, SQLite3, and JWT Auth**.
   - Serves as an integrated full-stack mock environment for local development, pre-seeded with real geographic coordinate datasets of major Tamil Nadu hubs.

3. **Production Python Flask Export Module (`/backend`):**
   - A fully independent, production-grade **Python Flask REST API Server** written by senior backend engineers.
   - Built with **Flask-SQLAlchemy** for ORM management and **Flask-JWT-Extended** for token authentication.
   - Includes custom serialization helpers, password hashing (`bcrypt`), and auto-seeding scripts.

4. **Normalized Relational SQL Blueprint (`/database`):**
   - A complete `/database/smart_traffic.sql` script configured with **Primary Keys, Foreign Keys, cascading triggers, performance indexes, and comprehensive sample datasets** compatible with any production MySQL or MariaDB instance (AWS RDS, Railway, GCP Cloud SQL, or Neon).

---

## ⚙️ Core Feature Set

*   **Geographic Telemetry Cascades:** Operators select `City ➔ District ➔ Area` to automatically narrow down traffic signal statistics directly queried from the relational database via REST APIs.
*   **Active Overrides Console:** Secure admin login (`admin@tamilnadu.gov.in` / `admin123`) unlocks full database modification capabilities—add new signals, override live vehicles counters, adjust speed markers, toggle signal modes (Adaptive AI / Manual Override / Fixed Timer), or decommission nodes.
*   **Simulated GIS Map Grid:** Fully visual plotting of junctions based on GPS coordinates. Bouncing colored halos instantly flag severe bottlenecks.
*   **Emergency Siren Dispatcher:** Seamlessly inject ambulances or fire trucks onto active routes. The GIS map plots sirens as animated red/blue blips and alerts corresponding signal corridors.
*   **AI Congestion Predictor:** Taps into server-side Gemini 3.5 models to predict future queue bottlenecks under custom conditions (e.g., heavy monsoon downpours, IPL cricket stadium surges, or festival weekends).
*   **CSV Telemetry Exporter:** Download live filtered database readings as official spreadsheet reports in one click.

---

## 🚀 Local Quickstart Guide

### 1. Unified Node.js Developer Workflow (Recommended for Testing)

To boot up the complete full-stack environment with integrated frontend and server-side SQLite feeds:

```bash
# 1. Install dependencies
npm install

# 2. Start the integrated Express/Vite full-stack system on Port 3000
npm run dev
```
Navigate to `http://localhost:3000` to test the live control room, interactive GIS maps, Recharts analytics, and AI modeling!

---

### 2. Standalone Python Flask + MySQL Export Workflow

To migrate and deploy the production-ready Python backend:

#### Prerequisites
- Python 3.10+ installed
- Running MySQL/MariaDB database instance

#### Step-by-Step Setup
```bash
# 1. Move to backend directory & establish virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure your Environment Variables
cp .env.example .env
# Edit '.env' and assign your MySQL Connection string:
# DATABASE_URL=mysql+pymysql://username:password@localhost:3306/smart_traffic

# 4. Bootstrap and Seed the MySQL database
flask seed-db

# 5. Boot the production server
flask run --host=0.0.0.0 --port=5000
```

---

## 📊 Database Schema Blueprint (`smart_traffic.sql`)

The system implements a fully normalized 3rd-Normal-Form (3NF) relational SQL design:

```
[Cities]
   └── [Districts]
          └── [Areas]
                 └── [Junctions]
                        ├── [TrafficData] (1:1 telemetry details)
                        ├── [EmergencyVehicles] (1:N active dispatches)
                        └── [TrafficLogs] (1:N historical audits)
```

-   **`admins`:** Stores encrypted operator credentials for secure overrides.
-   **`junctions`:** Physical coordinate map markers (Latitude, Longitude, Status, Signal Mode).
-   **`traffic_data`:** Real-time sensor metrics (Vehicle Counts, Delay times, Speed indexes, Congestion status).
-   **`emergency_vehicles`:** Priority emergency paths.
-   **`traffic_logs`:** Historical telemetry events (accidents, congestion spikes, power losses) for audit compliance.

---

## ☁️ Cloud Deployment Blueprints

The codebase includes two standardized orchestrator files to let you deploy instantly:

1. **Render Platform Blueprint (`render.yaml`):**
   - Deploys a managed MySQL database instance.
   - Deploys the Python Flask backend with pre-configured start commands.
   - Deploys the React client as a lightning-fast CDN static site with proxy-rewrites.

2. **Vercel Platform Configuration (`vercel.json`):**
   - Handles optimized production builds for the React client and proxies client `/api/*` routes to the live backend seamlessly to bypass any Cross-Origin Resource Sharing (CORS) roadblocks.

---

## 🔒 Security & Admin Overrides Credentials
-   **Default Operator:** `admin@tamilnadu.gov.in`
-   **Terminal Passcode:** `admin123`
-   *Note: Password hashing is completely secured using standard salt hashing protocols.*
