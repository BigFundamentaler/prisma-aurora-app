import { PrismaClient } from '@prisma/client'

// 全局 Prisma 实例
declare global {
  var __prisma: PrismaClient | undefined
}

// 创建 Prisma 客户端实例
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// 连接测试
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Aurora PostgreSQL 连接成功')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

// 断开连接
export async function disconnectDatabase() {
  await prisma.$disconnect()
}
