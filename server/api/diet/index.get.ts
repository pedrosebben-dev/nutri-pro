import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user

  const diets = await prisma.diet.findMany({
    where: { patient: { userId } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      validUntil: true,
      patient: { select: { id: true, name: true } },
    },
  })

  return diets
})
