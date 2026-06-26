import { prisma } from '~/server/utils/prisma'
import { generateDietWithAI } from '~/server/utils/openai'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const body = await readBody(event)

  const { patientId, title, validUntil } = body

  if (!patientId) {
    throw createError({ statusCode: 400, statusMessage: 'ID do paciente é obrigatório.' })
  }

  // Verifica que o paciente pertence ao nutricionista
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId } })
  if (!patient) {
    throw createError({ statusCode: 404, statusMessage: 'Paciente não encontrado.' })
  }

  // Calcula a idade
  const age = patient.birthDate
    ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30

  // Gera a dieta com IA
  const dietContent = await generateDietWithAI({
    name: patient.name,
    gender: patient.gender,
    age,
    weight: patient.weight,
    height: patient.height,
    activityLevel: patient.activityLevel,
    goal: patient.goal,
    restrictions: patient.restrictions,
    pathologies: patient.pathologies,
    notes: patient.notes || undefined,
  })

  // Salva no banco
  const diet = await prisma.diet.create({
    data: {
      title: title || `Plano Alimentar — ${patient.name}`,
      patientId,
      content: dietContent as object,
      kcalTarget: dietContent.totalCalories,
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  return { diet, content: dietContent }
})
