# ---- Etapa 1: Build ----
FROM node:20-alpine AS builder

# AÑADE ESTA LÍNEA: Actualiza los paquetes de Alpine para parchar CVEs
RUN apk upgrade --no-cache

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Etapa 2: Runner ----
FROM node:20-alpine AS runner
RUN apk upgrade --no-cache

WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]