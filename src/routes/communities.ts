import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const CreateCommunitySchema = z.object({
  name: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
})

router.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', q } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { description: { contains: q, mode: 'insensitive' as const } }] }
    : {}

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true, tasks: true } } },
    }),
    prisma.community.count({ where }),
  ])

  res.json({ communities, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parse = CreateCommunitySchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const existing = await prisma.community.findUnique({ where: { name: parse.data.name } })
  if (existing) {
    res.status(409).json({ error: 'Community name already taken' })
    return
  }

  const community = await prisma.community.create({
    data: {
      ...parse.data,
      members: { create: { userId: req.user!.id, role: 'admin' } },
    },
    include: { _count: { select: { members: true } } },
  })

  res.status(201).json(community)
})

router.get('/:id', async (req: Request, res: Response) => {
  const community = await prisma.community.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, reputation: true } } },
        take: 20,
        orderBy: { joinedAt: 'desc' },
      },
      _count: { select: { members: true, tasks: true } },
    },
  })
  if (!community) {
    res.status(404).json({ error: 'Community not found' })
    return
  }
  res.json(community)
})

router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
  const community = await prisma.community.findUnique({ where: { id: req.params.id } })
  if (!community) {
    res.status(404).json({ error: 'Community not found' })
    return
  }

  const existing = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: req.user!.id, communityId: community.id } },
  })
  if (existing) {
    res.status(409).json({ error: 'Already a member of this community' })
    return
  }

  await prisma.communityMember.create({
    data: { userId: req.user!.id, communityId: community.id },
  })
  res.json({ success: true })
})

router.get('/:id/tasks', async (req: Request, res: Response) => {
  const community = await prisma.community.findUnique({ where: { id: req.params.id } })
  if (!community) {
    res.status(404).json({ error: 'Community not found' })
    return
  }

  const { page = '1', limit = '20', status } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where: Record<string, unknown> = { communityId: req.params.id }
  if (status) where.status = status

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.task.count({ where }),
  ])

  res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
})

export default router
