# 🚀 Guia de Deploy e Produção

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deploy Local (PM2)](#deploy-local-pm2)
3. [Deploy com Docker](#deploy-com-docker)
4. [Deploy na Nuvem](#deploy-na-nuvem)
5. [Backup e Recuperação](#backup-e-recuperação)
6. [Monitoramento](#monitoramento)
7. [Segurança](#segurança)

---

## Pré-requisitos

### Servidor

- **CPU**: 2+ cores
- **RAM**: 4GB mínimo (8GB recomendado)
- **Disco**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ LTS ou similar
- **Node.js**: 18+ LTS
- **PostgreSQL**: 14+

### Checklist

- [ ] Servidor configurado
- [ ] PostgreSQL instalado
- [ ] Node.js instalado
- [ ] Domínio configurado (opcional)
- [ ] SSL/TLS certificado (recomendado)
- [ ] Firewall configurado
- [ ] Backup automático configurado

---

## Deploy Local (PM2)

### 1. Instale PM2

```bash
npm install -g pm2
```

### 2. Configure Variáveis de Produção

```bash
cp .env.example .env.production

nano .env.production
```

**Importante**: Use valores seguros em produção!

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:SENHA_FORTE@localhost:5432/burguesa"
JWT_SECRET="chave-super-secreta-aleatoria-64-caracteres-minimo"
PORT=3000
```

### 3. Build da Aplicação

```bash
npm run build
```

### 4. Inicie com PM2

Crie `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'burguesa',
    script: 'npm',
    args: 'start',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

Inicie:

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Nginx (Opcional)

Configure Nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Ative SSL com Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

## Deploy com Docker

### 1. Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: burguesa-db
    environment:
      POSTGRES_DB: burguesa
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build: .
    container_name: burguesa-app
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/burguesa
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

### 3. .dockerignore

```
node_modules
.next
.git
.env
*.log
npm-debug.log*
```

### 4. Build e Execute

```bash
# Build
docker-compose build

# Inicie
docker-compose up -d

# Logs
docker-compose logs -f app

# Parar
docker-compose down
```

---

## Deploy na Nuvem

### Vercel (Frontend + API Routes)

```bash
# Instale Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Configure variáveis de ambiente no dashboard da Vercel.

### Railway

1. Conecte repositório GitHub
2. Configure variáveis de ambiente
3. Deploy automático em cada push

### AWS EC2

1. Lance instância EC2 (Ubuntu)
2. Configure Security Groups (portas 80, 443, 22)
3. Instale Node.js e PostgreSQL
4. Clone repositório
5. Siga passos do PM2

### DigitalOcean App Platform

1. Conecte repositório
2. Configure como "Web Service"
3. Adicione PostgreSQL managed database
4. Configure variáveis
5. Deploy

---

## Backup e Recuperação

### Backup Automático PostgreSQL

#### Script de Backup

Crie `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/burguesa"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="burguesa"
DB_USER="postgres"

mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete

echo "Backup concluído: backup_$DATE.dump"
```

Torne executável:

```bash
chmod +x backup.sh
```

#### Agendar com Cron

```bash
crontab -e
```

Adicione (backup diário às 3h):

```
0 3 * * * /caminho/para/backup.sh >> /var/log/burguesa-backup.log 2>&1
```

### Restaurar Backup

```bash
pg_restore -U postgres -d burguesa -c /var/backups/burguesa/backup_20251006_030000.dump
```

### Backup de Arquivos

```bash
# Backup de uploads (se houver)
tar -czf uploads_$(date +%Y%m%d).tar.gz /caminho/para/uploads

# Sync para S3 (AWS)
aws s3 sync /var/backups/burguesa s3://seu-bucket/backups/
```

---

## Monitoramento

### PM2 Monitoring

```bash
# Status
pm2 status

# Logs em tempo real
pm2 logs

# Monitoramento detalhado
pm2 monit

# Dashboard web (PM2 Plus - grátis para 1 servidor)
pm2 link <secret> <public>
```

### Health Check

Crie endpoint de health:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Testa conexão com banco
    await prisma.$queryRaw`SELECT 1`

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  } catch (error) {
    return Response.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}
```

### Monitoramento com UptimeRobot

1. Acesse [uptimerobot.com](https://uptimerobot.com)
2. Crie monitor HTTP(S)
3. URL: `https://seu-dominio.com/api/health`
4. Intervalo: 5 minutos
5. Configure alertas

### Logs

#### Winston (Logger estruturado)

```bash
npm install winston
```

```typescript
// src/lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

Use:

```typescript
import { logger } from '@/lib/logger'

logger.info('Pedido criado', { orderId: order.id })
logger.error('Erro ao imprimir', { error: error.message })
```

---

## Segurança

### SSL/TLS

```bash
# Let's Encrypt (grátis)
sudo certbot certonly --standalone -d seu-dominio.com
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### PostgreSQL

```bash
# Edite pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Permita apenas localhost:

```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

### Variáveis Sensíveis

**NUNCA comite .env no Git!**

Use serviços de secrets:
- AWS Secrets Manager
- Vercel Environment Variables
- Railway Variables
- HashiCorp Vault

### Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // max 100 requests por IP
})

app.use('/api/', limiter)
```

### Helmet (Headers de segurança)

```bash
npm install helmet
```

```typescript
import helmet from 'helmet'
app.use(helmet())
```

---

## Performance

### Cache

```bash
npm install ioredis
```

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache de produtos
const products = await redis.get('products')
if (!products) {
  const data = await prisma.product.findMany()
  await redis.set('products', JSON.stringify(data), 'EX', 300) // 5 min
  return data
}
return JSON.parse(products)
```

### CDN

Use CDN para assets estáticos:
- Cloudflare (grátis)
- Vercel Edge Network
- AWS CloudFront

### Database Indexing

```prisma
// prisma/schema.prisma
model Table {
  // ...
  @@index([status])
  @@index([number])
}

model Order {
  // ...
  @@index([tableId])
  @@index([waiterId])
  @@index([createdAt])
}
```

---

## Checklist de Deploy

### Antes do Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] JWT_SECRET forte (64+ caracteres)
- [ ] Senhas de banco fortes
- [ ] Migrations executadas
- [ ] Build sem erros
- [ ] Testes passando
- [ ] .env adicionado ao .gitignore

### Pós-Deploy

- [ ] Aplicação acessível
- [ ] Health check respondendo
- [ ] Login funcionando
- [ ] Banco de dados conectado
- [ ] Logs sendo gerados
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] SSL/TLS ativo
- [ ] Firewall configurado
- [ ] Usuários criados

### Manutenção Regular

- [ ] Verificar logs semanalmente
- [ ] Testar restore de backup mensalmente
- [ ] Atualizar dependências mensalmente
- [ ] Revisar uso de recursos
- [ ] Limpar logs antigos
- [ ] Verificar espaço em disco

---

## Troubleshooting em Produção

### Aplicação não inicia

```bash
# Verifique logs
pm2 logs --lines 100

# Variáveis de ambiente
pm2 env 0

# Processo zombie?
pm2 delete all
pm2 start ecosystem.config.js
```

### Erro de conexão com banco

```bash
# PostgreSQL rodando?
sudo systemctl status postgresql

# Conexão de rede
psql -h localhost -U postgres -d burguesa

# Firewall
sudo ufw status
```

### Alta utilização de memória

```bash
# Monitorar
pm2 monit

# Reiniciar
pm2 restart burguesa

# Ajustar max_memory_restart em ecosystem.config.js
```

### Logs crescendo muito

```bash
# Rotação de logs PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Suporte

Para problemas de deploy, consulte:
- [README.md](README.md)
- [QUICKSTART.md](QUICKSTART.md)
- Issues do GitHub

---

**Sistema Burguesa** - Guia de Deploy v1.0
