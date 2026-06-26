import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const id = getRouterParam(event, 'id')!

  const diet = await prisma.diet.findFirst({
    where: {
      id,
      patient: { userId },
    },
    include: {
      patient: {
        select: {
          id: true, name: true, email: true, gender: true, weight: true,
          height: true, birthDate: true, activityLevel: true,
          goal: true, restrictions: true, pathologies: true, notes: true,
        },
      },
    },
  })

  if (!diet) {
    throw createError({ statusCode: 404, statusMessage: 'Dieta não encontrada.' })
  }

  return diet
})
