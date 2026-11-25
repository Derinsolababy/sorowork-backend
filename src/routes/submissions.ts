import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const SubmitSchema = z.object({
  taskId: z.string().uuid(),
  evidenceUrl: z.string().url(),
  description: z.string().max(2000).optional(),
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parse = SubmitSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const { taskId, evidenceUrl, description } = parse.data

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  if (!['OPEN', 'ASSIGNED'].includes(task.status)) {
    res.status(400).json({ error: 'Task is not accepting submissions' })
    return
  }
  if (task.creatorId === req.user!.id) {
    res.status(400).json({ error: 'Task creators cannot submit to their own tasks' })
    return
  }

  const existing = await prisma.submission.findFirst({
    where: { taskId, contributorId: req.user!.id, status: 'PENDING' },
  })
  if (existing) {
    res.status(409).json({ error: 'You already have a pending submission for this task' })
    return
  }

  const submission = await prisma.submission.create({
    data: { taskId, evidenceUrl, description, contributorId: req.user!.id },
    include: { contributor: { select: { id: true, username: true } } },
  })

  await prisma.task.update({ where: { id: taskId }, data: { status: 'SUBMITTED' } })

  res.status(201).json(submission)
})

router.get('/task/:taskId', requireAuth, async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } })
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }

  if (task.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only the task creator can view all submissions' })
    return
  }

  const submissions = await prisma.submission.findMany({
    where: { taskId: req.params.taskId },
    include: {
      contributor: { select: { id: true, username: true, walletAddress: true, reputation: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(submissions)
})

router.put('/:id/approve', requireAuth, async (req: Request, res: Response) => {
  const submission = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: { task: true },
  })
  if (!submission) {
    res.status(404).json({ error: 'Submission not found' })
    return
  }
  if (submission.task.creatorId !== req.user!.id) {
    res.status(403).json({ error: 'Only the task creator can approve submissions' })
    return
  }
  if (submission.status !== 'PENDING') {
    res.status(400).json({ error: 'Submission is not pending' })
    return
  }

  const [updated] = await prisma.$transaction([
    prisma.submission.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } }),
    prisma.task.update({ where: { id: submission.taskId }, data: { status: 'APPROVED' } }),
    prisma.user.update({
      where: { id: submission.contributorId },
      data: { reputation: { increment: 10 } },
    }),
    prisma.notification.create({
      data: {
        userId: submission.contributorId,
        type: 'SUBMISSION_APPROVED',
        message: `Your submission for "${submission.task.title}" was approved! Reward is being processed.`,
      },
    }),
  ])

  res.json(updated)
})

router.put('/:id/reject', requireAuth, async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string }

  const submission = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: { task: true },
  })
  if (!submission) {
    res.status(404).json({ error: 'Submission not found' })
    return
  }
  if (submission.task.creatorId !== req.user!.id) {
    res.status(403).json({ error: 'Only the task creator can reject submissions' })
    return
  }
  if (submission.status !== 'PENDING') {
    res.status(400).json({ error: 'Submission is not pending' })
    return
  }

  const [updated] = await prisma.$transaction([
    prisma.submission.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } }),
    prisma.task.update({ where: { id: submission.taskId }, data: { status: 'OPEN' } }),
    prisma.notification.create({
      data: {
        userId: submission.contributorId,
        type: 'SUBMISSION_REJECTED',
        message: reason
          ? `Your submission for "${submission.task.title}" was rejected: ${reason}`
          : `Your submission for "${submission.task.title}" was rejected.`,
      },
    }),
  ])

  res.json(updated)
})

export default router
