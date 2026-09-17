# Concurrency Architecture & Optimistic Concurrency Control (OCC)

## 1. Problem Statement: The Lost Update Anomaly

In multi-user project management environments, concurrent edits to the same issue are frequent:
- **Scenario:** User A opens issue PP-42 (Status: "To Do", Priority: "Medium"). User B simultaneously changes PP-42's status to "In Progress". Moments later, User A edits the description and clicks save.
- **Without Concurrency Control:** User A's update overwrites the entire document, silently reverting User B's status transition back to "To Do" (the Classic Lost Update).
- **With ProjectPilot OCC:** User A's update is rejected with an HTTP 409 Conflict because User A's expected document version no longer matches the database version.

---

## 2. Server Implementation Mechanics

Every `Issue` document tracks an integer `version` field, initialized to `1`:

```typescript
// server/src/models/Issue.ts
const issueSchema = new Schema<IIssueDocument>({
  // ... other fields
  version: { type: Number, default: 1 },
});
```

### Atomic Conditional Updates

When updating an issue, the client transmits the `version` it currently holds. The server runs an atomic `findOneAndUpdate`:

```typescript
// server/src/services/issue.service.ts
const filter: Record<string, unknown> = { _id: issueId };
if (input.version !== undefined) {
  filter.version = input.version;
}

const updated = await Issue.findOneAndUpdate(
  filter,
  {
    $set: updateData,
    $inc: { version: 1 }, // Atomically increment version
  },
  { new: true, runValidators: true }
);

if (!updated) {
  // If not found, distinguish between non-existent issue and version mismatch
  const currentIssue = await Issue.findById(issueId);
  if (!currentIssue) {
    throw Errors.notFound('Issue');
  }

  // Version mismatch detected!
  throw new AppError(
    'Issue has been modified by another user. Please reload and review the latest changes.',
    409,
    'CONFLICT',
    {
      currentVersion: currentIssue.version,
      clientVersion: input.version,
      currentIssue,
    }
  );
}
```

---

## 3. Client Conflict Resolution Flow

```
   Client Action                API Request                 Server Response
  ┌──────────────┐           ┌───────────────┐           ┌─────────────────┐
  │ Edit TF-42   │ ────────> │ PATCH /issues │ ────────> │ Check version   │
  │ (Version: 2) │           │ (Version: 2)  │           │ Matches (v3)?   │
  └──────────────┘           └───────────────┘           └────────┬────────┘
                                                                  │
                                                          [Mismatch Found]
                                                                  │
                                                                  ▼
  ┌──────────────────┐           ┌───────────────┐       ┌─────────────────┐
  │ Render Conflict  │ <──────── │ 409 Response  │ <──── │ HTTP 409        │
  │ Resolution Modal │           │ + Remote Diff │       │ 'CONFLICT'      │
  └────────┬─────────┘           └───────────────┘       └─────────────────┘
           │
   ┌───────┴────────┐
   ▼                ▼
[Overwrite]     [Discard & Reload]
Send version=3   Accept server state
```

### Conflict Dialog Component (`ConflictDialog.tsx`)
When a mutation encounters HTTP 409:
1. The mutation error is intercepted.
2. The `ConflictDialog` is opened, displaying:
   - Remote user's changes (e.g., status, description, priority).
   - Local uncommitted changes.
3. The user can either:
   - **Accept Remote Changes:** Discards local changes and refreshes the query cache with `currentIssue`.
   - **Force Overwrite:** Re-submits the mutation using the newly updated `currentVersion`.

---

## 4. Board Drag-and-Drop Concurrency

For Kanban column reordering and card drag-and-drop:
- Card positions utilize floating-point ordering indices with fractional spacing.
- Drag events emit optimistic updates to the UI immediately.
- If two users drop cards into the same slot concurrently, the server evaluates column indices sequentially within the project lock or falls back to re-normalizing card positions when gaps narrow below `0.001`.
