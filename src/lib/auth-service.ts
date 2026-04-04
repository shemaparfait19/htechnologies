// Authentication service for Prisma/PostgreSQL
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { User, UserRole } from '@prisma/client';

// Current user state (client-side)
let currentUser: User | null = null;

// Sign in
export async function signIn(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.active) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    currentUser = user;
    return user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  currentUser = null;
}

// Get current user
export function getCurrentUser(): User | null {
  return currentUser;
}

// Set current user (for session restoration)
export function setCurrentUser(user: User | null): void {
  currentUser = user;
}

// Check if user has permission
export function hasPermission(
  requiredRole: UserRole | UserRole[]
): boolean {
  if (!currentUser) return false;
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(currentUser.role);
}

// Role hierarchy
const roleHierarchy: Record<UserRole, number> = {
  owner: 4,
  manager: 3,
  technician: 2,
  sales: 1,
};

// Check if user has at least the specified role level
export function hasRoleLevel(minimumRole: UserRole): boolean {
  if (!currentUser) return false;
  return roleHierarchy[currentUser.role] >= roleHierarchy[minimumRole];
}

// Create new user (Owner/Manager only)
export async function createUser(
  email: string,
  password: string,
  userData: Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'lastLogin'>
): Promise<string> {
  if (!hasRoleLevel('manager')) {
    throw new Error('Insufficient permissions');
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...userData,
        email,
        passwordHash,
      },
    });

    return user.id;
  } catch (error: any) {
    console.error('Create user error:', error);
    throw new Error(error.message || 'Failed to create user');
  }
}

// Get user by email (for session restoration)
export async function getUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}

// Permission checks for specific actions
export const permissions = {
  canManageUsers: () => hasRoleLevel('manager'),
  canViewFinancials: () => hasRoleLevel('manager'),
  canDeleteRecords: () => hasRoleLevel('manager'),
  canVoidTransactions: () => hasPermission('owner'),
  canManageInventory: () => hasRoleLevel('manager'),
  canProcessSales: () => hasRoleLevel('sales'),
  canManageRepairs: () => hasRoleLevel('technician'),
  canViewReports: () => hasRoleLevel('manager'),
  canAdjustPrices: () => hasRoleLevel('manager'),
};
