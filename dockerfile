# ==========================================
# Tahap 1: Builder (Proses Build Aplikasi)
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copy seluruh source code aplikasi
COPY . .

RUN npm run build

# Hapus node_modules yang lama, dan install Ulang HANYA production dependencies
RUN npm ci --only=production && npm cache clean --force

# ==========================================
# Tahap 2: Production (Image Akhir)
# ==========================================
FROM node:24-alpine

# (Opsional) Set environment ke production
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER node

EXPOSE 3001

# Jalankan aplikasi
CMD ["node", "dist/main.js"]