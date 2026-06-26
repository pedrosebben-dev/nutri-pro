import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId, code } = await readBody(event)

  if (!userId || !code) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos.' })
  }

  const verification = await prisma.verificationCode.findFirst({
    where: { userId, code, type: 'verify_email', usedAt: null },
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

  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  })

  const config = useRuntimeConfig()
  const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: '7d' })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, crn: user.crn, logoUrl: user.logoUrl },
  }
})
