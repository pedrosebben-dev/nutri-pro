import { prisma } from '~/server/utils/prisma'
import { sendPasswordResetEmail } from '~/server/utils/auth-email'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail é obrigatório.' })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user) {
    return { userId: null, devCode: undefined, emailSent: false }
  }

  await prisma.verificationCode.updateMany({
    where: { userId: user.id, type: 'reset_password', usedAt: null },
    data: { usedAt: new Date() },
  })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code,
      type: 'reset_password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  let devCode: string | undefined
  let emailSent = false
  try {
    const result = await sendPasswordResetEmail(user.email, user.name, code)
    emailSent = !result.devMode
    if (result.devMode) devCode = result.code
  } catch (err) {
    console.error('[forgot-password] Email send failed:', err)
    devCode = code
  }

  return { userId: user.id, devCode, emailSent }
})
