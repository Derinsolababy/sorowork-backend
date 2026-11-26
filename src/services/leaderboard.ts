import { prisma } from './prisma.js'

export async function getLeaderboard(period?: 'week' | 'month', limit = 20) {
  const where: Record<string, unknown> = { reputation: { gt: 0 } }

  if (period) {
    const since = new Date()
    if (period === 'week') since.setDate(since.getDate() - 7)
    else since.setMonth(since.getMonth() - 1)
    where.updatedAt = { gte: since }
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      walletAddress: true,
      avatarUrl: true,
      reputation: true,
      _count: { select: { submissions: { where: { status: 'APPROVED' } } } },
    },
    orderBy: { reputation: 'desc' },
    take: limit,
  })
}
