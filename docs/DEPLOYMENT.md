# Production Deployment & Operations Guide

## 1. Overview & Production Topology

In a production environment, ProjectPilot is deployed as containerized services behind a TLS-terminating reverse proxy (Nginx or Cloudflare), connected to a MongoDB Replica Set:

```
                            [ Internet HTTPS / WSS ]
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │  Nginx / Cloudflare Proxy     │
                       │  - TLS Termination           │
                       │  - HTTP/2 & WebSocket Upgrade │
                       └───────────────┬───────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     ┌─────────────────────┐                       ┌─────────────────────┐
     │  Client SPA (Nginx) │                       │  Server API (Node)  │
     │  Port: 80 / 443     │                       │  Port: 5000         │
     └─────────────────────┘                       └──────────┬──────────┘
                                                              │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ MongoDB Replica Set │
                                                   │ Primary + 2 Second. │
                                                   └─────────────────────┘
```

---

## 2. Docker Compose Deployment

The root `docker-compose.yml` orchestrates the complete stack:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: projectpilot-mongo
    restart: always
    environment:
      MONGO_INITDB_DATABASE: projectpilot
    volumes:
      - mongo_data:/data/db
    ports:
      - '27017:27017'
    command: ['--replSet', 'rs0', '--bind_ip_all']

  server:
    build:
      context: .
      dockerfile: server/Dockerfile
    container_name: projectpilot-server
    restart: always
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://mongodb:27017/projectpilot?replicaSet=rs0
      JWT_SECRET: ${JWT_SECRET}
      CLIENT_URL: https://app.projectpilot.dev
      RATE_LIMIT_MAX: 300
    depends_on:
      - mongodb
    ports:
      - '5000:5000'

  client:
    build:
      context: .
      dockerfile: client/Dockerfile
    container_name: projectpilot-client
    restart: always
    ports:
      - '80:80'
    depends_on:
      - server

volumes:
  mongo_data:
```

---

## 3. Nginx Reverse Proxy Configuration

Ensure WebSocket upgrades (`Connection: upgrade`) are forwarded to allow Socket.IO persistence:

```nginx
server {
    listen 443 ssl http2;
    server_name app.projectpilot.dev;

    ssl_certificate /etc/letsencrypt/live/projectpilot.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/projectpilot.dev/privkey.pem;

    # Client Single Page Application
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO WebSocket Engine
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 4. Health Checks & Monitoring

The server exposes dedicated monitoring endpoints:
- **Liveness Probe:** `GET /health` — Returns HTTP 200 `{ status: "ok" }`.
- **Readiness Probe:** `GET /readiness` — Evaluates MongoDB connectivity and returns HTTP 200 `{ status: "ready", database: "connected", mode: "mongodb" }` or HTTP 503 if unreachable.
- **OpenAPI Interactive Documentation:** `GET /api/docs` (Swagger UI) and `GET /api/docs/json` (OpenAPI 3.0 specification).
