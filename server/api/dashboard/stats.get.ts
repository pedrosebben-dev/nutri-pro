import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalPatients, totalDiets, recentPatients, dietsThisMonth] = await Promise.all([
    prisma.patient.count({ where: { userId } }),
    prisma.diet.count({ where: { patient: { userId } } }),
    prisma.patient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { diets: true } } },
    }),
    prisma.diet.count({
      where: {
        patient: { userId },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ])

  // Diet expiration breakdown
  const [activeDiets, expiringSoonDiets, expiredDiets] = await Promise.all([
    prisma.diet.count({
      where: { patient: { userId }, validUntil: { gt: thirtyDaysFromNow } },
    }),
    prisma.diet.count({
      where: { patient: { userId }, validUntil: { gte: now, lte: thirtyDaysFromNow } },
    }),
    prisma.diet.count({
      where: { patient: { userId }, validUntil: { lt: now } },
    }),
  ])

  const noExpiry = totalDiets - activeDiets - expiringSoonDiets - expiredDiets

  // Monthly patient growth — last 6 months
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const allPatientDates = await prisma.patient.findMany({
    where: { userId, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  })

  const monthLabels: string[] = []
  const monthCounts: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleString('pt-BR', { month: 'short' })
    const count = allPatientDates.filter(p => {
      const pd = new Date(p.createdAt)
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()
    }).length
    monthLabels.push(label.charAt(0).toUpperCase() + label.slice(1))
    monthCounts.push(count)
  }

  return {
    totalPatients,
    totalDiets,
    dietsThisMonth,
    recentPatients,
    dietStatus: {
      active: activeDiets,
      expiringSoon: expiringSoonDiets,
      expired: expiredDiets,
      noExpiry: noExpiry < 0 ? 0 : noExpiry,
    },
    monthlyPatients: {
      labels: monthLabels,
      data: monthCounts,
    },
  }
})
