import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.patient.findFirst({ where: { id, userId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Paciente não encontrado.' })

  await prisma.patient.delete({ where: { id } })

  return { message: 'Paciente removido com sucesso.' }
})
