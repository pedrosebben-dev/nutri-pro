import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      crn: true,
      phone: true,
      logoUrl: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' })
  }

  return user
})
