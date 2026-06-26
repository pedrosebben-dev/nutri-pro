import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Cria nutricionista padrão
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'nutricionista@nutripro.com' },
    update: {},
    create: {
      email: 'nutricionista@nutripro.com',
      password: hashedPassword,
      name: 'Dr. João Silva',
      crn: 'CRN-3 12345',
      phone: '(11) 99999-9999',
    },
  })

  console.log('✅ Nutricionista criado:', user.email)
  console.log('📋 Login: nutricionista@nutripro.com | Senha: admin123')

  // Cria paciente de exemplo
  const patient = await prisma.patient.upsert({
    where: { id: 'example-patient-1' },
    update: {},
    create: {
      id: 'example-patient-1',
      name: 'Maria Oliveira',
      email: 'maria@email.com',
      phone: '(11) 98888-7777',
      birthDate: new Date('1990-05-15'),
      gender: 'feminino',
      weight: 68,
      height: 165,
      activityLevel: 'moderado',
      goal: 'emagrecimento',
      restrictions: ['gluten'],
      pathologies: [],
      notes: 'Paciente com histórico de gastrite.',
      userId: user.id,
    },
  })

  console.log('✅ Paciente de exemplo criado:', patient.name)
  console.log('\n🚀 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
