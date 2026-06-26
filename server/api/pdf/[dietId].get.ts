import { prisma } from '~/server/utils/prisma'
import { generateDietPdf } from '~/server/utils/pdf'
import type { GeneratedDiet } from '~/server/utils/openai'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const dietId = getRouterParam(event, 'dietId')!

  const diet = await prisma.diet.findFirst({
    where: { id: dietId, patient: { userId } },
    include: {
      patient: true,
    },
  })

  if (!diet) {
    throw createError({ statusCode: 404, statusMessage: 'Dieta não encontrada.' })
  }

  const nutritionist = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!nutritionist) {
    throw createError({ statusCode: 404, statusMessage: 'Nutricionista não encontrado.' })
  }

  try {
    const pdfBuffer = await generateDietPdf({
      diet: diet.content as unknown as GeneratedDiet,
      patient: diet.patient,
      nutritionist,
      dietTitle: diet.title,
      validUntil: diet.validUntil?.toISOString() || null,
    })

    const filename = `dieta-${diet.patient.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`

    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', pdfBuffer.length)

    return pdfBuffer
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao gerar o PDF. Tente novamente.' })
  }
})
