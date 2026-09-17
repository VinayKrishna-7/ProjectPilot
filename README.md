# 🚀 ProjectPilot — Enterprise Agile Project Management Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-lightgrey?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)](https://www.mongodb.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_26%2F26_Passing-orange?logo=playwright)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_17%2F17_Passing-yellow?logo=vitest)](https://vitest.dev/)

**ProjectPilot** is a production-grade, full-stack Jira and Trello hybrid Project Management SaaS application. Built on modern software engineering standards using the **MERN** stack (MongoDB, Express, React, Node.js) with **100% strict TypeScript**, **Tailwind CSS**, **@dnd-kit**, **TanStack Query**, and **Socket.IO**.

It bridges the gap between high-level sprint planning and flexible drag-and-drop board execution, designed for high-velocity software engineering teams.

---

## 🌟 Highlights & Special Implementations

- ⚡ **Real-Time Kanban Engine (`@dnd-kit`)**:
  - Smooth multi-container drag-and-drop reordering within and across columns.
  - Optimistic UI updates with instant feedback and automatic rollback on network latency or failure.
  - Multi-client live sync powered by Socket.IO rooms.

- 🎯 **Jira-Style Sprints & Backlog Engine**:
  - Complete state-machine lifecycle: `planned` ➔ `active` ➔ `completed`.
  - Velocity metrics and story points estimation.
  - Intelligent sprint completion modal allowing unresolved issues to rollover to another active/planned sprint or back into the backlog.

- 🔎 **Issue Query Language (JQL) Search Engine**:
  - Custom lexer, tokenizer, and Abstract Syntax Tree (AST) query parser on the backend.
  - Executes queries such as `status = done AND priority in (high, highest) ORDER BY position DESC`.
  - Full-text search across titles, keys, descriptions, and assignees.

- 🛡️ **Optimistic Concurrency Control (OCC)**:
  - Version-based document locking (`version` key verification) prevents race conditions and accidental overwrites when multiple users edit the same ticket at once.

- 💾 **Dual-Mode Persistence (Zero-Config Fallback)**:
  - Seamlessly runs with **MongoDB** (local or Atlas cloud) using Mongoose models.
  - Automatically activates an intelligent **In-Memory & Disk Fallback Engine** if MongoDB is offline, allowing immediate evaluation with zero database installation. Auto-reconnects as soon as MongoDB is detected.

- 🏢 **Multi-Tenant Workspaces with Strict Isolation**:
  - Fine-grained Role-Based Access Control (RBAC): `owner`, `admin`, `member`.
  - 100% clean account onboarding: new accounts start with zero mock or leaked workspaces, greeted by a guided first-workspace creation flow.

- 💬 **Collaborative Audit Trail & Notifications**:
  - Real-time Markdown comments with user mentions.
  - Immutable audit logs capturing every status change, assignment, attachment, and priority update.
  - In-app notification bell with live WebSocket push badges.

- 🌓 **First-Class Theming & Command Palette**:
  - Instant toggle between Dark Mode and Light Mode with zero flicker.
  - Global `⌘K` / `Ctrl+K` Command Palette for instant navigation to projects, boards, and account settings.

---

## 🏗️ Architecture & Monorepo Layout

ProjectPilot is organized as an **npm workspaces monorepo** with strict boundary separation between shared contracts, backend services, and the frontend client.

```
projectpilot/
├── shared/                     # Shared TypeScript contracts & DTOs
│   ├── src/                    # Single source of truth for types, enums, interfaces
│   └── package.json            # @taskflow/shared package
│
├── server/                     # Node.js + Express + Socket.IO API
│   ├── src/
│   │   ├── config/             # Environment validation, MongoDB & Cloudinary config
│   │   ├── controllers/        # Express route handlers
│   │   ├── middleware/         # JWT auth, RBAC permissions, Zod validation, rate limits
│   │   ├── models/             # Mongoose schemas (14 models with compound indexes)
│   │   ├── routes/             # Modular RESTful API routers
│   │   ├── services/           # Business logic (JQL, Sprints, Audit, Auth)
│   │   ├── sockets/            # Socket.IO rooms & real-time event dispatchers
│   │   ├── scripts/            # Seed scripts for demo data and performance stress testing
│   │   └── test/               # Vitest API and unit test suites
│   └── Dockerfile              # Production multi-stage Docker build
│
├── client/                     # React 18 + Vite SPA
│   ├── src/
│   │   ├── app/                # Query client, Router config, theme provider
│   │   ├── components/         # Reusable UI library (Radix primitives + Tailwind)
│   │   ├── features/           # Feature-sliced modules:
│   │   │   ├── auth/           # Login, Register, Session Management
│   │   │   ├── board/          # Drag-and-drop Kanban board (@dnd-kit)
│   │   │   ├── issue/          # Issue modals, details, attachments, comments
│   │   │   ├── sprint/         # Backlog, sprint management, complete dialog
│   │   │   ├── workspace/      # Multi-tenant workspace switcher & settings
│   │   │   └── reports/        # Recharts analytics and velocity graphs
│   │   ├── pages/              # Routed view components
│   │   └── stores/             # Zustand state stores (auth, layout, filters)
│   └── Dockerfile              # Multi-stage Nginx production container
│
├── e2e/                        # Playwright End-to-End Test Suite
│   ├── auth.spec.ts            # Auth flows, session isolation, clean onboarding tests
│   ├── board.spec.ts           # Kanban drag-and-drop & status transitions
│   ├── sprints.spec.ts         # Sprint lifecycle & backlog interactions
│   └── jql.spec.ts             # JQL search filtering tests
│
├── docker-compose.yml          # Containerized orchestration (App + MongoDB)
├── playwright.config.ts        # Playwright test runner configuration
└── package.json                # Monorepo root scripts & dev dependencies
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- *(Optional)* **MongoDB** 6.0+ (the application will run smoothly in standby fallback mode even without MongoDB)

### 1. Clone & Install Dependencies
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd ProjectManagement
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` into `server/.env`:
```bash
cp .env.example server/.env
```
*(On Windows CMD: `copy .env.example server\.env`)*

The default values are pre-configured for instant local development:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/projectpilot
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
CLIENT_URL=http://localhost:5173
```

### 3. Seed Demo Data (Optional)
To test with sample data (mock teams, projects, sprints, and 15+ issues):
```bash
npm run seed
```

**Pre-seeded Demo Credentials:**
| Role | Email | Password |
|---|---|---|
| Admin / Lead | `demo@projectpilot.dev` | `Password123!` |
| Product Manager | `sarah@projectpilot.dev` | `Password123!` |
| Developer | `mike@projectpilot.dev` | `Password123!` |

*(Note: Creating a new account via the UI starts with a 100% clean workspace ready for your team's custom configuration).*

### 4. Start Development Servers
```bash
npm run dev
```
- **Web App (Vite UI):** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/health](http://localhost:5000/health)
- **Interactive Swagger Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🛠️ CLI Commands & NPM Scripts

Run these scripts from the repository root:

| Command | Action |
|---|---|
| `npm run dev` | Concurrently launches backend API & Vite frontend with hot module reload (HMR) |
| `npm run build` | Compiles `@taskflow/shared`, builds server TypeScript, and generates optimized Vite client bundles |
| `npm run start` | Boots the compiled production Express server |
| `npm run test` | Executes all Vitest test suites across client and server |
| `npm run test:e2e` | Runs headless Playwright browser tests across all core user flows |
| `npm run type-check` | Runs `tsc --noEmit` across all workspaces to guarantee type safety |
| `npm run lint` | Lints JavaScript and TypeScript files with ESLint |
| `npm run seed` | Populates database with sample workspaces, projects, sprints, and issues |

---

## 🐳 Docker Deployment

To launch the full containerized stack (MongoDB, Express Server, and Nginx-backed Client):

```bash
docker-compose up --build -d
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **MongoDB:** `localhost:27017`

To inspect container logs:
```bash
docker-compose logs -f
```

To stop containers:
```bash
docker-compose down -v
```

---

## 🧪 Testing & Verification

ProjectPilot is backed by automated tests across every layer:

### Unit & API Tests (Vitest)
```bash
npm run test
```
- **Server:** 11 passing tests covering health checks, readiness metrics, OpenAPI schemas, JQL tokenizer, and auth guards.
- **Client:** 6 passing tests covering utility formatters, date helpers, and state transformations.

### End-to-End Tests (Playwright)
```bash
npm run test:e2e
```
- **26/26 Passing Tests**:
  - Complete authentication cycle, validation errors, and profile management.
  - Clean slate onboarding for newly registered accounts.
  - Multi-column drag-and-drop movement with status updates.
  - Sprint creation, starting, issue transitions, and sprint completion rollover.
  - Optimistic concurrency conflict detection.
  - Multi-criteria JQL search filtering and sorting.

---

## ⚙️ Environment Configuration

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | No | `5000` | Backend API port |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `MONGODB_URI` | No | `mongodb://localhost:27017/projectpilot` | MongoDB connection string |
| `JWT_SECRET` | **Yes** | `dev-secret-...` | Secret used for signing short-lived access tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifespan |
| `JWT_REFRESH_SECRET` | **Yes** | `dev-refresh-...` | Secret for issuing long-lived refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifespan |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit duration in ms (15 minutes) |
| `RATE_LIMIT_MAX` | No | `300` | Max API requests per IP window |
| `CLOUDINARY_CLOUD_NAME` | No | `""` | Optional Cloudinary cloud name for issue file uploads |
| `CLOUDINARY_API_KEY` | No | `""` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | `""` | Cloudinary API secret |

---

## 🤝 Contributing

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Ensure type check and tests pass (`npm run type-check && npm run test`).
4. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`).
5. Push to the Branch (`git push origin feature/AmazingFeature`).
6. Open a Pull Request.

---

