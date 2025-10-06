# 🍔 Sistema Burguesa

Sistema completo de gerenciamento de vendas para restaurante com controle de mesas, pedidos e impressão térmica.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Configuração de Impressoras](#configuração-de-impressoras)

## 🎯 Visão Geral

O Sistema Burguesa é uma solução completa para gerenciamento de restaurantes que oferece:

- **Dois níveis de acesso**: Recepcionista (completo) e Garçom (limitado)
- **Gerenciamento visual de mesas** com sistema de bloquinhos coloridos
- **União de mesas** via drag & drop
- **Impressão térmica automática** para cozinha e recepção
- **Sistema em tempo real** com WebSocket
- **Calculadora flutuante** para auxiliar cálculos rápidos
- **Histórico completo** de atendimentos e vendas
- **Suporte offline** com sincronização automática

## ✨ Funcionalidades

### Recepcionista (Acesso Completo)

- ✅ Dashboard com visão geral do dia
- ✅ Criar, editar e excluir mesas
- ✅ Criar, editar e excluir produtos
- ✅ Visualizar histórico de todos os garçons
- ✅ Configurar impressoras térmicas
- ✅ Cancelar pedidos
- ✅ Imprimir notas fiscais
- ✅ Unir e separar mesas
- ✅ Liberar mesas finalizadas

### Garçom (Acesso Limitado)

- ✅ Visualizar mesas disponíveis
- ✅ Pegar/atender mesas vazias
- ✅ Adicionar produtos às mesas
- ✅ Fechar contas
- ✅ Unir mesas
- ✅ Visualizar próprio histórico
- ✅ Cancelar pedidos

### Estados das Mesas

- 🟦 **Vazio**: Mesa disponível para atendimento
- 🟨 **Atendendo**: Mesa em atendimento ativo
- 🟩 **Finalizado**: Conta fechada, aguardando liberação
- 🟪 **Unidas**: Badge adicional quando mesas estão unidas

## 🛠 Tecnologias

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT com bcrypt
- **Estado Global**: Zustand
- **Estilização**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Impressão**: escpos + node-usb
- **Tempo Real**: Socket.IO
- **Datas**: date-fns

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Impressoras térmicas KP-IM607 Knup (opcional)

### Passo a Passo

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd burguesa
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/burguesa?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura"
NODE_ENV="development"
PORT=3000

# IDs USB das impressoras (veja seção de configuração)
KITCHEN_PRINTER_VENDOR_ID="0x0483"
KITCHEN_PRINTER_PRODUCT_ID="0x070b"
RECEPTION_PRINTER_VENDOR_ID="0x0483"
RECEPTION_PRINTER_PRODUCT_ID="0x070c"
```

4. **Configure o banco de dados**

```bash
# Gera o cliente Prisma
npm run prisma:generate

# Executa as migrations
npm run prisma:migrate

# (Opcional) Abre o Prisma Studio
npm run prisma:studio
```

5. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuração

### Banco de Dados

O sistema usa PostgreSQL. Certifique-se de ter uma instância rodando:

```bash
# Com Docker
docker run --name burguesa-db -e POSTGRES_PASSWORD=senha123 -p 5432:5432 -d postgres

# Crie o banco de dados
docker exec -it burguesa-db psql -U postgres -c "CREATE DATABASE burguesa;"
```

### Usuários Iniciais

Crie usuários diretamente no Prisma Studio ou via SQL:

```sql
INSERT INTO users (id, name, email, password, role, active, created_at, updated_at)
VALUES
  ('user1', 'Admin', 'admin@burguesa.com', '$2a$10$hashaqui', 'RECEPTIONIST', true, NOW(), NOW()),
  ('user2', 'João Garçom', 'joao@burguesa.com', '$2a$10$hashaqui', 'WAITER', true, NOW(), NOW());
```

**Nota**: Use bcrypt para gerar os hashes das senhas.

## 🖨️ Configuração de Impressoras

### Impressoras Suportadas

- **Modelo**: KP-IM607 Knup
- **Tipo**: Térmica 58mm
- **Conexão**: USB
- **Protocolo**: ESC/POS
- **Resolução**: 203dpi
- **Velocidade**: até 90mm/s

### Identificando IDs USB

No Linux:

```bash
lsusb
```

Saída exemplo:
```
Bus 001 Device 005: ID 0483:070b STMicroelectronics Thermal Printer
```

Os valores são:
- **Vendor ID**: `0483` (primeiros 4 dígitos)
- **Product ID**: `070b` (últimos 4 dígitos)

### Configurando Permissões (Linux)

Crie uma regra udev para permitir acesso sem root:

```bash
sudo nano /etc/udev/rules.d/99-thermal-printer.rules
```

Adicione:
```
SUBSYSTEM=="usb", ATTR{idVendor}=="0483", ATTR{idProduct}=="070b", MODE="0666"
SUBSYSTEM=="usb", ATTR{idVendor}=="0483", ATTR{idProduct}=="070c", MODE="0666"
```

Recarregue as regras:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Testando Impressoras

No dashboard do recepcionista, acesse "Configurações de Impressoras" e clique em "Teste de Impressão".

## 🚀 Uso

### Login

1. Acesse a aplicação
2. Faça login com suas credenciais
3. Será redirecionado para o dashboard

### Fluxo de Atendimento (Garçom)

1. **Pegar Mesa**: Clique em uma mesa vazia
2. **Adicionar Produtos**: Selecione produtos e quantidade
3. **Confirmar Pedido**: Pedido é enviado automaticamente para impressão
4. **Fechar Conta**: Quando cliente solicitar, finalize a mesa
5. **Mesa vai para "Finalizado"**: Aguarda liberação do recepcionista

### Unindo Mesas

1. Arraste um bloquinho de mesa sobre outro
2. Confirme a união
3. As contas são somadas automaticamente
4. Badge "Unida" aparece nas mesas
5. Pode separar antes de finalizar

### Cancelando Pedidos

1. Abra o modal da mesa
2. Selecione o item a cancelar
3. Opcionalmente, informe o motivo
4. Cancelamento é impresso na cozinha

### Imprimindo Nota Fiscal

1. Selecione mesa finalizada
2. Clique em "Imprimir Nota Fiscal"
3. Nota é impressa na impressora da recepção

## 📁 Estrutura do Projeto

```
burguesa/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── public/                     # Arquivos estáticos
├── src/
│   ├── app/                    # Pages e API Routes (Next.js 15)
│   │   ├── api/
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── tables/        # Mesas
│   │   │   ├── products/      # Produtos
│   │   │   ├── orders/        # Pedidos
│   │   │   └── printers/      # Impressoras
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── login/             # Página de login
│   │   └── layout.tsx         # Layout raiz
│   ├── components/            # Componentes React
│   │   ├── TableCard.tsx      # Card de mesa
│   │   ├── Calculator.tsx     # Calculadora flutuante
│   │   └── ...
│   ├── lib/                   # Bibliotecas e utilitários
│   │   ├── prisma.ts          # Cliente Prisma
│   │   └── auth.ts            # Utilitários de auth
│   ├── services/              # Serviços
│   │   └── printer.ts         # Serviço de impressão
│   ├── store/                 # Estado global (Zustand)
│   │   ├── useAuthStore.ts
│   │   └── useTableStore.ts
│   └── types/                 # Tipos TypeScript
│       └── index.ts
├── .env.example               # Exemplo de variáveis
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🔌 API

### Autenticação

#### POST `/api/auth/login`

Autentica usuário e retorna token JWT.

**Body**:
```json
{
  "email": "admin@burguesa.com",
  "password": "senha123"
}
```

**Response**:
```json
{
  "user": {
    "id": "user1",
    "name": "Admin",
    "email": "admin@burguesa.com",
    "role": "RECEPTIONIST"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Mesas

#### GET `/api/tables`

Lista todas as mesas.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "table1",
      "number": 1,
      "status": "ATTENDING",
      "currentTotal": 45.90,
      "waiter": {...},
      "orders": [...]
    }
  ]
}
```

#### POST `/api/tables`

Cria nova mesa (apenas recepcionista).

**Headers**: `Authorization: Bearer {token}`

**Body**:
```json
{
  "number": 10
}
```

#### PATCH `/api/tables/{id}`

Atualiza mesa.

**Body**:
```json
{
  "status": "FINISHED",
  "currentTotal": 89.50
}
```

#### DELETE `/api/tables/{id}`

Remove mesa (apenas recepcionista, apenas se vazia).

### Produtos

Endpoints similares em `/api/products`

### Pedidos

Endpoints similares em `/api/orders`

## 🐛 Troubleshooting

### Impressora não conecta

1. Verifique se está ligada e conectada via USB
2. Confirme os IDs USB com `lsusb`
3. Verifique permissões (veja seção de configuração)
4. Reinicie o servidor

### Erro de conexão com banco

1. Verifique se PostgreSQL está rodando
2. Confirme credenciais no `.env`
3. Execute migrations: `npm run prisma:migrate`

### Erro de autenticação

1. Verifique se `JWT_SECRET` está configurado
2. Token pode ter expirado (validade: 7 dias)
3. Faça logout e login novamente

## 📝 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint

# Prisma Studio
npm run prisma:studio
```

## 🔒 Segurança

- Senhas são hasheadas com bcrypt (10 rounds)
- Tokens JWT com expiração de 7 dias
- Rotas da API protegidas com middleware
- Validação de permissões por role
- Prepared statements (Prisma previne SQL injection)

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.

---

**Sistema Burguesa** - Desenvolvido com ❤️ para otimizar o gerenciamento do seu restaurante.
