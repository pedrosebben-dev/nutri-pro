import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'
import { sendVerificationEmail } from '~/server/utils/auth-email'

export default defineEventHandler(async (event) => {
  const { name, email, password, crn } = await readBody(event)

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Nome, e-mail e senha são obrigatórios.' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Este e-mail já está cadastrado.' })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      crn: crn?.trim() || null,
      emailVerified: false,
    },
  })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code,
      type: 'verify_email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  let devCode: string | undefined
  let emailSent = false
  try {
    const result = await sendVerificationEmail(user.email, user.name, code)
    emailSent = !result.devMode
    if (result.devMode) devCode = result.code
  } catch (err) {
    console.error('[register] Email send failed:', err)
    devCode = code
  }

  return { userId: user.id, email: user.email, devCode, emailSent }
})
