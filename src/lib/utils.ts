// Utility functions for H TECHNOLOGIES LTD PWA

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting for RWF
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === undefined || amount === null) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return `RWF ${num.toLocaleString('en-US')}`;
}

// Date formatting
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Guard against invalid dates
  if (isNaN(d.getTime())) return '-';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

// Stock level calculation
export function getStockLevel(quantity: number, reorderLevel: number): {
  status: 'healthy' | 'low' | 'critical';
  color: string;
  bgColor: string;
} {
  if (quantity === 0) {
    return {
      status: 'critical',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    };
  }
  if (quantity <= reorderLevel) {
    return {
      status: 'low',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    };
  }
  return {
    status: 'healthy',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  };
}

// Generate unique IDs
export function generateJobNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `REP-${year}-${random}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `INV-${year}-${random}`;
}

export function generateSKU(categoryName: string): string {
  const prefix = categoryName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `${prefix}-${random}`;
}

// Calculate days difference
export function daysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Check if date is overdue
export function isOverdue(date: Date): boolean {
  return date < new Date();
}

// Get status color for repair jobs
export function getRepairStatusColor(
  status: string
): { color: string; bgColor: string } {
  const statusColors: Record<string, { color: string; bgColor: string }> = {
    pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    diagnosed: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
    in_progress: { color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ready: { color: 'text-green-600', bgColor: 'bg-green-100' },
    collected: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
    abandoned: { color: 'text-red-600', bgColor: 'bg-red-100' },
  };
  return (
    statusColors[status] || { color: 'text-gray-600', bgColor: 'bg-gray-100' }
  );
}

// Get priority color
export function getPriorityColor(
  priority: string
): { color: string; bgColor: string } {
  const priorityColors: Record<string, { color: string; bgColor: string }> = {
    normal: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
    urgent: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
    express: { color: 'text-red-600', bgColor: 'bg-red-100' },
  };
  return (
    priorityColors[priority] || {
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    }
  );
}

// Validate phone number (Rwanda format)
export function isValidPhone(phone: string): boolean {
  // Rwanda phone numbers: +250 XXX XXX XXX or 07XX XXX XXX
  const phoneRegex = /^(\+250|0)[7][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
