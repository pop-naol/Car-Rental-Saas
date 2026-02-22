import { PrismaClient } from '@prisma/client'
    import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Car Rentals',
      subscription_tier: 'premium',
      is_active: true,
    },
  })
  console.log('✅ Created company:', company.name)

  // Create demo branch
  const branch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      company_id: company.id,
      name: 'Main Branch',
      address: '123 Main Street, Demo City, DC 12345',
      phone: '+1-555-0100',
      email: 'main@democarrentals.com',
      is_active: true,
    },
  })
  console.log('✅ Created branch:', branch.name)

  // Update or create admin user with company and branch
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carrental.com' },
    update: {
      company_id: company.id,
      branch_id: branch.id,
    },
    create: {
      email: 'admin@carrental.com',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'SUPER_ADMIN',
      company_id: company.id,
      branch_id: branch.id,
      is_active: true,
    },
  })
  console.log('✅ Created/Updated admin user:', admin.email)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
