import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const body = await readBody(event)

  const { name, crn, phone, currentPassword, newPassword } = body

  const updateData: Record<string, unknown> = {}

  if (name) updateData.name = name
  if (crn !== undefined) updateData.crn = crn
  if (phone !== undefined) updateData.phone = phone

  // Troca de senha
  if (newPassword) {
    if (!currentPassword) {
      throw createError({ statusCode: 400, statusMessage: 'Senha atual é obrigatória para alterar a senha.' })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw createError({ statusCode: 400, statusMessage: 'Senha atual incorreta.' })

    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, crn: true, phone: true, logoUrl: true },
  })

  return updated
})
