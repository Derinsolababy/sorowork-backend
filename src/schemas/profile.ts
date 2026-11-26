import { z } from 'zod'

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
