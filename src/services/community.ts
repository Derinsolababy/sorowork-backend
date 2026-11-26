import { prisma } from './prisma.js'

export async function findCommunities(search?: string, skip = 0, take = 20) {
  const where = search
    ? { OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]}
    : {}

  const [data, total] = await Promise.all([
    prisma.community.findMany({
      where,
      include: { _count: { select: { members: true, tasks: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.community.count({ where }),
  ])

  return { data, total }
}

export async function getCommunityDetail(id: string) {
  return prisma.community.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, walletAddress: true, avatarUrl: true } } },
        take: 50,
      },
      _count: { select: { members: true, tasks: true } },
    },
  })
}
