import { z } from 'zod'

export const registerSchema = z.object({
  walletAddress: z.string().min(56).max(56),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
})

export const loginSchema = z.object({
  walletAddress: z.string().min(56).max(56),
  signature: z.string().min(1),
  message: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
