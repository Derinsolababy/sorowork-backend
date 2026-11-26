import { z } from 'zod'

export const createSubmissionSchema = z.object({
  taskId: z.string().uuid(),
  evidenceUrl: z.string().url(),
  description: z.string().max(2000).optional(),
})

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
