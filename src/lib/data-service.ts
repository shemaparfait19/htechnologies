// Data service layer for Prisma/PostgreSQL operations
import { prisma } from './prisma';
import type {
  User,
  Customer,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  RepairJob,
  RepairPartUsed,
  SalesInvoice,
  SalesItem,
  Appointment,
  Expense,
  Notification,
  ActivityLog,
  Supplier,
  TransactionType,
  TransactionReason,
} from '@prisma/client';

// Inventory: Update stock quantity
export async function updateStockQuantity(
  itemId: string,
  quantityChange: number,
  type: TransactionType,
  reason: TransactionReason,
  userId: string,
  referenceId?: string,
  notes?: string
): Promise<void> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new Error('Item not found');

  const newQuantity = item.quantity + (type === 'IN' ? quantityChange : -quantityChange);
  if (newQuantity < 0) throw new Error('Insufficient stock');

  // Update item quantity in a transaction
  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        lowStockAlert: newQuantity <= item.reorderLevel,
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        itemId,
        type,
        quantity: quantityChange,
        reason,
        referenceId,
        userId,
        notes,
      },
    }),
  ]);

  // Create notification if low stock
  if (newQuantity <= item.reorderLevel && newQuantity > 0) {
    // Find owner user
    const owner = await prisma.user.findFirst({
      where: { role: 'owner', active: true },
    });

    if (owner) {
      await prisma.notification.create({
        data: {
          userId: owner.id,
          type: 'low_stock',
          message: `${item.name} is running low (${newQuantity} remaining)`,
          relatedId: itemId,
        },
      });
    }
  }
}

// Repair: Create new repair job with auto-generated job number
export async function createRepairJob(
  jobData: Omit<RepairJob, 'id' | 'jobNumber' | 'createdAt'>
): Promise<string> {
  // Generate unique job number
  const year = new Date().getFullYear();
  const lastJob = await prisma.repairJob.findFirst({
    orderBy: { createdAt: 'desc' },
    where: {
      jobNumber: {
        startsWith: `REP-${year}-`,
      },
    },
  });

  let jobNumber = `REP-${year}-0001`;
  if (lastJob) {
    const lastNumber = parseInt(lastJob.jobNumber.split('-')[2]);
    jobNumber = `REP-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
  }

  const job = await prisma.repairJob.create({
    data: {
      ...jobData,
      jobNumber,
    },
  });

  // Notify assigned technician
  if (jobData.assignedTo) {
    await prisma.notification.create({
      data: {
        userId: jobData.assignedTo,
        type: 'new_repair',
        message: `New repair job assigned: ${jobNumber}`,
        relatedId: job.id,
      },
    });
  }

  return job.id;
}

// Repair: Add parts to repair job and update inventory
export async function addPartsToRepair(
  repairJobId: string,
  parts: Array<{ itemId: string; quantity: number }>,
  userId: string
): Promise<void> {
  for (const part of parts) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: part.itemId },
    });

    if (!item) throw new Error(`Item ${part.itemId} not found`);

    // Deduct from inventory
    await updateStockQuantity(
      part.itemId,
      part.quantity,
      'OUT',
      'repair_use',
      userId,
      repairJobId
    );

    // Record part usage
    await prisma.repairPartUsed.create({
      data: {
        repairJobId,
        itemId: part.itemId,
        quantity: part.quantity,
        unitCost: item.unitCost,
        totalCost: item.unitCost * part.quantity,
      },
    });
  }
}

// Sales: Create invoice and update inventory
export async function createSaleInvoice(
  invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>,
  items: Array<{ itemId: string; quantity: number; unitPrice: number; discount: number }>,
  userId: string
): Promise<string> {
  // Generate unique invoice number
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.salesInvoice.findFirst({
    orderBy: { createdAt: 'desc' },
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
  });

  let invoiceNumber = `INV-${year}-0001`;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    invoiceNumber = `INV-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
  }

  // Create invoice and items in transaction
  const invoice = await prisma.salesInvoice.create({
    data: {
      ...invoiceData,
      invoiceNumber,
    },
  });

  // Add items and update inventory
  for (const item of items) {
    const total = item.unitPrice * item.quantity - item.discount;

    // Create sales item
    await prisma.salesItem.create({
      data: {
        invoiceId: invoice.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total,
      },
    });

    // Deduct from inventory
    await updateStockQuantity(
      item.itemId,
      item.quantity,
      'OUT',
      'sale',
      userId,
      invoice.id
    );
  }

  // Update customer total spent if customer is specified
  if (invoiceData.customerId) {
    await prisma.customer.update({
      where: { id: invoiceData.customerId },
      data: {
        totalSpent: {
          increment: invoiceData.total,
        },
      },
    });
  }

  return invoice.id;
}

// Get dashboard statistics
export async function getDashboardStats(branchId?: string): Promise<any> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const branchFilter = branchId ? { branchId } : {};

  // Today's sales
  const todaySales = await prisma.salesInvoice.aggregate({
    where: {
      saleDate: {
        gte: today,
      },
      ...branchFilter,
    },
    _sum: {
      total: true,
    },
  });

  // Today's repair revenue
  const todayRepairs = await prisma.repairJob.aggregate({
    where: {
      completedAt: {
        gte: today,
      },
      status: 'collected',
      ...branchFilter,
    },
    _sum: {
      actualCost: true,
    },
  });

  // Repair status counts
  const repairCounts = await prisma.repairJob.groupBy({
    by: ['status'],
    where: branchFilter,
    _count: true,
  });

  const pendingRepairs = repairCounts.find((r) => r.status === 'pending')?._count || 0;
  const activeRepairs = repairCounts.find((r) => r.status === 'in_progress')?._count || 0;
  const readyForPickup = repairCounts.find((r) => r.status === 'ready')?._count || 0;

  // Low stock items
  const lowStockItems = await prisma.inventoryItem.count({
    where: {
      lowStockAlert: true,
      active: true,
      ...branchFilter,
    },
  });

  // Overdue repairs
  const now = new Date();
  const overdueRepairs = await prisma.repairJob.count({
    where: {
      status: {
        notIn: ['collected', 'abandoned'],
      },
      promisedDate: {
        lt: now,
      },
      ...branchFilter,
    },
  });

  // Unpaid invoices
  const unpaidInvoices = await prisma.salesInvoice.aggregate({
    where: {
      paymentStatus: {
        in: ['unpaid', 'partial'],
      },
      ...branchFilter,
    },
    _sum: {
      total: true,
      paidAmount: true,
    },
  });

  const unpaidAmount =
    (unpaidInvoices._sum.total || 0) - (unpaidInvoices._sum.paidAmount || 0);

  return {
    todaySales: todaySales._sum.total || 0,
    repairRevenue: todayRepairs._sum.actualCost || 0,
    netProfit: (todaySales._sum.total || 0) + (todayRepairs._sum.actualCost || 0),
    pendingRepairs,
    activeRepairs,
    readyForPickup,
    lowStockItems,
    overdueRepairs,
    unpaidInvoices: unpaidAmount,
  };
}

// Activity logging
export async function logActivity(
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      tableName,
      recordId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    },
  });
}

// Export prisma for direct access
export { prisma };
