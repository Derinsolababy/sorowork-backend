import { prisma } from './prisma.js'
import { REPUTATION_PER_APPROVAL } from '../utils/constants.js'

export async function addReputation(userId: string, amount: number = REPUTATION_PER_APPROVAL) {
  return prisma.user.update({
    where: { id: userId },
    data: { reputation: { increment: amount } },
  })
}

export function getReputationTier(reputation: number): string {
  if (reputation >= 500) return 'Master'
  if (reputation >= 200) return 'Expert'
  if (reputation >= 100) return 'Experienced'
  if (reputation >= 30) return 'Reliable'
  return 'Newcomer'
}
