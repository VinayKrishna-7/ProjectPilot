# ProjectPilot — System Architecture & Engineering Blueprint

## 1. Executive Summary & Core Philosophy

**ProjectPilot** is a modern, enterprise-grade Project Management SaaS platform modeled after Jira and Trello. It combines the rigorous planning workflows of agile issue tracking, Kanban drag-and-drop boards, Sprint backlogs, and multi-tenant workspaces with real-time collaboration and modern security ergonomics.

The platform is designed around three architectural pillars:
1. **Zero-Crash Dual-Engine Persistence:** Automatic detection and transparent switching between clustered MongoDB with multi-document transactions and an in-memory standby mode (`demoMemoryStore`) for rapid local development without database overhead.
2. **Deterministic Data Integrity:** Strict Optimistic Concurrency Control (OCC) with version increments on mutations, preventing lost-update anomalies across distributed collaborators.
3. **Defense-in-Depth Security:** Rotating short-lived JWT access tokens, cryptographic session tracking with breach detection, fine-grained role-based access control (RBAC), tiered rate limiting, and immutable audit logs.

---

## 2. Monorepo Structure

The codebase is organized as an npm workspace monorepo:

```
projectpilot/
├── shared/              # Pure TypeScript contracts, enums, interfaces, and DTOs
│   └── src/index.ts     # Single source of truth for client and server models
├── server/              # Node.js + Express + TypeScript REST & WebSocket API
│   ├── src/
│   │   ├── config/      # Env validation, Mongoose, Mailer, Swagger OpenAPI
│   │   ├── middleware/  # Auth, correlation IDs, rate limits, audit, error handling
│   │   ├── models/      # Mongoose schemas with compound indexes & OCC versioning
│   │   ├── services/    # Domain business logic (Auth, JQL, Sprint, Workspace, etc.)
│   │   ├── controllers/ # HTTP transport controllers
│   │   ├── routes/      # REST API route definitions
│   │   ├── sockets/     # Socket.IO room lifecycle & event emission
│   │   └── scripts/     # High-scale performance seed scripts
├── client/              # React 18 + Vite + TypeScript Single Page Application
│   ├── src/
│   │   ├── app/         # Router definitions & application providers
│   │   ├── features/    # Vertical feature modules (auth, issue, board, workspace)
│   │   ├── components/  # Shared Shadcn-based UI primitives
│   │   ├── stores/      # Zustand client state (auth, filters, UI modals)
│   │   └── lib/         # Axios instance, query client, socket client
├── e2e/                 # Playwright end-to-end integration test suite
└── docs/                # Architectural, operational, and security specifications
```

---

## 3. Dual-Mode Execution Architecture

ProjectPilot operates under two database operational modes:

```
                      ┌────────────────────────┐
                      │  ProjectPilot Startup  │
                      └───────────┬────────────┘
                                  │
                       [Connect to MONGODB_URI]
                                  │
                   ┌──────────────┴──────────────┐
             [Connection OK]               [Connection Failed]
                   │                             │
         Check Replica Set Support         Fallback to Demo Mode
         ┌─────────┴─────────┐                   │
    [Supported]        [Standalone]              ▼
         │                   │           ┌────────────────┐
         ▼                   ▼           │ In-Memory Store│
 ┌───────────────┐   ┌───────────────┐   │   (Standby)    │
 │ Multi-Document│   │ Sequential    │   │ Zero Crash     │
 │ Transactions  │   │ Fallback Mode │   │ Local Dev      │
 └───────────────┘   └───────────────┘   └────────────────┘
```

- **Production Mode:** Full MongoDB clustering. Operations such as workspace deletion, project provisioning, and sprint completion utilize `runInTransaction()` for ACID guarantees.
- **Standby Dev Mode:** If MongoDB is unreachable at startup, the server automatically mounts `demo.routes.ts` with the in-memory state engine `demoMemoryStore`. All features—including JQL search, session management, and OCC version conflict detection—remain functional with instant demo credentials (`demo@projectpilot.dev`).

---

## 4. Request Lifecycle & Middleware Pipeline

Every HTTP request traverses a standardized security and observability pipeline:

1. **Correlation Tracking (`requestId.ts`):** Generates or propagates `X-Request-Id` (UUIDv4), injecting it into response headers and structured log contexts.
2. **Security Headers (`helmet`):** Configures strict Content Security Policies, Frameguard (`DENY`), and cross-origin isolation.
3. **CORS Validation (`cors`):** Enforces origin whitelisting with credential verification for secure cookie transmission.
4. **Tiered Rate Limiting (`rateLimit.ts`):** Segregates traffic into global (300 req/min), auth (15 req/15min), invitation generation (30 req/hr), and upload tiers (30 req/15min).
5. **Authentication (`auth.ts`):** Validates Bearer headers or HTTP-only cookies, inspecting session revocation and token expiration.
6. **Authorization (`authorization.ts`):** Evaluates user membership and role levels against workspace or project hierarchy.
7. **Validation (`validate.ts`):** Validates request bodies and queries against strict Zod schemas before reaching controllers.
8. **Operational Error Handler (`error.ts`):** Translates `AppError`, Mongoose duplicate keys, validation errors, and unhandled exceptions into structured JSON responses.

---

## 5. Data Flow & Real-Time Sync

- **Reads:** Cached via TanStack Query on the client with aggressive stale-time policies and background refetching.
- **Writes:** Client triggers optimistic UI updates, fires the mutation via Axios, and awaits server confirmation.
- **Real-Time Distribution:** On mutation success, the server publishes scoped events to Socket.IO rooms (`workspace:<id>`, `project:<id>`, `issue:<id>`).
- **Conflict Handling:** Server detects OCC version mismatches, throws HTTP 409 `CONFLICT`, and the client prompts the user to review the remote diff or reload without lost updates.
