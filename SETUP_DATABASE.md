# 🗄️ Configuração do Banco de Dados

## ⚠️ IMPORTANTE

**O erro 500 no login significa que o banco de dados ainda não foi configurado!**

Siga estes passos para configurar:

---

## Passo 1: Verificar PostgreSQL

Certifique-se de que o PostgreSQL está instalado e rodando:

```bash
# Verificar se PostgreSQL está instalado
psql --version

# Verificar se está rodando
sudo systemctl status postgresql
```

### Não tem PostgreSQL?

#### Opção 1: Instalar PostgreSQL no Ubuntu

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Opção 2: Usar Docker (Mais Fácil)

```bash
docker run --name burguesa-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=burguesa \
  -p 5432:5432 \
  -d postgres:14

# Verificar se está rodando
docker ps
```

---

## Passo 2: Criar o Banco de Dados

### Com PostgreSQL Local

```bash
# Conectar como postgres
sudo -u postgres psql

# Dentro do psql:
CREATE DATABASE burguesa;
\q
```

**OU em uma linha:**

```bash
sudo -u postgres createdb burguesa
```

### Com Docker

Se usou Docker no Passo 1, o banco já foi criado automaticamente! ✅

---

## Passo 3: Configurar .env

Verifique se o arquivo `.env` tem a configuração correta:

```env
# Para PostgreSQL local
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/burguesa?schema=public"

# Para Docker
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/burguesa?schema=public"
```

**IMPORTANTE**: Substitua `sua_senha` pela senha do seu PostgreSQL!

### Testar Conexão

```bash
# Com PostgreSQL local
psql -U postgres -h localhost -d burguesa

# Com Docker
docker exec -it burguesa-db psql -U postgres -d burguesa
```

Se conectou sem erros, está tudo certo! Digite `\q` para sair.

---

## Passo 4: Gerar Cliente Prisma

```bash
npm run prisma:generate
```

Você deve ver:

```
✔ Generated Prisma Client
```

---

## Passo 5: Executar Migrations

Isto cria todas as tabelas no banco:

```bash
npm run prisma:migrate
```

Quando perguntar o nome da migration, digite algo como: `init`

Você deve ver:

```
✔ Database schema migrated successfully
```

---

## Passo 6: Popular com Dados de Teste

```bash
npx tsx scripts/seed.ts
```

Você deve ver:

```
🌱 Iniciando seed do banco de dados...
🗑️  Limpando dados existentes...
👤 Criando usuários...
✅ Criados 3 usuários
🪑 Criando mesas...
✅ Criadas 20 mesas
🍔 Criando produtos...
✅ Criados produtos
🖨️  Criando configurações de impressoras...
✅ Criadas configurações de impressoras

✨ Seed concluído com sucesso!

📊 Resumo:
   - Usuários: 3 (1 recepcionista, 2 garçons)
   - Mesas: 20
   - Produtos: 18
   - Impressoras: 2

🔐 Credenciais:
   Admin: admin@burguesa.com / admin123
   Garçom 1: joao@burguesa.com / garcom123
   Garçom 2: maria@burguesa.com / garcom123
```

---

## Passo 7: Verificar se Funcionou

### Teste 1: Health Check

Acesse no navegador: http://localhost:3000/api/health

Deve retornar:

```json
{
  "status": "ok",
  "message": "Sistema funcionando",
  "database": "connected",
  "timestamp": "..."
}
```

### Teste 2: Login

1. Acesse: http://localhost:3000/login
2. Use: `admin@burguesa.com` / `admin123`
3. Você deve ser redirecionado para o dashboard!

---

## 🎉 Pronto!

Se tudo funcionou, você está pronto para usar o sistema!

---

## 🐛 Troubleshooting

### Erro: "Connection refused"

PostgreSQL não está rodando:

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Ou com Docker
docker start burguesa-db
```

### Erro: "password authentication failed"

Senha incorreta no `.env`. Verifique a senha do PostgreSQL:

```bash
# Redefinir senha do postgres (Linux)
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nova_senha';
\q
```

Atualize o `.env` com a nova senha.

### Erro: "database does not exist"

O banco não foi criado. Volte ao Passo 2.

### Erro: "relation does not exist"

As migrations não foram executadas. Volte ao Passo 5.

### Erro: "Port 5432 already in use"

Já tem PostgreSQL rodando:

```bash
# Verificar o que está rodando
sudo lsof -i :5432

# Parar PostgreSQL existente
sudo systemctl stop postgresql

# OU parar Docker existente
docker stop burguesa-db
```

### Verificar Logs do Prisma

```bash
# No terminal onde o dev server está rodando
# Você verá logs de queries SQL se estiver funcionando
```

---

## 🔧 Comandos Úteis

```bash
# Ver estrutura do banco
npm run prisma:studio

# Ver tabelas no psql
psql -U postgres -d burguesa -c "\dt"

# Resetar banco (CUIDADO: apaga tudo!)
npm run prisma:migrate reset

# Ver logs do Docker
docker logs burguesa-db

# Conectar ao banco
psql -U postgres -h localhost -d burguesa
```

---

## 📋 Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco `burguesa` criado
- [ ] `.env` configurado corretamente
- [ ] `npm run prisma:generate` executado
- [ ] `npm run prisma:migrate` executado
- [ ] `npx tsx scripts/seed.ts` executado
- [ ] http://localhost:3000/api/health retorna status "ok"
- [ ] Login funciona

---

**Se todos os itens estão ✅, você está pronto!** 🎊

Qualquer problema, consulte [FAQ.md](FAQ.md)
