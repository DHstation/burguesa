# Dockerfile para Sistema Burguesa
FROM node:20-slim AS base

# Instalar dependências necessárias para Prisma e USB
RUN apt-get update && apt-get install -y \
    openssl \
    libusb-1.0-0 \
    libusb-1.0-0-dev \
    libudev-dev \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências
FROM base AS deps
RUN npm ci

# Rebuild módulo USB nativo
RUN npm rebuild usb --build-from-source

# Build da aplicação
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build do Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expor porta
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs

CMD ["node", "server.js"]
