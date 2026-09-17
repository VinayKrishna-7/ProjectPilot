# Database Backups & Disaster Recovery Guide

## 1. Overview

ProjectPilot relies on MongoDB for persistent, multi-tenant SaaS data storage. To ensure business continuity and meet enterprise Recovery Point Objectives (RPO < 1 hour) and Recovery Time Objectives (RTO < 30 minutes), this document defines standard operational backup and recovery procedures.

---

## 2. Replica Set Point-in-Time Recovery (PITR)

In production, ProjectPilot requires a MongoDB Replica Set (`rs0`). This architecture provides:
1. **Automatic Failover:** Zero downtime during primary node maintenance.
2. **Oplog (Operations Log):** A rolling record of all mutations enabling continuous point-in-time restoration down to a specific second.

To initiate a replica set locally or on a VPS:
```bash
# Connect to primary mongosh
mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

---

## 3. Automated Backup Script (`scripts/backup.sh`)

A production backup script executes via daily/hourly cron, creating gzip-compressed archives and streaming them to off-site object storage (AWS S3 or Cloudflare R2):

```bash
#!/usr/bin/env bash
set -eo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/projectpilot_backups"
ARCHIVE_NAME="projectpilot_backup_${TIMESTAMP}.tar.gz"
S3_BUCKET="s3://projectpilot-production-backups"

mkdir -p "${BACKUP_DIR}"

echo "📦 [${TIMESTAMP}] Starting ProjectPilot database backup..."

# 1. Execute mongodump with oplog for consistency
mongodump \
  --uri="${MONGODB_URI}" \
  --archive="${BACKUP_DIR}/${ARCHIVE_NAME}" \
  --gzip \
  --oplog

# 2. Upload to encrypted off-site cloud storage
aws s3 cp "${BACKUP_DIR}/${ARCHIVE_NAME}" "${S3_BUCKET}/${ARCHIVE_NAME}" --sse aws:kms

# 3. Clean up local staging file
rm -f "${BACKUP_DIR}/${ARCHIVE_NAME}"

echo "✅ [${TIMESTAMP}] Backup completed and archived to ${S3_BUCKET}/${ARCHIVE_NAME}"
```

---

## 4. Disaster Recovery & Restoration Procedure

In the event of database corruption or hardware failure:

### 1. Full Database Restoration
```bash
# Download backup archive
aws s3 cp s3://projectpilot-production-backups/projectpilot_backup_20260916_030000.tar.gz ./backup.tar.gz

# Restore to fresh MongoDB cluster with oplog replay
mongorestore \
  --uri="mongodb://localhost:27017/projectpilot" \
  --archive=./backup.tar.gz \
  --gzip \
  --oplogReplay \
  --drop
```

### 2. Post-Restoration Verification Checklist
1. Verify document counts across collections (`Issue.countDocuments()`, `Workspace.countDocuments()`).
2. Verify all unique indexes are active:
   ```javascript
   db.issues.getIndexes();
   db.workspaces.getIndexes();
   db.users.getIndexes();
   ```
3. Run readiness probe:
   ```bash
   curl -i http://localhost:5000/readiness
   ```
4. Perform sample read/write validation using test user credentials.

---

## 5. Index Maintenance & Performance Tuning

To maintain low latency on large datasets (100,000+ issues), ensure all compound indexes are rebuilt periodically:

```javascript
db.issues.reIndex();
db.auditlogs.reIndex();
```

Use `explain("executionStats")` to verify that queries utilize index scans (`IXSCAN`) rather than collection scans (`COLLSCAN`):
```javascript
db.issues.find({ project: ObjectId("..."), status: "in_progress" }).explain("executionStats");
```
