const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'htechnologiesltd1@gmail.com';
  
  // Find user to check current state
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (!existingUser) {
    console.log('User not found in DB!');
    return;
  }
  
  console.log('Found user. Current hash starts with:', existingUser.passwordHash.substring(0, 10));

  const newHash = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: newHash, active: true }
  });
  
  console.log('Password forcefully reset to admin123. New hash starts with:', user.passwordHash.substring(0, 10));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
