import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const query = getQuery(event)

  const search = query.search as string | undefined

  const patients = await prisma.patient.findMany({
    where: {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { diets: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return patients
})
