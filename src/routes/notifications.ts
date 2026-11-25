import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { page = '1', limit = '30', unread } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where: Record<string, unknown> = { userId: req.user!.id }
  if (unread === 'true') where.read = false

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
  ])

  res.json({ notifications, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
})

router.put('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } })
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }
  if (notification.userId !== req.user!.id) {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  })
  res.json(updated)
})

router.put('/read-all', requireAuth, async (req: Request, res: Response) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  })
  res.json({ updated: result.count })
})

export default router
