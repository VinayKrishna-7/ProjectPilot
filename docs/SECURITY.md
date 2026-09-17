# Security Architecture & Threat Mitigation Guide

## 1. Threat Model & Defense-in-Depth

ProjectPilot is engineered to safeguard multi-tenant project and issue data against prevalent web application attack vectors, including token theft, session hijacking, privilege escalation, brute-force credential stuffing, and data tampering.

---

## 2. Authentication & Dual-Token Rotation Architecture

ProjectPilot implements an enterprise-grade dual-token authentication pattern with automatic refresh rotation and token reuse detection:

```
                    ┌────────────────────────────┐
                    │    POST /api/auth/login    │
                    └─────────────┬──────────────┘
                                  │
                 Issues:          │
                 - Access Token   │ (15-min JWT)
                 - Refresh Token  │ (7-day crypto random string)
                                  │
                                  ▼
               ┌─────────────────────────────────────┐
               │           Client Storage            │
               │  - access_token (HTTP-only cookie)  │
               │  - refresh_token (HTTP-only cookie) │
               └──────────────────┬──────────────────┘
                                  │
               When access_token expires (15m):
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │   POST /api/auth/refresh   │
                    └─────────────┬──────────────┘
                                  │
            ┌─────────────────────┴─────────────────────┐
     [Token Valid & Current]                     [Token Reused / Expired]
            │                                           │
   1. Invalidate old token                     1. Trigger BREACH ALERT
   2. Issue NEW refresh token                  2. Revoke ALL active sessions
   3. Issue NEW access token                      for this user immediately
   4. Update Session record                    3. Force full re-authentication
```

### Refresh Token Security Attributes:
- Stored on the server as a **one-way SHA-256 hash** inside the `Session` collection. The plaintext refresh token is never stored in the database.
- Transmitted strictly via `HttpOnly`, `SameSite=Lax` (or `Strict` in production), `Secure` cookies.
- JavaScript running in the browser cannot access or read the cookie values, mitigating Cross-Site Scripting (XSS) token exfiltration.

---

## 3. Session Management & Remote Revocation

Users maintain visibility and control over all active devices via `/settings/security`:
- Each session records `userAgent`, `ipAddress`, `lastActiveAt`, and an `isRevoked` flag.
- Users can revoke individual sessions or trigger **"Sign Out Other Devices"** (`DELETE /api/auth/sessions`), terminating all active sessions except the current browser.

---

## 4. Cryptographic Workspace Invitations

Workspace invitations bypass shared links in favor of time-bounded, single-use cryptographic tokens:
1. An admin sends an invite (`POST /api/workspaces/:id/invitations`).
2. The server generates a 32-byte cryptographic random token (`crypto.randomBytes(32).toString('hex')`).
3. The token is hashed with SHA-256 and stored in `WorkspaceInvitation` with a 7-day expiration timestamp.
4. An invite email is dispatched (via Nodemailer SMTP or logged to the dev console).
5. Upon acceptance at `/invitations/accept?token=...`, the hash is validated, marked `accepted`, and the user is atomically enrolled into the workspace.

---

## 5. Role-Based Access Control (RBAC) Matrix

ProjectPilot enforces strict hierarchical authorization checks at both workspace and project layers:

### Workspace Layer:
| Capability | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| View Workspace & Projects | Yes | Yes | Yes |
| Create Projects | Yes | Yes | No |
| Invite Workspace Members | Yes | Yes | No |
| View Security Audit Trail | Yes | Yes | No |
| Manage Workspace Billing & Plan | Yes | Yes | No |
| Delete Workspace | Yes | No | No |

### Project Layer:
| Capability | Workspace Owner/Admin | Project Admin | Project Member |
|---|:---:|:---:|:---:|
| View Board & Issues | Yes | Yes | Yes |
| Create / Edit Issues | Yes | Yes | Yes |
| Comment & Attach Files | Yes | Yes | Yes |
| Create & Manage Sprints | Yes | Yes | No |
| Modify Board Columns & WIP Limits | Yes | Yes | No |
| Archive / Delete Project | Yes | Yes | No |

---

## 6. Immutable Security Audit Trail

All sensitive administrative and data mutations generate structured audit events recorded in `AuditLog`:

```typescript
// server/src/models/AuditLog.ts
{
  workspace: ObjectId,
  actor: ObjectId,
  action: 'workspace.invite_sent' | 'workspace.role_changed' | 'project.deleted' | 'session.revoked' | ...,
  targetEntity: 'Workspace' | 'Project' | 'Issue' | 'User',
  targetId: ObjectId,
  ipAddress: string,
  userAgent: string,
  metadata: Record<string, unknown>,
  timestamp: Date
}
```

Audit records are indexed by `{ workspace: 1, createdAt: -1 }` and accessible through the audit explorer (`GET /api/workspaces/:id/audit-log`) for compliance reporting.

---

## 7. Tiered Rate Limiting Policies

| Tier | Window | Max Requests | Purpose |
|------|--------|--------------|---------|
| **Global API** | 1 minute | 300 | Prevents denial-of-service spam |
| **Authentication** | 15 minutes | 15 | Protects login/register from credential stuffing |
| **Invitations** | 1 hour | 30 | Prevents invite email spam abuse |
| **File Uploads** | 15 minutes | 30 | Throttles Cloudinary bandwidth and storage consumption |
