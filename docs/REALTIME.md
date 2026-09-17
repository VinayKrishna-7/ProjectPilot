# Real-Time Architecture & Socket.IO Topology

## 1. Overview

ProjectPilot delivers sub-second collaborative updates across distributed team members using a multi-tiered Socket.IO architecture. When any user updates an issue, leaves a comment, or reorganizes the board, all teammates actively viewing the relevant workspace or project receive instantaneous updates without manual page refreshes.

---

## 2. Room Hierarchy & Scoping

To prevent unnecessary network broadcast overhead, sockets are partitioned into granular rooms based on domain context:

```
                          ┌───────────────────────────┐
                          │   Socket.IO Connection    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│ workspace:<id>        │   │ project:<id>          │   │ issue:<id>            │
├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤
│ Workspace membership, │   │ Board movements,      │   │ Active issue editing, │
│ member invites, role  │   │ column changes,       │   │ typing indicators,    │
│ promotions            │   │ sprint lifecycle      │   │ live comments         │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

In addition, every authenticated user automatically joins a personal room:
- `user:<userId>`: Scoped for direct notifications (mentions, issue assignments, sprint reminders).

---

## 3. Connection Lifecycle & Reconnection Topology

### Client Connection Management (`useSocketSync.ts`)
The client manages the socket connection with automatic exponential backoff:
```typescript
const socket = io(API_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});
```

### Transparent Room Re-Subscription
When a connection drops (e.g., temporary network interruption, laptop sleep) and reconnects:
1. The socket receives a new connection ID.
2. The client triggers the `reconnect` handler.
3. Active project and issue subscriptions are automatically re-joined:
   ```typescript
   socket.on('connect', () => {
     if (currentProjectId) {
       socket.emit('join:project', currentProjectId);
     }
     if (activeIssueId) {
       socket.emit('join:issue', activeIssueId);
     }
   });
   ```
4. Stale TanStack Query caches are selectively invalidated to capture any updates that occurred during the disconnected window.

---

## 4. Standard Event Dictionary

| Event Name | Scoped Room | Payload Summary | UI Action Triggered |
|------------|-------------|-----------------|---------------------|
| `issue:created` | `project:<id>` | `IIssue` | Appends issue to backlog or board column |
| `issue:updated` | `project:<id>` | `IIssue` | Updates card in place; checks OCC version |
| `issue:moved` | `project:<id>` | `{ issueId, columnId, position }` | Smooth card repositioning animation |
| `issue:deleted` | `project:<id>` | `{ issueId }` | Removes card from board view |
| `comment:added` | `issue:<id>` | `IComment` | Appends comment to discussion thread |
| `sprint:started` | `project:<id>` | `ISprint` | Switches board context to new active sprint |
| `sprint:completed` | `project:<id>` | `{ sprintId, rolledOverCount }` | Archives sprint and refreshes backlog |
| `notification:new` | `user:<id>` | `INotification` | Increments notification bell badge & toast |

---

## 5. Deduplication & Optimistic UI Coordination

When User A performs a mutation (e.g., moves an issue):
1. **Local Optimistic Update:** TanStack Query immediately applies the change to the local cache, providing 0ms perceived latency.
2. **Server Mutation:** An HTTP PATCH request is transmitted with the current version.
3. **Broadcast Event:** The server emits `issue:moved` to `project:<id>`.
4. **Sender Deduplication:** The originating client ignores or reconciles the incoming socket event against its pending mutation queue using the unique issue ID and expected version.
