FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

RUN npm install

COPY shared/ ./shared/
RUN npm run build --workspace=shared

COPY server/ ./server/
RUN npm run build --workspace=server

FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

RUN npm install --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/server
EXPOSE 5000

CMD ["node", "dist/server.js"]
