import { prisma } from '~/server/utils/prisma'
import { sendVerificationEmail, sendPasswordResetEmail } from '~/server/utils/auth-email'

export default defineEventHandler(async (event) => {
  const { userId, type } = await readBody(event)

  if (!userId || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos.' })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  }

  // Invalidate existing codes of the same type
  await prisma.verificationCode.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  await prisma.verificationCode.create({
    data: {
      userId,
      code,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  const sendFn = type === 'verify_email' ? sendVerificationEmail : sendPasswordResetEmail
  const result = await sendFn(user.email, user.name, code)

  return { devCode: result.devMode ? result.code : undefined }
})
