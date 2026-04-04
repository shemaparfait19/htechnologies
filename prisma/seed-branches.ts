import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting branch initialization...');

  // 1. Create or get the default branch
  let mainBranch = await prisma.branch.findFirst({
    where: { isDefault: true },
  });

  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        name: 'Kigali Main',
        location: 'Kigali',
        phone: '0780000000',
        isDefault: true,
      },
    });
    console.log(`Created default branch: ${mainBranch.name}`);
  } else {
    console.log(`Default branch already exists: ${mainBranch.name}`);
  }

  const branchId = mainBranch.id;

  // 2. Initialize Admin Settings if not present
  const adminSettings = await prisma.adminSettings.findFirst();
  if (!adminSettings) {
    await prisma.adminSettings.create({
      data: { adminPin: '00000' }
    });
    console.log('Created default AdminSettings (PIN: 00000)');
  }

  // 3. Assign all Users
  const usersResult = await prisma.user.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${usersResult.count} users.`);

  // 4. Assign all Customers
  const custResult = await prisma.customer.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${custResult.count} customers.`);

  // 5. Assign Inventory
  const invResult = await prisma.inventoryItem.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${invResult.count} inventory items.`);

  // 6. Assign Inventory Transactions
  const txResult = await prisma.inventoryTransaction.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${txResult.count} inventory transactions.`);

  // 7. Assign Repairs
  const repResult = await prisma.repairJob.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${repResult.count} repair jobs.`);

  // 8. Assign Repair Parts
  const partsResult = await prisma.repairPartUsed.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${partsResult.count} repair parts.`);

  // 9. Assign Sales Invoices
  const salesResult = await prisma.salesInvoice.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${salesResult.count} sales invoices.`);

  // 10. Assign Expenses
  const expResult = await prisma.expense.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${expResult.count} expenses.`);

  // 11. Assign Appointments
  const apptResult = await prisma.appointment.updateMany({
    where: { branchId: null },
    data: { branchId },
  });
  console.log(`Assigned branch to ${apptResult.count} appointments.`);

  console.log('Branch initialization complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
