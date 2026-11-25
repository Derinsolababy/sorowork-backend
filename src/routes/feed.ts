import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../services/prisma.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [recentTasks, recentApprovals] = await Promise.all([
    prisma.task.findMany({
      where: { status: 'OPEN' },
      take: Math.ceil(parseInt(limit) / 2),
      skip: Math.floor(skip / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        community: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.submission.findMany({
      where: { status: 'APPROVED' },
      take: Math.floor(parseInt(limit) / 2),
      skip: Math.floor(skip / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        contributor: { select: { id: true, username: true, avatarUrl: true } },
        task: { select: { id: true, title: true, rewardAmount: true, token: true } },
      },
    }),
  ])

  const feedItems = [
    ...recentTasks.map((t) => ({ type: 'NEW_TASK' as const, data: t, createdAt: t.createdAt })),
    ...recentApprovals.map((s) => ({ type: 'CONTRIBUTION_APPROVED' as const, data: s, createdAt: s.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, parseInt(limit))

  res.json({
    items: feedItems,
    page: parseInt(page),
    limit: parseInt(limit),
  })
})

export default router
