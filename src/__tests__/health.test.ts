import request from 'supertest'
import { app } from '../index.js'

describe('GET /health', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.version).toBeDefined()
    expect(res.body.uptime).toBeDefined()
  })
})

describe('GET /nonexistent', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Not found')
  })
})
