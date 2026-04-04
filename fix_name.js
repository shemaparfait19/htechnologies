const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'htechnologiesltd1@gmail.com';
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (!existingUser) {
    console.log('User not found in DB!');
    return;
  }
  
  console.log('Found user. Current fullName is:', existingUser.fullName);

  const user = await prisma.user.update({
    where: { email },
    data: { fullName: 'H Technologies LTD' }
  });
  
  console.log('Successfully updated fullName to:', user.fullName);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
