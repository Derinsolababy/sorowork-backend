import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../services/prisma.js'
import { verifySignature } from '../services/stellar.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const RegisterSchema = z.object({
  walletAddress: z.string().min(56).max(56),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  signature: z.string(),
  message: z.string(),
  bio: z.string().max(500).optional(),
})

const LoginSchema = z.object({
  walletAddress: z.string().min(56).max(56),
  signature: z.string(),
  message: z.string(),
})

function signToken(userId: string, walletAddress: string): string {
  const secret = process.env.JWT_SECRET!
  return jwt.sign({ userId, walletAddress }, secret, { expiresIn: '7d' })
}

router.post('/register', async (req: Request, res: Response) => {
  const parse = RegisterSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const { walletAddress, username, signature, message, bio } = parse.data

  if (!verifySignature(message, signature, walletAddress)) {
    res.status(401).json({ error: 'Invalid wallet signature' })
    return
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ walletAddress }, { username }] },
  })
  if (existing) {
    if (existing.walletAddress === walletAddress) {
      res.status(409).json({ error: 'Wallet address already registered' })
    } else {
      res.status(409).json({ error: 'Username already taken' })
    }
    return
  }

  const user = await prisma.user.create({
    data: { walletAddress, username, bio },
  })

  const token = signToken(user.id, user.walletAddress)
  res.status(201).json({ token, user: { id: user.id, walletAddress, username, role: user.role } })
})

router.post('/login', async (req: Request, res: Response) => {
  const parse = LoginSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const { walletAddress, signature, message } = parse.data

  if (!verifySignature(message, signature, walletAddress)) {
    res.status(401).json({ error: 'Invalid wallet signature' })
    return
  }

  const user = await prisma.user.findUnique({ where: { walletAddress } })
  if (!user) {
    res.status(404).json({ error: 'Account not found — please register first' })
    return
  }

  const token = signToken(user.id, user.walletAddress)
  res.json({ token, user: { id: user.id, walletAddress, username: user.username, role: user.role } })
})

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      bio: true,
      avatarUrl: true,
      reputation: true,
      role: true,
      createdAt: true,
      _count: { select: { tasks: true, submissions: true } },
    },
  })
  res.json(user)
})

export default router
