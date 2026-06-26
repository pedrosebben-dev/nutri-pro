import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.patient.findFirst({ where: { id, userId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Paciente não encontrado.' })

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado.' })
  }

  const file = formData[0]
  if (!file || !file.type?.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Apenas imagens são permitidas.' })
  }

  const ext = file.filename?.split('.').pop() || 'jpg'
  const filename = `patient-${id}-${Date.now()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), file.data)

  const photoUrl = `/uploads/${filename}`
  await prisma.patient.update({ where: { id }, data: { photoUrl } })

  return { photoUrl }
})
