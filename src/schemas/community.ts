import { z } from 'zod'

export const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
})

export const communityQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
