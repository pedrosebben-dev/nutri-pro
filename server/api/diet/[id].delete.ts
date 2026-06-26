import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const id = getRouterParam(event, 'id')!

  const diet = await prisma.diet.findFirst({
    where: { id, patient: { userId } },
  })

  if (!diet) throw createError({ statusCode: 404, statusMessage: 'Dieta não encontrada.' })

  await prisma.diet.delete({ where: { id } })

  return { message: 'Dieta removida com sucesso.' }
})
