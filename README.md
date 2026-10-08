# ProjectPilot

> A modern, full-stack agile project management platform combining Trello-style Kanban workflows with Jira-style sprint planning.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Features

- **Multi-Tenant Workspaces & Projects**: Isolated workspaces with role-based access control (`owner`, `admin`, `member`) and team directories.
- **Interactive Kanban Boards**: Fluid drag-and-drop column workflows powered by `@dnd-kit` with optimistic updates.
- **Sprint Management & Backlog**: Sprint planning, backlog grooming, velocity tracking, and rollover of incomplete tasks.
- **Real-Time Collaboration**: Instant task updates, live board movements, and notifications via Socket.IO rooms.
- **Issue Query Language (JQL)**: Custom query parser for complex filtering (e.g. `status = "done" AND priority = "high"`).
- **Optimistic Concurrency Control (OCC)**: Version-checked document updates preventing concurrent write collisions.
- **Analytics & Audit Logs**: Interactive burn-up charts and activity timelines powered by Recharts.
- **Keyboard Command Palette (`⌘K` / `Ctrl+K`)**: Quick navigation, search, and action triggers across the platform.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Zustand, `@dnd-kit` |
| **Backend** | Node.js, Express, TypeScript, Socket.IO, Zod, JWT, Helmet |
| **Database** | MongoDB with Mongoose ODM |
| **Testing** | Vitest, Playwright (E2E), Supertest |
| **Monorepo** | npm Workspaces (`client`, `server`, `shared`) |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (local service or connection URI)

### Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/VinayKrishna-7/ProjectPilot.git
   cd ProjectPilot
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Build Shared Library & Seed Database**:
   ```bash
   npm run build --workspace=shared
   npm run seed
   ```

4. **Start Development Servers**:
   ```bash
   npm run dev
   ```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

#### Demo Credentials
- **Email**: `demo@projectpilot.dev`
- **Password**: `Password123!`

---

## 📜 Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Launch client and server concurrently in development mode |
| `npm run build` | Compile `shared`, `server`, and `client` production bundles |
| `npm run test` | Run Vitest unit & integration test suites |
| `npm run test:e2e` | Run Playwright end-to-end browser test suites |
| `npm run type-check` | Verify TypeScript types across all workspaces |
| `npm run lint` | Run ESLint checks |
| `npm run seed` | Seed database with demo workspaces, projects, and issues |

---

## 📁 Repository Structure

```text
ProjectPilot/
├── client/          # React 18 Single Page Application (Vite + Tailwind CSS)
├── server/          # Express REST API & Socket.IO server
├── shared/          # Shared TypeScript interfaces, types, and DTO contracts
├── e2e/             # Playwright end-to-end test suite
└── docker-compose.yml
```

---

## 📄 License

MIT License.
