# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-10-06

### 🎉 Lançamento Inicial

Sistema completo de gerenciamento de vendas para restaurante.

### ✨ Adicionado

#### Autenticação e Autorização
- Sistema de login com JWT
- Dois níveis de acesso: Recepcionista e Garçom
- Sessões persistentes com tokens de 7 dias
- Middleware de autenticação para rotas protegidas

#### Gerenciamento de Mesas
- Interface visual com cards coloridos (bloquinhos)
- Estados: Vazio (🟦), Atendendo (🟨), Finalizado (🟩)
- Criação e exclusão de mesas (recepcionista)
- Pegar/atender mesas (garçom)
- Liberar mesas (recepcionista)
- Visualização de histórico da mesa

#### União de Mesas
- Drag & drop para unir mesas
- União de 2+ mesas
- Soma automática de valores
- Badge visual "Unida" (🟪)
- Opção de separar mesas
- Pagamento conjunto ou separado

#### Produtos
- CRUD completo (recepcionista)
- Categorias: Bebidas, Lanches, Sobremesas, Refeições, Entradas, Outros
- Upload de imagens
- Busca e filtros
- Ativação/desativação de produtos

#### Pedidos
- Adicionar produtos às mesas
- Quantidade e observações por item
- Cálculo automático de subtotal
- Taxa de serviço (10%)
- Total final
- Cancelamento de itens individuais

#### Sistema de Impressão Térmica
- Suporte para impressoras ESC/POS 58mm
- Modelo oficial: KP-IM607 Knup
- Impressora da Cozinha:
  - Impressão automática ao adicionar produtos
  - Impressão de cancelamentos
- Impressora da Recepção:
  - Cópia dos pedidos da cozinha
  - Impressão de nota fiscal (manual)
- Configuração via interface web
- Teste de impressão
- Status de conexão em tempo real

#### Histórico e Relatórios
- Histórico completo (recepcionista)
- Histórico pessoal (garçom)
- Mesas atendidas
- Pedidos realizados
- Valores totais
- Performance individual
- Filtros por data, garçom, mesa

#### Dashboard (Recepcionista)
- Visão geral em tempo real
- Total de mesas por status
- Receita do dia
- Total de pedidos
- Garçons ativos
- Indicadores de performance

#### Calculadora Flutuante
- Botão flutuante no canto inferior esquerdo
- Pop-up com calculadora completa
- Operações básicas: +, -, ×, ÷
- Independente do sistema
- Acessível para todos os usuários

#### WebSocket
- Atualizações em tempo real
- Sincronização de mesas
- Notificações de pedidos
- Status de impressoras
- Suporte para múltiplos usuários simultâneos

#### Banco de Dados
- PostgreSQL com Prisma ORM
- Schema completo e otimizado
- Migrations versionadas
- Índices para performance
- Relacionamentos com integridade referencial

#### API REST
- Rotas protegidas com JWT
- Endpoints para todas as entidades
- Validação de dados
- Tratamento de erros
- Documentação completa

#### Suporte Offline
- Tabela de sincronização
- Queue de ações pendentes
- Sincronização automática ao reconectar
- Persistência local

### 📚 Documentação

- README.md - Documentação completa
- QUICKSTART.md - Guia de início rápido
- PRINTER_SETUP.md - Configuração detalhada de impressoras
- DATABASE.md - Documentação do banco de dados
- DEPLOY.md - Guia de deploy e produção
- API_EXAMPLES.md - Exemplos de uso da API
- FAQ.md - Perguntas frequentes
- CHANGELOG.md - Histórico de versões

### 🛠️ Tecnologias

- Next.js 15
- React 19
- TypeScript 5
- PostgreSQL 14+
- Prisma ORM 6
- Tailwind CSS 4
- Zustand 5
- Socket.IO 4
- ESC/POS (escpos)
- node-usb 2
- JWT (jsonwebtoken)
- bcrypt
- date-fns
- @dnd-kit (drag & drop)
- @headlessui/react
- @heroicons/react

### 🔒 Segurança

- Senhas hasheadas com bcrypt (10 rounds)
- Tokens JWT com expiração
- Validação de permissões por role
- Proteção contra SQL injection (Prisma)
- Headers de segurança

### ⚡ Performance

- Server-side rendering (Next.js)
- Código otimizado e minificado
- Lazy loading de componentes
- Índices no banco de dados
- Queries otimizadas

### 📱 Responsividade

- Design mobile-first
- Suporte a tablets
- Interface adaptativa
- Touch-friendly

---

## [Unreleased]

### Planejado

#### v1.1.0
- [ ] PWA (Progressive Web App)
- [ ] Modo offline completo
- [ ] Notificações push
- [ ] Dark mode
- [ ] Atalhos de teclado
- [ ] Multi-idioma (i18n)

#### v1.2.0
- [ ] Relatórios avançados
- [ ] Gráficos e dashboards
- [ ] Exportação PDF/Excel
- [ ] Integração com NFC-e
- [ ] Sistema de delivery
- [ ] Taxa de entrega

#### v1.3.0
- [ ] App mobile nativo (React Native)
- [ ] Gestão de estoque
- [ ] Controle de fornecedores
- [ ] Promoções e cupons
- [ ] Programa de fidelidade

#### v2.0.0
- [ ] Multi-restaurante (multi-tenancy)
- [ ] Reservas online
- [ ] Integração com delivery (iFood, Uber Eats)
- [ ] Sistema de cozinha (KDS)
- [ ] Gestão de funcionários completa

### Em Consideração

- Impressão de comanda
- Split de conta por pessoa
- Gorjeta customizável
- Comandas eletrônicas
- QR Code para cardápio digital
- Pedidos pelo celular do cliente
- Integração com POS físico
- Sistema de avaliações
- Análise de sentimento
- Machine learning para previsões

---

## Versionamento

Este projeto usa [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis com versões anteriores
- **MINOR** (1.X.0): Novas funcionalidades retrocompatíveis
- **PATCH** (1.0.X): Correções de bugs retrocompatíveis

---

## Como Contribuir

1. Verifique issues abertas ou crie uma nova
2. Fork o repositório
3. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
4. Faça suas alterações
5. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
6. Push: `git push origin feature/nova-funcionalidade`
7. Abra um Pull Request

### Formato de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Apenas documentação
- `style:` - Formatação, ponto e vírgula, etc
- `refactor:` - Refatoração de código
- `test:` - Adição/correção de testes
- `chore:` - Manutenção, deps, etc

Exemplos:
```
feat: adiciona drag & drop para união de mesas
fix: corrige cálculo de taxa de serviço
docs: atualiza guia de instalação
```

---

## Licença

Este projeto é proprietário e privado.

---

## Agradecimentos

- Comunidade Next.js
- Comunidade Prisma
- Desenvolvedores de bibliotecas ESC/POS
- Todos os contribuidores

---

**Sistema Burguesa** - Changelog v1.0
