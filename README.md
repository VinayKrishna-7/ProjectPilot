# ProjectPilot

A full-stack agile project management application built with React, Node.js, and MongoDB. Includes Kanban boards, sprint planning, issue tracking, and real-time collaboration.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## Features

- **Workspaces & Projects**: Isolated team workspaces with role-based permissions (`owner`, `admin`, `member`) and team directories.
- **Kanban Board**: Drag-and-drop task movement across customizable columns with optimistic UI updates.
- **Sprint Management**: Sprint planning, backlog grooming, velocity tracking, and sprint completion workflows.
- **Real-Time Collaboration**: Live board updates and notifications across connected clients using Socket.IO.
- **Issue Query Language (JQL)**: Custom query parser for searching issues (e.g., `status = "done" AND priority = "high"`).
- **Activity & Comments**: Change logs, status transitions, and threaded discussions on issues.
- **Reports & Analytics**: Project velocity charts and issue distributions by type, priority, and status.
- **UI & Accessibility**: Responsive layout, light and dark themes, and command palette (`Cmd/Ctrl + K`).

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Zustand, `@dnd-kit`
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Zod, JWT
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Vitest, Playwright, Supertest
- **Monorepo**: npm workspaces (`client`, `server`, `shared`)

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- MongoDB instance running locally on port 27017 (or a remote connection string)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VinayKrishna-7/ProjectPilot.git
   cd ProjectPilot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

4. **Build shared types package**:
   ```bash
   npm run build --workspace=shared
   ```

5. **Seed demo data (optional)**:
   ```bash
   npm run seed
   ```

   **Demo login:**
   - Email: `demo@projectpilot.dev`
   - Password: `Password123!`

6. **Start development servers**:
   ```bash
   npm run dev
   ```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)
- API Docs (Swagger): [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client and server in development mode |
| `npm run build` | Build shared, server, and client packages for production |
| `npm run test` | Run unit and integration tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run type-check` | Run TypeScript type checks across workspaces |
| `npm run lint` | Run ESLint checks |
| `npm run seed` | Seed database with initial workspace and project data |

---

## Project Structure

```text
ProjectPilot/
├── client/          # Frontend React SPA (Vite, Tailwind CSS, Radix UI)
├── server/          # Express REST API & Socket.IO server
├── shared/          # Shared TypeScript contracts and interfaces
├── e2e/             # Playwright end-to-end test suite
└── docker-compose.yml
```

---

## License

MIT
