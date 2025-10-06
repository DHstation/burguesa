# 🐳 Docker - Sistema Burguesa

## Configuração Docker

Este projeto está configurado para rodar com Docker e Docker Compose, facilitando o deployment e desenvolvimento.

## Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+

## Estrutura Docker

### Arquivos

- **Dockerfile** - Imagem da aplicação Next.js
- **docker-compose.yml** - Orquestração dos serviços
- **.dockerignore** - Arquivos ignorados no build

### Serviços

1. **postgres** - Banco de dados PostgreSQL 16
2. **app** - Aplicação Next.js

## Como Usar

### 1. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

### 2. Subir os containers

```bash
# Build e start dos serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Apenas logs da aplicação
docker-compose logs -f app
```

### 3. Executar migrations do Prisma

```bash
# Acessar container da aplicação
docker-compose exec app sh

# Dentro do container, executar migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Opcional: Seed do banco
npx prisma db seed
```

### 4. Acessar a aplicação

Abra o navegador em: http://localhost:3000

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (apaga dados do banco)
docker-compose down -v

# Rebuild da aplicação
docker-compose up -d --build app

# Ver status dos containers
docker-compose ps
```

### Banco de Dados

```bash
# Acessar PostgreSQL
docker-compose exec postgres psql -U burguesa -d burguesa

# Backup do banco
docker-compose exec postgres pg_dump -U burguesa burguesa > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U burguesa -d burguesa < backup.sql
```

### Logs e Debug

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f app
docker-compose logs -f postgres

# Ver últimas 100 linhas
docker-compose logs --tail=100 app
```

### Limpeza

```bash
# Remover containers e redes
docker-compose down

# Remover também volumes (CUIDADO: apaga dados!)
docker-compose down -v

# Limpar imagens não utilizadas
docker system prune -a
```

## Acesso USB às Impressoras

O container está configurado com:
- **privileged: true** - Acesso total ao hardware
- **devices: /dev/bus/usb** - Acesso aos dispositivos USB

### Troubleshooting USB

Se a impressora não for reconhecida:

```bash
# No host, verificar dispositivos USB
lsusb

# Verificar permissões
ls -la /dev/bus/usb/

# Dar permissões ao grupo dialout
sudo usermod -a -G dialout $USER

# Reiniciar o container
docker-compose restart app
```

## Volumes Persistentes

### postgres_data
Armazena dados do PostgreSQL

### ./public/uploads
Compartilhado entre host e container para uploads de imagens

## Rede

- **burguesa-network** - Rede bridge customizada
- Comunicação interna: app ↔ postgres
- Porta exposta: 3000 (aplicação), 5432 (PostgreSQL)

## Produção

### Variáveis de ambiente importantes

```env
# Trocar em produção!
JWT_SECRET="sua-chave-secreta-forte-aqui"
DATABASE_URL="postgresql://user:senha@host:5432/db"
NODE_ENV="production"
```

### Build otimizado

O Dockerfile usa multi-stage build para:
- Reduzir tamanho da imagem final
- Separar deps de desenvolvimento/produção
- Executar como usuário não-root (nextjs)
- Output standalone do Next.js

### Segurança

- ✅ Usuário não-root (nextjs:nodejs)
- ✅ Multi-stage build
- ✅ Healthcheck no PostgreSQL
- ✅ Restart policy: unless-stopped
- ⚠️ Trocar JWT_SECRET em produção
- ⚠️ Usar senha forte no PostgreSQL
- ⚠️ Configurar firewall adequado

## Desenvolvimento

Para desenvolvimento local com hot-reload:

```bash
# Usar apenas o banco via Docker
docker-compose up -d postgres

# Rodar aplicação localmente
npm run dev
```

## Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Verificar portas em uso
lsof -i :3000
lsof -i :5432

# Rebuild forçado
docker-compose build --no-cache app
docker-compose up -d
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está healthy
docker-compose ps

# Testar conexão
docker-compose exec app sh
nc -zv postgres 5432

# Ver logs do PostgreSQL
docker-compose logs postgres
```

### Prisma Client desatualizado

```bash
# Regenerar Prisma Client
docker-compose exec app npx prisma generate

# Reiniciar aplicação
docker-compose restart app
```

## Estrutura de Pastas no Container

```
/app/
├── .next/           # Build do Next.js
├── public/          # Arquivos estáticos
│   └── uploads/     # Volume compartilhado
├── prisma/          # Schema e migrations
├── node_modules/    # Dependências
└── server.js        # Entry point (standalone)
```
