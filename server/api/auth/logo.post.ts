import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado.' })
  }

  const file = formData[0]
  if (!file || !file.type?.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Apenas imagens são permitidas.' })
  }

  const ext = file.filename?.split('.').pop() || 'png'
  const filename = `logo-${userId}-${Date.now()}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  const filePath = join(uploadDir, filename)

  // Cria diretório se não existir
  const { mkdirSync } = await import('fs')
  mkdirSync(uploadDir, { recursive: true })

  await writeFile(filePath, file.data)

  const logoUrl = `/uploads/${filename}`

  await prisma.user.update({
    where: { id: userId },
    data: { logoUrl },
  })

  return { logoUrl }
})
