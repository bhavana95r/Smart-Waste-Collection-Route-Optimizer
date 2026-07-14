# Smart Waste Collection Route Optimizer

Smart Waste Collection Route Optimizer is a production-ready, full-stack responsive web application designed to help municipalities optimize garbage collection schedules and routes. It integrates real-time IoT smart bin level tracking, operations analytics, Google OR-Tools Vehicle Routing Problem (VRP) solving, and Scikit-Learn Machine Learning models to predict bin overflows and route fuel requirements.

## Key Features

1. **AI Route Optimization**: Solves the Capacitated VRP using Google OR-Tools and NetworkX graph shortest paths, factoring in bin priority levels, truck payload capacities, and estimated fuel/CO2 emissions.
2. **Machine Learning Forecaster**: Trains Scikit-Learn Regressors (Random Forest and Gradient Boosting) on historical collection logs to predict bin overflow schedules (hours remaining) and fuel consumption.
3. **Interactive Live Map**: Custom Leaflet.js (OpenStreetMap) implementation with color-coded markers (Green/Yellow/Red) showing IoT fill levels, truck locations, and active polyline paths.
4. **Role-Based Workspaces**: Custom views and controls for Admins (full CRUD & system logs), Operators (dispatch control & route optimize requests), and Drivers (task checklists & collection logging).
5. **Real-Time Notification Logs**: Broadcasts and archives critical alerts (bin overflows, truck breakdowns).
6. **PDF & Excel Exports**: Compilation and download of operational reports generated dynamically in-memory.

---

## Project Structure

```
Smart_waste/
├── client/                 # Vite + React Frontend
│   ├── src/
│   │   ├── assets/         # CSS styles and configuration
│   │   ├── components/     # UI elements (Navbar, Sidebar)
│   │   ├── hooks/          # React contexts
│   │   ├── pages/          # App views (Landing, Dashboard, Bins, Vehicles, RouteOptimizer, DriverPortal, Settings)
│   │   ├── services/       # Axios API client helper
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
└── server/                 # Flask REST Backend
    ├── app/
    │   ├── database.py     # SQLAlchemy base config
    │   ├── models.py       # Database models and mappings
    │   ├── routes/         # API endpoints (auth, bins, vehicles, routes, analytics, notifications)
    │   └── services/       # AI/ML modules (optimizer.py, ml_service.py)
    ├── config.py           # Configuration variables
    ├── seed.py             # Database seed & ML model training script
    ├── run.py              # Application entry point
    └── requirements.txt
```

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 1. Backend Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database and train the ML models:
   ```bash
   python seed.py
   ```
   *This initializes a local `smart_waste.db` SQLite database, inserts test records, simulates 12 months of collections, trains the Random Forest and Gradient Boosting models, and saves them to `models/`.*
5. Run the Flask development server:
   ```bash
   python run.py
   ```
   *The backend will boot up on `http://localhost:5000`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
   *The frontend app will launch on `http://localhost:5173`.*

---

## Test Accounts (Seeded Credentials)

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartwaste.com` | `adminpassword` | Full fleet CRUD, user logs, analytics, settings |
| **Operator** | `operator@smartwaste.com` | `operatorpassword` | Optimize routes, monitor bins, export reports |
| **Driver** | `driver1@smartwaste.com` | `driverpassword` | Checklist portal, mark bins as collected, simulation |

---

## REST API Reference

### 1. Authentication
- `POST /api/auth/signup` - Register a new user (Name, Email, Password, Role).
- `POST /api/auth/login` - Authenticate credentials and get JWT token.
- `GET /api/auth/me` - Fetch profile details (requires Bearer token).
- `POST /api/auth/logout` - Discard session.

### 2. Smart Bins
- `GET /api/bins` - List all bins with current fill percentages and ML overflow predictions.
- `POST /api/bins` - Add a new smart bin.
- `PUT /api/bins/:id` - Update bin config or mark as collected (resets level to 0%).
- `DELETE /api/bins/:id` - Delete a bin.

### 3. Vehicles Fleet
- `GET /api/vehicles` - List all trucks, current drivers, status, and active route assignments.
- `POST /api/vehicles` - Add a vehicle.
- `PUT /api/vehicles/:id` - Update vehicle metadata.
- `DELETE /api/vehicles/:id` - Remove a vehicle.

### 4. Route Optimization
- `POST /api/routes/optimize-route` - Solves Capacitated VRP routing using Google OR-Tools.
- `GET /api/routes` - List all routes in the system.
- `GET /api/routes/live-route` - Fetch the active route checklist for the logged-in driver.
- `PUT /api/routes/:id` - Complete a route or update its status.

### 5. Analytics & Exporters
- `GET /api/analytics` - Fetch KPI values, waste breakdowns, and utilization metrics.
- `GET /api/analytics/export/pdf` - Download a compiled PDF operations summary.
- `GET /api/analytics/export/excel` - Download full logs (bins, vehicles, collections) as an Excel sheet.

### 6. Notifications Alerts
- `GET /api/notifications` - Retrieve list of alerts.
- `PUT /api/notifications/read-all` - Clear all alerts.
- `POST /api/notifications/send-alert` - Manually trigger/broadcast a notification.
