import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
})

router.get('/:walletAddress', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { walletAddress: req.params.walletAddress },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      bio: true,
      avatarUrl: true,
      reputation: true,
      role: true,
      createdAt: true,
      _count: {
        select: { tasks: true, submissions: true },
      },
    },
  })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json(user)
})

router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const parse = UpdateProfileSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  if (parse.data.username) {
    const taken = await prisma.user.findFirst({
      where: { username: parse.data.username, NOT: { id: req.user!.id } },
    })
    if (taken) {
      res.status(409).json({ error: 'Username already taken' })
      return
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: parse.data,
    select: {
      id: true,
      walletAddress: true,
      username: true,
      bio: true,
      avatarUrl: true,
      reputation: true,
      role: true,
    },
  })
  res.json(updated)
})

router.get('/:walletAddress/contributions', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { walletAddress: req.params.walletAddress },
  })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const { page = '1', limit = '20' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { contributorId: user.id, status: 'APPROVED' },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
            token: true,
            tags: true,
          },
        },
      },
    }),
    prisma.submission.count({ where: { contributorId: user.id, status: 'APPROVED' } }),
  ])

  res.json({ submissions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
})

export default router
