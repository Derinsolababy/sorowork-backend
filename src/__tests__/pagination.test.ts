import { parsePagination } from '../utils/pagination.js'

describe('parsePagination', () => {
  it('returns defaults when no params', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('calculates skip correctly', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('clamps limit to 100', () => {
    expect(parsePagination({ limit: '500' })).toEqual({ page: 1, limit: 100, skip: 0 })
  })

  it('enforces minimum page of 1', () => {
    expect(parsePagination({ page: '-5' })).toEqual({ page: 1, limit: 20, skip: 0 })
  })
})
