import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  rewardAmount: z.number().positive(),
  token: z.string().default('USDC'),
  tags: z.array(z.string().max(50)).max(10).default([]),
  communityId: z.string().uuid().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export const taskQuerySchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'SUBMITTED', 'APPROVED', 'CANCELLED']).optional(),
  tag: z.string().optional(),
  creatorId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>
