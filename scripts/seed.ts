// Script para popular o banco de dados com dados iniciais
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpa dados existentes (cuidado em produção!)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.tableSession.deleteMany()
  await prisma.table.deleteMany()
  await prisma.product.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.printerConfig.deleteMany()
  await prisma.user.deleteMany()

  // Cria usuários
  console.log('👤 Criando usuários...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const waiterPassword = await bcrypt.hash('garcom123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Recepcionista',
      email: 'admin@burguesa.com',
      password: adminPassword,
      role: 'RECEPTIONIST',
      active: true,
    },
  })

  const waiter1 = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@burguesa.com',
      password: waiterPassword,
      role: 'WAITER',
      active: true,
    },
  })

  const waiter2 = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@burguesa.com',
      password: waiterPassword,
      role: 'WAITER',
      active: true,
    },
  })

  console.log(`✅ Criados ${3} usuários`)

  // Cria mesas
  console.log('🪑 Criando mesas...')

  const tables = []
  for (let i = 1; i <= 20; i++) {
    const table = await prisma.table.create({
      data: {
        number: i,
        status: 'EMPTY',
      },
    })
    tables.push(table)
  }

  console.log(`✅ Criadas ${tables.length} mesas`)

  // Cria produtos
  console.log('🍔 Criando produtos...')

  const products = await prisma.product.createMany({
    data: [
      // Lanches
      {
        name: 'Hambúrguer Clássico',
        description: 'Pão, carne, queijo, alface, tomate',
        price: 25.90,
        category: 'SNACKS',
        active: true,
      },
      {
        name: 'X-Burger',
        description: 'Hambúrguer com queijo extra',
        price: 28.90,
        category: 'SNACKS',
        active: true,
      },
      {
        name: 'X-Bacon',
        description: 'Hambúrguer com bacon crocante',
        price: 32.90,
        category: 'SNACKS',
        active: true,
      },
      {
        name: 'X-Tudo',
        description: 'Hambúrguer completo',
        price: 38.90,
        category: 'SNACKS',
        active: true,
      },

      // Bebidas
      {
        name: 'Coca-Cola 350ml',
        description: 'Refrigerante lata',
        price: 6.00,
        category: 'DRINKS',
        active: true,
      },
      {
        name: 'Guaraná 350ml',
        description: 'Refrigerante lata',
        price: 6.00,
        category: 'DRINKS',
        active: true,
      },
      {
        name: 'Suco Natural 500ml',
        description: 'Laranja, limão ou maracujá',
        price: 10.00,
        category: 'DRINKS',
        active: true,
      },
      {
        name: 'Água Mineral 500ml',
        description: 'Com ou sem gás',
        price: 4.00,
        category: 'DRINKS',
        active: true,
      },
      {
        name: 'Cerveja Lata 350ml',
        description: 'Diversas marcas',
        price: 8.00,
        category: 'DRINKS',
        active: true,
      },

      // Porções
      {
        name: 'Batata Frita',
        description: 'Porção 400g',
        price: 18.00,
        category: 'APPETIZERS',
        active: true,
      },
      {
        name: 'Onion Rings',
        description: 'Porção 300g',
        price: 20.00,
        category: 'APPETIZERS',
        active: true,
      },
      {
        name: 'Nuggets',
        description: '10 unidades',
        price: 22.00,
        category: 'APPETIZERS',
        active: true,
      },

      // Sobremesas
      {
        name: 'Sorvete 2 Bolas',
        description: 'Diversos sabores',
        price: 12.00,
        category: 'DESSERTS',
        active: true,
      },
      {
        name: 'Milk Shake',
        description: 'Chocolate, morango ou baunilha',
        price: 15.00,
        category: 'DESSERTS',
        active: true,
      },
      {
        name: 'Brownie com Sorvete',
        description: 'Brownie quente com sorvete',
        price: 18.00,
        category: 'DESSERTS',
        active: true,
      },

      // Refeições
      {
        name: 'Prato Executivo',
        description: 'Arroz, feijão, carne e salada',
        price: 35.00,
        category: 'MEALS',
        active: true,
      },
      {
        name: 'Filé de Frango',
        description: 'Filé grelhado com guarnições',
        price: 38.00,
        category: 'MEALS',
        active: true,
      },
      {
        name: 'Picanha na Chapa',
        description: '300g com acompanhamentos',
        price: 55.00,
        category: 'MEALS',
        active: true,
      },
    ],
  })

  console.log(`✅ Criados produtos`)

  // Cria configurações de impressora
  console.log('🖨️  Criando configurações de impressoras...')

  await prisma.printerConfig.createMany({
    data: [
      {
        name: 'Impressora Cozinha',
        type: 'kitchen',
        vendorId: '0x0483',
        productId: '0x070b',
        connected: false,
        printCount: 0,
        settings: {
          speed: 'normal',
          density: 'medium',
          autoCut: true,
        },
      },
      {
        name: 'Impressora Recepção',
        type: 'reception',
        vendorId: '0x0483',
        productId: '0x070c',
        connected: false,
        printCount: 0,
        settings: {
          speed: 'normal',
          density: 'medium',
          autoCut: true,
        },
      },
    ],
  })

  console.log(`✅ Criadas configurações de impressoras`)

  // Resumo
  console.log('\n✨ Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log(`   - Usuários: 3 (1 recepcionista, 2 garçons)`)
  console.log(`   - Mesas: 20`)
  console.log(`   - Produtos: 18`)
  console.log(`   - Impressoras: 2`)
  console.log('\n🔐 Credenciais:')
  console.log(`   Admin: admin@burguesa.com / admin123`)
  console.log(`   Garçom 1: joao@burguesa.com / garcom123`)
  console.log(`   Garçom 2: maria@burguesa.com / garcom123`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
