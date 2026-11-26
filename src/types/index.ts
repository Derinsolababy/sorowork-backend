import type { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    walletAddress: string
    role: string
  }
}

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface TaskFilters {
  status?: string
  tag?: string
  creatorId?: string
  communityId?: string
  search?: string
}
