import { connectDatabase, disconnectDatabase } from './database'
import {
  createUsersInBatch,
  createPostWithRelations,
  userInteractionTransaction,
  batchUpdateOperations,
  upsertOperations,
  rawSqlOperations,
  concurrentWriteOperations,
  conditionalDelete,
} from './operations'

async function main() {
  console.log('🚀 Aurora PostgreSQL + Prisma 写操作示例')

  // 连接数据库
  await connectDatabase()

  try {
    // 1. 批量创建用户
    await createUsersInBatch()

    // 2. 创建文章及关联数据
    await createPostWithRelations()

    // 3. 用户互动事务
    await userInteractionTransaction()

    // 4. 批量更新操作
    await batchUpdateOperations()

    // 5. Upsert 操作
    await upsertOperations()

    // 6. 原始 SQL 操作
    await rawSqlOperations()

    // 7. 并发写操作
    await concurrentWriteOperations()

    // 8. 条件删除（可选，注释掉避免删除数据）
    // await conditionalDelete()

    console.log('\n✅ 所有写操作完成！')

  } catch (error) {
    console.error('❌ 操作失败:', error)
  } finally {
    await disconnectDatabase()
  }
}

// 运行主程序
main()
