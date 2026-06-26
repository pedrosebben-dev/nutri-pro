import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email e senha são obrigatórios.' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' })
  }

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' })
  }

  if (!user.emailVerified) {
    throw createError({ statusCode: 403, statusMessage: 'E-mail não verificado. Verifique sua caixa de entrada.', data: { userId: user.id, needsVerification: true } })
  }

  const config = useRuntimeConfig()
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  )

  // Cookie HttpOnly para segurança
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      crn: user.crn,
      logoUrl: user.logoUrl,
    },
  }
})
