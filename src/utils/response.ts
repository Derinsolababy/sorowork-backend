import type { Response } from 'express'

export function success(res: Response, data: unknown, statusCode: number = 200) {
  res.status(statusCode).json({ success: true, data })
}

export function created(res: Response, data: unknown) {
  success(res, data, 201)
}

export function paginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
) {
  res.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
