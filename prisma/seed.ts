import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with sample community work data...')

  const admin = await prisma.user.upsert({
    where: { walletAddress: 'GDEMO_ADMIN_ADDRESS_FOR_SEEDING_000000000000000' },
    update: {},
    create: {
      walletAddress: 'GDEMO_ADMIN_ADDRESS_FOR_SEEDING_000000000000000',
      username: 'riverside_council',
      bio: 'Riverside District Community Council',
      role: 'CREATOR',
      reputation: 100,
    },
  })

  const community = await prisma.community.upsert({
    where: { name: 'Riverside District' },
    update: {},
    create: {
      name: 'Riverside District',
      description: 'Community tasks for the Riverside neighborhood',
    },
  })

  const tasks = [
    { title: 'Clean up Riverside Park — trash & debris removal', description: 'Remove litter and debris from main trail and picnic areas. Submit before/after photos.', rewardAmount: 150, tags: ['Cleaning', 'Outdoors'] },
    { title: 'Fill potholes on Oak Street', description: 'Three potholes near intersection of Oak and Main. Materials provided by council.', rewardAmount: 300, tags: ['Road Repair'] },
    { title: 'Paint community center fence', description: 'Sand and repaint the perimeter fence. White latex paint provided.', rewardAmount: 200, tags: ['Painting', 'Maintenance'] },
    { title: 'Mow and trim Memorial Garden', description: 'Weekly mowing and edging of the memorial garden grounds.', rewardAmount: 75, tags: ['Landscaping'] },
    { title: 'Clear storm drain on 5th Avenue', description: 'Remove leaves and debris blocking the drain. Tools provided.', rewardAmount: 100, tags: ['Maintenance', 'Cleaning'] },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        rewardAmount: task.rewardAmount,
        creatorId: admin.id,
        communityId: community.id,
      },
    })
  }

  console.log('Seeded: 1 admin, 1 community, 5 sample tasks')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
