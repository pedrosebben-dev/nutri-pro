import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const id = getRouterParam(event, 'id')!

  const patient = await prisma.patient.findFirst({
    where: { id, userId },
    include: {
      diets: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          kcalTarget: true,
          validUntil: true,
          createdAt: true,
        },
      },
    },
  })

  if (!patient) {
    throw createError({ statusCode: 404, statusMessage: 'Paciente não encontrado.' })
  }

  return patient
})
