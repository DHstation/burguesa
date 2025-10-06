#!/usr/bin/env tsx
/**
 * Script para verificar se o ambiente está configurado corretamente
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSetup() {
  console.log('🔍 Verificando configuração do sistema...\n')

  // 1. Verificar conexão com banco
  console.log('1️⃣  Testando conexão com banco de dados...')
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('   ✅ Conexão com banco OK\n')
  } catch (error: any) {
    console.log('   ❌ Erro ao conectar com banco de dados')
    console.log('   Erro:', error.message)
    console.log('\n   💡 Solução:')
    console.log('   - Verifique se PostgreSQL está rodando')
    console.log('   - Verifique as credenciais no arquivo .env')
    console.log('   - Consulte SETUP_DATABASE.md\n')
    process.exit(1)
  }

  // 2. Verificar se tabelas existem
  console.log('2️⃣  Verificando tabelas do banco...')
  try {
    const userCount = await prisma.user.count()
    const tableCount = await prisma.table.count()
    const productCount = await prisma.product.count()

    console.log('   ✅ Tabelas encontradas:')
    console.log(`      - Users: ${userCount} registros`)
    console.log(`      - Tables: ${tableCount} registros`)
    console.log(`      - Products: ${productCount} registros\n`)

    if (userCount === 0) {
      console.log('   ⚠️  Nenhum usuário encontrado!')
      console.log('   Execute: npx tsx scripts/seed.ts\n')
    }
  } catch (error: any) {
    console.log('   ❌ Tabelas não encontradas')
    console.log('   Erro:', error.message)
    console.log('\n   💡 Solução:')
    console.log('   Execute: npm run prisma:migrate\n')
    process.exit(1)
  }

  // 3. Verificar variáveis de ambiente
  console.log('3️⃣  Verificando variáveis de ambiente...')
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
  let envOk = true

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} configurado`)
    } else {
      console.log(`   ❌ ${envVar} não encontrado`)
      envOk = false
    }
  }

  if (!envOk) {
    console.log('\n   💡 Solução:')
    console.log('   - Copie .env.example para .env')
    console.log('   - Configure as variáveis necessárias\n')
    process.exit(1)
  }

  console.log('')

  // 4. Verificar usuários de teste
  console.log('4️⃣  Verificando usuários de teste...')
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@burguesa.com' }
    })

    const waiter = await prisma.user.findUnique({
      where: { email: 'joao@burguesa.com' }
    })

    if (admin) {
      console.log('   ✅ Recepcionista: admin@burguesa.com')
    } else {
      console.log('   ❌ Recepcionista não encontrado')
    }

    if (waiter) {
      console.log('   ✅ Garçom: joao@burguesa.com')
    } else {
      console.log('   ❌ Garçom não encontrado')
    }

    if (!admin || !waiter) {
      console.log('\n   💡 Solução:')
      console.log('   Execute: npx tsx scripts/seed.ts\n')
    }
  } catch (error) {
    console.log('   ❌ Erro ao verificar usuários')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Verificação concluída!')
  console.log('='.repeat(60))
  console.log('\n📋 Resumo:')
  console.log('   ✅ Banco de dados conectado')
  console.log('   ✅ Tabelas criadas')
  console.log('   ✅ Variáveis de ambiente configuradas')
  console.log('\n🚀 Sistema pronto para uso!')
  console.log('\n   Acesse: http://localhost:3000')
  console.log('   Login: admin@burguesa.com / admin123\n')

  await prisma.$disconnect()
}

checkSetup().catch((error) => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
