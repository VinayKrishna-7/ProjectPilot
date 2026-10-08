# ProjectPilot

A project management tool for tracking issues, planning sprints, and managing Kanban boards in real time.

## Features

- Kanban board with drag and drop
- Sprints and backlog management
- Real-time updates with Socket.IO
- JQL search syntax (`status = "done" AND priority = "high"`)
- Workspaces and role-based access
- Activity history and comments
- Dark mode and command palette (`Cmd/Ctrl + K`)

## Tech Stack

React 18, TypeScript, Tailwind CSS, Vite, Node.js, Express, Socket.IO, MongoDB, TanStack Query, Zustand, Playwright.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (port 27017)

### Setup

```bash
git clone https://github.com/VinayKrishna-7/ProjectPilot.git
cd ProjectPilot

npm install
cp .env.example .env
npm run build --workspace=shared
npm run seed
npm run dev
```

The app will be running at:
- Client: http://localhost:5173
- Server: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

**Demo account:**
- Email: `demo@projectpilot.dev`
- Password: `Password123!`

## Scripts

- `npm run dev` — Start client and server in development mode
- `npm run build` — Build for production
- `npm run test` — Run unit and integration tests
- `npm run test:e2e` — Run Playwright end-to-end tests
- `npm run type-check` — Type check all workspaces
- `npm run lint` — Lint code
- `npm run seed` — Seed MongoDB with sample data

## License

MIT
