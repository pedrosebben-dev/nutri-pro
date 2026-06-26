import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/resend-code',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ]
  const url = getRequestURL(event).pathname

  if (!url.startsWith('/api/') || publicRoutes.includes(url)) {
    return
  }

  // Verifica token JWT
  const authHeader = getRequestHeader(event, 'Authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado. Faça login para continuar.',
    })
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string }
    event.context.user = decoded
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido ou expirado. Faça login novamente.',
    })
  }
})
