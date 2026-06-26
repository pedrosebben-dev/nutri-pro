import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId, code, newPassword } = await readBody(event)

  if (!userId || !code || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos.' })
  }
  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  const verification = await prisma.verificationCode.findFirst({
    where: { userId, code, type: 'reset_password', usedAt: null },
  })

  if (!verification) {
    throw createError({ statusCode: 400, statusMessage: 'Código inválido. Verifique e tente novamente.' })
  }

  if (verification.expiresAt < new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'Código expirado. Solicite um novo.' })
  }

  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  })

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })

  return { success: true }
})
