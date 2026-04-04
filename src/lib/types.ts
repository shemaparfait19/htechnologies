// Re-export Prisma types for use in components
export type {
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
  UserRole,
  CustomerType,
  InventoryType,
  TransactionType,
  TransactionReason,
  RepairStatus,
  RepairPriority,
  PaymentMethod,
  PaymentStatus,
  AppointmentStatus,
  NotificationType,
} from '@prisma/client';

// Helper types for UI
export interface StockLevel {
  status: 'healthy' | 'low' | 'critical';
  color: string;
  bgColor: string;
}

export interface DashboardStats {
  todaySales: number;
  repairRevenue: number;
  netProfit: number;
  pendingRepairs: number;
  activeRepairs: number;
  readyForPickup: number;
  lowStockItems: number;
  overdueRepairs: number;
  unpaidInvoices: number;
}
