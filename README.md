# Field Asset Maintenance Tracker (FAMT) — Frontend

Enterprise-grade industrial frontend application for tracking field equipment machinery, managing operational plant sites, and coordinating maintenance tickets through complete lifecycle resolution.

Built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **React Router 7**, **Lucide Icons**, and **Recharts**.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v20+ LTS (Tested on v26)
- **Backend API**: Running on `http://localhost:5001/api`

### 2. Installation
```bash
# Clone and enter directory
cd FAMT_Frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
The frontend connects by default to `http://localhost:5001/api`. You can customize this by creating a `.env` file:
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### 4. Running Locally
```bash
# Start Vite development server on port 5173
npm run dev

# Production build and type validation
npm run build

# Code linting
npm run lint
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Pre-Seeded Test Credentials

The login page includes **1-Click Test Role Buttons** and an interactive **Header Role Switcher** for instant evaluation without retyping passwords:

| Role | Email | Password | Permissions & Workflow |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@famt.dev` | `Password123!` | Full CRUD on Sites & Assets; assign any user role; resolve, close & reopen tickets; view dashboard telemetry & all tickets. |
| **Technician** | `tech@famt.dev` | `Password123!` | View Sites & Assets; raise tickets; view/update assigned tickets; progress ticket status (`Open → In progress → Resolved`); post comments. |
| **Viewer** | `viewer@famt.dev` | `Password123!` | Read-only access to Sites & Assets; raise new tickets; view comments & post notes; view dashboard metrics. |

---

## 🔄 Ticket Workflow State Machine

The maintenance ticket lifecycle strictly implements the state machine specification:

```
[Open] ──> [In progress] ──> [Resolved] ──> [Closed]
  ▲                                             │
  └────────────── (Admin Only Reopen) ──────────┘
```

- **Open**: Initial state for newly created tickets. Can only transition to `In_progress`.
- **In progress**: Assigned technician or Admin begins active field servicing. Can only transition to `Resolved`.
- **Resolved**: Work completed by technician or Admin. Can only transition to `Closed`.
- **Closed**: Final operational closure. Can only be reopened back to `Open` by an **Admin** (technicians receive 403 Forbidden if attempting to reopen).

---

## 🏗️ Architecture & Project Structure

```
FAMT_Frontend/
├── public/                 # Static assets & favicons
├── src/
│   ├── components/
│   │   ├── common/         # Badges, Buttons, Modals, Spinners, Empty States
│   │   │   ├── Badge.tsx          # Status, Priority, Role & Asset badges
│   │   │   ├── Button.tsx         # Styled button with spinner states
│   │   │   ├── Modal.tsx          # Accessible modal dialog with backdrop
│   │   │   ├── LoadingSpinner.tsx # Skeletons and spinners
│   │   │   └── EmptyState.tsx     # Clean empty state placeholders
│   │   └── layout/
│   │       └── AppLayout.tsx      # Top nav, brand logo, role switcher & health ping
│   ├── context/
│   │   ├── AuthContext.tsx        # Session auth, role switching & JWT persistence
│   │   └── ToastContext.tsx       # Toast notifications (success, error, warning)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx      # Login form with 1-click test credentials
│   │   │   └── RegisterPage.tsx   # Account registration with role selection
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx  # Telemetry cards, Recharts donut & bar charts
│   │   ├── sites/
│   │   │   └── SitesPage.tsx      # Facility cards, asset counts & CRUD modals
│   │   ├── assets/
│   │   │   └── AssetsPage.tsx     # Equipment table, filters, search & CRUD modals
│   │   └── tickets/
│   │       ├── TicketsPage.tsx    # Work order hub, chips & ticket creation
│   │       └── TicketDetailPage.tsx # 4-step pipeline, actions & live comments
│   ├── services/
│   │   └── api.ts                 # Axios HTTP client, interceptors & API methods
│   ├── types/
│   │   └── index.ts               # Complete TypeScript data models & enums
│   ├── App.tsx                    # React Router configuration & guards
│   ├── index.css                  # Tailwind CSS v4 & industrial glassmorphism tokens
│   └── main.tsx                   # Application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛡️ Security & Integration Features

- **JWT Bearer Authentication**: Automatically managed and attached to all API requests via Axios interceptors.
- **Auto Session Expiry Handling**: Intercepts 401 Unauthorized responses to safely clear tokens and redirect to login.
- **Strict Role-Based UI Guarding**: Admin-only controls (Site CRUD, Asset CRUD, Reopening tickets) are conditionally rendered and verified on the server.
- **Foreign Key Dependency Feedback**: Deleting sites with assets or assets with tickets gracefully displays backend error messages.
- **Responsive Industrial Design**: Tailored dark-mode UI with high-contrast status colors, glassmorphism panels, and smooth micro-animations.
