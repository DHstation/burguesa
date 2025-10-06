# 🚀 Guia Rápido de Início

## Início Rápido em 5 Minutos

### 1. Pré-requisitos

```bash
# Verifique se tem Node.js 18+
node --version

# Verifique se tem PostgreSQL rodando
psql --version
```

### 2. Clone e Instale

```bash
# Clone o repositório
git clone <url-do-repo>
cd burguesa

# Instale dependências
npm install
```

### 3. Configure o Banco de Dados

```bash
# Crie o banco de dados PostgreSQL
createdb burguesa

# Ou com Docker
docker run --name burguesa-db \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=burguesa \
  -p 5432:5432 \
  -d postgres
```

### 4. Configure Variáveis de Ambiente

```bash
# Copie o exemplo
cp .env.example .env

# Edite o .env
nano .env
```

Mínimo necessário:
```env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/burguesa"
JWT_SECRET="mude-esta-chave-secreta"
```

### 5. Execute Migrations e Seed

```bash
# Gera cliente Prisma
npm run prisma:generate

# Executa migrations
npm run prisma:migrate

# Popula banco com dados de teste
npx tsx scripts/seed.ts
```

### 6. Inicie o Servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

### 7. Faça Login

**Recepcionista**:
- Email: `admin@burguesa.com`
- Senha: `admin123`

**Garçom**:
- Email: `joao@burguesa.com`
- Senha: `garcom123`

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Inicia dev server
npm run build                  # Build de produção
npm start                      # Inicia produção

# Prisma
npm run prisma:generate        # Gera cliente
npm run prisma:migrate         # Executa migrations
npm run prisma:studio          # Abre Prisma Studio

# Banco de Dados
npx tsx scripts/seed.ts        # Popula banco
psql burguesa                  # Acessa PostgreSQL
```

---

## Estrutura Rápida

```
burguesa/
├── src/
│   ├── app/              # Pages e API Routes
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários
│   ├── services/         # Serviços (impressão, etc)
│   ├── store/            # Estado global (Zustand)
│   └── types/            # Tipos TypeScript
├── prisma/
│   └── schema.prisma     # Schema do banco
├── .env                  # Variáveis de ambiente
└── package.json
```

---

## Funcionalidades Principais

### Como Recepcionista

1. **Ver Dashboard**: Visão geral de mesas e vendas
2. **Criar Mesa**: Botão "Nova Mesa"
3. **Gerenciar Produtos**: Menu → Produtos → Criar/Editar
4. **Liberar Mesa**: Clique em mesa finalizada → Liberar
5. **Imprimir Nota**: Mesa finalizada → Imprimir Nota Fiscal

### Como Garçom

1. **Pegar Mesa**: Clique em mesa vazia → Atender
2. **Adicionar Produtos**: Mesa → Adicionar Produtos → Selecione → Confirmar
3. **Fechar Conta**: Mesa → Fechar Conta
4. **Unir Mesas**: Arraste uma mesa sobre outra

---

## Troubleshooting Rápido

### Erro de conexão com banco

```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Ou com Docker
docker ps

# Teste conexão
psql -U postgres -h localhost -d burguesa
```

### Erro de permissão

```bash
# Recompile módulos nativos
npm rebuild

# Ou reinstale
rm -rf node_modules
npm install
```

### Impressora não conecta

Veja [PRINTER_SETUP.md](PRINTER_SETUP.md) para guia completo

---

## Próximos Passos

1. ✅ Configure as impressoras térmicas (veja [PRINTER_SETUP.md](PRINTER_SETUP.md))
2. ✅ Adicione seus produtos reais
3. ✅ Crie usuários garçons reais
4. ✅ Configure backup automático
5. ✅ Ajuste taxa de serviço (padrão 10%)

---

## Suporte

- 📖 README completo: [README.md](README.md)
- 🖨️ Configuração impressoras: [PRINTER_SETUP.md](PRINTER_SETUP.md)
- 🐛 Issues: [GitHub Issues](...)

---

**Pronto para começar!** 🎉
