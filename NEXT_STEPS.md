# 🎯 Próximos Passos - Sistema Burguesa

## ✅ O que já está funcionando

1. ✅ **Servidor Next.js rodando** em http://localhost:3000
2. ✅ **Página de Login** criada e funcional
3. ✅ **Dashboard** com estatísticas e navegação
4. ✅ **API de Login** implementada
5. ✅ **Autenticação JWT** configurada
6. ✅ **Store Zustand** para gerenciamento de estado
7. ✅ **Calculadora flutuante** disponível
8. ✅ **Tailwind CSS 4** configurado

## 🔧 Configure o Banco de Dados

Antes de testar o login, você precisa configurar o banco:

### 1. Criar Banco de Dados

```bash
# Opção 1: PostgreSQL local
createdb burguesa

# Opção 2: Docker
docker run --name burguesa-db \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=burguesa \
  -p 5432:5432 \
  -d postgres
```

### 2. Verificar .env

Edite o arquivo `.env` se necessário:

```env
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/burguesa?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 3. Executar Migrations

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations (criar tabelas)
npm run prisma:migrate

# Popular com dados de teste
npx tsx scripts/seed.ts
```

## 🚀 Testar o Sistema

### 1. Acesse a Aplicação

Abra seu navegador em: **http://localhost:3000**

Você será redirecionado para `/login`

### 2. Faça Login

Use uma das credenciais de teste:

**Recepcionista (Acesso Completo):**
- Email: `admin@burguesa.com`
- Senha: `admin123`

**Garçom (Acesso Limitado):**
- Email: `joao@burguesa.com`
- Senha: `garcom123`

### 3. Explore o Dashboard

Após login, você verá:
- Cards com estatísticas
- Menu de navegação
- Calculadora flutuante (botão no canto inferior esquerdo)

## 📋 Páginas que ainda precisam ser criadas

### Prioritárias (para funcionalidade básica)

1. **Mesas** (`/tables`)
   - Grid com TableCards
   - Drag & Drop para união
   - Modal de detalhes

2. **Produtos** (`/products`)
   - Listagem de produtos
   - Formulário criar/editar
   - Upload de imagens

3. **Pedidos** (`/orders`)
   - Adicionar produtos à mesa
   - Visualizar pedidos ativos
   - Cancelar itens

### APIs que precisam ser criadas

1. `GET /api/products` - Listar produtos
2. `POST /api/products` - Criar produto
3. `PATCH /api/products/[id]` - Atualizar produto
4. `DELETE /api/products/[id]` - Deletar produto
5. `GET /api/orders` - Listar pedidos
6. `POST /api/orders` - Criar pedido
7. `PATCH /api/orders/[id]` - Atualizar pedido
8. `GET /api/dashboard/stats` - Estatísticas do dashboard
9. `POST /api/printers/print` - Imprimir pedido
10. `GET /api/history` - Histórico de vendas

## 🎨 Componentes que podem ser criados

1. **TableGrid** - Grid de mesas com drag & drop
2. **TableModal** - Modal com detalhes da mesa
3. **ProductCard** - Card de produto
4. **ProductForm** - Formulário de produto
5. **OrderModal** - Modal para adicionar produtos
6. **PrinterConfig** - Configuração de impressoras
7. **StatsCard** - Card de estatística reutilizável

## 🛠️ Melhorias Sugeridas

### Curto Prazo

- [ ] Implementar WebSocket para updates em tempo real
- [ ] Adicionar loading states em todas as páginas
- [ ] Implementar tratamento de erros global
- [ ] Adicionar toast notifications
- [ ] Criar página 404 customizada

### Médio Prazo

- [ ] Implementar testes unitários
- [ ] Adicionar validação de formulários (Zod/React Hook Form)
- [ ] Otimizar queries do banco (índices, eager loading)
- [ ] Implementar cache (React Query/SWR)
- [ ] Adicionar dark mode

### Longo Prazo

- [ ] PWA (Progressive Web App)
- [ ] App mobile (React Native)
- [ ] Relatórios avançados
- [ ] Integração com NFC-e
- [ ] Sistema de delivery

## 📖 Estrutura de Pastas Sugerida

```
src/
├── app/
│   ├── api/              # API Routes
│   ├── login/            # ✅ Criado
│   ├── dashboard/        # ✅ Criado
│   ├── tables/           # ⏳ Criar
│   ├── products/         # ⏳ Criar
│   ├── orders/           # ⏳ Criar
│   ├── history/          # ⏳ Criar
│   └── printers/         # ⏳ Criar (recepcionista)
│
├── components/
│   ├── Calculator.tsx    # ✅ Criado
│   ├── TableCard.tsx     # ✅ Criado
│   ├── TableGrid.tsx     # ⏳ Criar
│   ├── TableModal.tsx    # ⏳ Criar
│   ├── ProductCard.tsx   # ⏳ Criar
│   ├── ProductForm.tsx   # ⏳ Criar
│   ├── OrderModal.tsx    # ⏳ Criar
│   └── ui/               # Componentes reutilizáveis
│
├── hooks/
│   ├── useTables.ts      # ⏳ Criar
│   ├── useProducts.ts    # ⏳ Criar
│   └── useOrders.ts      # ⏳ Criar
│
└── lib/
    ├── api.ts            # ⏳ Cliente API
    └── utils.ts          # ⏳ Utilitários
```

## 🐛 Troubleshooting

### Erro ao conectar com banco

```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Ou com Docker
docker ps

# Teste conexão
psql -U postgres -h localhost -d burguesa
```

### Erro no login

1. Verifique se migrations foram executadas
2. Verifique se o seed foi executado
3. Verifique JWT_SECRET no .env
4. Verifique console do browser para erros

### Página em branco

1. Verifique console do browser (F12)
2. Verifique terminal do servidor
3. Limpe cache: `rm -rf .next`
4. Reinstale: `rm -rf node_modules && npm install`

## 📚 Recursos

### Documentação
- [README.md](README.md) - Documentação completa
- [QUICKSTART.md](QUICKSTART.md) - Início rápido
- [FAQ.md](FAQ.md) - Perguntas frequentes
- [API_EXAMPLES.md](API_EXAMPLES.md) - Exemplos de API

### Tecnologias
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand)

## ✨ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server
npm run build            # Build produção
npm start                # Inicia produção

# Banco de Dados
npm run prisma:studio    # UI visual do banco
npm run prisma:migrate   # Executar migrations
npx tsx scripts/seed.ts  # Popular banco

# Utilitários
npm run lint             # Verificar código
rm -rf .next             # Limpar cache Next.js
```

## 🎯 Sugestão de Ordem de Implementação

1. **Primeiro**: Configure banco e teste login ✅
2. **Segundo**: Implemente página de Mesas
3. **Terceiro**: Implemente página de Produtos
4. **Quarto**: Implemente página de Pedidos
5. **Quinto**: Configure impressoras
6. **Sexto**: Implemente Histórico/Relatórios

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faça commits: `git commit -m 'feat: adiciona nova funcionalidade'`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

---

**Bom desenvolvimento! 🚀**

Se tiver dúvidas, consulte [FAQ.md](FAQ.md) ou abra uma issue!
