# 🗄️ Documentação do Banco de Dados

## Diagrama de Relacionamentos (ER)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │◄──────│    Table     │──────►│    Order    │
│             │       │              │       │             │
│ id          │       │ id           │       │ id          │
│ name        │       │ number       │       │ tableId     │
│ email       │       │ status       │       │ waiterId    │
│ password    │       │ currentTotal │       │ total       │
│ role        │       │ waiterId     │       │ items[]     │
└─────────────┘       └──────────────┘       └─────────────┘
                             │                      │
                             │                      │
                             ▼                      ▼
                      ┌──────────────┐       ┌─────────────┐
                      │TableSession  │       │  OrderItem  │
                      │              │       │             │
                      │ tableId      │       │ orderId     │
                      │ waiterId     │       │ productId   │
                      │ startTime    │       │ quantity    │
                      │ totalAmount  │       │ price       │
                      └──────────────┘       └─────────────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │   Product   │
                                             │             │
                                             │ id          │
                                             │ name        │
                                             │ price       │
                                             │ category    │
                                             └─────────────┘
```

---

## Tabelas

### users

Usuários do sistema (recepcionistas e garçons)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| name | String | Nome completo |
| email | String (unique) | Email (usado para login) |
| password | String | Hash bcrypt da senha |
| role | Enum | RECEPTIONIST ou WAITER |
| active | Boolean | Se usuário está ativo |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Última atualização |

**Índices**:
- `email` (unique)

### tables

Mesas do restaurante

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| number | Integer (unique) | Número da mesa |
| status | Enum | EMPTY, ATTENDING, FINISHED |
| current_total | Float | Valor atual da conta |
| start_time | DateTime? | Quando atendimento iniciou |
| end_time | DateTime? | Quando conta foi fechada |
| waiter_id | String? | ID do garçom (FK) |
| merged_with_id | String? | ID de mesa unida (FK) |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Última atualização |

**Índices**:
- `number` (unique)
- `status`
- `waiter_id`

**Relações**:
- `waiter` → users (many-to-one)
- `mergedWith` → tables (self-relation)

### products

Produtos do cardápio

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| name | String | Nome do produto |
| description | String? | Descrição |
| price | Float | Preço unitário |
| category | Enum | DRINKS, SNACKS, DESSERTS, MEALS, APPETIZERS, OTHER |
| image_url | String? | URL da imagem |
| active | Boolean | Se produto está ativo |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Última atualização |

**Índices**:
- `category`
- `active`
- `name` (text search)

### orders

Pedidos realizados

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| table_id | String | ID da mesa (FK) |
| waiter_id | String | ID do garçom (FK) |
| status | Enum | PENDING, PREPARING, READY, DELIVERED, CANCELLED |
| total | Float | Subtotal |
| service_charge | Float | Taxa de serviço (10%) |
| final_total | Float | Total final |
| printed | Boolean | Se foi impresso |
| created_at | DateTime | Data/hora do pedido |
| updated_at | DateTime | Última atualização |

**Índices**:
- `table_id`
- `waiter_id`
- `status`
- `created_at`

**Relações**:
- `table` → tables (many-to-one)
- `waiter` → users (many-to-one)
- `items` → order_items (one-to-many)

### order_items

Itens individuais dos pedidos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| order_id | String | ID do pedido (FK) |
| product_id | String | ID do produto (FK) |
| quantity | Integer | Quantidade |
| price | Float | Preço no momento do pedido |
| observations | String? | Observações (ex: "sem cebola") |
| cancelled | Boolean | Se foi cancelado |
| cancel_reason | String? | Motivo do cancelamento |
| created_at | DateTime | Data/hora |

**Índices**:
- `order_id`
- `product_id`

**Relações**:
- `order` → orders (many-to-one)
- `product` → products (many-to-one)

### table_sessions

Histórico de atendimentos nas mesas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| table_id | String | ID da mesa (FK) |
| waiter_id | String | ID do garçom (FK) |
| start_time | DateTime | Início do atendimento |
| end_time | DateTime? | Fim do atendimento |
| total_amount | Float | Valor total da sessão |

**Índices**:
- `table_id`
- `waiter_id`
- `start_time`

### printer_configs

Configurações das impressoras

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| name | String (unique) | Nome da impressora |
| type | String | 'kitchen' ou 'reception' |
| vendor_id | String | Vendor ID USB |
| product_id | String | Product ID USB |
| connected | Boolean | Se está conectada |
| last_used | DateTime? | Último uso |
| print_count | Integer | Total de impressões |
| settings | JSON | Configurações adicionais |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Última atualização |

**Índices**:
- `name` (unique)
- `type`

### activity_logs

Log de atividades do sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| user_id | String | ID do usuário (FK) |
| action | String | Tipo de ação |
| description | String | Descrição da ação |
| metadata | JSON? | Dados adicionais |
| created_at | DateTime | Data/hora |

**Índices**:
- `user_id`
- `action`
- `created_at`

### offline_syncs

Dados para sincronização offline

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | String (CUID) | Identificador único |
| entity_type | String | Tipo de entidade |
| entity_id | String | ID da entidade |
| action | String | create, update, delete |
| data | JSON | Dados da ação |
| synced | Boolean | Se foi sincronizado |
| created_at | DateTime | Data de criação |
| synced_at | DateTime? | Quando sincronizou |

**Índices**:
- `synced`
- `entity_type`
- `created_at`

---

## Queries SQL Úteis

### Estatísticas do Dia

```sql
-- Total de vendas do dia
SELECT
  COUNT(*) as total_pedidos,
  SUM(final_total) as receita_total,
  AVG(final_total) as ticket_medio
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
  AND status != 'CANCELLED';

-- Vendas por garçom (hoje)
SELECT
  u.name as garcom,
  COUNT(o.id) as pedidos,
  SUM(o.final_total) as total
FROM orders o
JOIN users u ON o.waiter_id = u.id
WHERE DATE(o.created_at) = CURRENT_DATE
GROUP BY u.id, u.name
ORDER BY total DESC;

-- Produtos mais vendidos (hoje)
SELECT
  p.name as produto,
  SUM(oi.quantity) as quantidade,
  SUM(oi.price * oi.quantity) as total
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE DATE(o.created_at) = CURRENT_DATE
  AND oi.cancelled = false
GROUP BY p.id, p.name
ORDER BY quantidade DESC
LIMIT 10;
```

### Análise de Mesas

```sql
-- Tempo médio de atendimento por mesa
SELECT
  t.number as mesa,
  AVG(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/60) as tempo_medio_min
FROM table_sessions ts
JOIN tables t ON ts.table_id = t.id
WHERE ts.end_time IS NOT NULL
GROUP BY t.id, t.number
ORDER BY tempo_medio_min DESC;

-- Mesas mais lucrativas (últimos 30 dias)
SELECT
  t.number as mesa,
  COUNT(o.id) as total_pedidos,
  SUM(o.final_total) as receita_total
FROM orders o
JOIN tables t ON o.table_id = t.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY t.id, t.number
ORDER BY receita_total DESC;
```

### Performance de Garçons

```sql
-- Ranking de garçons (mês atual)
SELECT
  u.name as garcom,
  COUNT(DISTINCT o.table_id) as mesas_atendidas,
  COUNT(o.id) as pedidos,
  SUM(o.final_total) as receita,
  AVG(o.final_total) as ticket_medio,
  SUM(o.final_total) / COUNT(DISTINCT o.table_id) as receita_por_mesa
FROM orders o
JOIN users u ON o.waiter_id = u.id
WHERE DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  AND o.status != 'CANCELLED'
GROUP BY u.id, u.name
ORDER BY receita DESC;

-- Tempo médio de atendimento por garçom
SELECT
  u.name as garcom,
  COUNT(ts.id) as atendimentos,
  AVG(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/60) as tempo_medio_min
FROM table_sessions ts
JOIN users u ON ts.waiter_id = u.id
WHERE ts.end_time IS NOT NULL
  AND ts.start_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.id, u.name
ORDER BY tempo_medio_min;
```

### Análise de Produtos

```sql
-- Receita por categoria
SELECT
  p.category as categoria,
  COUNT(oi.id) as itens_vendidos,
  SUM(oi.quantity) as quantidade_total,
  SUM(oi.price * oi.quantity) as receita
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND oi.cancelled = false
GROUP BY p.category
ORDER BY receita DESC;

-- Produtos com baixa venda
SELECT
  p.name as produto,
  p.price as preco,
  COUNT(oi.id) as vezes_pedido,
  SUM(oi.quantity) as quantidade_total
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE p.active = true
GROUP BY p.id, p.name, p.price
HAVING COUNT(oi.id) < 5
ORDER BY quantidade_total;
```

### Cancelamentos

```sql
-- Itens mais cancelados
SELECT
  p.name as produto,
  COUNT(*) as cancelamentos,
  array_agg(DISTINCT oi.cancel_reason) as motivos
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.cancelled = true
  AND oi.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY cancelamentos DESC;

-- Taxa de cancelamento por garçom
SELECT
  u.name as garcom,
  COUNT(*) FILTER (WHERE oi.cancelled = true) as cancelados,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE oi.cancelled = true) / COUNT(*), 2) as taxa_cancelamento
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN users u ON o.waiter_id = u.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY taxa_cancelamento DESC;
```

### Análise Temporal

```sql
-- Vendas por hora do dia (última semana)
SELECT
  EXTRACT(HOUR FROM created_at) as hora,
  COUNT(*) as pedidos,
  SUM(final_total) as receita
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status != 'CANCELLED'
GROUP BY hora
ORDER BY hora;

-- Vendas por dia da semana (último mês)
SELECT
  TO_CHAR(created_at, 'Day') as dia_semana,
  COUNT(*) as pedidos,
  SUM(final_total) as receita,
  AVG(final_total) as ticket_medio
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND status != 'CANCELLED'
GROUP BY dia_semana, EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);
```

---

## Manutenção

### Limpeza de Dados Antigos

```sql
-- Remover logs antigos (mais de 90 dias)
DELETE FROM activity_logs
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

-- Remover syncs antigos já processados
DELETE FROM offline_syncs
WHERE synced = true
  AND synced_at < CURRENT_DATE - INTERVAL '30 days';
```

### Vacuum e Analyze

```sql
-- Otimizar tabelas
VACUUM ANALYZE tables;
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
VACUUM ANALYZE products;
```

### Reindexação

```sql
-- Recriar índices (se necessário)
REINDEX TABLE orders;
REINDEX TABLE order_items;
```

---

## Backup e Restore

### Backup Completo

```bash
# Backup com pg_dump
pg_dump -U postgres -d burguesa -F c -f backup.dump

# Backup apenas schema
pg_dump -U postgres -d burguesa -s > schema.sql

# Backup apenas dados
pg_dump -U postgres -d burguesa -a > data.sql
```

### Restore

```bash
# Restore completo
pg_restore -U postgres -d burguesa -c backup.dump

# Restore apenas tabela específica
pg_restore -U postgres -d burguesa -t orders backup.dump
```

---

## Views Úteis

### View: Mesas com Status Atual

```sql
CREATE VIEW v_table_status AS
SELECT
  t.id,
  t.number,
  t.status,
  t.current_total,
  u.name as waiter_name,
  COUNT(o.id) as open_orders,
  t.start_time,
  CASE
    WHEN t.start_time IS NOT NULL
    THEN EXTRACT(EPOCH FROM (NOW() - t.start_time))/60
  END as duration_minutes
FROM tables t
LEFT JOIN users u ON t.waiter_id = u.id
LEFT JOIN orders o ON t.id = o.table_id AND o.status NOT IN ('DELIVERED', 'CANCELLED')
GROUP BY t.id, t.number, t.status, t.current_total, u.name, t.start_time;
```

### View: Dashboard Resumo

```sql
CREATE VIEW v_dashboard_today AS
SELECT
  (SELECT COUNT(*) FROM tables) as total_tables,
  (SELECT COUNT(*) FROM tables WHERE status = 'EMPTY') as empty_tables,
  (SELECT COUNT(*) FROM tables WHERE status = 'ATTENDING') as attending_tables,
  (SELECT COUNT(*) FROM tables WHERE status = 'FINISHED') as finished_tables,
  (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
  (SELECT COALESCE(SUM(final_total), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status != 'CANCELLED') as today_revenue,
  (SELECT COUNT(DISTINCT waiter_id) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as active_waiters;
```

---

## Performance

### Índices Recomendados

```sql
-- Se não existirem
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_table_waiter ON orders(table_id, waiter_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_table_sessions_dates ON table_sessions(start_time, end_time);
```

### Analyze Query Performance

```sql
-- Explicar query
EXPLAIN ANALYZE
SELECT * FROM orders WHERE created_at >= CURRENT_DATE;

-- Ver queries lentas
SELECT
  pid,
  now() - query_start as duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;
```

---

## Constraints e Validações

### Check Constraints

```sql
-- Garantir preços positivos
ALTER TABLE products
ADD CONSTRAINT price_positive
CHECK (price > 0);

-- Garantir quantidades positivas
ALTER TABLE order_items
ADD CONSTRAINT quantity_positive
CHECK (quantity > 0);
```

---

**Sistema Burguesa** - Documentação de Banco de Dados v1.0
