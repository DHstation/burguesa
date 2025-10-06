# ❓ FAQ - Perguntas Frequentes

## Índice

- [Instalação e Configuração](#instalação-e-configuração)
- [Uso do Sistema](#uso-do-sistema)
- [Impressoras](#impressoras)
- [Banco de Dados](#banco-de-dados)
- [Segurança](#segurança)
- [Performance](#performance)
- [Erros Comuns](#erros-comuns)

---

## Instalação e Configuração

### Como instalar o sistema?

Siga o [QUICKSTART.md](QUICKSTART.md) para instalação rápida, ou [README.md](README.md) para guia completo.

### Qual versão do Node.js devo usar?

Node.js 18 LTS ou superior. Verifique com `node --version`.

### Preciso de PostgreSQL?

Sim, o sistema usa PostgreSQL como banco de dados. Você pode instalar localmente ou usar Docker.

### Posso usar MySQL ao invés de PostgreSQL?

Tecnicamente sim, mas requer modificações no Prisma schema. PostgreSQL é recomendado.

### Como atualizar o sistema?

```bash
git pull origin main
npm install
npm run prisma:migrate
npm run build
pm2 restart burguesa
```

---

## Uso do Sistema

### Como criar o primeiro usuário?

Execute o script de seed:
```bash
npx tsx scripts/seed.ts
```

Ou crie manualmente via Prisma Studio:
```bash
npm run prisma:studio
```

### Esqueci minha senha, como recuperar?

Atualmente não há sistema de recuperação. Um administrador pode redefinir via Prisma Studio ou SQL:

```sql
-- Gere novo hash bcrypt e atualize
UPDATE users SET password = '$2a$10$novo_hash_aqui' WHERE email = 'seu@email.com';
```

### Como alterar a taxa de serviço?

A taxa padrão é 10%. Para alterar, edite o cálculo em [src/app/api/orders/route.ts](src/app/api/orders/route.ts):

```typescript
const serviceCharge = total * 0.10 // Mude 0.10 para o valor desejado
```

### Posso desabilitar a taxa de serviço?

Sim, configure para 0:

```typescript
const serviceCharge = 0
```

### Como adicionar categorias de produtos?

Edite o enum no [prisma/schema.prisma:19](prisma/schema.prisma):

```prisma
enum ProductCategory {
  DRINKS
  SNACKS
  DESSERTS
  MEALS
  APPETIZERS
  OTHER
  BEVERAGES  // Nova categoria
}
```

Execute migration:
```bash
npm run prisma:migrate
```

### Limite de mesas?

Não há limite técnico, mas recomenda-se até 100 mesas para performance ideal.

### Quantos garçons podem usar simultaneamente?

Ilimitado. O sistema suporta múltiplos usuários simultâneos via WebSocket.

---

## Impressoras

### Quais impressoras são suportadas?

Oficialmente: KP-IM607 Knup. Outras impressoras ESC/POS compatíveis devem funcionar com ajustes.

### Como identificar os IDs USB da impressora?

Linux/Mac:
```bash
lsusb
```

Windows: Use Device Manager ou USBDeview.

### Impressora não conecta no Linux

1. Verifique permissões USB
2. Configure regras udev (veja [PRINTER_SETUP.md](PRINTER_SETUP.md))
3. Adicione usuário ao grupo `plugdev`
4. Reinicie o sistema

### Erro "LIBUSB_ERROR_ACCESS"

Permissões insuficientes. Soluções:

```bash
# Configure udev rules
sudo nano /etc/udev/rules.d/99-thermal-printer.rules

# Adicione:
SUBSYSTEM=="usb", ATTR{idVendor}=="0483", ATTR{idProduct}=="070b", MODE="0666"

# Recarregue
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Impressão sai cortada

- Verifique papel térmico (58mm)
- Lado térmico deve estar para cima
- Ajuste largura no código se necessário

### Como testar impressora sem sistema?

Use o script de teste em [PRINTER_SETUP.md](PRINTER_SETUP.md) ou:

```bash
# Linux - teste básico
echo "Teste" | lpr -P nome_da_impressora
```

### Papel recomendado?

- Largura: 58mm
- Tipo: Térmico
- Gramatura: 55-65 g/m²
- Sem BPA (recomendado)

---

## Banco de Dados

### Como fazer backup?

Manual:
```bash
pg_dump -U postgres -d burguesa -F c -f backup.dump
```

Automático: Configure cron (veja [DEPLOY.md](DEPLOY.md))

### Como restaurar backup?

```bash
pg_restore -U postgres -d burguesa -c backup.dump
```

### Erro "relation does not exist"

Migrations não foram executadas:

```bash
npm run prisma:migrate
```

### Como limpar todos os dados?

⚠️ **CUIDADO**: Isso apaga tudo!

```bash
npx tsx scripts/seed.ts  # Apaga e repopula
```

Ou manualmente:
```sql
TRUNCATE users, tables, products, orders, order_items CASCADE;
```

### Banco está lento

1. Execute VACUUM e ANALYZE:
```sql
VACUUM ANALYZE;
```

2. Verifique índices (veja [DATABASE.md](DATABASE.md))

3. Considere aumentar recursos do PostgreSQL

### Como migrar dados de outro sistema?

Crie scripts de importação ou use Prisma:

```typescript
import { prisma } from './lib/prisma'

const importData = async () => {
  // Seus dados antigos
  const oldProducts = [...]

  for (const p of oldProducts) {
    await prisma.product.create({
      data: {
        name: p.nome,
        price: p.preco,
        // ...
      }
    })
  }
}
```

---

## Segurança

### Como alterar JWT_SECRET?

1. Gere novo secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Atualize `.env`:
```env
JWT_SECRET="novo_secret_aqui"
```

3. Todos os tokens existentes serão invalidados (usuários precisam fazer login novamente)

### Sistema é seguro para produção?

Sim, desde que:
- ✅ Use HTTPS (SSL/TLS)
- ✅ JWT_SECRET forte
- ✅ Senhas fortes no banco
- ✅ Firewall configurado
- ✅ Backup regular
- ✅ Atualizações em dia

### Como implementar 2FA?

Não implementado nativamente. Você pode adicionar usando bibliotecas como `speakeasy`:

```bash
npm install speakeasy qrcode
```

### Posso limitar acesso por IP?

Sim, via Nginx ou firewall:

```nginx
# nginx.conf
location / {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://localhost:3000;
}
```

---

## Performance

### Sistema está lento

1. Verifique uso de recursos:
```bash
pm2 monit
```

2. Otimize banco de dados:
```sql
VACUUM ANALYZE;
REINDEX DATABASE burguesa;
```

3. Ative cache (Redis) se disponível

4. Aumente recursos do servidor

### Como habilitar cache?

Instale Redis:
```bash
npm install ioredis
```

Configure cache para produtos, mesas, etc. (veja [DEPLOY.md](DEPLOY.md))

### Quantas requisições simultâneas suporta?

Depende dos recursos do servidor. Em servidor médio (4GB RAM, 2 CPU):
- ~500-1000 requisições/segundo
- ~50-100 usuários simultâneos

### Como escalar horizontalmente?

1. Use load balancer (Nginx)
2. Multiple instâncias PM2
3. Banco de dados separado
4. Redis para sessões compartilhadas
5. CDN para assets estáticos

---

## Erros Comuns

### "Cannot find module '@prisma/client'"

```bash
npm run prisma:generate
```

### "Port 3000 already in use"

Mate processo existente:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Ou use outra porta:
```env
PORT=3001
```

### "ECONNREFUSED" ao conectar banco

1. PostgreSQL está rodando?
```bash
sudo systemctl status postgresql
```

2. Credenciais corretas em `.env`?

3. Firewall bloqueando?

### Erro de CORS

Configure headers em produção:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}
```

### "Token inválido ou expirado"

Token JWT expirou (7 dias). Faça login novamente.

### Mesa não atualiza em tempo real

1. WebSocket configurado?
2. Firewall bloqueando porta?
3. Verifique console do navegador

### Imagem de produto não carrega

1. Caminho correto?
2. Arquivo existe em `public/`?
3. Permissões de leitura?

---

## Funcionalidades

### Como exportar relatórios?

Não implementado nativamente. Use queries SQL (veja [DATABASE.md](DATABASE.md)) e exporte para CSV:

```bash
psql -U postgres -d burguesa -c "COPY (SELECT * FROM orders) TO '/tmp/orders.csv' CSV HEADER"
```

### Suporta delivery?

Não nativamente. Você pode adaptar adicionando:
- Campo `type` em Order (presencial/delivery)
- Campos de endereço
- Integração com Uber Eats, iFood, etc.

### Como adicionar taxa de entrega?

Adicione campo em Order:

```prisma
model Order {
  // ...
  deliveryFee Float @default(0)
}
```

### Múltiplos restaurantes?

Não suportado nativamente. Requer:
- Tabela `Restaurant`
- Multi-tenancy
- Isolamento de dados

### Como integrar com sistema fiscal?

Implemente integração com:
- NFC-e (Nota Fiscal do Consumidor eletrônica)
- SAT Fiscal
- APIs de emissores fiscais

---

## Suporte

### Onde reportar bugs?

GitHub Issues: [repositório]/issues

### Como contribuir?

1. Fork o repositório
2. Crie branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra Pull Request

### Documentação está desatualizada

Abra issue ou PR com correções.

### Preciso de suporte comercial?

Entre em contato com a equipe de desenvolvimento.

---

## Dicas

### Atalhos de Teclado (futuros)

Planeje implementar:
- `N` - Nova mesa
- `P` - Adicionar produto
- `F` - Fechar conta
- `/` - Buscar

### Temas (Dark Mode)

Não implementado. Adicione com Tailwind:

```typescript
// Use dark: prefix
className="bg-white dark:bg-gray-800"
```

### Notificações Push

Use Web Push API:

```bash
npm install web-push
```

### App Mobile

O sistema é responsivo e funciona em mobile. Para app nativo, considere:
- React Native
- PWA (Progressive Web App)
- Capacitor

---

**Não encontrou sua resposta?**

Consulte:
- [README.md](README.md) - Documentação completa
- [QUICKSTART.md](QUICKSTART.md) - Início rápido
- [PRINTER_SETUP.md](PRINTER_SETUP.md) - Configuração impressoras
- [DATABASE.md](DATABASE.md) - Banco de dados
- [DEPLOY.md](DEPLOY.md) - Deploy e produção

Ou abra uma issue no GitHub!

---

**Sistema Burguesa** - FAQ v1.0
