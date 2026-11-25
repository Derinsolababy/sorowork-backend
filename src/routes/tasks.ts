import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const CreateTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  rewardAmount: z.number().positive(),
  token: z.string().default('USDC'),
  tags: z.array(z.string()).max(10).default([]),
  communityId: z.string().uuid().optional(),
  contractTaskId: z.number().int().positive().optional(),
})

const UpdateTaskSchema = CreateTaskSchema.partial()

router.get('/', async (req: Request, res: Response) => {
  const { status, tag, creatorId, communityId, page = '1', limit = '20' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (creatorId) where.creatorId = creatorId
  if (communityId) where.communityId = communityId
  if (tag) where.tags = { has: tag }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true, walletAddress: true, reputation: true } },
        community: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.task.count({ where }),
  ])

  res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parse = CreateTaskSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const task = await prisma.task.create({
    data: { ...parse.data, creatorId: req.user!.id },
    include: { creator: { select: { id: true, username: true } } },
  })

  res.status(201).json(task)
})

router.get('/:id', async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      creator: { select: { id: true, username: true, walletAddress: true, reputation: true } },
      community: { select: { id: true, name: true, logoUrl: true } },
      submissions: {
        include: { contributor: { select: { id: true, username: true, reputation: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  res.json(task)
})

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  if (task.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Not authorized to update this task' })
    return
  }

  const parse = UpdateTaskSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const updated = await prisma.task.update({ where: { id: req.params.id }, data: parse.data })
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  if (task.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Not authorized to delete this task' })
    return
  }
  if (task.status !== 'OPEN') {
    res.status(400).json({ error: 'Cannot delete a task that is in progress or completed' })
    return
  }

  await prisma.task.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
  res.json({ success: true })
})

router.post('/:id/assign', requireAuth, async (req: Request, res: Response) => {
  const { contributorId } = req.body as { contributorId?: string }
  if (!contributorId) {
    res.status(400).json({ error: 'contributorId is required' })
    return
  }

  const task = await prisma.task.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  if (task.creatorId !== req.user!.id) {
    res.status(403).json({ error: 'Only the task creator can assign a contributor' })
    return
  }
  if (task.status !== 'OPEN') {
    res.status(400).json({ error: 'Task is not open for assignment' })
    return
  }

  const contributor = await prisma.user.findUnique({ where: { id: contributorId } })
  if (!contributor) {
    res.status(404).json({ error: 'Contributor not found' })
    return
  }

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: 'ASSIGNED' },
  })
  res.json(updated)
})

export default router
