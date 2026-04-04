import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create owner user
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const owner = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'htechnologiesltd1@gmail.com',
      phone: '0780562454',
      passwordHash,
    },
    create: {
      email: 'htechnologiesltd1@gmail.com',
      username: 'admin',
      passwordHash,
      role: 'owner',
      fullName: 'System Administrator',
      phone: '0780562454',
      active: true,
    },
  });

  console.log('✅ Created owner user:', {
    email: owner.email,
    username: owner.username,
    role: owner.role,
  });

  // Create sample inventory categories
  const shopCategory = await prisma.inventoryCategory.create({
    data: {
      name: 'Electronics',
      type: 'SHOP',
    },
  }).catch(() => null);

  const repairCategory = await prisma.inventoryCategory.create({
    data: {
      name: 'Repair Parts',
      type: 'REPAIR',
    },
  }).catch(() => null);

  console.log('✅ Created inventory categories');

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Walk-in Customer',
      phone: '0000000',
      customerType: 'walk_in',
    },
  }).catch(() => null);

  console.log('✅ Created sample customer');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: htechnologiesltd1@gmail.com');
  console.log('   Password: admin123');
  console.log('\n⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
