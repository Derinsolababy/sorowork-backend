import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../services/prisma.js'

export interface JwtPayload {
  userId: string
  walletAddress: string
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        walletAddress: string
        username: string
        role: string
      }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' })
    return
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload
    prisma.user
      .findUnique({ where: { id: payload.userId } })
      .then((user) => {
        if (!user) {
          res.status(401).json({ error: 'User not found' })
          return
        }
        req.user = {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
          role: user.role,
        }
        next()
      })
      .catch(next)
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
