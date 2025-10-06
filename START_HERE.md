# 👋 Comece Aqui - Sistema Burguesa

## 🚀 Início Rápido em 3 Passos

### 1️⃣ Instale Dependências

```bash
npm install
```

### 2️⃣ Configure o Banco de Dados

```bash
# Crie o banco PostgreSQL
createdb burguesa

# Configure .env
cp .env.example .env
nano .env

# Execute migrations
npm run prisma:migrate

# Popule com dados de teste
npx tsx scripts/seed.ts
```

### 3️⃣ Inicie o Servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔐 Credenciais de Teste

**Recepcionista** (acesso completo):
- Email: `admin@burguesa.com`
- Senha: `admin123`

**Garçom** (acesso limitado):
- Email: `joao@burguesa.com`
- Senha: `garcom123`

---

## 📚 Documentação

### Essencial
- **[QUICKSTART.md](QUICKSTART.md)** - Guia de início rápido
- **[README.md](README.md)** - Documentação completa
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Visão geral do projeto

### Configuração
- **[PRINTER_SETUP.md](PRINTER_SETUP.md)** - Configure impressoras térmicas
- **[DATABASE.md](DATABASE.md)** - Estrutura do banco de dados
- **[DEPLOY.md](DEPLOY.md)** - Deploy em produção

### Referência
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Exemplos de uso da API
- **[FAQ.md](FAQ.md)** - Perguntas frequentes
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de versões

---

## ✨ Funcionalidades Principais

- ✅ **Gerenciamento de Mesas** - Interface visual com drag & drop
- ✅ **Sistema de Pedidos** - Adicionar produtos, calcular totais
- ✅ **Impressão Térmica** - Cozinha e recepção (ESC/POS)
- ✅ **Calculadora Flutuante** - Ferramenta auxiliar
- ✅ **Dashboard** - Visão geral em tempo real
- ✅ **Histórico** - Relatórios completos
- ✅ **Multi-usuário** - Recepcionistas e garçons

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor dev
npm run build                  # Build de produção
npm start                      # Inicia produção

# Banco de Dados
npm run prisma:studio          # Interface visual do BD
npm run prisma:migrate         # Executa migrations
npx tsx scripts/seed.ts        # Popula banco com dados

# Utilitários
npm run lint                   # Verifica código
```

---

## 🔧 Requisitos

- **Node.js** 18+ LTS
- **PostgreSQL** 14+
- **npm** ou **yarn**

Opcional:
- **Docker** (para PostgreSQL containerizado)
- **Impressoras Térmicas** KP-IM607 Knup (58mm, ESC/POS)

---

## 🐛 Problemas?

### Erro de conexão com banco
```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Ou com Docker
docker ps
```

### Erro de permissões
```bash
# Recompile módulos
npm rebuild
```

### Precisa de ajuda?
Consulte **[FAQ.md](FAQ.md)** ou abra uma issue no GitHub.

---

## 📞 Próximos Passos

1. ✅ Explore o sistema com dados de teste
2. ✅ Leia **[README.md](README.md)** para entender melhor
3. ✅ Configure suas **impressoras** (se tiver)
4. ✅ Adicione seus **produtos reais**
5. ✅ Crie **usuários garçons** reais
6. ✅ Configure para **produção** quando pronto

---

## 🎯 Estrutura do Projeto

```
burguesa/
├── src/              # Código fonte
│   ├── app/          # Pages e API Routes
│   ├── components/   # Componentes React
│   ├── lib/          # Bibliotecas
│   ├── services/     # Serviços (impressão)
│   ├── store/        # Estado global
│   └── types/        # Tipos TypeScript
├── prisma/           # Schema do banco
├── scripts/          # Scripts úteis
└── docs/             # Documentação (este arquivo)
```

---

## 🌟 Destaques

### Tecnologias Modernas
- Next.js 15
- React 19
- TypeScript 5
- PostgreSQL
- Prisma ORM
- Tailwind CSS

### Arquitetura Escalável
- Código limpo e organizado
- Tipagem completa
- Documentação extensa
- Fácil manutenção

### Pronto para Produção
- Sistema de autenticação seguro
- API REST completa
- Suporte offline
- Impressão térmica
- Real-time updates

---

## 💡 Dicas

1. **Primeiro uso**: Execute o seed para ter dados de teste
2. **Desenvolvimento**: Use `npm run dev` e Hot Reload
3. **Banco de dados**: Use Prisma Studio para visualizar dados
4. **Produção**: Siga o guia em **DEPLOY.md**
5. **Impressoras**: Configure apenas quando necessário

---

## 🎉 Pronto!

Você está pronto para usar o **Sistema Burguesa**!

Se tiver dúvidas:
1. Consulte **[FAQ.md](FAQ.md)**
2. Leia **[README.md](README.md)**
3. Veja exemplos em **[API_EXAMPLES.md](API_EXAMPLES.md)**
4. Abra uma issue no GitHub

**Bom trabalho! 🍔**

---

**Sistema Burguesa** - Gerenciamento completo para restaurantes
