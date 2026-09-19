# ProjectPilot

[![CI Pipeline](https://github.com/VinayKrishna-7/ProjectPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/VinayKrishna-7/ProjectPilot/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

ProjectPilot is a full-stack agile project management application that combines Trello-style Kanban boards with Jira-style sprint planning. It helps engineering teams organize tasks, manage sprint lifecycles, and coordinate project workloads with real-time updates. The application is implemented as a TypeScript monorepo using React, Express, MongoDB, and Socket.IO.

---

## Demo

* **Live Demo**: *Deployment link coming soon*
* **Demo Video**: *Walkthrough recording coming soon*
* **API Documentation**: Available locally via Swagger UI at [http://localhost:5000/api/docs](http://localhost:5000/api/docs) when running the server.

---

## Screenshots

<!--
To display screenshots, capture images from your running application, place them in a docs/screenshots/ directory, and update the paths below.
-->

| Kanban Board | Sprint Backlog |
| :---: | :---: |
| *Add screenshot: `docs/screenshots/board.png`* | *Add screenshot: `docs/screenshots/backlog.png`* |

| Issue Details & Comments | Project Reports |
| :---: | :---: |
| *Add screenshot: `docs/screenshots/issue-detail.png`* | *Add screenshot: `docs/screenshots/reports.png`* |

---

## Features

* **Multi-Tenant Workspaces & Projects**: Organize work into isolated workspaces with role-based access control (`owner`, `admin`, `member`), unique project keys, and member management.
* **Kanban Board**: Drag-and-drop task movement across customizable columns powered by `@dnd-kit`, featuring reordering within columns, status transitions, and optimistic UI updates.
* **Sprint Planning & Backlog**: Manage sprint lifecycles (`planned`, `active`, `completed`), track story point velocity, groom backlog items, and reallocate unfinished tasks on sprint completion.
* **Issue Tracking**: Create and edit tasks, bugs, and stories with priorities, assignees, due dates, file attachments, and markdown descriptions.
* **Real-Time Synchronization**: Live board movements, issue edits, and notification updates delivered across connected clients using Socket.IO rooms.
* **Issue Query Language (JQL)**: Filter issues using a custom tokenizer and parser supporting queries such as `status = done AND priority in (high, highest) ORDER BY position DESC`.
* **Optimistic Concurrency Control (OCC)**: Version-based document locking to detect concurrent edits and prevent overwriting changes made by other team members.
* **Audit Trail & Discussion**: Immutable activity logs tracking status changes and field updates, alongside threaded comments with timestamps.
* **Project Analytics**: Visual breakdowns of issue distribution by status, priority, and type, as well as 14-day resolution metrics rendered with Recharts.
* **User Interface & Theme**: Responsive layout with collapsible sidebar, instant light and dark mode switching, and a global keyboard command palette (`⌘K` / `Ctrl+K`).

---

## Tech Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **State Management**: TanStack React Query (server cache), Zustand (client UI state)
* **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide React icons
* **Interactivity**: `@dnd-kit` (drag and drop), cmdk (command palette)
* **Data Visualization**: Recharts
* **HTTP Client**: Axios

### Backend
* **Runtime & Framework**: Node.js, Express.js, TypeScript
* **Real-Time**: Socket.IO
* **Validation**: Zod
* **Authentication**: JSON Web Tokens (JWT access & refresh tokens), bcryptjs
* **File Uploads**: Multer (with optional Cloudinary storage)
* **API Documentation**: Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)

### Database
* **Primary**: MongoDB with Mongoose ODM (compound indexes and schema validation)
* **Fallback**: Memory and disk-based fallback persistence for running without a local MongoDB instance

### Real-time
* **Engine**: Socket.IO with project and issue-specific room broadcasting

### Testing
* **Unit & API Testing**: Vitest, Supertest
* **End-to-End Testing**: Playwright (multi-browser testing)

### DevOps & Deployment
* **Containers**: Docker, Docker Compose
* **CI Pipeline**: GitHub Actions (type checking, linting, unit tests, and build verification)

---

## Architecture

ProjectPilot is organized as an npm workspaces monorepo with three primary packages:

1. **`shared`**: Contains shared TypeScript types, enums, interfaces, and DTO definitions. Both client and server import from this package, ensuring single-source-of-truth contracts across the API boundary.
2. **`server`**: Layered Express architecture with dedicated routers, middleware (JWT authentication, role authorization, rate limiting, request validation), service layers for business logic (JQL parser, sprint handling, audit logging), and Mongoose models. Includes a dual-persistence layer that defaults to MongoDB and automatically falls back to an in-memory/file store when a database connection is unavailable.
3. **`client`**: Single Page Application built with Vite and React. Follows a feature-sliced directory structure (`features/board`, `features/sprint`, `features/issue`, `features/auth`, etc.). Server data is cached and synchronized with TanStack Query, while local preferences (theme, filters) reside in Zustand stores.

---

## Project Structure

```text
ProjectPilot/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── app/                # Query client, Router config, theme provider
│   │   ├── components/         # Common UI components (buttons, dialogs, inputs)
│   │   ├── features/           # Feature-sliced modules (auth, board, issue, sprint)
│   │   ├── pages/              # Route view components
│   │   ├── stores/             # Zustand state stores
│   │   └── test/               # Client unit tests
│   └── Dockerfile              # Production Nginx container
├── server/                     # Backend Express REST & WebSocket API
│   ├── src/
│   │   ├── config/             # Environment, database, and Swagger configuration
│   │   ├── controllers/        # Route handler functions
│   │   ├── middleware/         # Auth, validation, error handling, rate limits
│   │   ├── models/             # Mongoose schemas and models
│   │   ├── routes/             # Express route declarations
│   │   ├── services/           # Business logic (JQL, sprints, audit, fallback)
│   │   ├── sockets/            # Socket.IO connection and event dispatchers
│   │   ├── scripts/            # Database seed scripts
│   │   └── test/               # Server API test suite (Vitest + Supertest)
│   └── Dockerfile              # Multi-stage Node.js container
├── shared/                     # Shared TypeScript contracts and interfaces
│   └── src/index.ts            # Common types and enums
├── e2e/                        # Playwright end-to-end test suite
├── docs/                       # Technical architecture and design docs
├── .github/workflows/          # GitHub Actions CI workflow
├── docker-compose.yml          # Container configuration for client, server, and MongoDB
├── playwright.config.ts        # Playwright test runner configuration
└── package.json                # Root monorepo workspace scripts
```

---

## Getting Started

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** >= 9.0.0
* *(Optional)* **MongoDB** 6.0+ (the application starts in fallback mode if MongoDB is not running locally)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VinayKrishna-7/ProjectPilot.git
   cd ProjectPilot
   ```

2. **Install workspace dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # On macOS/Linux:
   cp .env.example server/.env

   # On Windows (Command Prompt):
   copy .env.example server\.env
   ```

4. **Build the shared package**:
   ```bash
   npm run build --workspace=shared
   ```

5. **(Optional) Seed sample data**:
   Populates sample workspaces, projects, sprints, and issues for testing:
   ```bash
   npm run seed
   ```

   *Sample Seed Credentials:*
   * Admin: `demo@projectpilot.dev` / `Password123!`
   * Product Manager: `sarah@projectpilot.dev` / `Password123!`
   * Developer: `mike@projectpilot.dev` / `Password123!`

   *(Note: Newly registered accounts via the signup page start with a clean workspace without demo data).*

6. **Start development servers**:
   ```bash
   npm run dev
   ```
   * **Frontend UI**: [http://localhost:5173](http://localhost:5173)
   * **Backend API**: [http://localhost:5000](http://localhost:5000)
   * **API Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
   * **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## Available Scripts

Run these scripts from the repository root:

| Command | Description |
|---|---|
| `npm run dev` | Runs backend API and Vite client concurrently in development mode |
| `npm run build` | Compiles `@taskflow/shared`, server TypeScript, and Vite client bundles |
| `npm run start` | Boots the compiled production Express server |
| `npm run test` | Runs Vitest unit and integration test suites across server and client |
| `npm run test:e2e` | Runs Playwright end-to-end tests against browser instances |
| `npm run type-check` | Runs `tsc --noEmit` across all workspaces to verify TypeScript types |
| `npm run lint` | Runs ESLint across server and client workspaces |
| `npm run seed` | Seeds MongoDB with sample projects, members, and issues |

---

## Environment Variables

Configure these variables in `server/.env`. Safe defaults are provided in `.env.example`:

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | No | `5000` | Port for Express backend server |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin for frontend client |
| `MONGODB_URI` | No | `mongodb://localhost:27017/projectpilot` | MongoDB connection URI |
| `JWT_SECRET` | Yes | `your-jwt-secret-key` | Secret key for signing access tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Expiration window for access tokens |
| `JWT_REFRESH_SECRET` | Yes | `your-jwt-refresh-secret-key` | Secret key for signing refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Expiration window for refresh tokens |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limiting window in milliseconds (15 min) |
| `RATE_LIMIT_MAX` | No | `300` | Maximum requests per IP in the rate window |
| `CLOUDINARY_CLOUD_NAME` | No | `""` | Optional Cloudinary cloud name for issue attachments |
| `CLOUDINARY_API_KEY` | No | `""` | Optional Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | `""` | Optional Cloudinary API secret |
| `SMTP_HOST` | No | `""` | Optional SMTP server for email notifications |
| `SMTP_PORT` | No | `587` | Optional SMTP port |
| `SMTP_USER` | No | `""` | Optional SMTP username |
| `SMTP_PASS` | No | `""` | Optional SMTP password |
| `SMTP_FROM` | No | `noreply@projectpilot.dev` | Default sender address for system emails |

---

## Testing

The codebase includes test suites for unit logic, API endpoints, and end-to-end browser interactions:

### Unit and API Tests (Vitest)
Executes server route tests, authorization guards, JQL tokenizer/parser logic, and client utilities:
```bash
npm run test
```

### End-to-End Tests (Playwright)
Validates core browser user flows including authentication, workspace onboarding, Kanban column drag-and-drop, sprint transitions, and search filters:
```bash
npm run test:e2e
```

### Type Checking
Ensures strict TypeScript compliance across all packages without emitting output:
```bash
npm run type-check
```

---

## Docker

Run the entire application stack (MongoDB, Express server, and Nginx-backed client) using Docker Compose:

```bash
# Build and launch containers in detached mode
docker-compose up --build -d

# View container logs
docker-compose logs -f

# Stop and remove containers
docker-compose down
```

* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **MongoDB**: `localhost:27017`

---

## Security

* Secrets, database connection strings, and JWT keys must be defined in environment variables and never committed to version control.
* Sensitive file patterns such as `.env`, `.env.local`, and build directories are excluded via `.gitignore`.
* API routes enforce role-based access control, input validation via Zod schemas, HTTP rate limiting, and HTTP security headers via Helmet.

---

## Future Improvements

* Webhook integrations for external notifications (Slack, Discord, Microsoft Teams).
* User-defined custom issue types and customizable workflow states beyond standard columns.
* Time tracking and work logging with estimated versus actual hours.
* Data export options (CSV, JSON, PDF) for sprint summaries and issue lists.
* Multi-factor authentication (MFA/2FA) support.

---

## License

A license has not yet been assigned to this repository. A license file can be added separately.
