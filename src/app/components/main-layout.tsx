'use client';

import type { FC, ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Wrench,
  Boxes,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  Crown,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserNav } from './user-nav';
import { useAuth } from './auth-provider';
import { NotificationsDropdown } from './notifications-dropdown';
import { LanguageSwitcher } from './language-switcher';
import {
  hasPermission,
  canViewReports,
  canManageUsers
} from '@/lib/permissions';
import { useTranslations } from 'next-intl';
import { MobileNav } from './mobile-nav';

const navItems = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { href: '/repairs', label: 'repairs', icon: Wrench },
  { href: '/inventory', label: 'inventory', icon: Boxes },
  { href: '/customers', label: 'customers', icon: Users },
  { href: '/sales', label: 'sales', icon: ShoppingCart },
  { href: '/appointments', label: 'appointments', icon: Calendar },
  { href: '/reports', label: 'reports', icon: BarChart3 },
  { href: '/documents', label: 'documents', icon: FileText },
];

export const MainLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [headerTitle, setHeaderTitle] = useState('H TECHNOLOGIES LTD');
  const [branches, setBranches] = useState<any[]>([]);

  // Hooks must be called unconditionally

  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBranches(data);
      })
      .catch(console.error);
  }, []);

  const currentBranch = branches.find(b => b.id === user?.branchId);
  const branchName = user?.role === 'owner' ? 'HQ (All Branches)' : (currentBranch?.name || 'Loading Branch...');

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (item.label === 'reports') {
      return canViewReports(user?.role);
    }
    return true; 
  });

  useEffect(() => {
    // Determine title based on current path
    const currentNavItem = navItems.find((item) => pathname.startsWith(item.href));
    // Translate the title if it matches a nav item, otherwise default string
    if (currentNavItem) {
        setHeaderTitle(t(currentNavItem.label as any));
    } else if (pathname.startsWith('/settings')) {
        setHeaderTitle(t('settings'));
    } else {
        setHeaderTitle('H TECHNOLOGIES LTD');
    }
  }, [pathname, t]);

  // On the login page, render NO navigation — just a plain full-screen container
  if (pathname === '/login' || pathname === '/admin-pin') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" className="bg-background border-r">
          {/* ... existing Sidebar content ... */}
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <div className="relative h-8 w-8">
                 <Image src="/logowhite.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-bold text-lg text-white group-data-[collapsible=icon]:hidden">
                HTech
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={t(item.label as any)}
                    >
                      <item.icon />
                      <span>{t(item.label as any)}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              {/* Language Switcher */}
              <SidebarMenuItem>
                <div className="px-2 py-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
                  <LanguageSwitcher />
                </div>
              </SidebarMenuItem>

              {/* Only show Settings if user has management permissions */}
              {hasPermission(user?.role, 'manage_settings') && (
                <SidebarMenuItem>
                  <Link href="/settings">
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/settings')}
                      tooltip={t('settings')}
                    >
                      <Settings />
                      <span>{t('settings')}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}

              {/* Executive Admin Dashboard — owner only */}
              {user?.role === 'owner' && (
                <SidebarMenuItem>
                  <Link href="/admin-pin">
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/admin-dashboard') || pathname === '/admin-pin'}
                      tooltip="Admin Dashboard"
                      className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Crown className="text-yellow-500" />
                      <span>Admin Dashboard</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex w-full flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
            <SidebarTrigger />
            
            {/* PWA App Navigation Controls */}
            <div className="hidden sm:flex items-center gap-1">
              <button 
                onClick={() => router.back()} 
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground transition-colors"
                title="Go Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => router.forward()} 
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground transition-colors"
                title="Go Forward"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex items-center gap-3">
              <h1 className="text-lg font-semibold truncate">
                {headerTitle}
              </h1>
              {user && (
                <span className="hidden sm:inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20">
                  {branchName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <UserNav />
            </div>
          </header>
          
          {/* Add padding-bottom for mobile to account for fixed nav */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
          
          <MobileNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
