import { prisma } from './database'
import { Prisma } from '@prisma/client'

// 1. 批量用户创建
export async function createUsersInBatch() {
  console.log('\n📝 批量创建用户...')

  const users = await prisma.user.createMany({
    data: [
      {
        email: 'alice@example.com',
        username: 'alice_dev',
        firstName: 'Alice',
        lastName: 'Johnson',
      },
      {
        email: 'bob@example.com',
        username: 'bob_writer',
        firstName: 'Bob',
        lastName: 'Smith',
      },
      {
        email: 'charlie@example.com',
        username: 'charlie_tech',
        firstName: 'Charlie',
        lastName: 'Brown',
      },
    ],
    skipDuplicates: true,
  })

  console.log(`创建了 ${users.count} 个用户`)
  return users
}

// 2. 复杂的嵌套创建
export async function createPostWithRelations() {
  console.log('\n📝 创建文章及关联数据...')

  const post = await prisma.post.create({
    data: {
      title: 'Aurora PostgreSQL 性能优化指南',
      slug: 'aurora-postgresql-performance-guide',
      content: '这是一篇关于 Aurora PostgreSQL 性能优化的详细指南...',
      excerpt: 'learn how to optimize Aurora PostgreSQL for better performance',
      published: true,
      publishedAt: new Date(),
      author: {
        connect: { email: 'alice@example.com' }
      },
      tags: {
        create: [
          { tag: { create: { name: 'PostgreSQL', slug: 'postgresql', color: '#336791' } } },
          { tag: { create: { name: 'AWS', slug: 'aws', color: '#ff9900' } } },
          { tag: { create: { name: '性能优化', slug: 'performance', color: '#28a745' } } },
        ]
      },
      categories: {
        create: [
          { category: { create: { name: '数据库', slug: 'database', description: '数据库相关文章' } } },
          { category: { create: { name: '云计算', slug: 'cloud', description: '云计算技术' } } },
        ]
      }
    },
    include: {
      author: true,
      tags: { include: { tag: true } },
      categories: { include: { category: true } }
    }
  })

  console.log('创建的文章:', JSON.stringify(post, null, 2))
  return post
}

// 3. 事务操作 - 模拟用户互动
export async function userInteractionTransaction() {
  console.log('\n📝 执行用户互动事务...')

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 获取文章
      const post = await tx.post.findFirst({
        where: { published: true }
      })

      if (!post) throw new Error('没有找到已发布的文章')

      // 获取用户
      const user = await tx.user.findFirst({
        where: { email: 'bob@example.com' }
      })

      if (!user) throw new Error('用户不存在')

      // 添加评论
      const comment = await tx.comment.create({
        data: {
          content: '这篇文章写得很好，学到了很多！',
          postId: post.id,
          authorId: user.id,
        }
      })

      // 添加点赞
      const like = await tx.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        }
      })

      // 增加文章浏览量
      const updatedPost = await tx.post.update({
        where: { id: post.id },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })

      return { comment, like, updatedPost }
    })

    console.log('事务执行成功:', result)
    return result
  } catch (error) {
    console.error('事务执行失败:', error)
    throw error
  }
}

// 4. 批量更新操作
export async function batchUpdateOperations() {
  console.log('\n📝 执行批量更新操作...')

  // 批量更新用户状态
  const updateUsers = await prisma.user.updateMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内创建的用户
      }
    },
    data: {
      isActive: true,
    }
  })

  // 批量发布文章
  const publishPosts = await prisma.post.updateMany({
    where: {
      published: false,
      content: {
        not: null
      }
    },
    data: {
      published: true,
      publishedAt: new Date(),
    }
  })

  console.log(`更新了 ${updateUsers.count} 个用户状态`)
  console.log(`发布了 ${publishPosts.count} 篇文章`)

  return { updateUsers, publishPosts }
}

// 5. Upsert 操作（创建或更新）
export async function upsertOperations() {
  console.log('\n📝 执行 Upsert 操作...')

  const userData = [
    { email: 'admin@example.com', username: 'admin', firstName: 'Admin', lastName: 'User' },
    { email: 'alice@example.com', username: 'alice_updated', firstName: 'Alice', lastName: 'Johnson Updated' },
  ]

  const results = []

  for (const data of userData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: data,
      update: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        updatedAt: new Date(),
      },
    })
    results.push(user)
  }

  console.log('Upsert 结果:', results)
  return results
}

// 6. 原始 SQL 批量操作
export async function rawSqlOperations() {
  console.log('\n📝 执行原始 SQL 操作...')

  // 使用原始 SQL 进行批量插入（高性能）
  const insertResult = await prisma.$executeRaw`
    INSERT INTO posts (id, title, slug, content, published, "authorId", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid(),
      'Batch Post ' || generate_series,
      'batch-post-' || generate_series,
      'This is batch content for post ' || generate_series,
      true,
      (SELECT id FROM users LIMIT 1),
      NOW(),
      NOW()
    FROM generate_series(1, 5)
    ON CONFLICT (slug) DO NOTHING
  `

  // 批量更新浏览量
  const updateResult = await prisma.$executeRaw`
    UPDATE posts
    SET "viewCount" = "viewCount" + floor(random() * 100 + 1)::int
    WHERE published = true
  `

  console.log(`批量插入影响行数: ${insertResult}`)
  console.log(`批量更新影响行数: ${updateResult}`)

  return { insertResult, updateResult }
}

// 7. 并发写操作
export async function concurrentWriteOperations() {
  console.log('\n📝 执行并发写操作...')

  const operations = [
    // 并发创建多个评论
    prisma.comment.create({
      data: {
        content: '并发评论 1',
        post: { connect: { slug: 'aurora-postgresql-performance-guide' } },
        author: { connect: { email: 'alice@example.com' } }
      }
    }),
    prisma.comment.create({
      data: {
        content: '并发评论 2',
        post: { connect: { slug: 'aurora-postgresql-performance-guide' } },
        author: { connect: { email: 'bob@example.com' } }
      }
    }),
    // 并发更新用户信息
    prisma.user.update({
      where: { email: 'charlie@example.com' },
      data: {
        firstName: 'Charlie Updated',
        profile: {
          upsert: {
            create: { bio: '全栈开发者', website: 'https://charlie.dev' },
            update: { bio: '资深全栈开发者', website: 'https://charlie.dev' }
          }
        }
      }
    }),
  ]

  try {
    const results = await Promise.all(operations)
    console.log('并发操作完成:', results.length)
    return results
  } catch (error) {
    console.error('并发操作失败:', error)
    throw error
  }
}

// 8. 条件批量删除
export async function conditionalDelete() {
  console.log('\n📝 执行条件删除操作...')

  // 删除未发布且创建时间超过30天的文章
  const deletedPosts = await prisma.post.deleteMany({
    where: {
      AND: [
        { published: false },
        {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        { viewCount: 0 }
      ]
    }
  })

  console.log(`删除了 ${deletedPosts.count} 篇文章`)
  return deletedPosts
}
