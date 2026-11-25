import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../services/prisma.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { limit = '50', period } = req.query as Record<string, string>

  let submissionWhere = {}
  if (period === 'week') {
    const since = new Date()
    since.setDate(since.getDate() - 7)
    submissionWhere = { createdAt: { gte: since }, status: 'APPROVED' }
  } else if (period === 'month') {
    const since = new Date()
    since.setMonth(since.getMonth() - 1)
    submissionWhere = { createdAt: { gte: since }, status: 'APPROVED' }
  }

  const users = await prisma.user.findMany({
    take: parseInt(limit),
    orderBy: { reputation: 'desc' },
    select: {
      id: true,
      username: true,
      walletAddress: true,
      avatarUrl: true,
      reputation: true,
      _count: {
        select: {
          submissions: true,
          tasks: true,
        },
      },
    },
  })

  const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }))
  res.json({ leaderboard: ranked, period: period || 'all-time' })
})

export default router
