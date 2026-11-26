import { prisma } from './prisma.js'

type NotificationType = 'TASK_ASSIGNED' | 'WORK_SUBMITTED' | 'WORK_APPROVED' | 'WORK_REJECTED' | 'COMMUNITY_JOINED'

export async function createNotification(userId: string, type: NotificationType, message: string) {
  return prisma.notification.create({
    data: { userId, type, message },
  })
}

export async function notifyTaskAssigned(userId: string, taskTitle: string) {
  return createNotification(userId, 'TASK_ASSIGNED', `You were assigned to: ${taskTitle}`)
}

export async function notifyWorkSubmitted(creatorId: string, workerName: string, taskTitle: string) {
  return createNotification(creatorId, 'WORK_SUBMITTED', `${workerName} submitted work for: ${taskTitle}`)
}

export async function notifyWorkApproved(workerId: string, taskTitle: string, amount: number) {
  return createNotification(workerId, 'WORK_APPROVED', `Your work on "${taskTitle}" was approved! ${amount} USDC released.`)
}

export async function notifyWorkRejected(workerId: string, taskTitle: string) {
  return createNotification(workerId, 'WORK_REJECTED', `Your submission for "${taskTitle}" was rejected.`)
}
