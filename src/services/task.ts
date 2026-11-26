import { prisma } from './prisma.js'
import type { TaskFilters, PaginationParams } from '../types/index.js'

export async function findTasks(filters: TaskFilters, pagination: PaginationParams) {
  const where: Record<string, unknown> = {}

  if (filters.status) where.status = filters.status
  if (filters.creatorId) where.creatorId = filters.creatorId
  if (filters.communityId) where.communityId = filters.communityId
  if (filters.tag) where.tags = { has: filters.tag }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { creator: { select: { id: true, username: true, walletAddress: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.task.count({ where }),
  ])

  return { data, total }
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, username: true, walletAddress: true, avatarUrl: true, reputation: true } },
      submissions: {
        include: { contributor: { select: { id: true, username: true, walletAddress: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}
