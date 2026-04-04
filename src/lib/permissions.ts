export type UserRole = 'owner' | 'manager' | 'technician' | 'sales';

export const ROLES = {
  OWNER: 'owner' as UserRole,
  MANAGER: 'manager' as UserRole,
  TECHNICIAN: 'technician' as UserRole,
  SALES: 'sales' as UserRole,
};

export type Permission = 
  | 'manage_users'
  | 'view_reports'
  | 'delete_inventory'
  | 'adjust_stock'
  | 'manage_settings'
  | 'delete_repairs'
  | 'delete_sales'
  | 'view_cost_price'
  | 'manage_repairs'
  | 'manage_sales'
  | 'create_inventory'
  | 'edit_inventory'
  | 'delete_customers'
  | 'edit_repair_details';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'manage_users',
    'view_reports',
    'delete_inventory',
    'adjust_stock',
    'manage_settings',
    'delete_repairs',
    'delete_sales',
    'view_cost_price',
    'manage_repairs',
    'manage_sales',
    'create_inventory',
    'edit_inventory',
    'delete_customers',
    'edit_repair_details',
  ],
  manager: [
    'view_reports',
    'adjust_stock',
    'delete_repairs',
    'view_cost_price',
    'manage_repairs',
    'manage_sales',
    'create_inventory',
    'edit_inventory',
    'delete_customers',
    'edit_repair_details',
  ],
  technician: [
    // Technicians primarily work on assigned jobs.
    // They generally don't need to see cost prices or delete things.
  ],
  sales: [
    'view_reports',
    'manage_sales',
    // Sales staff operate POS.
    // They shouldn't delete sales history or inventory.
  ],
};

export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  if (!role) return false;
  
  // Normalize role string just in case
  const normalizeRole = role.toLowerCase() as UserRole;
  
  const permissions = ROLE_PERMISSIONS[normalizeRole];
  if (!permissions) return false;
  
  return permissions.includes(permission);
}

export function canDeleteInventory(role: string | undefined) {
  return hasPermission(role, 'delete_inventory');
}

export function canManageUsers(role: string | undefined) {
  return hasPermission(role, 'manage_users');
}

export function canViewReports(role: string | undefined) {
  return hasPermission(role, 'view_reports');
}

export function canManageRepairs(role: string | undefined) {
  return hasPermission(role, 'manage_repairs');
}

export function canManageSales(role: string | undefined) {
  return hasPermission(role, 'manage_sales');
}

export function canCreateInventory(role: string | undefined) {
  return hasPermission(role, 'create_inventory');
}

export function canEditInventory(role: string | undefined) {
  return hasPermission(role, 'edit_inventory');
}

export function canDeleteCustomers(role: string | undefined) {
  return hasPermission(role, 'delete_customers');
}

export function canEditRepairDetails(role: string | undefined) {
  return hasPermission(role, 'edit_repair_details');
}

export function canDeleteSales(role: string | undefined) {
  return hasPermission(role, 'delete_sales');
}

export function canDeleteRepairs(role: string | undefined) {
  return hasPermission(role, 'delete_repairs');
}
