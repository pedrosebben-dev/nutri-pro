import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const body = await readBody(event)

  const {
    name, email, phone, birthDate, gender,
    weight, height, activityLevel, goal,
    restrictions, pathologies, notes,
  } = body

  if (!name || !gender || !weight || !height || !activityLevel || !goal) {
    throw createError({ statusCode: 400, statusMessage: 'Campos obrigatórios: nome, gênero, peso, altura, nível de atividade e objetivo.' })
  }

  const patient = await prisma.patient.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender,
      weight: parseFloat(weight),
      height: parseFloat(height),
      activityLevel,
      goal,
      restrictions: restrictions || [],
      pathologies: pathologies || [],
      notes: notes || null,
      userId,
    },
  })

  return patient
})
