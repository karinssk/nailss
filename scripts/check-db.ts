import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking database...\n')

  const branches = await prisma.branch.findMany()
  console.log(`📍 Branches: ${branches.length}`)
  branches.forEach(b => console.log(`   - ${b.name} (${b.id})`))

  const technicians = await prisma.technician.findMany({
    include: { branch: true }
  })
  console.log(`\n👨‍🔧 Technicians: ${technicians.length}`)
  technicians.forEach(t => console.log(`   - ${t.name} at ${t.branch.name} (${t.color || 'no color'})`))

  const appointments = await prisma.appointment.findMany()
  console.log(`\n📅 Appointments: ${appointments.length}`)

  const users = await prisma.user.findMany()
  console.log(`\n👤 Users: ${users.length}`)
  users.forEach(u => console.log(`   - ${u.email} (${u.role})`))

  console.log('\n✅ Database check complete!')
}

checkDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
