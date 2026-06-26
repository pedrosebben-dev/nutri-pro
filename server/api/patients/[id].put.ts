import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const existing = await prisma.patient.findFirst({ where: { id, userId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Paciente não encontrado.' })

  const updated = await prisma.patient.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      gender: body.gender,
      weight: parseFloat(body.weight),
      height: parseFloat(body.height),
      activityLevel: body.activityLevel,
      goal: body.goal,
      restrictions: body.restrictions || [],
      pathologies: body.pathologies || [],
      notes: body.notes || null,
    },
  })

  return updated
})
