# 📡 Exemplos de Uso da API

## Índice

- [Autenticação](#autenticação)
- [Mesas](#mesas)
- [Produtos](#produtos)
- [Pedidos](#pedidos)
- [Impressoras](#impressoras)
- [Histórico](#histórico)

---

## Autenticação

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@burguesa.com",
    "password": "admin123"
  }'
```

**Resposta**:
```json
{
  "user": {
    "id": "clx123",
    "name": "Admin Recepcionista",
    "email": "admin@burguesa.com",
    "role": "RECEPTIONIST",
    "active": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use o token em todas as requisições subsequentes**:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Mesas

### Listar todas as mesas

```bash
curl http://localhost:3000/api/tables \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "table1",
      "number": 1,
      "status": "EMPTY",
      "currentTotal": 0,
      "startTime": null,
      "endTime": null,
      "waiter": null,
      "orders": []
    },
    {
      "id": "table2",
      "number": 2,
      "status": "ATTENDING",
      "currentTotal": 45.90,
      "startTime": "2025-10-06T14:30:00Z",
      "waiter": {
        "id": "waiter1",
        "name": "João Silva"
      },
      "orders": [...]
    }
  ]
}
```

### Criar mesa (apenas recepcionista)

```bash
curl -X POST http://localhost:3000/api/tables \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 21
  }'
```

### Buscar mesa específica

```bash
curl http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Atualizar mesa (pegar mesa)

```bash
curl -X PATCH http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ATTENDING",
    "waiterId": "waiter1",
    "startTime": "2025-10-06T15:00:00Z"
  }'
```

### Fechar conta

```bash
curl -X PATCH http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "FINISHED",
    "endTime": "2025-10-06T16:30:00Z"
  }'
```

### Liberar mesa (recepcionista)

```bash
curl -X PATCH http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "EMPTY",
    "waiterId": null,
    "currentTotal": 0,
    "startTime": null,
    "endTime": null
  }'
```

### Unir mesas

```bash
curl -X PATCH http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mergedWithId": "table2"
  }'
```

### Separar mesas

```bash
curl -X PATCH http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mergedWithId": null
  }'
```

### Deletar mesa (recepcionista, apenas se vazia)

```bash
curl -X DELETE http://localhost:3000/api/tables/table1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## Produtos

### Listar produtos

```bash
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Filtros disponíveis**:
```bash
# Por categoria
curl "http://localhost:3000/api/products?category=DRINKS" \
  -H "Authorization: Bearer SEU_TOKEN"

# Apenas ativos
curl "http://localhost:3000/api/products?active=true" \
  -H "Authorization: Bearer SEU_TOKEN"

# Busca por nome
curl "http://localhost:3000/api/products?search=hamburguer" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Criar produto (recepcionista)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "X-Bacon Especial",
    "description": "Hambúrguer com bacon crocante e queijo cheddar",
    "price": 35.90,
    "category": "SNACKS",
    "active": true
  }'
```

### Atualizar produto (recepcionista)

```bash
curl -X PATCH http://localhost:3000/api/products/prod1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 38.90,
    "description": "Descrição atualizada"
  }'
```

### Desativar produto (recepcionista)

```bash
curl -X PATCH http://localhost:3000/api/products/prod1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "active": false
  }'
```

### Deletar produto (recepcionista)

```bash
curl -X DELETE http://localhost:3000/api/products/prod1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## Pedidos

### Criar pedido

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "table1",
    "items": [
      {
        "productId": "prod1",
        "quantity": 2,
        "observations": "Sem cebola"
      },
      {
        "productId": "prod2",
        "quantity": 1
      }
    ]
  }'
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": "order1",
    "tableId": "table1",
    "waiterId": "waiter1",
    "status": "PENDING",
    "total": 51.80,
    "serviceCharge": 5.18,
    "finalTotal": 56.98,
    "printed": true,
    "items": [
      {
        "id": "item1",
        "productId": "prod1",
        "quantity": 2,
        "price": 25.90,
        "observations": "Sem cebola"
      }
    ]
  }
}
```

### Listar pedidos

```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Filtros**:
```bash
# Por mesa
curl "http://localhost:3000/api/orders?tableId=table1" \
  -H "Authorization: Bearer SEU_TOKEN"

# Por garçom
curl "http://localhost:3000/api/orders?waiterId=waiter1" \
  -H "Authorization: Bearer SEU_TOKEN"

# Por período
curl "http://localhost:3000/api/orders?startDate=2025-10-06&endDate=2025-10-07" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Atualizar status do pedido

```bash
curl -X PATCH http://localhost:3000/api/orders/order1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PREPARING"
  }'
```

Status disponíveis:
- `PENDING`: Pendente
- `PREPARING`: Preparando
- `READY`: Pronto
- `DELIVERED`: Entregue
- `CANCELLED`: Cancelado

### Cancelar item do pedido

```bash
curl -X PATCH http://localhost:3000/api/orders/order1/items/item1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancelled": true,
    "cancelReason": "Cliente mudou de ideia"
  }'
```

---

## Impressoras

### Status das impressoras

```bash
curl http://localhost:3000/api/printers \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "printer1",
      "name": "Impressora Cozinha",
      "type": "kitchen",
      "connected": true,
      "lastUsed": "2025-10-06T15:30:00Z",
      "printCount": 42
    },
    {
      "id": "printer2",
      "name": "Impressora Recepção",
      "type": "reception",
      "connected": true,
      "lastUsed": "2025-10-06T15:25:00Z",
      "printCount": 15
    }
  ]
}
```

### Imprimir teste (recepcionista)

```bash
curl -X POST http://localhost:3000/api/printers/printer1/test \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Imprimir nota fiscal (recepcionista)

```bash
curl -X POST http://localhost:3000/api/printers/print-invoice \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order1"
  }'
```

### Atualizar configurações (recepcionista)

```bash
curl -X PATCH http://localhost:3000/api/printers/printer1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "speed": "fast",
      "density": "high",
      "autoCut": true
    }
  }'
```

---

## Histórico

### Histórico do garçom

```bash
# Próprio histórico (garçom)
curl http://localhost:3000/api/history \
  -H "Authorization: Bearer SEU_TOKEN"

# Histórico de garçom específico (recepcionista)
curl http://localhost:3000/api/history/waiter1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "waiterId": "waiter1",
    "waiterName": "João Silva",
    "tablesAttended": 15,
    "totalOrders": 45,
    "totalRevenue": 1250.50,
    "averageTicket": 27.79,
    "period": {
      "start": "2025-10-06T00:00:00Z",
      "end": "2025-10-06T23:59:59Z"
    },
    "orders": [...]
  }
}
```

### Dashboard stats (recepcionista)

```bash
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "totalTables": 20,
    "emptyTables": 12,
    "attendingTables": 6,
    "finishedTables": 2,
    "todayRevenue": 2450.90,
    "todayOrders": 87,
    "activeWaiters": 3
  }
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

**Formato de erro**:
```json
{
  "error": "Mensagem descritiva do erro"
}
```

---

## WebSocket

### Conectar ao WebSocket

```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'SEU_TOKEN_JWT'
  }
})

// Eventos disponíveis
socket.on('table_update', (data) => {
  console.log('Mesa atualizada:', data)
})

socket.on('order_update', (data) => {
  console.log('Pedido atualizado:', data)
})

socket.on('printer_status', (data) => {
  console.log('Status impressora:', data)
})
```

---

## Exemplos em JavaScript/TypeScript

### Usando fetch

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()
  return data
}

// Listar mesas
const getTables = async (token: string) => {
  const response = await fetch('http://localhost:3000/api/tables', {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  const data = await response.json()
  return data
}

// Criar pedido
const createOrder = async (token: string, tableId: string, items: any[]) => {
  const response = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tableId, items })
  })

  const data = await response.json()
  return data
}
```

---

## Postman Collection

Importe esta collection no Postman para testes rápidos:

```json
{
  "info": {
    "name": "Burguesa API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@burguesa.com\",\n  \"password\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:3000/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

---

**Sistema Burguesa API** - v1.0
