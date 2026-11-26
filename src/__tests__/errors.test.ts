import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '../utils/errors.js'

describe('Error classes', () => {
  it('AppError has statusCode', () => {
    const err = new AppError('test', 400)
    expect(err.statusCode).toBe(400)
    expect(err.isOperational).toBe(true)
    expect(err.message).toBe('test')
  })

  it('NotFoundError is 404', () => {
    const err = new NotFoundError('Task')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Task not found')
  })

  it('UnauthorizedError is 401', () => {
    expect(new UnauthorizedError().statusCode).toBe(401)
  })

  it('ForbiddenError is 403', () => {
    expect(new ForbiddenError().statusCode).toBe(403)
  })

  it('ValidationError is 400', () => {
    const err = new ValidationError('bad input')
    expect(err.statusCode).toBe(400)
  })
})
