import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create branches
  const branch1 = await prisma.branch.create({
    data: {
      name: 'สาขาสยาม',
      address: 'กรุงเทพมหานคร'
    }
  })

  const branch2 = await prisma.branch.create({
    data: {
      name: 'สาขาเชียงใหม่',
      address: 'เชียงใหม่'
    }
  })

  // Create owner user
  const hashedPassword = await bcrypt.hash('password123', 10)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      name: 'Owner',
      email: 'owner@example.com',
      password: hashedPassword,
      role: 'OWNER'
    }
  })

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { branchId: branch1.id },
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      branchId: branch1.id
    }
  })

  // Create technician user (sample login)
  const technicianUser = await prisma.user.upsert({
    where: { email: 'technician@example.com' },
    update: { branchId: branch1.id, role: 'TECHNICIAN' },
    create: {
      name: 'Technician',
      email: 'technician@example.com',
      password: hashedPassword,
      role: 'TECHNICIAN',
      branchId: branch1.id
    }
  })

  // Create technicians (link first one to sample user)
  await prisma.technician.upsert({
    where: { userId: technicianUser.id },
    update: { color: '#3b82f6' },
    create: {
      name: 'ช่างแอน',
      branchId: branch1.id,
      commissionType: 'PERCENTAGE',
      commissionValue: 30,
      active: true,
      userId: technicianUser.id,
      color: '#3b82f6'
    }
  })

  await prisma.technician.createMany({
    data: [
      {
        name: 'ช่างนิด',
        branchId: branch1.id,
        commissionType: 'PERCENTAGE',
        commissionValue: 35,
        active: true
      },
      {
        name: 'ช่างนก',
        branchId: branch2.id,
        commissionType: 'FIXED',
        commissionValue: 200,
        active: true
      }
    ]
  })

  console.log('✅ Seed data created successfully!')
  console.log('Owner: owner@example.com / password123')
  console.log('Admin: admin@example.com / password123')
  console.log('Technician: technician@example.com / password123 (read-only)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
