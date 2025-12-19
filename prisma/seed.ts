import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clean up legacy test data safely (child records first to satisfy FK constraints)
  await prisma.appointment.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.technician.deleteMany()
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['owner@example.com', 'admin@example.com', 'technician@example.com']
      }
    }
  })

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
  const ownerPassword = await bcrypt.hash('258369ss', 10)
  const owner = await prisma.user.upsert({
    where: { email: 'owner_pro@gmail.com' },
    update: {
      password: ownerPassword
    },
    create: {
      name: 'Owner',
      email: 'owner_pro@gmail.com',
      password: ownerPassword,
      role: 'OWNER'
    }
  })

  // Create admin user
  const adminPassword = await bcrypt.hash('258369@@', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin_pro@gmail.com' },
    update: {
      branchId: branch1.id,
      password: adminPassword
    },
    create: {
      name: 'Admin',
      email: 'admin_pro@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      branchId: branch1.id
    }
  })

  // Create technicians (without test login accounts)
  await prisma.technician.createMany({
    data: [
      {
        name: 'ช่างแอน',
        branchId: branch1.id,
        commissionType: 'PERCENTAGE',
        commissionValue: 30,
        active: true,
        color: '#3b82f6'
      },
      {
        name: 'ช่างนิด',
        branchId: branch1.id,
        commissionType: 'PERCENTAGE',
        commissionValue: 35,
        active: true,
        color: '#ef4444'
      },
      {
        name: 'ช่างนก',
        branchId: branch2.id,
        commissionType: 'FIXED',
        commissionValue: 200,
        active: true,
        color: '#22c55e'
      }
    ]
  })

  console.log('✅ Seed data created successfully!')
  console.log('Owner: owner_pro@gmail.com / 258369ss')
  console.log('Admin: admin_pro@gmail.com / 258369@@')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
