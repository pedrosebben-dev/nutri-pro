import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const checks: Record<string, string> = {
    database: 'pending',
    jwt: config.jwtSecret ? 'ok' : 'MISSING',
    groq: config.groqApiKey ? 'ok' : 'missing',
    email: config.gmailUser ? 'ok' : 'missing (email disabled)',
    appUrl: (config.public?.appName || config.appUrl) ? 'ok' : 'missing',
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch (err: any) {
    checks.database = `ERROR: ${err.message}`
  }

  const allOk = checks.database === 'ok' && checks.jwt === 'ok'
  setResponseStatus(event, allOk ? 200 : 500)

  return { status: allOk ? 'ok' : 'degraded', checks }
})
