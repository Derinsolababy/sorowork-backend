import { createTaskSchema } from '../schemas/task.js'
import { registerSchema, loginSchema } from '../schemas/auth.js'

describe('Task schemas', () => {
  it('validates valid task', () => {
    const result = createTaskSchema.safeParse({
      title: 'Clean up Riverside Park',
      description: 'Remove trash and debris from the main trail areas',
      rewardAmount: 150,
      tags: ['Cleaning', 'Outdoors'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects short title', () => {
    const result = createTaskSchema.safeParse({
      title: 'Hi',
      description: 'Valid description here with enough characters',
      rewardAmount: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative reward', () => {
    const result = createTaskSchema.safeParse({
      title: 'Valid task title here',
      description: 'Valid description here with enough characters',
      rewardAmount: -50,
    })
    expect(result.success).toBe(false)
  })
})

describe('Auth schemas', () => {
  it('validates valid registration', () => {
    const result = registerSchema.safeParse({
      walletAddress: 'GDEMO_ADMIN_ADDRESS_FOR_SEEDING_000000000000000',
      username: 'test_user',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid username characters', () => {
    const result = registerSchema.safeParse({
      walletAddress: 'GDEMO_ADMIN_ADDRESS_FOR_SEEDING_000000000000000',
      username: 'bad user!',
    })
    expect(result.success).toBe(false)
  })
})
