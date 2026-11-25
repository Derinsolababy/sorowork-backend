import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../services/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/stats', async (_req: Request, res: Response) => {
  const [
    totalUsers,
    totalTasks,
    openTasks,
    totalSubmissions,
    approvedSubmissions,
    totalCommunities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'OPEN' } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: 'APPROVED' } }),
    prisma.community.count(),
  ])

  const recentUsers = await prisma.user.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  })

  res.json({
    users: { total: totalUsers, newThisWeek: recentUsers },
    tasks: { total: totalTasks, open: openTasks },
    submissions: { total: totalSubmissions, approved: approvedSubmissions },
    communities: { total: totalCommunities },
  })
})

router.get('/users', async (req: Request, res: Response) => {
  const { page = '1', limit = '50', role, q } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { walletAddress: { contains: q } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        role: true,
        reputation: true,
        createdAt: true,
        _count: { select: { tasks: true, submissions: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
})

const UpdateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CREATOR', 'CONTRIBUTOR']),
})

router.put('/users/:id/role', async (req: Request, res: Response) => {
  const parse = UpdateRoleSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parse.data.role },
    select: { id: true, username: true, role: true },
  })
  res.json(updated)
})

export default router
